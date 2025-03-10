import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import path from 'path'

export default defineConfig({
    base: '/',
    plugins: [react()],
    root: 'src',
    build: {
        outDir: '../dist',
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
                playground: resolve(__dirname, 'src/pages/playground/index.html'),
                policy: resolve(__dirname, 'src/pages/policy/index.html'),
                speech: resolve(__dirname, 'src/pages/speech/index.html'),
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
            '@config': path.resolve(__dirname, './src/config'),
            '@components': path.resolve(__dirname, './src/components'),
            '@layouts': path.resolve(__dirname, './src/layouts'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@assets': path.resolve(__dirname, './src/assets'),
            '@styles': path.resolve(__dirname, './src/styles'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@services': path.resolve(__dirname, './src/services')
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
        port: 3000,
        open: true,
        watch: {
            ignored: ['!**/src/components/**']
        }
    }
})
