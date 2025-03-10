<div data-type="custom-tableContents">
<h2>Table of Contents</h2><ul><li><p><a href="#overview">Overview</a></p></li><li><p><a href="#project-structure">Project Structure</a></p></li><li><p><a href="#project-summary">Project Summary</a></p></li><li><p><a href="#stack">Stack</a></p></li><li><p><a href="#setting-up">Setting Up</a></p></li><li><p><a href="#run-locally">Run Locally</a></p></li><li><p><a href="#deploy">Deploy</a></p></li></ul><div></div>
</div>

## Overview

jsreact offers developer tools and side projects to enhance productivity and creativity.

## Project Structure

```bash
├── .github
│   └── workflows
│       └── main.yml
├── .gitignore
├── .vscode
│   └── settings.json
├── CNAME
├── README.md
├── package-lock.json
├── package.json
├── postcss.config.js
├── robots.txt
├── site.webmanifest
├── sitemap.xml
├── src
│   ├── assets
│   │   ├── images
│   │   │   ├── android-chrome-192x192.png
│   │   │   ├── android-chrome-512x512.png
│   │   │   ├── apple-touch-icon.png
│   │   │   ├── favicon-16x16.png
│   │   │   ├── favicon-32x32.png
│   │   │   ├── favicon.ico
│   │   │   ├── icon-16x16.png
│   │   │   ├── icon.png
│   │   │   ├── logo.png
│   │   │   └── og-image.png
│   │   └── styles
│   │       └── global.css
│   ├── components
│   │   ├── KeywordAnalyzer.jsx
│   │   ├── footer.js
│   │   ├── head.js
│   │   ├── header.js
│   │   ├── navbar.js
│   │   └── toast.js
│   ├── index.html
│   ├── pages
│   │   ├── clean
│   │   │   ├── clean.js
│   │   │   └── index.html
│   │   ├── diff
│   │   │   ├── diff.js
│   │   │   └── index.html
│   │   ├── expression
│   │   │   ├── expression.js
│   │   │   └── index.html
│   │   ├── generator
│   │   │   ├── generator.js
│   │   │   └── index.html
│   │   ├── keyword
│   │   │   ├── index.html
│   │   │   └── index.jsx
│   │   ├── minify
│   │   │   ├── index.html
│   │   │   └── minify.js
│   │   ├── playground
│   │   │   ├── components
│   │   │   │   ├── ConsoleManager.js
│   │   │   │   ├── EditorManager.js
│   │   │   │   ├── LibraryManager.js
│   │   │   │   └── PreviewManager.js
│   │   │   ├── index.html
│   │   │   └── playground.js
│   │   ├── policy
│   │   │   └── index.html
│   │   └── speech
│   │       ├── index.html
│   │       └── speech.js
│   ├── sitemap.xml
│   └── utils
│       ├── activeusers.js
│       ├── app.js
│       └── utils.js
├── tailwind.config.js
└── vite.config.js
```

## Project Summary

- [.github](/.github): GitHub-specific configurations and templates.
- [.vscode](/.vscode): Visual Studio Code settings and configurations.
- [src](/src): Primary source code directory.
- [src/components](/src/components): Reusable React components.
- [src/pages](/src/pages): Page components for different routes.
- [src/utils](/src/utils): Utility functions and helpers.
- [src/assets](/src/assets): Static assets like images and styles.
- [src/pages/clean](/src/pages/clean): Page for cleaning and formatting tasks.

## Stack

- [rstacruz/startup-name-generator](https://github.com/rstacruz/startup-name-generator): Generates random startup names.
- [gh-pages](https://www.npmjs.com/package/gh-pages): Deploy projects to GitHub Pages.
- [react](https://reactjs.org/): Library for building user interfaces.
- [react-dom](https://reactjs.org/docs/react-dom.html): Serves as the entry point to the DOM.
- [vitejs/plugin-react](https://vitejs.dev/plugins/#vite-plugin-react): Vite plugin to support React Fast Refresh.
- [autoprefixer](https://www.npmjs.com/package/autoprefixer): Adds vendor prefixes to CSS rules.
- [postcss](https://postcss.org/): Tool for transforming styles with JS plugins.
- [tailwindcss](https://tailwindcss.com/): Utility-first CSS framework.
- [vite](https://vitejs.dev/): Frontend build tool for faster development.

## Setting Up

Insert your environment variables.

## Run Locally

1. Clone jsreact repository:

   ```bash
   git clone https://github.com/alex-md/jsreact
   ```
2. Install the dependencies with one of the package managers listed below:

   ```bash
   pnpm install
   
   bun install
   
   npm install
   
   yarn install
   ```
3. Start the development mode:

   ```bash
   pnpm dev
   
   bun dev
   
   npm run dev
   
   yarn dev
   ```
