const TextInput = ({ onTextChange }) => {
    const { createElement: h, useState } = React;
    const [text, setText] = useState('');

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        onTextChange(newText);
    };

    return h('div', {
        className: 'bg-white rounded-xl shadow-lg border border-gray-100 p-6'
    },
        h('div', { className: 'mb-6' },
            h('h2', { className: 'text-xl font-bold text-gray-900' }, 'Text Content'),
            h('p', { className: 'text-sm text-gray-600 mt-1' },
                'Enter or paste your text here for keyword analysis.'
            )
        ),
        h('textarea', {
            className: 'w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-lg ' +
                'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white ' +
                'transition-all duration-200 font-mono text-sm text-gray-900 resize-none',
            placeholder: 'Type or paste your text here...',
            value: text,
            onChange: handleChange
        }),
        h('div', { className: 'mt-3 flex justify-end' },
            h('div', { className: 'text-xs text-gray-500' },
                `${text.length.toLocaleString()} characters`
            )
        )
    );
};

window.TextInput = TextInput;
export default TextInput;
console.log('TextInput.js loaded successfully');
