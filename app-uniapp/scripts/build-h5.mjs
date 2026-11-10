// H5 构建脚本：根布局（非 src/）工程的 uni-app H5 打包
// 用法：cd app-uniapp && npm install && npm run build:h5 → 产物在 dist/
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.env.UNI_PLATFORM = 'h5';
process.env.UNI_INPUT_DIR = root.replace(/\\/g, '/') + '/';
process.env.UNI_OUTPUT_DIR = resolve(root, 'dist');
process.env.NODE_ENV = 'production';

const { build } = await import('vite');
await build({ root });
console.log('\n[h5] done ->', process.env.UNI_OUTPUT_DIR);
