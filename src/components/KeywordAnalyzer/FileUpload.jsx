import React, { useRef } from 'react';

export const FileUpload = ({ handleFileLoad }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => handleFileLoad(e.target.result);
            reader.readAsText(file);
        }
    };

    return (
        <div className="mt-6">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#eaeaea] dark:border-[#333] rounded-lg 
                hover:border-primary-400 dark:hover:border-primary-500 transition-colors duration-200 cursor-pointer"
                onClick={() => fileInputRef.current.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".txt,.doc,.docx,.pdf,.md"
                />
                <svg className="w-8 h-8 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Drop your file here or click to browse</p>
                <p className="mt-1 text-xs text-gray-500">Supports: TXT, DOC, DOCX, PDF, MD</p>
            </div>
        </div>
    );
};
