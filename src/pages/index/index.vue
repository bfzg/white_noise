<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { TIMER_OPTIONS, usePlayerStore } from '@/store/player'
import { findSoundById, SOUND_DATA } from '@/types/sound'
import type { SoundItem } from '@/types/sound'
import * as mixer from '@/utils/audioMixer'

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
const showMixerPanel = ref(true)
const currentTimerIndex = computed(() => {
  return TIMER_OPTIONS.findIndex(o => o.value === player.timerTotal)
})

const activeMixerItems = computed(() => {
  return player.activeSoundList
    .map(({ id, volume }) => {
      const sound = findSoundById(id)
      if (!sound)
        return null
      return { ...sound, id, volume }
    })
    .filter(Boolean) as Array<SoundItem & { volume: number }>
})

function isSoundActive(id: string) {
  return Object.prototype.hasOwnProperty.call(player.activeSounds, id)
}

function soundVolume(id: string) {
  return player.activeSounds[id] ?? 0
}

function soundVolumePercent(id: string) {
  return Math.round(soundVolume(id) * 100)
}

function cardStyle(sound: SoundItem) {
  const active = isSoundActive(sound.id)
  return {
    background: active
      ? `linear-gradient(160deg, ${sound.color} 0%, ${sound.color}E6 62%, ${sound.color}B8 100%)`
      : `linear-gradient(160deg, #FFFFFF 0%, ${sound.color}1A 100%)`,
    border: active ? `4rpx solid ${sound.color}` : `4rpx solid ${sound.color}3D`,
    height: '300rpx',
  }
}

function sceneImageStyle(sound: SoundItem) {
  const active = isSoundActive(sound.id)
  return {
    opacity: active ? 0.28 : 0.16,
  }
}

function onCardTap(sound: SoundItem) {
  if (!sound.url) {
    uni.showToast({ title: '音源地址待配置', icon: 'none' })
    return
  }
  player.toggleSound(sound.id)
}

function onMixerVolumeChange(sound: SoundItem & { volume: number }, e: any) {
  const value = e.detail.value / 100
  player.setSoundVolume(sound.id, value)
}

function onPlayToggle() {
  player.toggle()
}

function openTimerPicker() {
  showTimerPicker.value = true
}

