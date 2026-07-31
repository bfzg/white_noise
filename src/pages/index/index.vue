<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import { TIMER_OPTIONS, usePlayerStore } from '@/store/player'
import { SOUND_DATA } from '@/types/sound'
import type { SoundItem } from '@/types/sound'
import { enableWeixinShareMenu, getShareAppMessage, getShareTimeline } from '@/utils/share'

defineOptions({ name: 'Home' })
definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#FFF8F2',
  },
})

const player = usePlayerStore()
const systemInfo = uni.getSystemInfoSync()
const pageTopStyle = computed(() => ({
  paddingTop: `${systemInfo.statusBarHeight || 0}px`,
}))

const allSounds = computed<SoundItem[]>(() => {
  return SOUND_DATA.categories.flatMap(cat => cat.sounds)
})

const showTimerPicker = ref(false)
const currentTimerIndex = computed(() => {
  return TIMER_OPTIONS.findIndex(o => o.value === player.timerTotal)
})

function isSoundActive(id: string) {
  return Object.prototype.hasOwnProperty.call(player.activeSounds, id)
}

function cardStyle(sound: SoundItem) {
  const active = isSoundActive(sound.id)
  return {
    background: active
      ? `linear-gradient(160deg, ${sound.color} 0%, ${sound.color}E8 58%, ${sound.color}D0 100%)`
      : `linear-gradient(160deg, #FFFFFF 0%, ${sound.color}18 100%)`,
    border: active ? '4rpx solid #17C964' : `2rpx solid ${sound.color}36`,
    boxShadow: active
      ? `0 14rpx 34rpx ${sound.color}42, inset 0 0 0 2rpx rgba(255,255,255,0.35)`
      : '0 8rpx 26rpx rgba(66, 56, 48, 0.06)',
    height: '156rpx',
  }
}

function iconWrapStyle(sound: SoundItem) {
  const active = isSoundActive(sound.id)
  return {
    background: active ? 'rgba(255,255,255,0.24)' : `${sound.color}20`,
    color: active ? '#FFFFFF' : sound.color,
  }
}

