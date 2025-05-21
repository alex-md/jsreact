// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));      // project root
const srcDir = path.resolve(rootDir, 'src');                      // src shortcut

// List of directories that aren't pages and shouldn't be processed
const nonPageDirs = ['components', 'assets', 'utils', 'workers'];

// build an { pageName: htmlPath } map and ensure proper asset handling
const getPageInputs = () => {
    const entries = Object.fromEntries(
        fs.existsSync(srcDir)
            ? fs.readdirSync(srcDir, { withFileTypes: true })
                .filter(d => d.isDirectory() && !nonPageDirs.includes(d.name))
                .map(d => {
                    const pagePath = path.resolve(srcDir, d.name);
                    const htmlPath = path.resolve(pagePath, 'index.html');

                    if (fs.existsSync(htmlPath)) {
                        const entryPoints = ['main.tsx', 'main.jsx', 'main.ts', 'main.js', 'index.tsx', 'index.jsx', 'index.ts', 'index.js']
                            .map(file => path.resolve(pagePath, file))
                            .find(file => fs.existsSync(file));

                        return [d.name, entryPoints || htmlPath];
                    }
                    return undefined;
                })
                .filter(Boolean)
            : []
    );

    entries.main = path.resolve(srcDir, 'index.html');
    return entries;
};

export default defineConfig({
    root: rootDir,
    resolve: {
        alias: {
            '@': srcDir,
            '@components': path.resolve(srcDir, 'components'),
            '@utils': path.resolve(srcDir, 'utils'),
            '@styles': path.resolve(srcDir, 'assets/styles')
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        rollupOptions: {
            input: getPageInputs(),
            output: {
                manualChunks: {
                    vendor: [
                        'react',
                        'react-dom',
                        '@mui/material',
                        '@emotion/react',
                        '@emotion/styled'
                    ],
                    monaco: ['monaco-editor']
                }
            }
        }
    },
    css: {
        modules: {
            scopeBehaviour: 'local',
            localsConvention: 'camelCase',
        },
        devSourcemap: true,
    },
    plugins: [react()]
});
