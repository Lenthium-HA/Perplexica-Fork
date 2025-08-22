/**
 * Intelligent Query Classifier
 * 
 * This class determines whether a query needs full enhancement or can use a fast path
 * based on its complexity, structure, and content.
 */
export interface ClassificationResult {
  needsEnhancement: boolean;
  confidence: number;
  reason: string;
}

export class QueryClassifier {
  private simpleQueryPatterns = [
    /^what\s+(is|are|was|were)\s+/i,
    /^who\s+(is|are|was|were)\s+/i,
    /^where\s+(is|are|was|were)\s+/i,
    /^when\s+(did|does|do)\s+/i,
    /^which\s+/i,
    /^how\s+(much|many|old|tall|wide|high|long|heavy|big|small)\s+/i,
    /^how\s+many\s+/i,
    /^how\s+much\s+/i,
  ];

  private complexQueryKeywords = [
    'best', 'better', 'versus', 'vs', 'compare', 'comparison',
    'pros and cons', 'advantages and disadvantages', 'pros', 'cons',
    'opinion', 'think', 'believe', 'should', 'recommend', 'suggestion',
    'based on', 'according to', 'research', 'study', 'analysis',
    'trend', 'trends', '2025', '2024', 'latest', 'recent',
    'performance', 'review', 'evaluation', 'rank', 'rating',
    'top', 'worst', 'good', 'bad', 'effective', 'ineffective',
    'versus', 'alternative', 'options', 'choices', 'select',
    'guide', 'tutorial', 'learn', 'understand', 'explain',
    'difference', 'similarities', 'advantages', 'disadvantages',
    'pros', 'cons', 'for', 'against', 'arguments', 'reasons',
  ];

  private factualIndicators = [
    'capital', 'author', 'weather', 'date', 'definition', 'population',
    'currency', 'language', 'president', 'prime minister', 'king', 'queen',
    'founder', 'inventor', 'creator', 'developer', 'company',
    'height', 'weight', 'size', 'length', 'width', 'depth',
    'temperature', 'speed', 'distance', 'area', 'volume',
    'population', 'gdp', 'income', 'unemployment', 'inflation',
    'founded', 'established', 'born', 'died', 'graduated',
    'located', 'situated', 'position', 'coordinates', 'address',
  ];

  classify(query: string): ClassificationResult {
    const normalizedQuery = query.trim().toLowerCase();
    
    // Rule 1: Check for empty or very short queries
    if (normalizedQuery.length < 3) {
      return {
        needsEnhancement: true,
        confidence: 0.9,
        reason: 'Query too short, default to enhancement'
      };
    }

    // Rule 2: Check for simple question patterns
    const isSimpleQuestion = this.simpleQueryPatterns.some(pattern => 
      pattern.test(normalizedQuery)
    );
    
    // Rule 3: Check for complex keywords
    const hasComplexKeywords = this.complexQueryKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );
    
    // Rule 4: Length-based classification
    const wordCount = normalizedQuery.split(' ').length;
    const isShortQuery = wordCount <= 8;
    const isLongQuery = wordCount > 15;
    
    // Rule 5: Factual indicators
    const hasFactualIndicators = this.factualIndicators.some(indicator => 
      normalizedQuery.includes(indicator)
    );

    // Rule 6: Check for comparative patterns
    const hasComparativePatterns = [
      /vs\b/, /versus\b/, /compared to\b/, /better than\b/, 
      /worse than\b/, /superior to\b/, /inferior to\b/
    ].some(pattern => pattern.test(normalizedQuery));

    // Rule 7: Check for opinion-seeking patterns
    const hasOpinionPatterns = [
      /do you think\b/, /what do you think\b/, /in your opinion\b/,
      /should i\b/, /would you recommend\b/, /what is your opinion\b/
    ].some(pattern => pattern.test(normalizedQuery));

    // Rule 8: Check for research/analysis patterns
    const hasResearchPatterns = [
      /based on\b/, /according to\b/, /research shows\b/,
      /studies indicate\b/, /analysis of\b/, /evaluation of\b/
    ].some(pattern => pattern.test(normalizedQuery));

    // Decision logic for simple queries (fast path)
    if (isSimpleQuestion && isShortQuery && hasFactualIndicators && !hasComplexKeywords) {
      return {
        needsEnhancement: false,
        confidence: 0.9,
        reason: 'Simple factual question with clear indicators'
      };
    }

    // Decision logic for complex queries (enhancement needed)
    if (hasComplexKeywords || hasComparativePatterns || hasOpinionPatterns || 
        hasResearchPatterns || isLongQuery) {
      return {
        needsEnhancement: true,
        confidence: 0.8,
        reason: 'Contains complex keywords, comparative language, or research patterns'
      };
    }

    // Borderline cases - default to enhancement for safety
    if (isSimpleQuestion && !hasFactualIndicators) {
      return {
        needsEnhancement: true,
        confidence: 0.6,
        reason: 'Simple question but lacks clear factual indicators'
      };
    }

    if (isShortQuery && !hasComplexKeywords) {
      return {
        needsEnhancement: false,
        confidence: 0.7,
        reason: 'Short query without complex keywords'
      };
    }

    // Default to enhancement for uncertain cases
    return {
      needsEnhancement: true,
      confidence: 0.5,
      reason: 'Default to enhancement for safety'
    };
  }

  /**
   * Get classification statistics for a batch of queries
   */
  getClassificationStats(queries: string[]): {
    total: number;
    simple: number;
    complex: number;
    averageConfidence: number;
  } {
    const results = queries.map(query => this.classify(query));
    
    return {
      total: queries.length,
      simple: results.filter(r => !r.needsEnhancement).length,
      complex: results.filter(r => r.needsEnhancement).length,
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    };
  }
}

// Export singleton instance for easy use
export const queryClassifier = new QueryClassifier();