// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(rootDir, 'src');

// Define directories that should not be treated as pages
const nonPageDirs = ['components', 'utils', 'assets'];

const getPageInputs = () => {
    const entries = {};

    // Add the main entry point
    const mainHtmlPath = path.resolve(srcDir, 'index.html');
    if (fs.existsSync(mainHtmlPath)) {
        entries.index = mainHtmlPath;
    }

    // Add other pages
    if (fs.existsSync(srcDir)) {
        fs.readdirSync(srcDir, { withFileTypes: true })
            .filter(d => d.isDirectory() && !nonPageDirs.includes(d.name))
            .forEach(d => {
                const pagePath = path.resolve(srcDir, d.name);
                const htmlPath = path.resolve(pagePath, 'index.html');

                if (fs.existsSync(htmlPath)) {
                    const entryPoints = ['main.tsx', 'main.jsx', 'main.ts', 'main.js', 'index.tsx', 'index.jsx', 'index.ts', 'index.js']
                        .map(file => path.resolve(pagePath, file))
                        .find(file => fs.existsSync(file));

                    if (entryPoints) {
                        entries[d.name] = entryPoints;
                    } else {
                        entries[d.name] = htmlPath;
                    }
                }
            });
    }

    return entries;
};

export default defineConfig({
    root: srcDir,
    base: '/',
    publicDir: path.resolve(rootDir, 'public'),
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg'],
    resolve: {
        alias: {
            '@': srcDir,
            '@components': path.resolve(srcDir, 'components'),
            '@utils': path.resolve(srcDir, 'utils'),
            '@styles': path.resolve(rootDir, 'public/assets/styles')
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    build: {
        outDir: path.resolve(rootDir, 'dist'),
        emptyOutDir: true,
        assetsInlineLimit: 0,
        rollupOptions: {
            input: {
                main: path.resolve(srcDir, 'index.html'),
                analytics: path.resolve(srcDir, 'analytics/index.html'),
                minify: path.resolve(srcDir, 'minify/index.html'),
                clean: path.resolve(srcDir, 'clean/index.html'),
                insert: path.resolve(srcDir, 'insert/index.html'),
                keyword: path.resolve(srcDir, 'keyword/index.html'),
                generator: path.resolve(srcDir, 'generator/index.html'),
                diff: path.resolve(srcDir, 'diff/index.html'),
                expression: path.resolve(srcDir, 'expression/index.html'),
                playground: path.resolve(srcDir, 'playground/index.html'),
                qr: path.resolve(srcDir, 'qr/index.html'),
                speech: path.resolve(srcDir, 'speech/index.html'),
                domain: path.resolve(srcDir, 'domain/index.html'),
                osrs: path.resolve(srcDir, 'osrs/index.html'),
                elevation: path.resolve(srcDir, 'elevation/index.html'),
                oeis: path.resolve(srcDir, 'oeis/index.html'),
                numigma: path.resolve(srcDir, 'numigma/index.html'),
                connect4: path.resolve(srcDir, 'connect4/index.html')
            },
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('monaco-editor')) {
                            return 'monaco';
                        }
                        if (id.includes('@mui') || id.includes('@emotion')) {
                            return 'mui';
                        }
                        if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                            return 'react';
                        }
                        return 'vendor';
                    }
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
