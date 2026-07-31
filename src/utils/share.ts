export const SHARE_TITLE = '睡眠白噪音 - 自由混合自然环境音'
export const SHARE_PATH = '/pages/index/index'

export function getShareAppMessage() {
  return {
    title: SHARE_TITLE,
    path: SHARE_PATH,
  }
}

export function getShareTimeline() {
  return {
    title: SHARE_TITLE,
    query: '',
  }
}

export function enableWeixinShareMenu() {
  // #ifdef MP-WEIXIN
  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  })
  // #endif
}
