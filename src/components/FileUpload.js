const FileUpload = ({ handleFileLoad }) => {
    const { createElement: h } = React;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileContent = e.target.result;
                handleFileLoad(fileContent);
            };
            reader.readAsText(file);
        }
    };

    return h('div', { className: 'card-modern' },
        h('h3', { className: 'text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2' },
            h('span', null, '📁 File Upload')
        ),
        h('div', { className: 'space-y-2' },
            h('input', {
                type: 'file',
                onChange: handleFileChange,
                accept: '.txt,.doc,.docx,.md',
                className: 'w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-lg ' +
                    'focus:border-primary-500 focus:bg-white transition-all duration-200 ' +
                    'text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md ' +
                    'file:border-0 file:text-sm file:font-medium file:bg-primary-500 file:text-white ' +
                    'hover:file:bg-primary-600'
            }),
            h('p', { className: 'text-sm text-gray-500' },
                'Upload a text file to analyze its content'
            )
        )
    );
};

// Make component available globally
window.FileUpload = FileUpload;
export default FileUpload;
console.log('FileUpload.js loaded successfully');
