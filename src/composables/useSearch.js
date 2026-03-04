export function useSearch() {
  function normalizeText(text) {
    if (!text) return ''
    
    return String(text)
      .toLowerCase()
      .replace(/[.,!?;:'"`~@#$%^&*()\[\]{}<>/\\|=+_]/g, '')
      .replace(/[-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function normalizeTextAggressive(text) {
    if (!text) return ''
    
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim()
  }

  function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length

    const matrix = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }

  function similarityScore(str1, str2) {
    if (!str1 || !str2) return 0
    
    const s1 = normalizeTextAggressive(str1)
    const s2 = normalizeTextAggressive(str2)
    
    if (s1 === s2) return 1
    
    const distance = levenshteinDistance(s1, s2)
    const maxLength = Math.max(s1.length, s2.length)
    
    return maxLength > 0 ? 1 - (distance / maxLength) : 0
  }

  function isSimilar(str1, str2, threshold = 0.7) {
    return similarityScore(str1, str2) >= threshold
  }

  function textContainsFuzzy(text, keyword, threshold = 0.7) {
    if (!text || !keyword) return false
    
    const normalizedText = normalizeText(text)
    const normalizedKeyword = normalizeText(keyword)
    
    if (normalizedText.includes(normalizedKeyword)) {
      return true
    }
    
    const textWords = normalizedText.split(' ')
    const keywordWords = normalizedKeyword.split(' ')
    
    for (const kw of keywordWords) {
      if (kw.length < 3) {
        if (!textWords.some(word => word === kw)) {
          return false
        }
      } else {
        const hasMatch = textWords.some(word => 
          isSimilar(word, kw, threshold) || 
          word.includes(kw) || 
          kw.includes(word)
        )
        if (!hasMatch) return false
      }
    }
    
    return true
  }

  function calculateFuzzyRelevance(text, keyword) {
    if (!text || !keyword) return 0
    
    const normalizedText = normalizeText(text)
    const normalizedKeyword = normalizeText(keyword)
    
    if (normalizedText === normalizedKeyword) {
      return 1.0
    }
    
    if (normalizedText.includes(normalizedKeyword)) {
      return 0.9
    }
    
    const overallSimilarity = similarityScore(normalizedText, normalizedKeyword)
    if (overallSimilarity > 0.7) {
      return overallSimilarity
    }
    
    const textWords = normalizedText.split(' ')
    const keywordWords = normalizedKeyword.split(' ')
    
    let totalScore = 0
    let matchedWords = 0
    
    for (const kw of keywordWords) {
      if (kw.length < 3) {
        if (textWords.includes(kw)) {
          totalScore += 1
          matchedWords++
        }
      } else {
        let bestScore = 0
        for (const tw of textWords) {
          const score = similarityScore(tw, kw)
          bestScore = Math.max(bestScore, score)
        }
        if (bestScore > 0.6) {
          totalScore += bestScore
          matchedWords++
        }
      }
    }
    
    return matchedWords > 0 ? totalScore / matchedWords : 0
  }

  function getSimilarWords(text, keyword, threshold = 0.7) {
    if (!text || !keyword) return []
    
    const normalizedText = normalizeText(text)
    const normalizedKeyword = normalizeText(keyword)
    const textWords = normalizedText.split(' ')
    const keywordWords = normalizedKeyword.split(' ')
    
    const similarWords = []
    
    for (const kw of keywordWords) {
      if (kw.length < 3) continue
      
      for (const tw of textWords) {
        if (isSimilar(tw, kw, threshold) && !similarWords.includes(tw)) {
          similarWords.push(tw)
        }
      }
    }
    
    return similarWords
  }

  function splitKeywords(query) {
    if (!query) return []
    
    return normalizeText(query)
      .split(' ')
      .filter(kw => kw.length >= 2)
  }

  return {
    normalizeText,
    normalizeTextAggressive,
    levenshteinDistance,
    similarityScore,
    isSimilar,
    textContainsFuzzy,
    calculateFuzzyRelevance,
    getSimilarWords,
    splitKeywords
  }
}