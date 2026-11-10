import { defineConfig } from 'vite';
import uniPkg from '@dcloudio/vite-plugin-uni';

const uni = uniPkg.default || uniPkg;

export default defineConfig({
  base: './',
  plugins: [uni()],
});
