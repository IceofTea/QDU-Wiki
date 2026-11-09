<!-- 文件路径: /qdu-wiki/app-uniapp/pages/detail/detail.vue -->
<template>
  <view class="page">
    <web-view :src="url" @error="onErr"></web-view>
    <view v-if="err" class="fallback">
      <text class="mut">页面加载失败</text>
      <view class="btn" @click="copy">复制链接去浏览器打开</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { pageUrl } from '../../utils/api.js';

const url = ref('');
const err = ref(false);

onLoad(q => {
  const loc = decodeURIComponent(q.loc || '');
  url.value = pageUrl(loc);
  if (q.title) uni.setNavigationBarTitle({ title: decodeURIComponent(q.title) });
});
function onErr() { err.value = true; }
function copy() {
  uni.setClipboardData({ data: url.value });
}
</script>

<style>
.page { height: 100vh; }
.fallback { position: fixed; inset: 0; background: #f5f6fa; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.btn { margin-top: 30rpx; background: #7c3aed; color: #fff; padding: 18rpx 48rpx; border-radius: 999rpx; font-size: 28rpx; }
</style>
