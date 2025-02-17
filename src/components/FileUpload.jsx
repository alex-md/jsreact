import React, { useRef } from 'react';

const FileUpload = ({ handleFileLoad }) => {
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
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-300 transition-colors duration-200">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.doc,.docx,.pdf,.md"
            />
            <button
                onClick={() => fileInputRef.current.click()}
                className="px-6 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium 
                    text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
                Choose File
            </button>
            <p className="mt-2 text-sm text-gray-500">
                Supported formats: TXT, DOC, DOCX, PDF, MD
            </p>
        </div>
    );
};

export default FileUpload;
