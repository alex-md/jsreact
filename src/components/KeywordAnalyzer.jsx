import React, { useState, useCallback } from 'react';
import TextInput from './TextInput.jsx';
import FileUpload from './FileUpload.jsx';
import ResultsDisplay from './ResultsDisplay.jsx';
import HighestDensityClusterDisplay from './HighestDensityClusterDisplay.jsx';
import KeywordInput from './KeywordInput.jsx';
import TextHighlightDisplay from './TextHighlightDisplay.jsx';
import { utils } from '../utils/utils';

const KeywordAnalyzer = () => {
    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [matchingStrategy, setMatchingStrategy] = useState('partial');
    const [windowSizePercent, setWindowSizePercent] = useState(10); // Changed to percentage

    const handleKeywordsChange = useCallback((newKeywords) => {
        setKeywords(newKeywords);
    }, []);

    const handleMatchingStrategyChange = useCallback((newStrategy) => {
        setMatchingStrategy(newStrategy);
    }, []);

    const handleWindowSizeChange = useCallback((newSizePercent) => {
        setWindowSizePercent(newSizePercent);
    }, []);

    // Calculate actual window size based on text length and percentage
    const getActualWindowSize = useCallback(() => {
        const words = text.trim().split(/\s+/);
        return Math.max(1, Math.round((windowSizePercent / 100) * words.length));
    }, [text, windowSizePercent]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Keyword Density Analyzer</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Analyze the density and distribution of keywords in your text. Upload a file or paste your content to get started.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-8">
                        <TextInput onTextChange={setText} />
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Upload a File</h3>
                            <FileUpload handleFileLoad={setText} />
                        </div>
                    </div>

                    <KeywordInput
                        keywords={keywords}
                        onKeywordsChange={handleKeywordsChange}
                        matchingStrategy={matchingStrategy}
                        onMatchingStrategyChange={handleMatchingStrategyChange}
                        windowSizePercent={windowSizePercent}
                        onWindowSizeChange={handleWindowSizeChange}
                    />
                </div>

                {/* Results Section - Swapped order and enhanced styling */}
                {keywords.length > 0 && text && (
                    <div className="space-y-8">
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default KeywordAnalyzer;
