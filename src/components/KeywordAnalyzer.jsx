import React, { useState } from 'react';
import TextInput from './TextInput.jsx';
import FileUpload from './FileUpload.jsx';
import ResultsDisplay from './ResultsDisplay.jsx';
import HighestDensityClusterDisplay from './HighestDensityClusterDisplay.jsx';
import { utils } from '../utils/utils';

const KeywordAnalyzer = () => {
    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [matchingStrategy, setMatchingStrategy] = useState('partial');
    const [windowSize, setWindowSize] = useState(10);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TextInput onTextChange={setText} />
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Upload a File</h3>
                    <FileUpload handleFileLoad={setText} />
                </div>
            </div>

            {keywords.length > 0 && text && (
                <div className="space-y-8">
                    <ResultsDisplay
                        text={text}
                        keywords={keywords}
                        matchingStrategy={matchingStrategy}
                        windowSize={windowSize}
                        utils={utils}
                    />
                    <HighestDensityClusterDisplay
                        text={text}
                        keywords={keywords}
                        windowSize={windowSize}
                        matchingStrategy={matchingStrategy}
                        utils={utils}
                    />
                </div>
            )}
        </div>
    );
};

export default KeywordAnalyzer;
