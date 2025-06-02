console.log('App.js loading...');

// Verify React is available
if (!window.React) {
    throw new Error('React not loaded when initializing App');
}

const { Component, createElement: h, useCallback, useState, useEffect, useMemo } = React;

// Error Boundary Component
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return h('div', { className: 'error-message' },
                h('h2', { className: 'font-bold mb-2' }, 'Something went wrong'),
                h('p', null, this.state.error?.message || 'Unknown error')
            );
        }
        return this.props.children;
    }
}

// Define and immediately export App component
window.App = () => {
    const { createElement: h, useState, useCallback, useRef } = React;

    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [matchingStrategy, setMatchingStrategy] = useState('partial');
    const [windowSize, setWindowSize] = useState(10);
    const [displayWindowSize, setDisplayWindowSize] = useState(10);
    const timeoutRef = useRef(null);

    const handleTextChange = useCallback((e) => {
        setText(e.target.value);
    }, []);

    const handleFileLoad = useCallback((fileContent) => {
        setText(fileContent);
    }, []);

    const handleWindowSizeChange = useCallback((e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            // Update display immediately for smooth UI
            setDisplayWindowSize(value);

            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set a new timeout to update the actual window size
            timeoutRef.current = setTimeout(() => {
                setWindowSize(value);
            }, 300); // 300ms delay
        }
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return h('div', { className: 'min-h-screen bg-[#faf9f7] py-8 px-4 sm:px-6 lg:px-8' },
        h('div', { className: 'max-w-7xl mx-auto space-y-8' },
            // Header Section
            h('div', { className: 'text-center mb-12 animate-fade-in' },
                h('h1', { className: 'text-4xl font-bold text-gray-800 mb-4' },
                    'Multi-Keyword Density Analyzer'
                ),
                h('p', { className: 'text-lg text-gray-600 max-w-3xl mx-auto' },
                    'Analyze keyword density and find intersection clusters in your text with advanced visualization'
                )
            ),

            // Main Content Grid
            h('div', { className: 'grid grid-cols-1 lg:grid-cols-12 gap-8' },
                // Left Column - Controls
                h('div', { className: 'lg:col-span-4 space-y-6' },
                    // Keywords and Strategy Card
                    h('div', { className: 'card-modern' },
                        h('h3', { className: 'text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2' },
                            h('span', { className: 'text-primary-500' }, '🎯'),
                            'Keywords Configuration'
                        ),
                        h(KeywordInput, {
                            keywords,
                            onKeywordsChange: setKeywords,
                            matchingStrategy,
                            onMatchingStrategyChange: setMatchingStrategy
                        })
                    ),

                    // Analysis Options Card
                    h('div', { className: 'card-modern' },
                        h('h3', { className: 'text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2' },
                            h('span', { className: 'text-primary-500' }, '⚙️'),
                            'Analysis Options'
                        ),
                        h('div', { className: 'space-y-4' },
                            h('div', { className: 'space-y-3' },
                                // Label and current value
                                h('div', { className: 'flex justify-between items-center' },
                                    h('label', {
                                        className: 'text-sm font-medium text-gray-700 flex items-center gap-2'
                                    },
                                        'Window Size',
                                        h('span', {
                                            className: 'tooltip text-xs text-gray-500 cursor-help',
                                            'data-tooltip': 'Percentage of text to analyze in each window'
                                        }, 'ⓘ')
                                    ),
                                    h('span', {
                                        className: 'text-sm font-bold text-primary-600'
                                    }, `${displayWindowSize}%`)
                                ),
                                // Slider
                                h('input', {
                                    type: 'range',
                                    min: '1',
                                    max: '100',
                                    value: displayWindowSize,
                                    onChange: handleWindowSizeChange,
                                    className: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500'
                                }),
                                // Percentage indicators
                                h('div', { className: 'flex justify-between px-1 mt-1' },
                                    ['0%', '25%', '50%', '75%', '100%'].map(percent =>
                                        h('span', {
                                            className: 'text-xs text-muted-dark transform -translate-x-1/2',
                                            key: percent
                                        }, percent)
                                    )
                                )
                            )
                        )
                    ),

                    // File Upload Card (moved to bottom)
                    h('div', { className: 'card-modern' },
                        h('h3', { className: 'text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2' },
                            h('span', { className: 'text-primary-500' }, '📎'),
                            'Upload Text'
                        ),
                        h(FileUpload, { onTextLoad: handleFileLoad })
                    )
                ),

                // Right Column - Text Input and Results
                h('div', { className: 'lg:col-span-8 space-y-6' },
                    // Text Input Card
                    h('div', { className: 'card-modern' },
                        h('h3', { className: 'text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2' },
                            h('span', { className: 'text-primary-500' }, '📝'),
                            'Text Input'
                        ),
                        h('textarea', {
                            value: text,
                            onChange: handleTextChange,
                            className: 'w-full rounded-lg border-white-200 dark:border-gray-700 shadow-sm focus:bg-zinc-200 focus:ring-primary-500  dark:text-light-100 h-48 resize-y p-4 bg-gray-200 text-white-700',
                            placeholder: 'Enter or paste your text here...'
                        })
                    ),

                    // Results Section
                    text && keywords.length > 0 && h(ResultsDisplay, {
                        text,
                        keywords,
                        matchingStrategy,
                        windowSize: Math.floor(text.split(/\s+/).length * (windowSize / 100))
                    })
                )
            )
        )
    );
};

window.ErrorBoundary = ErrorBoundary;

console.log('App.js loaded successfully');
