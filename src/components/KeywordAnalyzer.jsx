import React, { useState, useCallback } from 'react';
import { utils } from '../utils/utils';
import { TextInput } from './KeywordAnalyzer/TextInput';
import { FileUpload } from './KeywordAnalyzer/FileUpload';
import { KeywordInput } from './KeywordAnalyzer/KeywordInput';
import { TextHighlightDisplay } from './KeywordAnalyzer/TextHighlightDisplay';
import { ResultsDisplay } from './KeywordAnalyzer/ResultsDisplay';
import { HighestDensityClusterDisplay } from './KeywordAnalyzer/HighestDensityClusterDisplay';

const KeywordAnalyzer = () => {
    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [matchingStrategy, setMatchingStrategy] = useState('partial');
    const [windowSizePercent, setWindowSizePercent] = useState(10);
    const [activeTab, setActiveTab] = useState('input');

    const handleKeywordsChange = useCallback((newKeywords, shouldSwitchTab = false) => {
        setKeywords(newKeywords);
        if (shouldSwitchTab && text && newKeywords.length > 0) {
            setActiveTab('analysis');
        }
    }, [text]);

    const handleMatchingStrategyChange = useCallback((newStrategy) => {
        setMatchingStrategy(newStrategy);
    }, []);

    const handleWindowSizeChange = useCallback((newSizePercent) => {
        setWindowSizePercent(newSizePercent);
    }, []);

    const getActualWindowSize = useCallback(() => {
        const words = text.trim().split(/\s+/);
        return Math.max(1, Math.round(windowSizePercent / 100 * words.length));
    }, [text, windowSizePercent]);

    return (
        <div className="bg-[#fafafa] min-h-screen">
            {/* Modern Header */}
            <header className="bg-gray-900 border-[#eaeaea] border-b top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        Keyword Density Analyzer
                    </h1>
                    <nav className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('input')}
                            className={`px-4 py-2 text-sm transition-colors ${activeTab === 'input'
                                ? 'text-primary-500 border-b-2 border-primary-500'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Input
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`px-4 py-2 text-sm transition-colors ${activeTab === 'analysis'
                                ? 'text-primary-500 border-b-2 border-primary-500'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            disabled={!text || !keywords.length}
                        >
                            Analysis
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {activeTab === 'input' ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="card-modern">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary-50 text-primary-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Input Text</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter or paste the text you want to analyze</p>
                                </div>
                            </div>
                            <TextInput onTextChange={setText} />
                            <FileUpload handleFileLoad={setText} />
                        </div>

                        <div className="card-modern">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary-50 text-primary-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 010 2.828l-7.586 7.586a2 2 0 01-2.828 0l-5-5a2 2 0 010-2.828L7 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Keywords</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure your keywords and analysis settings</p>
                                </div>
                            </div>
                            <KeywordInput
                                keywords={keywords}
                                onKeywordsChange={handleKeywordsChange}
                                matchingStrategy={matchingStrategy}
                                onMatchingStrategyChange={handleMatchingStrategyChange}
                                windowSizePercent={windowSizePercent}
                                onWindowSizeChange={handleWindowSizeChange}
                                hasText={Boolean(text)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-8">
                        {text && keywords.length > 0 && (
                            <>
                                <HighestDensityClusterDisplay
                                    text={text}
                                    keywords={keywords}
                                    windowSize={getActualWindowSize()}
                                    matchingStrategy={matchingStrategy}
                                    utils={utils}
                                />
                                <ResultsDisplay
                                    text={text}
                                    keywords={keywords}
                                    matchingStrategy={matchingStrategy}
                                    windowSize={getActualWindowSize()}
                                    utils={utils}
                                />
                                <TextHighlightDisplay
                                    text={text}
                                    keywords={keywords}
                                    matchingStrategy={matchingStrategy}
                                    utils={utils}
                                />
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default KeywordAnalyzer;
