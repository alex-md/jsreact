import React, { useState, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function MultiKeywordDensityAnalyzer() {
  const [text, setText] = useState('')
  const [keywords, setKeywords] = useState([''])
  const [file, setFile] = useState(null)

  const handleTextChange = (e) => setText(e.target.value)
  const handleKeywordChange = (index, value) => {
    const newKeywords = [...keywords]
    newKeywords[index] = value
    setKeywords(newKeywords)
  }
  const addKeyword = () => setKeywords([...keywords, ''])
  const removeKeyword = (index) => {
    const newKeywords = keywords.filter((_, i) => i !== index)
    setKeywords(newKeywords.length ? newKeywords : [''])
  }

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setText(e.target.result)
      reader.readAsText(file)
    }
  }, [])

  const substringMatch = (word, target) => {
    return word.toLowerCase().includes(target.toLowerCase())
  }

  const analyzeKeywords = useMemo(() => {
    if (!text || keywords.every(k => !k.trim())) return []

    const words = text.match(/\b\w+\b/g) || []
    const totalWords = words.length

    return keywords.filter(k => k.trim()).map(keyword => {
      const targetCount = words.filter(word => substringMatch(word, keyword)).length
      const density = totalWords > 0 ? (targetCount / totalWords) * 100 : 0

      // Find highest density cluster for individual keyword
      const minWindowSize = Math.max(70, Math.floor(totalWords * 0.05))
      const maxWindowSize = Math.floor(totalWords * 0.2)
      const step = Math.max(1, Math.floor(totalWords * 0.01))

      let maxDensity = 0
      let maxDensityStart = 0
      let maxDensityEnd = 0

      for (let windowSize = minWindowSize; windowSize <= maxWindowSize; windowSize += step) {
        for (let i = 0; i <= totalWords - windowSize; i += step) {
          const windowWords = words.slice(i, i + windowSize)
          const count = windowWords.filter(word => substringMatch(word, keyword)).length
          const density = (count / windowSize) * 100

          if (density > maxDensity) {
            maxDensity = density
            maxDensityStart = i
            maxDensityEnd = i + windowSize
          }
        }
      }

      const highestDensityCluster = {
        start: maxDensityStart,
        end: maxDensityEnd,
        context: words.slice(maxDensityStart, maxDensityEnd).join(' '),
        size: maxDensityEnd - maxDensityStart,
        density: maxDensity.toFixed(2)
      }

      return {
        keyword,
        targetCount,
        density: density.toFixed(2),
        highestDensityCluster
      }
    })
  }, [text, keywords])

  const overallHighestDensityCluster = useMemo(() => {
    if (!text || keywords.every(k => !k.trim())) return null

    const words = text.match(/\b\w+\b/g) || []
    const totalWords = words.length
    const minWindowSize = Math.max(70, Math.floor(totalWords * 0.05))
    const maxWindowSize = Math.floor(totalWords * 0.2)
    const step = Math.max(1, Math.floor(totalWords * 0.01))

    let maxIntersectionScore = 0
    let maxDensityStart = 0
    let maxDensityEnd = 0
    const activeKeywords = keywords.filter(k => k.trim())

    for (let windowSize = minWindowSize; windowSize <= maxWindowSize; windowSize += step) {
      for (let i = 0; i <= totalWords - windowSize; i += step) {
        const windowWords = words.slice(i, i + windowSize)
        
        // Calculate how many words match each keyword
        const keywordMatches = activeKeywords.map(keyword => {
          const matches = windowWords.filter(word => substringMatch(word, keyword))
          return matches.length > 0 ? matches.length : 0
        })

        // Only consider windows where all keywords appear at least once
        if (keywordMatches.every(count => count > 0)) {
          // Calculate intersection score as the product of normalized densities
          const intersectionScore = keywordMatches.reduce((score, count) => {
            const density = (count / windowSize)
            return score * density
          }, 1) * 100 * activeKeywords.length // Multiply by keywords length to normalize scores

          if (intersectionScore > maxIntersectionScore) {
            maxIntersectionScore = intersectionScore
            maxDensityStart = i
            maxDensityEnd = i + windowSize
          }
        }
      }
    }

    // If no intersection was found, return null
    if (maxIntersectionScore === 0) {
      return null
    }

    return {
      start: maxDensityStart,
      end: maxDensityEnd,
      context: words.slice(maxDensityStart, maxDensityEnd).join(' '),
      size: maxDensityEnd - maxDensityStart,
      density: maxIntersectionScore.toFixed(2)
    }
  }, [text, keywords])

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Multi-Keyword Density Analyzer</h1>
      <div className="mb-6">
        <Textarea
          placeholder="Paste your text here..."
          value={text}
          onChange={handleTextChange}
          className="min-h-[200px]"
        />
      </div>
      <div className="mb-6">
        <Label htmlFor="file-upload">Or upload a text file:</Label>
        <Input id="file-upload" type="file" accept=".txt" onChange={handleFileUpload} className="mt-2" />
      </div>
      <div className="mb-6">
        <Label>Enter keywords:</Label>
        {keywords.map((keyword, index) => (
          <div key={index} className="flex mt-2">
            <Input
              type="text"
              placeholder="Enter keyword"
              value={keyword}
              onChange={(e) => handleKeywordChange(index, e.target.value)}
              className="flex-grow"
            />
            <Button onClick={() => removeKeyword(index)} className="ml-2">Remove</Button>
          </div>
        ))}
        <Button onClick={addKeyword} className="mt-2">Add Keyword</Button>
      </div>
      {analyzeKeywords.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Keyword Density Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {analyzeKeywords.map((stats, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-semibold">Keyword: &quot;{stats.keyword}&quot;</h3>
                <ul className="space-y-2 ml-4">
                  <li>Occurrences: {stats.targetCount}</li>
                  <li>Overall Density: {stats.density}%</li>
                  <li>Highest Density Cluster:</li>
                  <ul className="ml-4">
                    <li>Position: {stats.highestDensityCluster.start} - {stats.highestDensityCluster.end}</li>
                    <li>Cluster Size: {stats.highestDensityCluster.size} words</li>
                    <li>Cluster Density: {stats.highestDensityCluster.density}%</li>
                    <li>Context: <span className="text-sm">...{stats.highestDensityCluster.context}...</span></li>
                  </ul>
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {overallHighestDensityCluster && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Highest Keyword Intersection Cluster</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>Position: {overallHighestDensityCluster.start} - {overallHighestDensityCluster.end}</li>
              <li>Cluster Size: {overallHighestDensityCluster.size} words</li>
              <li>Intersection Density Score: {overallHighestDensityCluster.density}%</li>
              <li>Context: <span className="text-sm">...{overallHighestDensityCluster.context}...</span></li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
