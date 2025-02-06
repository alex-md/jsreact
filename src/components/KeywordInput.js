console.log('KeywordInput.js loading...');

const KeywordInput = ({ keywords, onKeywordsChange, matchingStrategy, onMatchingStrategyChange }) => {
    const { createElement: h, useState } = React;

    const [newKeyword, setNewKeyword] = useState('');

    const handleAdd = () => {
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            onKeywordsChange([...keywords, newKeyword.trim()]);
            setNewKeyword('');
        }
    };

    const handleRemove = (keywordToRemove) => {
        onKeywordsChange(keywords.filter(k => k !== keywordToRemove));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return h('div', { className: 'space-y-4' },
        // Keyword Input Section
        h('div', { className: 'space-y-2' },
            h('div', { className: 'relative' },
                h('input', {
                    type: 'text',
                    value: newKeyword,
                    onChange: (e) => setNewKeyword(e.target.value),
                    onKeyPress: handleKeyPress,
                    placeholder: 'Add a keyword...',
                    className: 'w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-lg ' +
                        'focus:border-primary-500 focus:bg-white transition-all duration-200 ' +
                        'placeholder-gray-400 text-gray-700 text-base shadow-sm'
                }),
                h('button', {
                    onClick: handleAdd,
                    disabled: !newKeyword.trim(),
                    className: 'absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary-500 ' +
                        'text-white rounded-md hover:bg-primary-600 transition-colors duration-200 ' +
                        'disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium'
                }, 'Add')
            ),

            // Matching Strategy Dropdown
            h('div', { className: 'relative mt-4' },
                h('select', {
                    value: matchingStrategy,
                    onChange: (e) => onMatchingStrategyChange(e.target.value),
                    className: 'w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg ' +
                        'focus:border-primary-500 focus:bg-white transition-all duration-200 ' +
                        'text-gray-700 appearance-none cursor-pointer shadow-sm'
                },
                    h('option', { value: 'exact' }, 'Exact Match'),
                    h('option', { value: 'partial' }, 'Partial Match'),
                    h('option', { value: 'regex' }, 'Regex Match')
                ),
                // Custom dropdown arrow
                h('div', {
                    className: 'absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500'
                }, '▼')
            )
        ),

        // Keywords List
        keywords.length > 0 && h('div', { className: 'mt-4' },
            h('div', { className: 'text-sm font-medium text-gray-600 mb-2' },
                `Active Keywords (${keywords.length})`
            ),
            h('div', { className: 'flex flex-wrap gap-2' },
                keywords.map(keyword =>
                    h('div', {
                        key: keyword,
                        className: 'group flex items-center gap-2 px-3 py-1.5 bg-primary-100 ' +
                            'text-primary-700 rounded-full text-sm font-medium animate-fade-in'
                    },
                        keyword,
                        h('button', {
                            onClick: () => handleRemove(keyword),
                            className: 'opacity-60 hover:opacity-100 transition-opacity duration-200'
                        }, '×')
                    )
                )
            )
        )
    );
};

// Make component available globally
window.KeywordInput = KeywordInput;

console.log('KeywordInput.js loaded successfully');
