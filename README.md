# JSReact Tools

A collection of JavaScript utilities and tools for web development, featuring a modern React-like UI.

## Features

- **Text Cleaning**: Remove unwanted characters and format text
- **Diff Checker**: Compare two texts and highlight differences
- **Expression Solver**: Evaluate mathematical expressions
- **AI Name Generator**: Generate creative names using AI
- **Keyword Density Analyzer**: Analyze keyword frequency in text
- **Code Minifier**: Minify JavaScript, CSS, and HTML code

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jsreact.git
cd jsreact
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Build for production:
```bash
npm run build
```

## Development

The project structure is organized as follows:

```
src/
├── components/     # Reusable UI components
├── scripts/       # JavaScript functionality
├── styles/        # CSS styles
├── images/        # Assets and icons
└── *.html         # Tool pages
```

### Key Components

- `navbar.js`: Navigation component with dark mode support
- `common.js`: Shared utilities and error handling
- `global.css`: Global styles and theme variables

### Build System

The project uses Webpack for bundling and optimization:

- **Development**: Run `npm start` for hot-reloading development server
- **Production**: Run `npm run build` for optimized production build
- **Development Build**: Run `npm run build:dev` for development build

### Features

- ES6+ transpilation with Babel
- CSS processing with PostCSS and Tailwind
- Asset optimization and management
- Code splitting and vendor chunk optimization
- Development server with hot reloading

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with modern web technologies
- Uses Bootstrap for responsive design
- Implements dark mode support
- Includes Google Analytics integration
