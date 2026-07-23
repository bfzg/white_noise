<script lang="ts" setup>
defineOptions({ name: 'Contact' })
definePage({
  style: {
    navigationBarTitleText: '联系客服',
    navigationBarBackgroundColor: '#F2F5EF',
  },
})

const wechat = 'hwh-bai-zhao-ye'
const workTime = '9:00 - 21:00'

function copyWechat() {
  uni.setClipboardData({
    data: wechat,
    success: () => uni.showToast({ title: '已复制微信号', icon: 'success' }),
  })
}
</script>

<template>
  <view class="min-h-screen bg-[#F2F5EF] p-5">
    <view class="mb-4 flex flex-col items-center rounded-2xl bg-white p-8">
      <view class="mb-3 h-16 w-16 rounded-full bg-[#07c160] flex items-center justify-center">
        <text class="text-2xl text-white">💬</text>
      </view>
      <text class="text-base font-semibold text-[#1F2A1E]">在线客服</text>
      <text class="mt-1 text-sm text-[#8A9A88]">有问题随时找我们</text>
    </view>

    <view class="mb-4 rounded-2xl bg-white p-5">
      <view class="mb-3 flex items-center justify-between">
        <text class="text-sm text-[#8A9A88]">客服微信号</text>
        <text class="text-base text-[#1F2A1E]">{{ wechat }}</text>
      </view>
      <view class="mb-3 flex items-center justify-between">
        <text class="text-sm text-[#8A9A88]">服务时间</text>
        <text class="text-base text-[#1F2A1E]">{{ workTime }}</text>
      </view>
      <view
        class="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#07c160] text-white"
        hover-class="opacity-90"
        @tap="copyWechat"
      >
        复制微信号
      </view>
    </view>

    <view class="rounded-2xl bg-white p-5">
      <text class="mb-2 block text-sm text-[#8A9A88]">温馨提示</text>
      <text class="leading-7 text-sm text-[#4A5A48]">
        1. 添加微信时请备注「白噪音」，方便我们快速通过；\n2. 工作时间内一般 30 分钟内回复；\n3. 紧急问题建议直接电话联系。
      </text>
    </view>
  </view>
</template>
