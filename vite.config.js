import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/',
    plugins: [react()],
    root: 'src',
    build: {
        outDir: '../dist', // Changed to output to root dist directory
        emptyOutDir: true,
        sourcemap: false,
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
                clean: resolve(__dirname, 'src/pages/clean/index.html'),
                diff: resolve(__dirname, 'src/pages/diff/index.html'),
                expression: resolve(__dirname, 'src/pages/expression/index.html'),
                generator: resolve(__dirname, 'src/pages/generator/index.html'),
                keyword: resolve(__dirname, 'src/pages/keyword/index.html'),
                minify: resolve(__dirname, 'src/pages/minify/index.html'),
                policy: resolve(__dirname, 'src/pages/policy/index.html')
            },
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash][extname]',
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                }
            }
        }
    },
    css: {
        modules: {
            scopeBehavior: 'local',
            localsConvention: 'camelCase'
        },
        devSourcemap: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': resolve(__dirname, 'src/components'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@assets': resolve(__dirname, 'src/assets'),
            '@styles': resolve(__dirname, 'src/assets/styles')
        }
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@rstacruz/startup-name-generator'
        ]
    },
    server: {
        middlewareMode: true, // Updated deprecated value
        watch: {
            ignored: ['!**/src/components/**']
        }
    }
})
