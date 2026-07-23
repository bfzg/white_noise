<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { TIMER_OPTIONS, usePlayerStore } from '@/store/player'
import { SOUND_DATA } from '@/types/sound'
import type { SoundItem } from '@/types/sound'
import * as audio from '@/utils/audio'

defineOptions({ name: 'Home' })
definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '哄娃白噪音',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#FFF8F2',
  },
})

const player = usePlayerStore()

const allSounds = computed<SoundItem[]>(() => {
  return SOUND_DATA.categories.flatMap(cat => cat.sounds)
})

const showTimerPicker = ref(false)
const currentTimerIndex = computed(() => {
  return TIMER_OPTIONS.findIndex(o => o.value === player.timerTotal)
})

function onCardTap(sound: SoundItem) {
  if (!sound.url) {
    uni.showToast({ title: '音源地址待配置', icon: 'none' })
    return
  }
  player.playSound(sound.id)
}

function onPlayToggle() {
  player.toggle()
}

function openTimerPicker() {
  showTimerPicker.value = true
}

function selectTimer(idx: number) {
  const opt = TIMER_OPTIONS[idx]
  player.setTimer(opt.value)
  showTimerPicker.value = false
  if (opt.value > 0) {
    uni.showToast({ title: `已设定 ${opt.label}`, icon: 'none' })
  }
}

function gotoMe() {
  uni.navigateTo({ url: '/pages/me/me' })
}

