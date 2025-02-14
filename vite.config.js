import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: '/index.html',
                clean: '/pages/clean/index.html',
                diff: '/pages/diff/index.html',
                expression: '/pages/expression/index.html',
                generator: '/pages/generator/index.html',
                keyword: '/pages/keyword/index.html',
                minify: '/pages/minify/index.html',
                policy: '/pages/policy/index.html'
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    publicDir: '../public'
});
