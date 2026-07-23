/**
 * 音频文件本地缓存管理
 *
 * - 小程序端：使用 uni.downloadFile + uni.saveFile 把音频持久化到 USER_DATA_PATH
 *   下次播放直接读本地文件，省去下载耗时
 * - H5 端：浏览器无法跨域持久化原始音频二进制，回退为直接使用网络 URL
 *
 * 用法：
 *   const path = await audioCache.getOrDownload(url)
 *   await audio.play(path)
 */

interface CacheRecord {
  url: string
  savedFilePath: string
  size: number
  cachedAt: number
}

const STORAGE_KEY = 'wn_audio_cache_v1'

// 内存中的缓存索引（启动时从 storage 加载）
let cacheIndex: Record<string, CacheRecord> = {}
let initialized = false

function persist() {
  try {
    uni.setStorageSync(STORAGE_KEY, cacheIndex)
  }
  catch (e) {
    console.warn('[audioCache] persist failed', e)
  }
}

function load() {
  if (initialized)
    return
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (raw && typeof raw === 'object') {
      cacheIndex = raw as Record<string, CacheRecord>
    }
  }
  catch (e) {
    console.warn('[audioCache] load failed', e)
  }
  initialized = true
}

function isWeixinMp(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

/** 判断是否为本地资源路径（/static/ 前缀） */
function isLocalPath(url: string): boolean {
  return url.startsWith('/static/') || url.startsWith('static/')
}

/** 获取最终可播放的路径：本地文件直接返回，远程文件优先用本地缓存，否则触发下载 */
export async function getOrDownload(url: string): Promise<string> {
  if (!url)
    return ''
  load()

  // 本地打包文件 & H5 端：直接返回原路径，无需下载
  if (!isWeixinMp() || isLocalPath(url))
    return url

  // 命中缓存
  const hit = cacheIndex[url]
  if (hit?.savedFilePath) {
    // 校验文件是否真的还在
    try {
      const info = await getFileInfo(hit.savedFilePath)
      if (info.size > 0)
        return hit.savedFilePath
    }
    catch {
      // 文件失效，删除记录并重新下载
      delete cacheIndex[url]
    }
  }

  // 下载并保存
  try {
    const dl = await uni.downloadFile({ url })
    if (dl.statusCode !== 200 || !dl.tempFilePath) {
      throw new Error(`download failed: ${dl.statusCode}`)
    }
    const saved = await uni.saveFile({ tempFilePath: dl.tempFilePath })
    if (!saved.savedFilePath)
      throw new Error('saveFile returned empty path')

    const info = await getFileInfo(saved.savedFilePath)
    cacheIndex[url] = {
      url,
      savedFilePath: saved.savedFilePath,
      size: info.size,
      cachedAt: Date.now(),
    }
    persist()
    return saved.savedFilePath
  }
  catch (e) {
    console.warn('[audioCache] getOrDownload failed, fallback to network url', e)
    return url
  }
}

function getFileInfo(filePath: string): Promise<{ size: number }> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.getFileSystemManager().getFileInfo({
      filePath,
      success: (res) => {
        resolve({ size: res.size || 0 })
      },
      fail: err => reject(err),
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve({ size: 0 })
    // #endif
  })
}

/** 计算当前缓存总大小（字节） */
export function getCacheSize(): number {
  load()
  return Object.values(cacheIndex).reduce((sum, r) => sum + (r.size || 0), 0)
}

/** 缓存文件数量 */
export function getCacheCount(): number {
  load()
  return Object.keys(cacheIndex).length
}

/** 清空全部音频缓存 */
export async function clearCache(): Promise<void> {
  load()
  const records = Object.values(cacheIndex)
  await Promise.all(records.map(async (r) => {
    if (!r.savedFilePath)
      return
    try {
      await uni.removeSavedFile({ filePath: r.savedFilePath })
    }
    catch (e) {
      console.warn('[audioCache] remove failed', r.savedFilePath, e)
    }
  }))
  cacheIndex = {}
  persist()
}

/** 删除单条缓存（用于音源地址变更等场景） */
export async function removeOne(url: string): Promise<void> {
  load()
  const r = cacheIndex[url]
  if (!r)
    return
  try {
    await uni.removeSavedFile({ filePath: r.savedFilePath })
  }
  catch (e) {
    console.warn('[audioCache] removeOne failed', e)
  }
  delete cacheIndex[url]
  persist()
}