function onVolumeChange(e: any) {
  const value = e.detail.value / 100
  player.setVolume(value)
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

onShow(() => {
  audio.setVolume(player.volume)
})
</script>

<template>
  <view class="home min-h-screen flex flex-col" style="background: #FFF8F2;">
    <scroll-view class="flex-1" scroll-y>
      <!-- 顶部暖心标题 -->
      <view class="px-6 pb-2 pt-8">
        <text class="block text-3xl font-bold" style="color: #3D3530; font-family: 'PingFang SC', system-ui;">
          今夜好眠
        </text>
        <text class="mt-1 block text-sm" style="color: #A89A8E;">
          选一个声音，陪你入梦
        </text>
      </view>

      <!-- 声音卡片网格 -->
      <view class="mx-5 pb-32 pt-3">
        <view
          v-for="(row, rowIdx) in chunk(allSounds, 2)"
          :key="rowIdx"
          class="mb-3 flex gap-3"
        >
          <view
            v-for="sound in row"
            :key="sound.id"
            class="flex-1"
            @tap="onCardTap(sound)"
          >
            <view
              class="relative flex flex-col items-center justify-center overflow-hidden rounded-[28rpx] px-3 py-6 active:scale-95"
              :style="{
                background: player.currentSoundId === sound.id
                  ? sound.color
                  : `${sound.color}14`,
                border: player.currentSoundId === sound.id
                  ? `4rpx solid ${sound.color}`
                  : '4rpx solid transparent',
                height: '210rpx',
              }"
            >
              <!-- 大图标 -->
              <view
                :class="sound.icon"
                class="h-14 w-14"
                :style="{
                  color: player.currentSoundId === sound.id
                    ? '#FFFFFF'
                    : sound.color,
                }"
              />
              <!-- 名称 -->
              <text
                class="mt-2 text-sm font-semibold"
                :style="{
                  color: player.currentSoundId === sound.id
                    ? '#FFFFFF'
                    : '#3D3530',
                }"
              >
                {{ sound.name }}
              </text>
              <!-- 选中态：右上角白点 -->
              <view
                v-if="player.currentSoundId === sound.id"
                class="absolute right-2 top-2 h-5 w-5 flex items-center justify-center rounded-full"
                style="background: rgba(255,255,255,0.4);"
              >
                <view class="i-carbon-checkmark h-3 w-3 text-white" />
              </view>
            </view>
          </view>
          <view v-if="row.length < 2" class="flex-1" />
        </view>
      </view>
    </scroll-view>

    <!-- 音量微调面板 -->
    <view
      v-if="player.hasSound"
      class="absolute bottom-32 left-0 right-0 z-10 mx-5 flex items-center gap-3 rounded-full bg-white px-4 py-3"
      style="box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);"
    >
      <view class="i-carbon-volume-up h-5 w-5 flex-shrink-0" style="color: #A89A8E;" />
      <text class="flex-shrink-0 text-xs font-medium" style="color: #3D3530;">
        {{ player.currentSound?.name }}
      </text>
      <slider
        class="flex-1"
        :value="Math.round(player.volume * 100)"
        active-color="#07c160"
        background-color="#F2EBE5"
        block-color="#07c160"
        @change="onVolumeChange"
        @changing="onVolumeChange"
      />
      <text class="flex-shrink-0 text-xs" style="color: #A89A8E; width: 36px;">
        {{ Math.round(player.volume * 100) }}%
      </text>
    </view>

    <!-- 底部三键 -->
    <view
      class="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between bg-white px-5 pb-12 pt-3"
    >
      <!-- 定时设置 -->
      <view
        class="h-12 w-32 flex items-center justify-center gap-2 rounded-full bg-white active:scale-95"
        style="box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);"
        @tap="openTimerPicker"
      >
        <view
          class="i-carbon-timer h-4 w-4"
          :style="{ color: player.timerActive ? '#07c160' : '#A89A8E' }"
        />
        <text
          class="text-sm font-semibold"
          :style="{ color: player.timerActive ? '#07c160' : '#3D3530' }"
        >
          {{ player.timerActive ? player.timerLabel : '定时' }}
        </text>
      </view>

      <!-- 播放/暂停 大圆钮（无阴影） -->
      <view
        class="h-16 w-16 flex items-center justify-center rounded-full active:scale-90"
        style="background: #07c160;"
        @tap="onPlayToggle"
      >
        <view
          v-if="player.isPlaying"
          class="i-carbon-pause-filled h-7 w-7 text-white"
        />
        <view
          v-else
          class="i-carbon-play-filled-alt h-8 w-8 text-white"
        />
      </view>

      <!-- 我的 -->
      <view
        class="h-12 w-32 flex items-center justify-center gap-2 rounded-full bg-white active:scale-95"
        style="box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);"
        @tap="gotoMe"
      >
        <view class="i-carbon-user-avatar h-4 w-4" style="color: #A89A8E;" />
        <text class="text-sm font-semibold" style="color: #3D3530;">我的</text>
      </view>
    </view>

    <!-- 定时弹层 -->
    <view
      v-if="showTimerPicker"
      class="fixed inset-0 z-50 flex items-end bg-black/40"
      @tap="showTimerPicker = false"
    >
      <view
        class="w-full rounded-t-3xl bg-white p-5 pb-8"
        @tap.stop
      >
        <view class="mb-1 text-center text-base font-bold" style="color: #3D3530;">
          定时关闭
        </view>
        <view class="mb-5 text-center text-xs" style="color: #A89A8E;">
          设定后自动停止播放
        </view>
        <view
          v-for="(opt, idx) in TIMER_OPTIONS"
          :key="opt.value"
          class="flex items-center justify-between border-b py-4 last:border-0"
          style="border-color: #F2EBE5;"
          @tap="selectTimer(idx)"
        >
          <view class="flex items-center gap-3">
            <view
              v-if="idx === currentTimerIndex"
              class="i-carbon-checkmark h-5 w-5"
              style="color: #07c160;"
            />
            <view v-else class="h-5 w-5" />
            <text class="text-base" style="color: #3D3530;">{{ opt.label }}</text>
          </view>
        </view>
        <view
          class="mt-5 h-12 w-full flex items-center justify-center rounded-full"
          style="background: #F2EBE5; color: #A89A8E;"
          @tap="showTimerPicker = false"
        >
          <text class="text-sm font-medium">取消</text>
        </view>
      </view>
    </view>
  </view>
</template>
