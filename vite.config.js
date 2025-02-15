import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    root: 'src', // Set root to src directory
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5174,
        strictPort: true,
    },
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/index.html'),
                keyword: path.resolve(__dirname, 'src/pages/keyword/index.html'),
                clean: path.resolve(__dirname, 'src/pages/clean/index.html'),
                diff: path.resolve(__dirname, 'src/pages/diff/index.html'),
                expression: path.resolve(__dirname, 'src/pages/expression/index.html'),
                generator: path.resolve(__dirname, 'src/pages/generator/index.html'),
                minify: path.resolve(__dirname, 'src/pages/minify/index.html'),
                policy: path.resolve(__dirname, 'src/pages/policy/index.html')
            },
        },
        outDir: '../dist', // Output to dist in root since root is now src
        emptyOutDir: true
    },
})
