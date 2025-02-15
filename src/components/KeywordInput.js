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

    return h('div', { className: 'bg-white rounded-xl shadow-lg border border-gray-100 p-6' },
        // Header Section
        h('div', { className: 'mb-6' },
            h('h2', { className: 'text-xl font-bold text-gray-900' }, 'Keywords'),
            h('p', { className: 'text-sm text-gray-600 mt-1' },
                'Add keywords to analyze their density and distribution in your text.'
            )
        ),

        // Keyword Input Section
        h('div', { className: 'space-y-4' },
            h('div', { className: 'relative' },
                h('input', {
                    type: 'text',
                    value: newKeyword,
                    onChange: (e) => setNewKeyword(e.target.value),
                    onKeyPress: handleKeyPress,
                    placeholder: 'Enter a keyword...',
                    className: 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg ' +
                        'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white ' +
                        'transition-all duration-200 placeholder-gray-400 text-gray-900'
                }),
                h('button', {
                    onClick: handleAdd,
                    disabled: !newKeyword.trim(),
                    className: 'absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary-500 ' +
                        'text-white rounded-md hover:bg-primary-600 transition-colors duration-200 ' +
                        'disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm ' +
                        'hover:shadow-md disabled:hover:shadow-none'
                }, 'Add')
            ),

            // Matching Strategy Selector
            h('div', { className: 'space-y-2' },
                h('label', {
                    className: 'block text-sm font-medium text-gray-700'
                }, 'Matching Strategy'),
                h('select', {
                    value: matchingStrategy,
                    onChange: (e) => onMatchingStrategyChange(e.target.value),
                    className: 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg ' +
                        'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white ' +
                        'transition-all duration-200 text-gray-900 appearance-none cursor-pointer'
                },
                    h('option', { value: 'exact' }, 'Exact Match'),
                    h('option', { value: 'partial' }, 'Partial Match'),
                    h('option', { value: 'regex' }, 'Regex Match')
                )
            )
        ),

        // Active Keywords List
        keywords.length > 0 && h('div', { className: 'mt-6 pt-6 border-t border-gray-100' },
            h('div', { className: 'flex items-center justify-between mb-3' },
                h('h3', { className: 'text-sm font-medium text-gray-900' }, 'Active Keywords'),
                h('span', {
                    className: 'text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full'
                }, keywords.length)
            ),
            h('div', { className: 'flex flex-wrap gap-2' },
                keywords.map(keyword =>
                    h('div', {
                        key: keyword,
                        className: 'group flex items-center gap-2 px-3 py-1.5 bg-primary-50 ' +
                            'text-primary-700 rounded-full text-sm font-medium animate-fade-in ' +
                            'border border-primary-100'
                    },
                        keyword,
                        h('button', {
                            onClick: () => handleRemove(keyword),
                            className: 'ml-1 text-primary-400 hover:text-primary-600 transition-colors'
                        }, '×')
                    )
                )
            )
        )
    );
};

window.KeywordInput = KeywordInput;
export default KeywordInput;
console.log('KeywordInput.js loaded successfully');
