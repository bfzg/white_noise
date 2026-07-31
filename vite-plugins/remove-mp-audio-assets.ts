import type { Plugin } from 'vite'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

export function removeMpAudioAssetsPlugin(enable: boolean): Plugin {
  return {
    name: 'remove-mp-audio-assets',
    apply: 'build',
    async closeBundle() {
      if (!enable)
        return

      const modeDir = process.env.NODE_ENV === 'production' ? 'build' : 'dev'
      const outputDir = path.resolve(process.cwd(), 'dist', modeDir, 'mp-weixin', 'static')
      const targets = ['audio', 'audio2'].map(dir => path.join(outputDir, dir))

      await Promise.all(targets.map(async (target) => {
        await fs.rm(target, { recursive: true, force: true })
      }))
      console.log('[remove-mp-audio-assets] removed static/audio and static/audio2 from mp-weixin output')
    },
  }
}
