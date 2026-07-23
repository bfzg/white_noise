/**
 * 多轨音频混音器
 * - 使用多个 InnerAudioContext 实例实现多轨同时播放
 * - 每个音轨独立音量、独立循环
 * - 支持主控播放/暂停
 *
 * 注意：微信小程序中 InnerAudioContext 在后台会被系统暂停，
 * 这是多轨混音与后台播放的固有权衡。如需后台必须切回单轨 BackgroundAudioManager。
 */

export interface TrackState {
  playing: boolean
  volume: number
}

const tracks = new Map<string, UniApp.InnerAudioContext>()
const states = new Map<string, TrackState>()

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(fn => fn())
}

function ensureTrack(id: string, src: string): UniApp.InnerAudioContext {
  let ctx = tracks.get(id)
  if (!ctx) {
    ctx = uni.createInnerAudioContext()
    ctx.src = src
    ctx.loop = true
    ctx.obeyMuteSwitch = false
    ctx.onPlay(() => {
      states.set(id, { ...getState(id), playing: true })
      emit()
    })
    ctx.onPause(() => {
      states.set(id, { ...getState(id), playing: false })
      emit()
    })
    ctx.onStop(() => {
      states.set(id, { ...getState(id), playing: false })
      emit()
    })
    ctx.onEnded(() => {
      states.set(id, { ...getState(id), playing: false })
      emit()
    })
    ctx.onError((err) => {
      // eslint-disable-next-line no-console
      console.error(`[AudioMixer] track ${id} error:`, err)
      states.set(id, { ...getState(id), playing: false })
      emit()
    })
    tracks.set(id, ctx)
    if (!states.has(id)) {
      states.set(id, { playing: false, volume: 0.5 })
    }
  }
  return ctx
}

function getState(id: string): TrackState {
  return states.get(id) || { playing: false, volume: 0.5 }
}

/** 加载音轨（不播放） */
export function load(id: string, src: string) {
  ensureTrack(id, src)
}

/** 播放指定音轨 */
export function play(id: string, src: string) {
  const ctx = ensureTrack(id, src)
  if (ctx.src !== src) {
    ctx.src = src
  }
  ctx.play()
}

/** 暂停指定音轨 */
export function pause(id: string) {
  const ctx = tracks.get(id)
  if (ctx) ctx.pause()
}

/** 停止指定音轨 */
export function stop(id: string) {
  const ctx = tracks.get(id)
  if (ctx) ctx.stop()
}

/** 卸载指定音轨 */
export function unload(id: string) {
  const ctx = tracks.get(id)
  if (ctx) {
    ctx.destroy()
    tracks.delete(id)
    states.delete(id)
  }
}

/** 设置音轨音量 0-1 */
export function setVolume(id: string, volume: number) {
  const v = Math.max(0, Math.min(1, volume))
  const ctx = tracks.get(id)
  if (ctx) {
    ctx.volume = v
  }
  states.set(id, { ...getState(id), volume: v })
  emit()
}

/** 播放所有已加载音轨 */
export function playAll() {
  tracks.forEach(ctx => ctx.play())
}

/** 暂停所有音轨 */
export function pauseAll() {
  tracks.forEach(ctx => ctx.pause())
}

/** 停止并卸载所有音轨 */
export function stopAll() {
  tracks.forEach((ctx, id) => {
    ctx.stop()
    ctx.destroy()
  })
  tracks.clear()
  states.clear()
  emit()
}

/** 获取当前所有音轨状态 */
export function getAllStates(): Record<string, TrackState> {
  const result: Record<string, TrackState> = {}
  states.forEach((state, id) => {
    result[id] = { ...state }
  })
  return result
}

/** 订阅状态变化 */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** 获取是否任意音轨正在播放 */
export function isAnyPlaying(): boolean {
  for (const state of states.values()) {
    if (state.playing) return true
  }
  return false
}

/** 获取已激活（volume > 0 或正在播放）的音轨数量 */
export function activeCount(): number {
  return tracks.size
}
