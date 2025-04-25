import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'; // Import fileURLToPath

// Get the directory name in an ESM-friendly way
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically generate input entries for all pages
function getPageInputs() {
    const pagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/pages');
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
    entries.main = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/index.html');
    return entries;
}

export default defineConfig({
    base: '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
            '@components': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/components'),
            '@utils': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/utils'),
            '@assets': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/assets'),
            '@styles': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/assets/styles')
        },
    },
    root: 'src',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: false,
        assetsDir: 'assets',
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
