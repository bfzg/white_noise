/**
 * 播放状态 store
 * - activeSounds: 当前选中的声音（单音频模式，最多一个）
 * - isPlaying: 主控播放状态
 * - timer: 定时关闭（剩余秒数、是否激活）
 */

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { findSoundById } from '@/types/sound'
import * as audioCache from '@/utils/audioCache'
import * as backgroundAudio from '@/utils/backgroundAudio'

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

const DEFAULT_SOUND_VOLUME = 0.4

export const usePlayerStore = defineStore(
  'player',
  () => {
    // 当前选中的声音 id -> volume，保留对象结构便于兼容现有页面与持久化数据
    const activeSounds = ref<Record<string, number>>({})
    const lastSoundPreset = ref<Record<string, number>>({})
    // 主控播放状态
    const isPlaying = ref(false)
    const errorMsg = ref<string>('')

    // 定时器
    const timerTotal = ref(0)
    const timerRemaining = ref(0)
    let timerHandle: ReturnType<typeof setInterval> | null = null

    const hasSound = computed(() => Object.keys(activeSounds.value).length > 0)
    const hasLastSoundPreset = computed(() => Object.keys(lastSoundPreset.value).length > 0)
    const activeSoundList = computed<ActiveSound[]>(() => {
      return Object.entries(activeSounds.value)
        .slice(0, 1)
        .map(([id, volume]) => ({ id, volume: normalizeVolume(volume) }))
    })
    const currentSoundState = computed<ActiveSound | undefined>(() => {
      return activeSoundList.value[0]
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

    function normalizeSingleSound() {
      const first = Object.entries(activeSounds.value)[0]
      if (!first)
        return
      activeSounds.value = { [first[0]]: normalizeVolume(first[1]) }
    }

    function normalizeVolume(volume: number) {
      if (!Number.isFinite(volume) || volume <= 0)
        return DEFAULT_SOUND_VOLUME
      return Math.max(0, Math.min(1, volume))
    }

    /** 切换声音激活状态（单音频模式：同一声音点击关闭，不同声音点击切换并播放） */
    async function toggleSound(id: string) {
      if (Object.prototype.hasOwnProperty.call(activeSounds.value, id)) {
        removeSound(id)
        return
      }
      await addSound(id)
    }

    /** 添加一个声音，默认音量 40% */
    async function addSound(id: string, defaultVolume = DEFAULT_SOUND_VOLUME) {
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
      backgroundAudio.stop()
      activeSounds.value = { [id]: normalizeVolume(defaultVolume) }

      try {
        await playCurrentSound()
        isPlaying.value = true
      }
      catch (e: any) {
        errorMsg.value = e?.message || '加载音源失败'
        uni.showToast({ title: errorMsg.value, icon: 'none' })
        activeSounds.value = {}
      }
    }

    /** 移除一个声音 */
    function removeSound(id: string) {
      if (backgroundAudio.getCurrentTrackId() === id)
        backgroundAudio.stop()
      activeSounds.value = {}
      isPlaying.value = false
    }

    /** 切换主控 播放/暂停 */
    async function toggle() {
      if (!hasSound.value) {
        uni.showToast({ title: '请先选择一个声音', icon: 'none' })
        return
      }
      if (isPlaying.value) {
        backgroundAudio.pause()
        isPlaying.value = false
      }
      else {
        await playCurrentSound()
        isPlaying.value = true
      }
    }

    /** 从持久化状态恢复当前选择，不自动播放 */
    async function initFromPersist() {
      migrateLastMixPreset()

      if (!hasSound.value && hasLastSoundPreset.value) {
        activeSounds.value = { ...lastSoundPreset.value }
      }
      normalizeSingleSound()

      const item = currentSoundState.value
      if (!item)
        return

      const sound = findSoundById(item.id)
      if (!sound?.url) {
        activeSounds.value = {}
      }
    }

    function migrateLastMixPreset() {
      if (hasLastSoundPreset.value)
        return

      try {
        const raw = uni.getStorageSync('player') as any
        const oldPreset = raw?.lastMixPreset
        const first = oldPreset && typeof oldPreset === 'object'
          ? Object.entries(oldPreset)[0]
          : undefined
        if (first) {
          lastSoundPreset.value = { [first[0]]: normalizeVolume(first[1] as number) }
        }
      }
      catch {
        // Ignore migration failures; activeSounds is still persisted separately.
      }
    }

    async function playCurrentSound() {
      const item = currentSoundState.value
      if (!item)
        return

      const sound = findSoundById(item.id)
      if (!sound?.url)
        return

      const path = await audioCache.getOrDownload(sound.url)
      const played = backgroundAudio.play({
        id: item.id,
        src: path,
        title: sound.name,
        volume: item.volume,
      })
      if (!played) {
        throw new Error('当前环境不支持后台音频播放')
      }
    }

    /** 完全停止 */
    function stop(options: { clearSounds?: boolean } = {}) {
      backgroundAudio.stop()
      isPlaying.value = false
      if (options.clearSounds) {
        activeSounds.value = {}
      }
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

    backgroundAudio.subscribe(() => {
      isPlaying.value = backgroundAudio.isPlaying()
    })

    watch(
      activeSounds,
      (sounds) => {
        if (Object.keys(sounds).length > 0) {
          lastSoundPreset.value = { ...sounds }
        }
      },
      { deep: true },
    )

    return {
      // state
      activeSounds,
      lastSoundPreset,
      isPlaying,
      errorMsg,
      timerTotal,
      timerRemaining,
      // computed
      hasSound,
      hasLastSoundPreset,
      activeSoundList,
      currentSoundState,
      timerActive,
      timerLabel,
      // actions
      toggleSound,
      addSound,
      removeSound,
      toggle,
      initFromPersist,
      playCurrentSound,
      stop,
      setTimer,
      clearTimer,
    }
  },
  {
    persist: {
      pick: ['activeSounds', 'lastSoundPreset', 'timerTotal'],
    },
  },
)
