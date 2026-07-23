<script lang="ts" setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useSettingsStore } from '@/store/settings'
import { clearCache, getCacheSize } from '@/utils/audioCache'
import { formatBytes } from '@/utils/format'

defineOptions({ name: 'Me' })
definePage({
  style: {
    navigationBarTitleText: '我的',
    navigationBarBackgroundColor: '#FFF8F2',
  },
})

const versionLabel = '1.0.0'

const settings = useSettingsStore()
const cacheSize = ref(0)

function refreshCacheSize() {
  cacheSize.value = getCacheSize()
}

onShow(() => {
  refreshCacheSize()
})

function shareToFriend() {
  // #ifdef MP-WEIXIN
  uni.showToast({ title: '点击右上角 · · · 分享', icon: 'none' })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '仅微信小程序支持', icon: 'none' })
  // #endif
}

function addToDesktop() {
  uni.showModal({
    title: '添加到桌面',
    content: '微信内：点击右上角 · · · → 「添加到桌面」\n按提示在系统设置中允许「桌面快捷方式」即可。',
    showCancel: false,
    confirmText: '我知道了',
  })
}

function confirmClearCache() {
  if (cacheSize.value === 0) {
    uni.showToast({ title: '暂无缓存', icon: 'none' })
    return
  }
  uni.showModal({
    title: '清理音频缓存',
    content: `将清除 ${formatBytes(cacheSize.value)} 的已下载音频，下次播放需重新下载，确认清理？`,
    success: async (res) => {
      if (!res.confirm)
        return
      uni.showLoading({ title: '清理中...' })
      try {
        await clearCache()
        settings.lastClearAt = Date.now()
        refreshCacheSize()
        uni.hideLoading()
        uni.showToast({ title: '清理完成', icon: 'success' })
      }
      catch (_e) {
        uni.hideLoading()
        uni.showToast({ title: '清理失败', icon: 'none' })
      }
    },
  })
}
</script>

<template>
  <view class="min-h-screen pt-3 pb-safe" style="background: #FFF8F2;">
    <!-- 帮助与支持 -->
    <view class="mx-5 mb-6 overflow-hidden rounded-3xl bg-white shadow-sm">
      <view class="flex items-center px-4 py-4 active:opacity-70" @tap="shareToFriend">
        <view class="mr-3 h-10 w-10 flex items-center justify-center rounded-2xl" style="background: #07c16018;">
          <view class="i-carbon-share h-5 w-5" style="color: #07c160;" />
        </view>
        <text class="flex-1 text-base font-medium" style="color: #4A453E;">分享给好友</text>
        <view class="i-carbon-chevron-right h-4 w-4" style="color: #C8BFB8;" />
      </view>
      <view class="mx-4 h-px" style="background: #F5F0ED;" />

      <view class="flex items-center px-4 py-4 active:opacity-70" @tap="addToDesktop">
        <view class="mr-3 h-10 w-10 flex items-center justify-center rounded-2xl" style="background: #FFB6C118;">
          <view class="i-carbon-screen h-5 w-5" style="color: #FFB6C1;" />
        </view>
        <text class="flex-1 text-base font-medium" style="color: #4A453E;">添加到桌面</text>
        <view class="i-carbon-chevron-right h-4 w-4" style="color: #C8BFB8;" />
      </view>
      <view class="mx-4 h-px" style="background: #F5F0ED;" />

      <view class="flex items-center px-4 py-4 active:opacity-70" @tap="confirmClearCache">
        <view class="mr-3 h-10 w-10 flex items-center justify-center rounded-2xl" style="background: #FFE9C218;">
          <view class="i-carbon-trash-can h-5 w-5" style="color: #D4A574;" />
        </view>
        <text class="flex-1 text-base font-medium" style="color: #4A453E;">清理音频缓存</text>
        <text class="mr-2 text-sm" style="color: #9B8E84;">{{ formatBytes(cacheSize) }}</text>
        <view class="i-carbon-chevron-right h-4 w-4" style="color: #C8BFB8;" />
      </view>
    </view>

    <!-- 版本与版权 -->
    <view class="mt-auto px-5 pb-6 pt-8 text-center">
      <text class="block text-xs font-medium" style="color: #C8BFB8;">v{{ versionLabel }}</text>
      <text class="mt-1 block text-xs" style="color: #D8D0C8;">2026 哄睡白噪音 · 版权所有</text>
    </view>
  </view>
</template>
