# Query Enhancement Implementation Plan

## Executive Summary
This document provides a detailed technical implementation plan for the intelligent query enhancement system. The goal is to reduce response times for simple queries by 70-90% while maintaining quality for complex queries.

## Implementation Overview

### Phase 1: Core Query Classification (Priority: High)
**Duration**: 2-3 days
**Objective**: Implement rule-based query classification to detect simple vs complex queries

#### Step 1.1: Create QueryClassifier Class
```typescript
// src/lib/utils/queryClassifier.ts
export class QueryClassifier {
  private simpleQueryPatterns = [
    /^what\s+(is|are|was|were)\s+/i,
    /^who\s+(is|are|was|were)\s+/i,
    /^where\s+(is|are|was|were)\s+/i,
    /^when\s+(did|does|do)\s+/i,
    /^which\s+/i,
    /^how\s+(much|many|old|tall|wide)\s+/i,
  ];

  private complexQueryKeywords = [
    'best', 'better', 'versus', 'vs', 'compare', 'comparison',
    'pros and cons', 'advantages and disadvantages', 'pros', 'cons',
    'opinion', 'think', 'believe', 'should', 'recommend', 'suggestion',
    'based on', 'according to', 'research', 'study', 'analysis',
    'trend', 'trends', '2025', '2024', 'latest', 'recent',
    'performance', 'review', 'evaluation', 'rank', 'rating',
  ];

  classify(query: string): ClassificationResult {
    // Implementation logic
  }
}

interface ClassificationResult {
  needsEnhancement: boolean;
  confidence: number;
  reason: string;
}
```

#### Step 1.2: Classification Logic
```typescript
classify(query: string): ClassificationResult {
  const normalizedQuery = query.trim().toLowerCase();
  
  // Rule 1: Check for simple question patterns
  const isSimpleQuestion = this.simpleQueryPatterns.some(pattern => 
    pattern.test(normalizedQuery)
  );
  
  // Rule 2: Check for complex keywords
  const hasComplexKeywords = this.complexQueryKeywords.some(keyword => 
    normalizedQuery.includes(keyword)
  );
  
  // Rule 3: Length-based classification
  const isShortQuery = normalizedQuery.split(' ').length <= 8;
  
  // Rule 4: Factual indicators
  const hasFactualIndicators = [
    'capital', 'author', 'weather', 'date', 'definition', 'population',
    'currency', 'language', 'president', 'prime minister', 'king', 'queen'
  ].some(indicator => normalizedQuery.includes(indicator));
  
  // Decision logic
  if (isSimpleQuestion && isShortQuery && hasFactualIndicators && !hasComplexKeywords) {
    return {
      needsEnhancement: false,
      confidence: 0.9,
      reason: 'Simple factual question with clear indicators'
    };
  }
  
  if (hasComplexKeywords || normalizedQuery.split(' ').length > 15) {
    return {
      needsEnhancement: true,
      confidence: 0.8,
      reason: 'Contains comparative or complex keywords'
    };
  }
  
  // Default to enhancement for borderline cases
  return {
    needsEnhancement: true,
    confidence: 0.6,
    reason: 'Default to enhancement for safety'
  };
}
```

#### Step 1.3: Integration with MetaSearchAgent
```typescript
// src/lib/search/metaSearchAgent.ts
private async enhanceQuery(
  query: string,
  history: BaseMessage[],
  embeddings: Embeddings,
  llm: BaseChatModel,
  optimizationMode: 'speed' | 'balanced' | 'quality'
): Promise<{ enhancedQuery: string; queryExpansion: QueryExpansion | null }> {
  
  // Only apply intelligent classification for Balanced mode
  if (optimizationMode === 'balanced') {
    const classifier = new QueryClassifier();
    const classification = classifier.classify(query);
    
    if (!classification.needsEnhancement) {
      // Fast path for simple queries
      console.log(`Using fast path for query: ${query} (${classification.reason})`);
      return { enhancedQuery: query, queryExpansion: null };
    }
  }
  
  // Existing enhancement logic for complex queries or other modes
  // ... (current implementation)
}
```

### Phase 2: Performance Optimization (Priority: Medium)
**Duration**: 1-2 days
**Objective**: Optimize the fast path and reduce overhead

#### Step 2.1: Fast Path Implementation
```typescript
// Add to MetaSearchAgent for fast path
private async processSimpleQuery(
  query: string,
  history: BaseMessage[],
  llm: BaseChatModel,
  embeddings: Embeddings,
  fileIds: string[]
): Promise<Document[]> {
  // Skip query enhancement entirely
  // Skip reranking
  // Use basic search with minimal processing
  
  const searchRetrieverChain = await this.createBasicSearchChain();
  const result = await searchRetrieverChain.invoke({
    chat_history: history,
    query: query,
  });
  
  return result.docs;
}
```

#### Step 2.2: Configuration Options
```typescript
// Add to config.ts
interface QueryEnhancementConfig {
  enableIntelligentClassification: boolean;
  classificationSensitivity: 'conservative' | 'balanced' | 'aggressive';
  minimumQueryLength: number;
  maximumSimpleQueryLength: number;
  fastPathConfidenceThreshold: number;
}

export const getQueryEnhancementConfig = (): QueryEnhancementConfig => ({
  enableIntelligentClassification: true,
  classificationSensitivity: 'balanced',
  minimumQueryLength: 3,
  maximumSimpleQueryLength: 12,
  fastPathConfidenceThreshold: 0.7,
});
```

### Phase 3: Testing and Validation (Priority: High)
**Duration**: 2 days
**Objective**: Ensure the system works correctly and improves performance

