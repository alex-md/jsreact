// document.addEventListener('DOMContentLoaded', () => {
//     const textArea = document.getElementById('textArea');
//     const fileUpload = document.getElementById('file-upload');
//     const keywordsContainer = document.getElementById('keywordsContainer');
//     const addKeywordButton = document.getElementById('addKeyword');
//     const keywordStats = document.getElementById('keywordStats');
//     const keywordStatsContent = document.getElementById('keywordStatsContent');
//     const overallCluster = document.getElementById('overallCluster');
//     const overallClusterContent = document.getElementById('overallClusterContent');

//     const keywords = [''];

//     const handleTextChange = () => {
//         analyzeKeywords();
//     };

//     const handleFileUpload = (e) => {
//         const file = e.target.files[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = (e) => {
//                 textArea.value = e.target.result;
//                 analyzeKeywords();
//             };
//             reader.readAsText(file);
//         }
//     };

//     const handleKeywordChange = (index, value) => {
//         keywords[index] = value;
//         analyzeKeywords();
//     };

//     const addKeyword = () => {
//         keywords.push('');
//         renderKeywords();
//     };

//     const removeKeyword = (index) => {
//         keywords.splice(index, 1);
//         if (keywords.length === 0) {
//             keywords.push('');
//         }
//         renderKeywords();
//         analyzeKeywords();
//     };

//     const renderKeywords = () => {
//         keywordsContainer.innerHTML = '';
//         keywords.forEach((keyword, index) => {
//             const keywordInputGroup = document.createElement('div');
//             keywordInputGroup.className = 'input-group mt-2';
//             keywordInputGroup.innerHTML = `
//                 <input type="text" class="form-control keyword-input" placeholder="Enter keyword" value="${keyword}">
//                 <button class="btn btn-danger remove-keyword">Remove</button>
//             `;
//             keywordsContainer.appendChild(keywordInputGroup);

//             const keywordInput = keywordInputGroup.querySelector('.keyword-input');
//             const removeKeywordButton = keywordInputGroup.querySelector('.remove-keyword');

//             keywordInput.addEventListener('input', (e) => handleKeywordChange(index, e.target.value));
//             removeKeywordButton.addEventListener('click', () => removeKeyword(index));
//         });
//     };

//     const substringMatch = (word, target) => {
//         return word.toLowerCase().includes(target.toLowerCase());
//     };

//     const analyzeKeywords = () => {
//         const text = textArea.value;
//         if (!text || keywords.every(k => !k.trim())) {
//             keywordStats.classList.add('d-none');
//             overallCluster.classList.add('d-none');
//             return;
//         }

//         const words = text.match(/\b\w+\b/g) || [];
//         const totalWords = words.length;

//         const analyzeResults = keywords.filter(k => k.trim()).map(keyword => {
//             const targetCount = words.filter(word => substringMatch(word, keyword)).length;
//             const density = totalWords > 0 ? (targetCount / totalWords) * 100 : 0;

//             // Find highest density cluster for individual keyword
//             const minWindowSize = Math.max(70, Math.floor(totalWords * 0.05));
//             const maxWindowSize = Math.floor(totalWords * 0.2);
//             const step = Math.max(1, Math.floor(totalWords * 0.01));

//             let maxDensity = 0;
//             let maxDensityStart = 0;
//             let maxDensityEnd = 0;

//             for (let windowSize = minWindowSize; windowSize <= maxWindowSize; windowSize += step) {
//                 for (let i = 0; i <= totalWords - windowSize; i += step) {
//                     const windowWords = words.slice(i, i + windowSize);
//                     const count = windowWords.filter(word => substringMatch(word, keyword)).length;
//                     const density = (count / windowSize) * 100;

//                     if (density > maxDensity) {
//                         maxDensity = density;
//                         maxDensityStart = i;
//                         maxDensityEnd = i + windowSize;
//                     }
//                 }
//             }

//             const highestDensityCluster = {
//                 start: maxDensityStart,
//                 end: maxDensityEnd,
//                 context: words.slice(maxDensityStart, maxDensityEnd).join(' '),
//                 size: maxDensityEnd - maxDensityStart,
//                 density: maxDensity.toFixed(2)
//             };

//             return {
//                 keyword,
//                 targetCount,
//                 density: density.toFixed(2),
//                 highestDensityCluster
//             };
//         });

