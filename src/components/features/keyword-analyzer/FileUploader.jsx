import React from 'react';
import { createInput } from '@components/common/Input';
import { createButton } from '@components/common/Button';
import { validators } from '@utils/core';

export function FileUploader({ onFileUpload }) {
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!validators.isValidFileType(file.name, ['.txt', '.md', '.doc', '.docx'])) {
            showToast('Invalid file type. Please upload a text document.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => onFileUpload(e.target.result);
        reader.readAsText(file);
    };

    return (
        <div className="space-y-4">
            <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.md,.doc,.docx"
                className="hidden"
                id="file-upload"
            />
            <label
                htmlFor="file-upload"
                className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
            >
                <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                <span className="text-sm text-gray-500">Drop your file here or click to browse</span>
            </label>
        </div>
    );
}