function toggleMixerPanel() {
  if (!activeMixerItems.value.length)
    return
  showMixerPanel.value = !showMixerPanel.value
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

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

onShow(async () => {
  // 页面回到前台时，恢复持久化的音轨
  await player.initFromPersist()
  if (player.isPlaying && !mixer.isAnyPlaying()) {
    await player.playAllActive()
  }
})
</script>

<template>
  <view class="home min-h-screen flex flex-col" style="background: #FFF8F2;">
    <scroll-view class="flex-1" scroll-y>
      <!-- 顶部标题 -->
      <view class="px-6 pb-3 pt-8">
        <text class="block text-3xl font-bold" style="color: #3D3530; font-family: 'PingFang SC', system-ui;">
          哄娃白噪音
        </text>
        <text class="mt-1 block text-sm" style="color: #A89A8E;">
          混合你喜欢的声音
        </text>
      </view>

      <!-- 声音卡片网格 -->
      <view class="mx-5 pb-80 pt-2">
        <view v-for="(row, rowIdx) in chunk(allSounds, 2)" :key="rowIdx" class="mb-3 flex gap-3">
          <view v-for="sound in row" :key="sound.id" class="flex-1">
            <view
              class="relative overflow-hidden rounded-[28rpx] px-4 py-4 active:scale-95" :style="cardStyle(sound)"
              @tap="onCardTap(sound)"
            >
              <image
                v-if="sound.image" :src="sound.image" mode="aspectFit" class="absolute bottom-0 right-0 h-24 w-24"
                :style="sceneImageStyle(sound)"
              />
              <view
                v-else class="absolute bottom-0 right-0 h-24 w-24 rounded-tl-full"
                :style="{ background: `${sound.color}26` }"
              />

              <view class="relative z-10 h-full flex flex-col justify-between">
                <view class="flex items-start justify-between gap-2">
                  <view>
                    <text
                      class="block text-base font-semibold" :style="{
                        color: isSoundActive(sound.id) ? '#FFFFFF' : '#3D3530',
                      }"
                    >
                      {{ sound.name }}
                    </text>
                    <text
                      class="mt-1 block text-[22rpx] leading-4" :style="{
                        color: isSoundActive(sound.id) ? 'rgba(255,255,255,0.78)' : '#8D8178',
                      }"
                    >
                      {{ sound.desc }}
                    </text>
                  </view>
                  <view
                    v-if="isSoundActive(sound.id)"
                    class="h-6 min-w-10 flex shrink-0 items-center justify-center rounded-full px-2"
                    style="background: rgba(255,255,255,0.24);"
                  >
                    <text class="text-[20rpx] text-white font-semibold">{{ soundVolumePercent(sound.id) }}%</text>
                  </view>
                </view>
              </view>

              <!-- 选中态 -->
              <view
                v-if="isSoundActive(sound.id)"
                class="absolute bottom-3 right-3 h-5 w-5 flex items-center justify-center rounded-full"
                style="background: rgba(255,255,255,0.32);"
              >
                <view class="i-carbon-checkmark h-3 w-3 text-white" />
              </view>
            </view>
          </view>
          <view v-if="row.length < 2" class="flex-1" />
        </view>
      </view>
    </scroll-view>

    <!-- 底部控制栏 -->
    <view
      class="fixed bottom-0 left-0 right-0 z-30 mx-auto overflow-hidden rounded-t-3xl bg-white px-4 pb-6 pt-3"
      style="box-shadow: 0 -8rpx 36rpx rgba(61,53,48,0.08);"
    >
      <view v-if="activeMixerItems.length" class="pb-3">
        <view class="mb-2 flex items-center justify-between" @tap="toggleMixerPanel">
          <view class="flex items-center gap-2">
            <text class="text-sm font-semibold" style="color: #3D3530;">
              混音控制
            </text>
            <text class="text-xs" style="color: #A89A8E;">
              {{ activeMixerItems.length }} 个音源
            </text>
          </view>
          <text class="text-xs font-medium" style="color: #A89A8E;">
            {{ showMixerPanel ? '收起' : '展开' }}
          </text>
        </view>

        <scroll-view v-if="showMixerPanel" scroll-y class="max-h-62">
          <view v-for="sound in activeMixerItems" :key="sound.id" class="mb-2 rounded-2xl py-1.5 last:mb-0">
            <view class="mb-1 flex items-center justify-between gap-3">
              <view class="min-w-0 flex-1">
                <text class="block truncate text-sm font-semibold">
                  {{ sound.name }}
                </text>
              </view>
              <view
                class="h-6 min-w-12 flex items-center justify-center rounded-full"
                :style="{ background: `${sound.color}22` }"
              >
                <text class="text-[20rpx] font-semibold" :style="{ color: sound.color }">
                  {{ Math.round(sound.volume * 100) }}%
                </text>
              </view>
            </view>

            <slider
              :value="Math.round(sound.volume * 100)" active-color="#07c160" background-color="#E9DED3"
              block-color="#FFFFFF" @change="onMixerVolumeChange(sound, $event)"
              @changing="onMixerVolumeChange(sound, $event)"
            />
          </view>
        </scroll-view>
      </view>

      <view class="flex items-center justify-between">
        <!-- 定时设置 -->
        <view
          class="h-12 w-28 flex items-center justify-center gap-2 rounded-full bg-white active:scale-95"
          @tap="openTimerPicker"
        >
          <view class="i-carbon-timer h-4 w-4" :style="{ color: player.timerActive ? '#07c160' : '#A89A8E' }" />
          <text class="text-sm font-semibold" :style="{ color: player.timerActive ? '#07c160' : '#3D3530' }">
            {{ player.timerActive ? player.timerLabel : '定时' }}
          </text>
        </view>

        <!-- 播放/暂停 大圆钮（无阴影） -->
        <view
          class="h-16 w-16 flex items-center justify-center rounded-full active:scale-90" :style="{
            background: player.hasSound ? '#07c160' : '#D1D1D1',
          }" @tap="onPlayToggle"
        >
          <view v-if="player.isPlaying" class="i-carbon-pause-filled h-7 w-7 text-white" />
          <view v-else class="i-carbon-play-filled-alt h-8 w-8 text-white" />
        </view>

        <!-- 我的 -->
        <view
          class="h-12 w-28 flex items-center justify-center gap-2 rounded-full bg-white active:scale-95"
          @tap="gotoMe"
        >
          <view class="i-carbon-user-avatar h-4 w-4" style="color: #A89A8E;" />
          <text class="text-sm font-semibold" style="color: #3D3530;">我的</text>
        </view>
      </view>
    </view>

    <!-- 定时弹层 -->
    <view v-if="showTimerPicker" class="fixed inset-0 z-50 flex items-end bg-black/40" @tap="showTimerPicker = false">
      <view class="w-full rounded-t-3xl bg-white p-5 pb-8" @tap.stop>
        <view class="mb-1 text-center text-base font-bold" style="color: #3D3530;">
          定时关闭
        </view>
        <view class="mb-5 text-center text-xs" style="color: #A89A8E;">
          设定后自动停止播放
        </view>
        <view
          v-for="(opt, idx) in TIMER_OPTIONS" :key="opt.value"
          class="flex items-center justify-between border-b py-4 last:border-0" style="border-color: #F2EBE5;"
          @tap="selectTimer(idx)"
        >
          <view class="flex items-center gap-3">
            <view v-if="idx === currentTimerIndex" class="i-carbon-checkmark h-5 w-5" style="color: #07c160;" />
            <view v-else class="h-5 w-5" />
            <text class="text-base" style="color: #3D3530;">{{ opt.label }}</text>
          </view>
        </view>
        <view
          class="mt-5 h-12 w-full flex items-center justify-center rounded-full"
          style="background: #F2EBE5; color: #A89A8E;" @tap="showTimerPicker = false"
        >
          <text class="text-sm font-medium">取消</text>
        </view>
      </view>
    </view>
  </view>
</template>
