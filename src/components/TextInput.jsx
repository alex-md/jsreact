import React from 'react';

const TextInput = ({ onTextChange }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Input Text</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Enter or paste the text you want to analyze.
                </p>
            </div>
            <textarea
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Enter your text here..."
                className="w-full h-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg 
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white 
                    transition-all duration-200 placeholder-gray-400 text-gray-900 resize-none"
            />
        </div>
    );
};

export default TextInput;
