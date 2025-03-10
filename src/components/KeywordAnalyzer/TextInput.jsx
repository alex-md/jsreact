import React from 'react';

export const TextInput = ({ onTextChange }) => {
    return (
        <div className="space-y-4">
            <textarea
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Enter your text here..."
                className="bg-white border border-[#eaeaea] dark:focus:border-primary-400 duration-200 focus:border-primary-500 hover:border-gray-300 min-h-[200px] rounded-lg transition-all w-full"
            />
        </div>
    );
};