#### Step 3.1: Unit Tests
```typescript
// src/lib/utils/queryClassifier.test.ts
describe('QueryClassifier', () => {
  const classifier = new QueryClassifier();
  
  test('should classify simple factual queries as not needing enhancement', () => {
    const result = classifier.classify('What is the capital of France?');
    expect(result.needsEnhancement).toBe(false);
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  test('should classify complex queries as needing enhancement', () => {
    const result = classifier.classify('What LLMs are best for 2025 based on Reddit?');
    expect(result.needsEnhancement).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

#### Step 3.2: Performance Tests
```typescript
// performance.test.ts
describe('Query Performance', () => {
  test('simple queries should be fast', async () => {
    const startTime = Date.now();
    await processQuery('What is the capital of France?');
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Should be under 5 seconds
  });
  
  test('complex queries should still work', async () => {
    const startTime = Date.now();
    await processQuery('What LLMs are best for 2025 based on Reddit?');
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000); // Should be under 30 seconds
  });
});
```

### Phase 4: Monitoring and Iteration (Priority: Medium)
**Duration**: Ongoing
**Objective**: Continuously improve the system based on real usage

#### Step 4.1: Monitoring Implementation
```typescript
// Add to MetaSearchAgent
private logClassification(query: string, classification: ClassificationResult, actualTime: number) {
  // Log for analytics and improvement
  console.log('Query Classification:', {
    query: query.substring(0, 100),
    predicted: classification.needsEnhancement,
    confidence: classification.confidence,
    actualTime: actualTime,
    timestamp: new Date().toISOString()
  });
}
```

#### Step 4.2: Feedback Loop
```typescript
// Add user feedback collection
interface QueryFeedback {
  query: string;
  predictedClassification: boolean;
  actualClassification: boolean; // Did it actually need enhancement?
  userSatisfaction: number; // 1-5 rating
  responseTime: number;
}
```

## Implementation Timeline

### Week 1: Core Implementation
- **Day 1-2**: Implement QueryClassifier class
- **Day 3**: Integrate with MetaSearchAgent
- **Day 4**: Add configuration options
- **Day 5**: Basic testing and debugging

### Week 2: Optimization and Testing
- **Day 6-7**: Performance optimization
- **Day 8-9**: Comprehensive testing
- **Day 10**: Bug fixes and refinement

### Week 3: Deployment and Monitoring
- **Day 11-12**: Deploy to staging
- **Day 13-14**: Monitor performance and collect feedback
- **Day 15**: Iterate based on feedback

## Risk Assessment

### High Risk Items
1. **Classification Accuracy**: Poor classification could degrade user experience
   - **Mitigation**: Conservative initial settings, fallback to enhancement
2. **Performance Regression**: Changes might slow down the system
   - **Mitigation**: Thorough performance testing, gradual rollout
3. **Edge Cases**: Unusual query formats might break classification
   - **Mitigation**: Comprehensive testing, fallback mechanisms

### Medium Risk Items
1. **User Experience**: Users might notice different response characteristics
   - **Mitigation**: Clear communication, consistent quality
2. **System Complexity**: Adding complexity might make maintenance harder
   - **Mitigation**: Clean code architecture, documentation

### Low Risk Items
1. **Configuration Overhead**: Additional configuration options
   - **Mitigation**: Sensible defaults, clear documentation

## Success Criteria

### Performance Metrics
- **Simple Query Response Time**: < 5 seconds (currently 10-50 seconds)
- **Complex Query Response Time**: < 30 seconds (currently 30-60 seconds)
- **Classification Accuracy**: > 85%
- **False Positive Rate**: < 10%

### Quality Metrics
- **User Satisfaction**: Maintain or improve response quality
- **Query Success Rate**: No degradation in successful query resolution
- **Error Rate**: No increase in errors or failures

### Business Metrics
- **User Engagement**: Increase in query frequency due to faster responses
- **User Retention**: Improved retention through better performance
- **Feature Adoption**: Higher adoption of Balanced mode

## Rollout Strategy

### Phase 1: Internal Testing
- Deploy to development environment
- Test with synthetic queries
- Validate classification accuracy
- Measure performance improvements

### Phase 2: Staging Environment
- Deploy to staging server
- Test with real user data (anonymized)
- Collect performance metrics
- Gather user feedback

### Phase 3: Gradual Rollout
- Roll out to 10% of users
- Monitor performance and user feedback
- Gradually increase to 50%, then 100%
- Have rollback plan ready

### Phase 4: Continuous Improvement
- Monitor production performance
- Collect user feedback
- Iterate on classification rules
- Add machine learning components

## Maintenance Plan

### Ongoing Tasks
1. **Performance Monitoring**: Track response times and classification accuracy
2. **User Feedback Collection**: Gather feedback on query classification
3. **Rule Updates**: Update classification rules based on new patterns
4. **Performance Tuning**: Optimize based on usage patterns

### Quarterly Tasks
1. **Comprehensive Review**: Analyze 3 months of data
2. **Model Improvement**: Enhance classification accuracy
3. **Performance Benchmarking**: Compare against industry standards
4. **User Research**: Conduct user interviews to understand pain points

### Annual Tasks
1. **Architecture Review**: Evaluate if new technologies could improve performance
2. **Major Version Update**: Implement significant improvements
3. **Competitive Analysis**: Compare with similar systems
4. **Long-term Planning**: Set goals for next year

## Conclusion

This implementation plan provides a clear path to significantly improve query response times while maintaining quality. The intelligent query enhancement system will make Perplexica much more responsive for common queries while still providing sophisticated analysis for complex questions.

The key to success is a gradual, data-driven approach with careful monitoring and continuous improvement. By starting with rule-based classification and adding machine learning later, we can achieve quick wins while building a foundation for future enhancements.