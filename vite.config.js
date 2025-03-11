import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
                main: path.resolve(__dirname, 'src/index.html'),
                clean: path.resolve(__dirname, 'src/pages/clean/index.html'),
                diff: path.resolve(__dirname, 'src/pages/diff/index.html'),
                expression: path.resolve(__dirname, 'src/pages/expression/index.html'),
                generator: path.resolve(__dirname, 'src/pages/generator/index.html'),
                keyword: path.resolve(__dirname, 'src/pages/keyword/index.html'),
                minify: path.resolve(__dirname, 'src/pages/minify/index.html'),
                playground: path.resolve(__dirname, 'src/pages/playground/index.html'),
                policy: path.resolve(__dirname, 'src/pages/policy/index.html'),
                speech: path.resolve(__dirname, 'src/pages/speech/index.html'),
            },
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: ({ name }) => {
                    if (name && name.includes('src/assets/images/logo.png')) {
                        return 'assets/images/logo.png';
                    }
                    if (name && /\.(gif|jpe?g|png|svg)$/i.test(name)) {
                        return name;
                    }
                    return 'assets/[name].[hash][extname]';
                },
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
            '@': path.resolve(__dirname, 'src'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@assets': path.resolve(__dirname, 'src/assets'),
            '@styles': path.resolve(__dirname, 'src/assets/styles')
        }
    },
    optimizeDeps: {
        include: ['react', 'react-dom', '@rstacruz/startup-name-generator']
    },
    server: {
        port: 3000,
        open: true,
        watch: {
            ignored: ['!**/src/components/**']
        }
    }
})
