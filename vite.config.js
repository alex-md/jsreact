// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));      // project root
const srcDir = path.resolve(rootDir, 'src');                      // src shortcut
const pagesDir = path.resolve(srcDir, 'pages');

// build an { pageName: htmlPath } map
const getPageInputs = () => {
    const entries = Object.fromEntries(
        fs.existsSync(pagesDir)
            ? fs.readdirSync(pagesDir, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => {
                    const htmlPath = path.resolve(pagesDir, d.name, 'index.html');
                    return fs.existsSync(htmlPath) ? [d.name, htmlPath] : undefined;
                })
                .filter(Boolean)
            : []
    );

    entries.main = path.resolve(srcDir, 'index.html');
    return entries;
};

export default defineConfig({
    root: srcDir,                 // dev server root
    publicDir: path.resolve(rootDir, 'public'),
    base: '/',
    plugins: [react({
        jsxImportSource: '@emotion/react',
        babel: {
            plugins: ['@emotion/babel-plugin']
        }
    })],
    resolve: {
        alias: {
            '@': srcDir,
            '@components': path.resolve(srcDir, 'components'),
            '@utils': path.resolve(srcDir, 'utils'),
            '@assets': path.resolve(srcDir, 'assets'),
            '@styles': path.resolve(srcDir, 'assets/styles'),
        },
    },
    build: {
        outDir: path.resolve(rootDir, 'dist'),
        emptyOutDir: true,
        sourcemap: false,
        assetsDir: 'assets',
        rollupOptions: {
            input: getPageInputs(),
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: ({ name }) =>
                    /\.(gif|jpe?g|png|svg|ico)$/.test(name ?? '')
                        ? 'assets/images/[name].[hash][extname]'
                        : 'assets/[name].[hash][extname]',
                manualChunks: {
                    vendor: [
                        'react',
                        'react-dom',
                        '@mui/material',
                        '@emotion/react',
                        '@emotion/styled'
                    ]
                },
            },
        },
    },
    css: {
        modules: {
            scopeBehaviour: 'local',
            localsConvention: 'camelCase',
        },
        devSourcemap: true,
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@rstacruz/startup-name-generator',
            '@mui/material',
            '@emotion/react',
            '@emotion/styled'
        ],
        exclude: [],
    },
    server: {
        port: 3000,
        open: true,
        watch: {
            usePolling: true, // Add polling for better file watching
        },
    },
});
