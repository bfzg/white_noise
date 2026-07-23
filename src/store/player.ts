/**
 * 播放状态 store
 * - currentSoundId: 当前选中的声音
 * - isPlaying: 是否正在播放
 * - timer: 定时关闭（剩余秒数、是否激活）
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { findSoundById, type SoundItem } from '@/types/sound'
import * as audioCache from '@/utils/audioCache'
import * as audio from '@/utils/audio'

export const TIMER_OPTIONS = [
  { label: '关闭', value: 0 },
  { label: '15 分钟', value: 15 * 60 },
  { label: '30 分钟', value: 30 * 60 },
  { label: '60 分钟', value: 60 * 60 },
  { label: '90 分钟', value: 90 * 60 },
] as const

export const usePlayerStore = defineStore(
  'player',
  () => {
    const currentSoundId = ref<string>('')
    const isPlaying = ref(false)
    const errorMsg = ref<string>('')
    const volume = ref(1) // 音量 0-1

    // 定时器
    const timerTotal = ref(0) // 总时长（秒）
    const timerRemaining = ref(0) // 剩余时长（秒）
    let timerHandle: ReturnType<typeof setInterval> | null = null

    const currentSound = computed<SoundItem | undefined>(() => {
      if (!currentSoundId.value) return undefined
      return findSoundById(currentSoundId.value)
    })

    const hasSound = computed(() => !!currentSoundId.value)
    const timerActive = computed(() => timerTotal.value > 0 && timerRemaining.value > 0)
    const timerLabel = computed(() => {
      if (timerTotal.value === 0) return '定时设置'
      return `剩余 ${formatRemain(timerRemaining.value)}`
    })

    function formatRemain(sec: number) {
      const m = Math.floor(sec / 60)
      const s = sec % 60
      return `${m}:${String(s).padStart(2, '0')}`
    }

    /** 选中并播放一个声音 */
    async function playSound(id: string) {
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
      currentSoundId.value = id

      try {
        uni.showLoading({ title: '缓冲中...', mask: true })
        const path = await audioCache.getOrDownload(sound.url)
        uni.hideLoading()
        audio.setVolume(volume.value)
        audio.play(path, sound.name)
        isPlaying.value = true
      }
      catch (e: any) {
        uni.hideLoading()
        errorMsg.value = e?.message || '播放失败'
        uni.showToast({ title: errorMsg.value, icon: 'none' })
        isPlaying.value = false
      }
    }

    /** 切换播放/暂停 */
    function toggle() {
      if (!hasSound.value) {
        uni.showToast({ title: '请先选择一个声音', icon: 'none' })
        return
      }
      if (isPlaying.value) {
        audio.pause()
        isPlaying.value = false
      }
      else {
        audio.resume()
        isPlaying.value = true
      }
    }

    /** 完全停止（清空当前选中） */
    function stop() {
      audio.stop()
      isPlaying.value = false
      currentSoundId.value = ''
      clearTimer()
    }

    /** 设置音量 0-1 */
    function setVolume(value: number) {
      volume.value = Math.max(0, Math.min(1, value))
      audio.setVolume(volume.value)
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

    // 监听底层播放器事件
    audio.subscribe((state) => {
      isPlaying.value = state.playing
      if (state.errorMsg) errorMsg.value = state.errorMsg
    })

    return {
      // state
      currentSoundId,
      isPlaying,
      errorMsg,
      volume,
      timerTotal,
      timerRemaining,
      // computed
      currentSound,
      hasSound,
      timerActive,
      timerLabel,
      // actions
      playSound,
      toggle,
      stop,
      setVolume,
      setTimer,
      clearTimer,
    }
  },
  {
    persist: {
      pick: ['currentSoundId', 'timerTotal', 'volume'],
    },
  },
)
