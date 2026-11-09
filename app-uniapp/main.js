// 文件路径: /qdu-wiki/app-uniapp/main.js
import { createSSRApp } from 'vue';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  return { app };
}