//         renderKeywordStats(analyzeResults);

//         const overallClusterResult = findOverallHighestDensityCluster(words, totalWords, keywords);
//         renderOverallCluster(overallClusterResult);
//     };

//     const renderKeywordStats = (analyzeResults) => {
//         keywordStatsContent.innerHTML = '';
//         analyzeResults.forEach(stats => {
//             const statsElement = document.createElement('div');
//             statsElement.className = 'mb-4';
//             statsElement.innerHTML = `
//                 <h3 class="font-semibold">Keyword: "${stats.keyword}"</h3>
//                 <ul class="space-y-2 ml-4">
//                     <li>Occurrences: ${stats.targetCount}</li>
//                     <li>Overall Density: ${stats.density}%</li>
//                     <li>Highest Density Cluster:</li>
//                     <ul class="ml-4">
//                         <li>Position: ${stats.highestDensityCluster.start} - ${stats.highestDensityCluster.end}</li>
//                         <li>Cluster Size: ${stats.highestDensityCluster.size} words</li>
//                         <li>Cluster Density: ${stats.highestDensityCluster.density}%</li>
//                         <li>Context: <span class="text-sm">...${stats.highestDensityCluster.context}...</span></li>
//                     </ul>
//                 </ul>
//             `;
//             keywordStatsContent.appendChild(statsElement);
//         });
//         keywordStats.classList.remove('d-none');
//     };

//     const findOverallHighestDensityCluster = (words, totalWords, keywords) => {
//         const minWindowSize = Math.max(70, Math.floor(totalWords * 0.05));
//         const maxWindowSize = Math.floor(totalWords * 0.2);
//         const step = Math.max(1, Math.floor(totalWords * 0.01));

//         let maxIntersectionScore = 0;
//         let maxDensityStart = 0;
//         let maxDensityEnd = 0;
//         const activeKeywords = keywords.filter(k => k.trim());

//         for (let windowSize = minWindowSize; windowSize <= maxWindowSize; windowSize += step) {
//             for (let i = 0; i <= totalWords - windowSize; i += step) {
//                 const windowWords = words.slice(i, i + windowSize);

//                 // Calculate how many words match each keyword
//                 const keywordMatches = activeKeywords.map(keyword => {
//                     const matches = windowWords.filter(word => substringMatch(word, keyword));
//                     return matches.length > 0 ? matches.length : 0;
//                 });

//                 // Only consider windows where all keywords appear at least once
//                 if (keywordMatches.every(count => count > 0)) {
//                     // Calculate intersection score as the product of normalized densities
//                     const intersectionScore = keywordMatches.reduce((score, count) => {
//                         const density = (count / windowSize);
//                         return score * density;
//                     }, 1) * 100 * activeKeywords.length; // Multiply by keywords length to normalize scores

//                     if (intersectionScore > maxIntersectionScore) {
//                         maxIntersectionScore = intersectionScore;
//                         maxDensityStart = i;
//                         maxDensityEnd = i + windowSize;
//                     }
//                 }
//             }
//         }

//         // If no intersection was found, return null
//         if (maxIntersectionScore === 0) {
//             return null;
//         }

//         return {
//             start: maxDensityStart,
//             end: maxDensityEnd,
//             context: words.slice(maxDensityStart, maxDensityEnd).join(' '),
//             size: maxDensityEnd - maxDensityStart,
//             density: maxIntersectionScore.toFixed(2)
//         };
//     };

//     const renderOverallCluster = (overallClusterResult) => {
//         if (!overallClusterResult) {
//             overallCluster.classList.add('d-none');
//             return;
//         }

//         overallClusterContent.innerHTML = `
//             <ul class="space-y-2">
//                 <li>Position: ${overallClusterResult.start} - ${overallClusterResult.end}</li>
//                 <li>Cluster Size: ${overallClusterResult.size} words</li>
//                 <li>Intersection Density Score: ${overallClusterResult.density}%</li>
//                 <li>Context: <span class="text-sm">...${overallClusterResult.context}...</span></li>
//             </ul>
//         `;
//         overallCluster.classList.remove('d-none');
//     };

//     textArea.addEventListener('input', handleTextChange);
//     fileUpload.addEventListener('change', handleFileUpload);
//     addKeywordButton.addEventListener('click', addKeyword);

//     renderKeywords();
// });
