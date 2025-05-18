import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { debounce } from 'lodash';

const PackageManager = ({ packages, addPackage, removePackage, onClose }) => {
    const [newPackageUrl, setNewPackageUrl] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const handleAddPackage = () => {
        if (!newPackageUrl && !searchQuery) {
            setError('Please enter a package name or URL');
            return;
        }

        if (searchQuery && searchResults.length > 0) {
            // If we have search results, use the first one
            const pkg = searchResults[0];
            const url = `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/${pkg.name}.min.js`;
            addPackage(url);
            setSearchQuery('');
            setSearchResults([]);
        } else if (newPackageUrl) {
            // If we have a direct URL
            try {
                new URL(newPackageUrl);
                addPackage(newPackageUrl);
            } catch {
                setError('Please enter a valid URL');
                return;
            }
        }

        setNewPackageUrl('');
        setError('');
        setShowDropdown(false);
    };

    const searchPackages = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsLoading(true);
        try {
            // Search for packages using the npm registry API
            const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`);
            if (!response.ok) {
                setSearchResults([]);
                return;
            }
            const data = await response.json();

            // Transform the results to include package details
            const packages = data.objects.map(obj => ({
                name: obj.package.name,
                version: obj.package.version,
                description: obj.package.description
            }));

            setSearchResults(packages);
            setShowDropdown(true);
        } catch (err) {
            console.error('Error searching packages:', err);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedSearch = debounce(searchPackages, 300);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const handleSelectPackage = (pkg) => {
        // Try to generate a minified URL first
        const url = `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/dist/${pkg.name}.min.js`;
        setNewPackageUrl(url);
        setSearchQuery('');
        setShowDropdown(false);
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
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Package Manager</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Add Package via CDN URL</label>
                        <div className="relative" ref={dropdownRef}>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Search for npm packages..."
                                    className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                                />
                                <input
                                    type="text"
                                    value={newPackageUrl}
                                    onChange={(e) => setNewPackageUrl(e.target.value)}
                                    placeholder="or enter CDN URL directly"
                                    className="flex-1 px-3 py-2 border-t border-b focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                                />
                                <button
                                    onClick={handleAddPackage}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>

                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 border rounded-md shadow-lg bg-white border-gray-200"
                                    style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {isLoading ? (
                                        <div className="p-4 text-center text-gray-600">
                                            Loading...
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-200">
                                            {searchResults.map((pkg) => (
                                                <li
                                                    key={pkg.name}
                                                    onClick={() => handleSelectPackage(pkg)}
                                                    className="p-3 cursor-pointer hover:bg-blue-50"
                                                >
                                                    <div className="font-medium">{pkg.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {pkg.version}
                                                    </div>
                                                    {pkg.description && (
                                                        <div className="text-sm text-gray-500">
                                                            {pkg.description}
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
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
                                    className="text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                    {pkg.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-2">Current Packages</h3>
                        {packages.length === 0 ? (
                            <p className="text-sm text-gray-500">No packages added yet.</p>
                        ) : (
                            <ul className="border rounded-md divide-y border-gray-200 divide-gray-200">
                                {packages.map((pkg) => (
                                    <li key={pkg} className="flex items-center justify-between py-2 px-3">
                                        <span className="text-sm truncate flex-1">{pkg}</span>
                                        <button
                                            onClick={() => removePackage(pkg)}
                                            className="p-1 rounded-md hover:bg-gray-100 text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackageManager;
