import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Dynamically generate input entries for all pages
function getPageInputs() {
    const pagesDir = path.resolve(__dirname, 'src/pages');
    const entries = {};
    if (fs.existsSync(pagesDir)) {
        fs.readdirSync(pagesDir, { withFileTypes: true }).forEach(dirent => {
            if (dirent.isDirectory()) {
                const htmlPath = path.resolve(pagesDir, dirent.name, 'index.html');
                if (fs.existsSync(htmlPath)) {
                    entries[dirent.name] = htmlPath;
                }
            }
        });
    }
    // Add main index.html
    entries.main = path.resolve(__dirname, 'src/index.html');
    return entries;
}

export default defineConfig({
    base: '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@assets': path.resolve(__dirname, 'src/assets'),
            '@styles': path.resolve(__dirname, 'src/assets/styles')
        },
    },
    root: 'src',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: false,
        assetsDir: 'assets',
        copyPublicDir: true,
        rollupOptions: {
            input: getPageInputs(),
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: ({ name }) => {
                    if (/\.(gif|jpe?g|png|svg|ico)$/.test(name ?? '')) {
                        return 'assets/images/[name].[hash][extname]'
                    }
                    return 'assets/[name].[hash][extname]'
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
