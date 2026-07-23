<script lang="ts" setup>
defineOptions({ name: 'About' })
definePage({
  style: {
    navigationBarTitleText: '关于我们',
    navigationBarBackgroundColor: '#F2F5EF',
  },
})
</script>

<template>
  <view class="min-h-screen bg-[#F2F5EF] p-5">
    <view class="mb-6 flex flex-col items-center pt-10">
      <view class="mb-3 h-20 w-20 rounded-2xl bg-[#07c160] flex items-center justify-center">
        <text class="text-3xl text-white">🌙</text>
      </view>
      <text class="text-xl font-semibold text-[#1F2A1E]">哄娃白噪音</text>
      <text class="mt-1 text-sm text-[#8A9A88]">让宝宝安心入睡的好帮手</text>
    </view>

    <view class="mb-4 rounded-2xl bg-white p-5">
      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">产品介绍</text>
      <text class="leading-7 text-sm text-[#4A5A48]">
        哄娃白噪音是一款专为新生儿家庭设计的哄睡小程序，收录了安抚初生、自然万象、精选混音三大类共 18 种白噪音音源，帮助宝宝在熟悉的声环境中安心入睡。
      </text>
    </view>

    <view class="mb-4 rounded-2xl bg-white p-5">
      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">功能特点</text>
      <text class="leading-7 text-sm text-[#4A5A48]">
        · 海量白噪音，覆盖宝宝哄睡常见场景\n· 一键下载缓存，离线也能听\n· 定时关闭，睡着后自动停止\n· 简洁界面，操作不打扰
      </text>
    </view>

    <view class="mb-4 rounded-2xl bg-white p-5">
      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">联系我们</text>
      <text class="leading-7 text-sm text-[#4A5A48]">
        如果您有任何建议或反馈，欢迎通过「我的 - 联系客服」与我们联系，我们会认真倾听每一位宝爸宝妈的声音。
      </text>
    </view>
  </view>
</template>