function onCardTap(sound: SoundItem) {
  if (!sound.url) {
    uni.showToast({ title: '音源地址待配置', icon: 'none' })
    return
  }
  player.toggleSound(sound.id)
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

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

function cardColumnStyle() {
  return {
    width: 'calc((100% - 24rpx) / 2)',
  }
}

onShow(async () => {
  enableWeixinShareMenu()
  // 页面回到前台时，恢复上次选择；不自动播放，用户点击播放即可。
  await player.initFromPersist()
})

onShareAppMessage(() => getShareAppMessage())
onShareTimeline(() => getShareTimeline())
</script>

<template>
  <view
    class="home min-h-screen flex flex-col"
    style="
      background: linear-gradient(
        180deg,
        #f7f1ea 0%,
        #f4f7f1 46%,
        #f8f5f0 100%
      );
    "
  >
    <scroll-view class="flex-1" scroll-y>
      <view class="h-16" :style="pageTopStyle" />

      <!-- 声音卡片网格 -->
      <view class="mx-5 pb-36">
        <view class="mb-4 px-1">
          <text
            class="block text-[44rpx] font-bold leading-tight"
            style="color: #2f2925"
          >
            选择睡眠声音
          </text>
          <text class="mt-1 block text-[24rpx]" style="color: #8b7d72">
            选择一个声音，锁屏后也能继续播放
          </text>
        </view>

        <view
          v-for="(row, rowIdx) in chunk(allSounds, 2)"
          :key="rowIdx"
          class="mb-3.5 flex justify-between"
        >
          <view
            v-for="sound in row"
            :key="sound.id"
            :style="cardColumnStyle()"
          >
            <view
              class="relative overflow-hidden rounded-[28rpx] px-4 py-4 active:scale-95"
              :style="cardStyle(sound)"
              @tap="onCardTap(sound)"
            >
              <view
                class="absolute h-24 w-24 rounded-full -bottom-8 -right-8"
                :style="{
                  background: isSoundActive(sound.id)
                    ? 'rgba(255,255,255,0.16)'
                    : `${sound.color}14`,
                }"
              />

              <view
                class="relative z-10 h-full flex flex-col justify-between gap-2"
              >
                <view class="flex items-start justify-between gap-2">
                  <view class="min-w-0 flex-1">
                    <text
                      class="block truncate text-[32rpx] font-bold"
                      :style="{
                        color: isSoundActive(sound.id) ? '#FFFFFF' : '#3D3530',
                      }"
                    >
                      {{ sound.name }}
                    </text>
                    <text
                      class="mt-1 block truncate text-[22rpx]"
                      :style="{
                        color: isSoundActive(sound.id)
                          ? 'rgba(255,255,255,0.82)'
                          : '#9C8F84',
                      }"
                    >
                      {{ sound.desc }}
                    </text>
                  </view>
                </view>

                <view class="flex items-end justify-between">
                  <view
                    class="h-11 w-11 flex items-center justify-center rounded-2xl"
                    :style="iconWrapStyle(sound)"
                  >
                    <view :class="[sound.icon]" class="h-6 w-6" />
                  </view>
                  <view
                    v-if="isSoundActive(sound.id)"
                    class="h-7 w-7 flex items-center justify-center"
                  >
                    <view
                      class="i-carbon-checkmark h-5 w-5 font-bold"
                      style="color: #17c964; font-weight: 900;"
                    />
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view v-if="row.length < 2" :style="cardColumnStyle()" />
        </view>
      </view>
    </scroll-view>

    <!-- 底部控制栏 -->
    <view
      class="fixed bottom-0 left-0 right-0 z-30 mx-auto overflow-hidden rounded-t-[36rpx] bg-white px-4 pb-6 pt-3"
      style="box-shadow: 0 -12rpx 40rpx rgba(61, 53, 48, 0.1)"
    >
      <view class="flex items-center justify-between">
        <!-- 定时设置 -->
        <view
          class="h-12 w-28 flex items-center justify-center gap-2 rounded-full bg-white active:scale-95"
          @tap="openTimerPicker"
        >
          <view
            class="i-carbon-timer h-4 w-4"
            :style="{ color: player.timerActive ? '#17C964' : '#A89A8E' }"
          />
          <text
            class="text-sm font-semibold"
            :style="{ color: player.timerActive ? '#17C964' : '#3D3530' }"
          >
            {{ player.timerActive ? player.timerLabel : "定时" }}
          </text>
        </view>

        <!-- 播放/暂停 大圆钮（无阴影） -->
        <view
          class="h-16 w-16 flex items-center justify-center rounded-full active:scale-90"
          :style="{
            background: player.hasSound ? '#17C964' : '#D1D1D1',
          }"
          @tap="onPlayToggle"
        >
          <view
            v-if="player.isPlaying"
            class="i-carbon-pause-filled h-7 w-7 text-white"
          />
          <view v-else class="i-carbon-play-filled-alt h-8 w-8 text-white" />
        </view>

        <!-- 我的 -->
        <view
          class="h-12 w-28 flex items-center justify-center gap-2 rounded-full bg-white active:scale-95"
          @tap="gotoMe"
        >
          <view class="i-carbon-user-avatar h-4 w-4" style="color: #a89a8e" />
          <text class="text-sm font-semibold" style="color: #3d3530">我的</text>
        </view>
      </view>
    </view>

    <!-- 定时弹层 -->
    <view
      v-if="showTimerPicker"
      class="fixed inset-0 z-50 flex items-end bg-black/40"
      @tap="showTimerPicker = false"
    >
      <view class="w-full rounded-t-3xl bg-white p-5 pb-8" @tap.stop>
        <view
          class="mb-1 text-center text-base font-bold"
          style="color: #3d3530"
        >
          定时关闭
        </view>
        <view class="mb-5 text-center text-xs" style="color: #a89a8e">
          设定后自动停止播放
        </view>
        <view
          v-for="(opt, idx) in TIMER_OPTIONS"
          :key="opt.value"
          class="flex items-center justify-between border-b py-4 last:border-0"
          style="border-color: #f2ebe5"
          @tap="selectTimer(idx)"
        >
          <view class="flex items-center gap-3">
            <view
              v-if="idx === currentTimerIndex"
              class="i-carbon-checkmark h-5 w-5"
              style="color: #07c160"
            />
            <view v-else class="h-5 w-5" />
            <text class="text-base" style="color: #3d3530">
              {{
                opt.label
              }}
            </text>
          </view>
        </view>
        <view
          class="mt-5 h-12 w-full flex items-center justify-center rounded-full"
          style="background: #f2ebe5; color: #a89a8e"
          @tap="showTimerPicker = false"
        >
          <text class="text-sm font-medium">取消</text>
        </view>
      </view>
    </view>
  </view>
</template>
