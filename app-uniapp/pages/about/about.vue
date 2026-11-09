<!-- 文件路径: /qdu-wiki/app-uniapp/pages/about/about.vue -->
<template>
  <view class="page safe-bottom">
    <view class="card center">
      <view class="logo">📖</view>
      <view class="name">青大百科</view>
      <view class="mut">v1.0.0 · 词条与 QDU-Wiki 网站同步</view>
    </view>

    <view class="card">
      <view class="row-item" @click="refresh">
        <text>🔄 刷新词条索引</text>
        <text class="mut">{{ refreshText }}</text>
      </view>
      <view class="row-item" @click="copySite">
        <text>🌐 打开网页版（复制链接）</text>
        <text class="mut">iceoftea.github.io/QDU-Wiki</text>
      </view>
    </view>

    <view class="card">
      <view class="sec-title">说明</view>
      <view class="mut li">· 词条索引复用网站 search_index.json，站内搜索同款数据</view>
      <view class="mut li">· 词条正文经 web-view 直接加载官网页面</view>
      <view class="mut li">· 本应用不收集任何个人信息</view>
    </view>

    <view class="card">
      <view class="sec-title">iOS 打包说明（HBuilderX 云打包）</view>
      <view class="mut li">1. HBuilderX 打开本目录 → manifest.json 填 appid 与 iOS 证书</view>
      <view class="mut li">2. 发行 → 原生App-云打包 → iOS(ipa)</view>
      <view class="mut li">3. 爱思助手/AltStore/TestFlight 安装</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { fetchIndex, cacheTime, SITE_URL } from '../../utils/api.js';

const refreshText = ref(cacheTime() ? `上次 ${cacheTime()}` : '点击同步');
async function refresh() {
  refreshText.value = '同步中…';
  const j = await fetchIndex(true);
  refreshText.value = j ? `已更新 ${cacheTime()}（${j.pages.length} 词条）` : '同步失败';
}
function copySite() {
  uni.setClipboardData({ data: SITE_URL, success: () => uni.showToast({ title: '链接已复制' }) });
}
</script>

<style>
.center { display: flex; flex-direction: column; align-items: center; padding: 40rpx 0; }
.logo { font-size: 72rpx; }
.name { font-size: 34rpx; font-weight: 700; margin-top: 12rpx; }
.row-item { display: flex; align-items: center; justify-content: space-between; padding: 26rpx 0; border-bottom: 1rpx solid #f0f1f5; }
.row-item:last-child { border-bottom: none; }
.sec-title { font-weight: 600; margin-bottom: 12rpx; }
.li { line-height: 1.8; }
</style>
