<script lang="ts" setup>
defineOptions({ name: 'Agreement' })
definePage({
  style: {
    navigationBarTitleText: '用户协议',
    navigationBarBackgroundColor: '#F2F5EF',
  },
})
</script>

<template>
  <view class="min-h-screen bg-[#F2F5EF] p-5">
    <view class="rounded-2xl bg-white p-5 leading-7">
      <text class="mb-3 block text-lg font-semibold text-[#1F2A1E]">用户协议</text>
      <text class="mb-3 block text-xs text-[#8A9A88]">最后更新：2026-07-22</text>

      <text class="mb-2 mt-4 block text-base font-semibold text-[#1F2A1E]">一、服务说明</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        哄娃白噪音（以下简称"本应用"）是一款提供白噪音音频播放的工具型小程序。本协议是您与开发者之间就使用本应用所订立的协议。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">二、使用规则</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        1. 您应保证使用本应用的网络环境与设备合法合规；\n2. 请勿利用本应用从事违反法律法规的活动；\n3. 因使用本应用所产生的任何后果，由您自行承担。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">三、知识产权</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        本应用内提供的音频资源，仅供您个人在合法范围内使用。未经授权，请勿用于商业用途或公开传播。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">四、免责声明</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        本应用按"现状"提供，开发者不对音频内容的持续可用性、准确性或特定用途的适用性作任何明示或暗示的保证。\n请勿长时间大音量使用本应用，以免对您的设备或听力造成影响。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">五、协议变更</text>
      <text class="mb-3 block text-sm text-[#4A5A48]">
        开发者有权根据需要修改本协议，修改后的协议将在本应用内重新发布。继续使用本应用即视为接受修改后的协议。
      </text>

      <text class="mb-2 block text-base font-semibold text-[#1F2A1E]">六、联系我们</text>
      <text class="block text-sm text-[#4A5A48]">
        如您对本协议有任何疑问，可通过「我的 - 联系客服」与我们取得联系。
      </text>
    </view>
  </view>
</template>
