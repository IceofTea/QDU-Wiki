<!-- 文件路径: /qdu-wiki/app-uniapp/pages/detail/detail.vue -->
<!-- iOS/H5 端本地渲染词条正文（search_index.json 分段合并），不依赖 web-view -->
<template>
  <view class="page">
    <view class="title">{{ title }}</view>
    <view v-if="loading" class="mut center">加载中…</view>
    <view v-else-if="empty" class="mut center">
      <text>该词条暂无缓存正文</text>
      <view class="btn" @click="copy">复制链接去浏览器看原文</view>
    </view>
    <scroll-view v-else scroll-y class="body">
      <view class="seg" v-for="(s, i) in segs" :key="i">
        <view v-if="s.h" class="seg-h">{{ s.h }}</view>
        <text class="seg-t" selectable>{{ s.text }}</text>
      </view>
      <view class="src" @click="copy">查看官网原文（复制链接）</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { fetchDetail } from '../../utils/api.js';

const title = ref('');
const segs = ref([]);
const url = ref('');
const loading = ref(true);
const empty = ref(false);

onLoad(async q => {
  const loc = decodeURIComponent((q && q.loc) || '');
  if (q && q.title) uni.setNavigationBarTitle({ title: decodeURIComponent(q.title) });
  try {
    const d = await fetchDetail(loc);
    title.value = d.title;
    segs.value = d.segs;
    url.value = d.url;
    empty.value = !d.segs.length;
    if (d.title) uni.setNavigationBarTitle({ title: d.title });
  } catch (e) {
    empty.value = true;
  } finally {
    loading.value = false;
  }
});
function copy() {
  uni.setClipboardData({ data: url.value });
}
</script>

<style>
.page { min-height: 100vh; background: #f7f7fc; padding: 28rpx; box-sizing: border-box; }
.title { font-size: 40rpx; font-weight: 700; color: #2d2560; margin-bottom: 24rpx; line-height: 1.35; }
.body { height: calc(100vh - 150rpx); }
.seg { background: #fff; border-radius: 20rpx; padding: 26rpx 28rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(60,40,120,.05); }
.seg-h { font-size: 30rpx; font-weight: 600; color: #3F337B; margin-bottom: 12rpx; }
.seg-t { font-size: 28rpx; color: #333; line-height: 1.8; }
.src { margin: 8rpx 0 calc(40rpx + env(safe-area-inset-bottom)); text-align: center; color: #3F337B; font-size: 26rpx; padding: 20rpx; border: 1rpx dashed #3F337B66; border-radius: 999rpx; }
.mut { color: #8a8f99; font-size: 26rpx; }
.center { display: flex; flex-direction: column; align-items: center; margin-top: 120rpx; gap: 20rpx; }
.btn { background: #3F337B; color: #fff; padding: 14rpx 40rpx; border-radius: 999rpx; font-size: 26rpx; }
</style>
