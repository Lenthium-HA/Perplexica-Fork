import { queryClassifier, ClassificationResult } from './queryClassifier';

describe('QueryClassifier', () => {
  describe('classify', () => {
    it('should classify simple factual questions as not needing enhancement', () => {
      const simpleQueries = [
        'What is the capital of France?',
        'Who wrote Romeo and Juliet?',
        'Where is the Eiffel Tower?',
        'When did World War II end?',
        'How many continents are there?',
        'What is the population of Japan?',
        'Who is the president of the United States?',
        'What is the weather like today?',
      ];

      simpleQueries.forEach(query => {
        const result = queryClassifier.classify(query);
        expect(result.needsEnhancement).toBe(false);
        expect(result.confidence).toBeGreaterThan(0.7);
        expect(result.reason).toContain('Simple factual question');
      });
    });

    it('should classify complex queries as needing enhancement', () => {
      const complexQueries = [
        'What are the best programming languages for web development in 2025?',
        'Compare React vs Vue vs Angular for large-scale applications',
        'What are the pros and cons of using TypeScript in 2025?',
        'Based on recent research, what are the most effective machine learning algorithms?',
        'Should I learn Python or JavaScript for data science in 2025?',
        'What are the latest trends in artificial intelligence research?',
        'In your opinion, what is the best framework for building microservices?',
        'According to recent studies, what are the benefits of remote work?',
      ];

      complexQueries.forEach(query => {
        const result = queryClassifier.classify(query);
        expect(result.needsEnhancement).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.6);
        expect(['complex keywords', 'comparative language', 'research patterns']).toContain(
          result.reason.toLowerCase()
        );
      });
    });

    it('should handle edge cases appropriately', () => {
      const edgeCases = [
        { query: 'Hi', expected: true }, // Too short
        { query: 'Hello how are you', expected: true }, // Greeting
        { query: 'What is AI', expected: false }, // Simple factual
        { query: 'What is the best AI model', expected: true }, // Contains "best"
        { query: 'vs', expected: true }, // Very short
        { query: '', expected: true }, // Empty
      ];

      edgeCases.forEach(({ query, expected }) => {
        const result = queryClassifier.classify(query);
        expect(result.needsEnhancement).toBe(expected);
      });
    });

    it('should detect comparative language correctly', () => {
      const comparativeQueries = [
        'iPhone vs Android',
        'Tesla vs Ford',
        'React vs Vue',
        'Python vs JavaScript',
        'Best laptop for programming vs gaming',
      ];

      comparativeQueries.forEach(query => {
        const result = queryClassifier.classify(query);
        expect(result.needsEnhancement).toBe(true);
        expect(result.reason.toLowerCase()).toContain('comparative');
      });
    });

    it('should detect opinion-seeking patterns correctly', () => {
      const opinionQueries = [
        'What do you think about AI?',
        'In your opinion, what is the best framework?',
        'Should I learn Python or JavaScript?',
        'What is your recommendation for a beginner?',
      ];

      opinionQueries.forEach(query => {
        const result = queryClassifier.classify(query);
        expect(result.needsEnhancement).toBe(true);
        expect(result.reason.toLowerCase()).toContain('opinion');
      });
    });

    it('should detect research patterns correctly', () => {
      const researchQueries = [
        'Based on recent research, what are the benefits of meditation?',
        'According to studies, what causes climate change?',
        'What does research say about remote work productivity?',
        'Based on analysis, what are the best investment strategies?',
      ];

      researchQueries.forEach(query => {
        const result = queryClassifier.classify(query);
        expect(result.needsEnhancement).toBe(true);
        expect(result.reason.toLowerCase()).toContain('research');
      });
    });

    it('should provide confidence scores between 0 and 1', () => {
      const queries = [
        'What is the capital of France?',
        'What are the best programming languages for web development?',
        'Hello',
        'Compare React vs Vue vs Angular',
      ];

      queries.forEach(query => {
        const result = queryClassifier.classify(query);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should handle queries with different lengths correctly', () => {
      const shortQuery = 'What is AI?';
      const mediumQuery = 'What are the benefits of artificial intelligence in healthcare?';
      const longQuery = 'Based on recent research and studies conducted in 2025, what are the most significant benefits and drawbacks of implementing artificial intelligence in healthcare systems compared to traditional medical approaches?';

      const shortResult = queryClassifier.classify(shortQuery);
      const mediumResult = queryClassifier.classify(mediumQuery);
      const longResult = queryClassifier.classify(longQuery);

      expect(shortResult.needsEnhancement).toBe(false);
      expect(mediumResult.needsEnhancement).toBe(true);
      expect(longResult.needsEnhancement).toBe(true);
    });
  });

  describe('getClassificationStats', () => {
    it('should provide correct statistics for a batch of queries', () => {
      const queries = [
        'What is the capital of France?',
        'What are the best programming languages?',
        'Who wrote Romeo and Juliet?',
        'Compare React vs Vue',
        'Where is the Eiffel Tower?',
      ];

      const stats = queryClassifier.getClassificationStats(queries);

      expect(stats.total).toBe(5);
      expect(stats.simple).toBe(3); // First, third, and fifth queries
      expect(stats.complex).toBe(2); // Second and fourth queries
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(stats.averageConfidence).toBeLessThanOrEqual(1);
    });

    it('should handle empty array', () => {
      const stats = queryClassifier.getClassificationStats([]);
      expect(stats.total).toBe(0);
      expect(stats.simple).toBe(0);
      expect(stats.complex).toBe(0);
      expect(stats.averageConfidence).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should correctly classify common user queries', () => {
      const scenarios = [
        {
          query: 'What is the weather in London today?',
          expected: false,
          reason: 'Simple weather query'
        },
        {
          query: 'What are the best restaurants in Paris?',
          expected: true,
          reason: 'Contains "best" - opinion seeking'
        },
        {
          query: 'How to cook pasta?',
          expected: false,
          reason: 'Simple instructional query'
        },
        {
          query: 'What are the health benefits of meditation vs exercise?',
          expected: true,
          reason: 'Comparative query'
        },
        {
          query: 'What is the population of Tokyo?',
          expected: false,
          reason: 'Simple factual query'
        },
        {
          query: 'Based on recent studies, what is the impact of social media on mental health?',
          expected: true,
          reason: 'Research-based query'
        }
      ];

      scenarios.forEach(({ query, expected, reason }) => {
        const result = queryClassifier.classify(query);
        expect(result.needsEnhancement).toBe(expected);
        if (expected) {
          expect(result.reason.toLowerCase()).toContain(reason.toLowerCase());
        }
      });
    });
  });
});