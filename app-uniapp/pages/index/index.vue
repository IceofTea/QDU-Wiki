<!-- 文件路径: /qdu-wiki/app-uniapp/pages/index/index.vue -->
<template>
  <view class="page safe-bottom">
    <view class="hero">
      <view class="hero-title">青大百科</view>
      <view class="hero-sub">青岛大学 Wiki · {{ total }} 篇词条</view>
      <view class="search-box">
        <input class="search" v-model="kw" placeholder="搜索词条（课程/复试/食堂/办事…）"
               confirm-type="search" @confirm="doSearch" />
        <text class="search-btn" @click="doSearch">搜</text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view v-if="kw && searched" class="card">
      <view class="g-title">搜索「{{ kw }}」（{{ results.length }}）</view>
      <view v-if="!results.length" class="mut">没有匹配的词条</view>
      <view v-for="p in results" :key="p.loc" class="item" @click="open(p)">
        <view class="i-body">
          <text class="i-title">{{ p.title }}</text>
          <text class="i-text">{{ p.text }}</text>
          <text class="i-sec">{{ secName(p.section) }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 分栏浏览 -->
    <template v-if="!kw">
      <view v-for="s in sectionList" :key="s.key" class="card">
        <view class="g-title between" @click="toggle(s.key)">
          <text>{{ s.name }} <text class="mut">（{{ s.pages.length }}）</text></text>
          <text class="mut">{{ collapsed[s.key] ? '▸' : '▾' }}</text>
        </view>
        <view v-if="!collapsed[s.key]">
          <view v-for="p in s.pages" :key="p.loc" class="item" @click="open(p)">
            <view class="i-body"><text class="i-title">{{ p.title }}</text></view>
            <text class="arrow">›</text>
          </view>
        </view>
      </view>
    </template>

    <view v-if="loading" class="empty"><text>加载词条索引…</text></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchIndex, indexData, search, SECTIONS } from '../../utils/api.js';

const kw = ref('');
const searched = ref(false);
const results = ref([]);
const loading = ref(true);
const collapsed = ref({ en: true, friends: true, share: true });
const total = computed(() => (indexData.value ? indexData.value.pages.length : 0));

const sectionList = computed(() => {
  if (!indexData.value) return [];
  const order = ['new', 'study', 'live', 'college', 'service', 'organization', 'words', 'share', 'friends', 'about', 'en'];
  const bySec = {};
  indexData.value.pages.forEach(p => { (bySec[p.section] = bySec[p.section] || []).push(p); });
  return order.filter(k => bySec[k] && bySec[k].length)
    .map(k => ({ key: k, name: SECTIONS[k] || k, pages: bySec[k] }));
});

function secName(k) { return SECTIONS[k] || k; }
function toggle(k) { collapsed.value = { ...collapsed.value, [k]: !collapsed.value[k] }; }
function doSearch() {
  searched.value = true;
  results.value = search(kw.value);
}
function open(p) {
  uni.navigateTo({ url: '/pages/detail/detail?loc=' + encodeURIComponent(p.loc) + '&title=' + encodeURIComponent(p.title) });
}

onShow(async () => {
  loading.value = true;
  await fetchIndex();
  loading.value = false;
});
</script>

<style>
.hero { background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: #fff; padding: 44rpx 32rpx 32rpx; }
.hero-title { font-size: 44rpx; font-weight: 700; }
.hero-sub { opacity: .85; margin-top: 8rpx; font-size: 26rpx; }
.search-box { margin-top: 24rpx; display: flex; background: #fff; border-radius: 999rpx; overflow: hidden; }
.search { flex: 1; padding: 18rpx 28rpx; font-size: 26rpx; color: #1f2329; }
.search-btn { padding: 18rpx 32rpx; color: #7c3aed; font-weight: 700; font-size: 26rpx; }
.g-title { font-size: 30rpx; font-weight: 600; margin-bottom: 8rpx; }
.between { display: flex; align-items: center; justify-content: space-between; }
.item { display: flex; align-items: center; padding: 18rpx 0; border-top: 1rpx solid #f0f1f5; }
.item:active { opacity: .6; }
.i-body { flex: 1; }
.i-title { font-size: 28rpx; font-weight: 500; }
.i-text { display: block; font-size: 20rpx; color: #8a8f99; margin-top: 4rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 560rpx; }
.i-sec { display: inline-block; font-size: 18rpx; color: #7c3aed; background: #ede9fe; border-radius: 999rpx; padding: 2rpx 14rpx; margin-top: 6rpx; }
.arrow { color: #c0c4cc; font-size: 36rpx; }
.empty { display: flex; align-items: center; justify-content: center; padding: 80rpx 0; color: #8a8f99; }
</style>
