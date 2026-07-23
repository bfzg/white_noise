/**
 * 播放状态 store
 * - activeSounds: 当前激活的声音集合，每个声音独立音量
 * - isPlaying: 主控播放状态
 * - timer: 定时关闭（剩余秒数、是否激活）
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { SoundItem } from '@/types/sound'
import { findSoundById } from '@/types/sound'
import * as audioCache from '@/utils/audioCache'
import * as mixer from '@/utils/audioMixer'

export const TIMER_OPTIONS = [
  { label: '关闭', value: 0 },
  { label: '15 分钟', value: 15 * 60 },
  { label: '30 分钟', value: 30 * 60 },
  { label: '60 分钟', value: 60 * 60 },
  { label: '90 分钟', value: 90 * 60 },
  { label: '120 分钟', value: 120 * 60 },
  { label: '180 分钟', value: 180 * 60 },
] as const

export interface ActiveSound {
  id: string
  volume: number
}

export const usePlayerStore = defineStore(
  'player',
  () => {
    // 激活的声音集合 id -> volume
    const activeSounds = ref<Record<string, number>>({})
    // 主控播放状态
    const isPlaying = ref(false)
    const errorMsg = ref<string>('')

    // 定时器
    const timerTotal = ref(0)
    const timerRemaining = ref(0)
    let timerHandle: ReturnType<typeof setInterval> | null = null

    const hasSound = computed(() => Object.keys(activeSounds.value).length > 0)
    const activeSoundList = computed<ActiveSound[]>(() => {
      return Object.entries(activeSounds.value).map(([id, volume]) => ({ id, volume }))
    })
    const activeSoundItems = computed<SoundItem[]>(() => {
      return activeSoundList.value
        .map(item => findSoundById(item.id))
        .filter(Boolean) as SoundItem[]
    })

    const timerActive = computed(() => timerTotal.value > 0 && timerRemaining.value > 0)
    const timerLabel = computed(() => {
      if (timerTotal.value === 0)
        return '定时'
      return `剩余 ${formatRemain(timerRemaining.value)}`
    })

    function formatRemain(sec: number) {
      const m = Math.floor(sec / 60)
      const s = sec % 60
      return `${m}:${String(s).padStart(2, '0')}`
    }

    /** 切换声音激活状态（开/关） */
    async function toggleSound(id: string) {
      if (activeSounds.value[id]) {
        removeSound(id)
        return
      }
      await addSound(id)
    }

    /** 添加一个声音，默认音量 50% */
    async function addSound(id: string, defaultVolume = 0.5) {
      const sound = findSoundById(id)
      if (!sound) {
        errorMsg.value = '未找到该音源'
        return
      }
      if (!sound.url) {
        errorMsg.value = '音源地址未配置'
        uni.showToast({ title: '该音源地址待配置', icon: 'none' })
        return
      }

      errorMsg.value = ''
      activeSounds.value[id] = defaultVolume

      try {
        const path = await audioCache.getOrDownload(sound.url)
        mixer.load(id, path)
        mixer.setVolume(id, defaultVolume)
        if (isPlaying.value) {
          mixer.play(id, path)
        }
      }
      catch (e: any) {
        errorMsg.value = e?.message || '加载音源失败'
        uni.showToast({ title: errorMsg.value, icon: 'none' })
        delete activeSounds.value[id]
      }
    }

    /** 移除一个声音 */
    function removeSound(id: string) {
      mixer.unload(id)
      const next = { ...activeSounds.value }
      delete next[id]
      activeSounds.value = next
    }

    /** 设置某个声音的音量 */
    async function setSoundVolume(id: string, volume: number) {
      const v = Math.max(0, Math.min(1, volume))
      activeSounds.value[id] = v
      mixer.setVolume(id, v)

      const sound = findSoundById(id)
      if (!sound?.url)
        return

      if (v === 0) {
        mixer.pause(id)
      }
      else if (isPlaying.value) {
        const path = await audioCache.getOrDownload(sound.url)
        mixer.play(id, path)
      }
    }

    /** 切换主控 播放/暂停 */
    async function toggle() {
      if (!hasSound.value) {
        uni.showToast({ title: '请先选择至少一个声音', icon: 'none' })
        return
      }
      if (isPlaying.value) {
        mixer.pauseAll()
        isPlaying.value = false
      }
      else {
        await playAllActive()
        isPlaying.value = true
      }
    }

    /** 从持久化状态恢复音轨 */
    async function initFromPersist() {
      const ids = Object.keys(activeSounds.value)
      if (ids.length === 0)
        return
      for (const id of ids) {
        const sound = findSoundById(id)
        if (!sound?.url) {
          delete activeSounds.value[id]
          continue
        }
        try {
          const path = await audioCache.getOrDownload(sound.url)
          mixer.load(id, path)
          mixer.setVolume(id, activeSounds.value[id])
        }
        catch (e) {
          console.error(`[player] init ${id} failed`, e)
          delete activeSounds.value[id]
        }
      }
    }
    async function playAllActive() {
      for (const id of Object.keys(activeSounds.value)) {
        const sound = findSoundById(id)
        if (!sound?.url)
          continue
        try {
          const path = await audioCache.getOrDownload(sound.url)
          mixer.setVolume(id, activeSounds.value[id])
          if (activeSounds.value[id] > 0)
            mixer.play(id, path)
        }
        catch (e) {
          console.error(`playAllActive ${id} failed`, e)
        }
      }
    }

    /** 完全停止 */
    function stop() {
      mixer.stopAll()
      isPlaying.value = false
      activeSounds.value = {}
      clearTimer()
    }

    /** 设定时关闭（秒，0 表示关闭） */
    function setTimer(seconds: number) {
      clearTimer()
      if (!seconds || seconds <= 0) {
        timerTotal.value = 0
        timerRemaining.value = 0
        return
      }
      timerTotal.value = seconds
      timerRemaining.value = seconds
      timerHandle = setInterval(() => {
        timerRemaining.value -= 1
        if (timerRemaining.value <= 0) {
          clearTimer()
          stop()
          uni.showToast({ title: '定时已到，自动停止', icon: 'none' })
        }
      }, 1000)
    }

    function clearTimer() {
      if (timerHandle) {
        clearInterval(timerHandle)
        timerHandle = null
      }
      timerTotal.value = 0
      timerRemaining.value = 0
    }

    // 监听底层混音器事件，保持状态同步
    mixer.subscribe(() => {
      isPlaying.value = mixer.isAnyPlaying()
    })

    return {
      // state
      activeSounds,
      isPlaying,
      errorMsg,
      timerTotal,
      timerRemaining,
      // computed
      hasSound,
      activeSoundList,
      activeSoundItems,
      timerActive,
      timerLabel,
      // actions
      toggleSound,
      addSound,
      removeSound,
      setSoundVolume,
      toggle,
      initFromPersist,
      playAllActive,
      stop,
      setTimer,
      clearTimer,
    }
  },
  {
    persist: {
      pick: ['activeSounds', 'timerTotal'],
    },
  },
)
