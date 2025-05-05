import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PackageManager = ({ packages, addPackage, removePackage, onClose, darkMode }) => {
    const [newPackageUrl, setNewPackageUrl] = useState('');
    const [error, setError] = useState('');

    const handleAddPackage = () => {
        if (!newPackageUrl) {
            setError('Please enter a package URL');
            return;
        }

        try {
            new URL(newPackageUrl);
        } catch {
            setError('Please enter a valid URL');
            return;
        }

        addPackage(newPackageUrl);
        setNewPackageUrl('');
        setError('');
    };

    const popularPackages = [
        { name: 'Bootstrap CSS', url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css' },
        { name: 'Bootstrap JS', url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js' },
        { name: 'jQuery', url: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js' },
        { name: 'React', url: 'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js' },
        { name: 'React DOM', url: 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js' },
        { name: 'Tailwind CSS', url: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css' },
        { name: 'Alpine.js', url: 'https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js' },
        { name: 'Lodash', url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`w-full max-w-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden`}>
                <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                    <h2 className="text-xl font-semibold">Package Manager</h2>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Add Package via CDN URL</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={newPackageUrl}
                                onChange={(e) => setNewPackageUrl(e.target.value)}
                                placeholder="https://cdn.jsdelivr.net/npm/package@version/file"
                                className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            />
                            <button
                                onClick={handleAddPackage}
                                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2">Popular Packages</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {popularPackages.map((pkg) => (
                                <button
                                    key={pkg.url}
                                    onClick={() => addPackage(pkg.url)}
                                    className={`text-left px-3 py-2 text-sm rounded-md ${darkMode
                                        ? 'hover:bg-gray-700 focus:bg-gray-700'
                                        : 'hover:bg-gray-100 focus:bg-gray-100'
                                        } focus:outline-none`}
                                >
                                    {pkg.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-2">Current Packages</h3>
                        {packages.length === 0 ? (
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No packages added yet.</p>
                        ) : (
                            <ul className={`border rounded-md divide-y ${darkMode ? 'border-gray-700 divide-gray-700' : 'border-gray-200 divide-gray-200'}`}>
                                {packages.map((pkg) => (
                                    <li key={pkg} className="flex items-center justify-between py-2 px-3">
                                        <span className="text-sm truncate flex-1">{pkg}</span>
                                        <button
                                            onClick={() => removePackage(pkg)}
                                            className={`p-1 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-red-500`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackageManager;
