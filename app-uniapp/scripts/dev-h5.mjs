// H5 本地预览：npm run dev:h5 → http://localhost:5173
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.env.UNI_PLATFORM = 'h5';
process.env.UNI_INPUT_DIR = root.replace(/\\/g, '/') + '/';
process.env.UNI_OUTPUT_DIR = resolve(root, 'dist');
process.env.NODE_ENV = 'development';

const { createServer } = await import('vite');
const server = await createServer({ root });
await server.listen();
server.printUrls();
