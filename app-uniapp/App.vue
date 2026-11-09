// 文件路径: /qdu-wiki/app-uniapp/App.vue
<script setup>
import { onLaunch } from '@dcloudio/uni-app';
import { preloadIndex } from './utils/api.js';
onLaunch(() => { preloadIndex(); });
</script>

<style>
page { background: #f5f6fa; color: #1f2329; font-size: 28rpx; }
.safe-bottom {
  padding-bottom: calc(12rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
}
.card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin: 20rpx 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.04); }
.mut { color: #8a8f99; font-size: 24rpx; }
</style>
