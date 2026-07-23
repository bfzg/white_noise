<script lang="ts" setup>
defineOptions({ name: 'Privacy' })
definePage({
  style: {
    navigationBarTitleText: '隐私政策',
    navigationBarBackgroundColor: '#F2F5EF',
  },
})
</script>

<template>
  <view class="min-h-screen bg-[#F2F5EF] p-5">
    <view class="rounded-2xl bg-white p-5 leading-7">
      <text class="mb-3 block text-lg font-semibold text-[#1F2A1E]">隐私政策</text>
      <text class="mb-3 block text-xs text-[#8A9A88]">最后更新：2026-07-22</text>

      <text class="mb-2 mt-4 block text-base font-semibold text-[#1F2A1E]">一、信息收集</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        本小程序为本地工具类应用，不收集您的任何个人信息。我们仅在您使用音频缓存功能时，将音频文件保存在您的设备本地，您可以随时在「我的 - 清理音频缓存」中清除。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">二、信息使用</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        我们不会收集、上传、分享您的任何个人信息。本应用完全在您的设备上运行，所有数据均由您自主控制。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">三、第三方服务</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        本小程序使用微信小程序平台能力（如背景音频播放、本地文件存储）。这些能力遵循微信平台的相关协议。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">四、未成年人保护</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        本应用面向家长或看护人使用，不面向未成年人直接收集信息。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">五、协议变更</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        如本政策发生更新，我们会在小程序内重新发布。请您定期查阅。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">六、联系我们</text>
      <text class="block text-sm text-[#4A5A48]">
        如您对本政策有任何疑问，可通过「我的 - 联系客服」与我们取得联系。
      </text>
    </view>
  </view>
</template>
