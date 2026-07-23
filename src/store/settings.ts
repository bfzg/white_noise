/**
 * 设置项 store
 * - followSystemTheme: 是否跟随系统日/夜间
 * - lastClearAt: 上次清理时间
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const followSystemTheme = ref(true)
    const lastClearAt = ref<number>(0)
    const appVersion = ref('1.0.0') // 与 manifest 中 versionName 保持一致

    function setFollowSystem(v: boolean) {
      followSystemTheme.value = v
    }

    return {
      followSystemTheme,
      lastClearAt,
      appVersion,
      setFollowSystem,
    }
  },
  {
    persist: {
      pick: ['followSystemTheme', 'lastClearAt'],
    },
  },
)
