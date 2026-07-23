/**
 * 音频播放器封装
 * - 使用 BackgroundAudioManager 以支持后台播放（小程序端）
 * - H5 端回退为 InnerAudioContext
 * - 循环播放（白噪音需要）
 */

import { isMpWeixin } from '@uni-helper/uni-env'

type BgAudio = UniApp.BackgroundAudioManager & {
  // 兼容字段
}

let bgm: BgAudio | null = null
let iaudio: UniApp.InnerAudioContext | null = null

type Listener = (state: PlayerState) => void

export interface PlayerState {
  playing: boolean
  paused: boolean
  stopped: boolean
  duration: number
  currentTime: number
  errorMsg?: string
}

const listeners = new Set<Listener>()
let lastState: PlayerState = {
  playing: false,
  paused: false,
  stopped: true,
  duration: 0,
  currentTime: 0,
}

function emit(partial: Partial<PlayerState>) {
  lastState = { ...lastState, ...partial }
  listeners.forEach(l => l(lastState))
}

function ensurePlayer() {
  if (isMpWeixin) {
    if (!bgm) {
      bgm = uni.getBackgroundAudioManager()
      bgm.onPlay(() => emit({ playing: true, paused: false, stopped: false, errorMsg: undefined }))
      bgm.onPause(() => emit({ playing: false, paused: true }))
      bgm.onStop(() => emit({ playing: false, paused: false, stopped: true }))
      bgm.onEnded(() => emit({ playing: false, paused: false, stopped: true }))
      bgm.onError(err => emit({ playing: false, paused: false, stopped: true, errorMsg: String(err?.errMsg || err) }))
      bgm.onTimeUpdate(() => {
        emit({
          currentTime: bgm?.currentTime || 0,
          duration: bgm?.duration || 0,
        })
      })
    }
    return bgm
  }
  if (!iaudio) {
    iaudio = uni.createInnerAudioContext()
    iaudio.loop = true
    iaudio.obeyMuteSwitch = false
    iaudio.onPlay(() => emit({ playing: true, paused: false, stopped: false, errorMsg: undefined }))
    iaudio.onPause(() => emit({ playing: false, paused: true }))
    iaudio.onStop(() => emit({ playing: false, paused: false, stopped: true }))
    iaudio.onEnded(() => emit({ playing: false, paused: false, stopped: true }))
    iaudio.onError(err => emit({ playing: false, paused: false, stopped: true, errorMsg: String(err?.errMsg || err) }))
  }
  return iaudio
}

/** 播放指定路径（本地路径或网络 URL） */
export function play(src: string, title = '白噪音', coverImgUrl = '') {
  if (!src) return
  const p = ensurePlayer()
  p.stop()
  p.src = src
  p.title = title
  if (isMpWeixin) {
    // BackgroundAudioManager 还支持更多字段
    ;(p as any).coverImgUrl = coverImgUrl
    ;(p as any).epname = title
    ;(p as any).singer = '哄娃白噪音'
  }
  p.play()
}

/** 暂停 */
export function pause() {
  if (isMpWeixin) bgm?.pause()
  else iaudio?.pause()
}

/** 恢复 */
export function resume() {
  if (isMpWeixin) bgm?.play()
  else iaudio?.play()
}

/** 停止 */
export function stop() {
  if (isMpWeixin) bgm?.stop()
  else iaudio?.stop()
  emit({ playing: false, paused: false, stopped: true })
}

/** 切换 播放/暂停 */
export function toggle() {
  if (lastState.playing) pause()
  else resume()
}

/** 设置音量 0-1 */
export function setVolume(value: number) {
  const v = Math.max(0, Math.min(1, value))
  if (isMpWeixin) {
    if (bgm) bgm.volume = v
  }
  else {
    if (iaudio) iaudio.volume = v
  }
}

/** 订阅播放器状态 */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  fn(lastState)
  return () => listeners.delete(fn)
}

/** 读取当前快照 */
export function snapshot(): PlayerState {
  return { ...lastState }
}

/** 释放资源（页面卸载时调用） */
export function destroy() {
  if (iaudio) {
    iaudio.destroy()
    iaudio = null
  }
  // BackgroundAudioManager 是单例，不要 destroy
  bgm = null
}
