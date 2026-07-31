interface BackgroundTrack {
  id: string
  src: string
  title: string
  volume: number
}

let currentTrack: BackgroundTrack | null = null
let playing = false
let initialized = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(fn => fn())
}

function getManager(): any {
  // #ifdef MP-WEIXIN
  const manager = wx.getBackgroundAudioManager()
  if (!initialized) {
    initialized = true
    manager.onPlay(() => {
      playing = true
      emit()
    })
    manager.onPause(() => {
      playing = false
      emit()
    })
    manager.onEnded(() => {
      if (currentTrack) {
        manager.src = currentTrack.src
      }
    })
    manager.onStop(() => {
      playing = false
      currentTrack = null
      emit()
    })
    manager.onError(() => {
      playing = false
      emit()
    })
  }
  return manager
  // #endif
  // #ifndef MP-WEIXIN
  return null
  // #endif
}

export function isSupported(): boolean {
  return !!getManager()
}

export function getCurrentTrackId(): string {
  return currentTrack?.id || ''
}

export function isPlaying(): boolean {
  return playing
}

export function play(track: BackgroundTrack) {
  const manager = getManager()
  if (!manager)
    return false

  currentTrack = track
  manager.title = track.title
  manager.epname = '睡眠白噪音'
  manager.singer = '睡眠白噪音'
  manager.src = track.src
  if ('volume' in manager)
    manager.volume = track.volume

  playing = true
  emit()
  return true
}

export function setVolume(volume: number) {
  const manager = getManager()
  if (!manager || !currentTrack)
    return

  const v = Math.max(0, Math.min(1, volume))
  currentTrack = { ...currentTrack, volume: v }
  if ('volume' in manager)
    manager.volume = v
}

export function pause() {
  const manager = getManager()
  if (manager)
    manager.pause()
  playing = false
  emit()
}

export function stop() {
  const manager = getManager()
  if (manager)
    manager.stop()
  playing = false
  currentTrack = null
  emit()
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
