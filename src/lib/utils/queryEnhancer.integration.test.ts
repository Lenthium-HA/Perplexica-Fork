import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import QueryEnhancer from './queryEnhancer';
import MetaSearchAgent from '../search/metaSearchAgent';
import prompts from '../prompts';

// Mock dependencies
vi.mock('@langchain/openai');
vi.mock('@langchain/core/embeddings');
vi.mock('../search/metaSearchAgent');
vi.mock('../prompts');

const mockLLM = new ChatOpenAI({
  openAIApiKey: 'test-key',
  modelName: 'gpt-3.5-turbo',
  temperature: 0,
});

const mockEmbeddings = new OpenAIEmbeddings({
  openAIApiKey: 'test-key',
});

describe('Query Enhancement Integration Tests', () => {
  let queryEnhancer: QueryEnhancer;
  let metaSearchAgent: MetaSearchAgent;

  beforeEach(() => {
    queryEnhancer = new QueryEnhancer(mockEmbeddings, mockLLM);
    
    // Create a mock MetaSearchAgent
    metaSearchAgent = new MetaSearchAgent({
      searchWeb: true,
      rerank: true,
      summarizer: true,
      rerankThreshold: 0.3,
      queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
      responsePrompt: prompts.webSearchResponsePrompt,
      activeEngines: ['google', 'bing'],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('MetaSearchAgent Integration', () => {
    it('should initialize query enhancer correctly', () => {
      expect(metaSearchAgent).toBeDefined();
    });

    it('should enhance query before search execution', async () => {
      const query = 'What is the capital of France?';
      const history = [
        { content: 'User: I am learning about European countries', type: 'user' },
        { content: 'Assistant: Great choice! What would you like to know?', type: 'assistant' }
      ];

      // Mock the enhanceQuery method
      const mockEnhancement = {
        enhancedQuery: 'capital of France Paris European countries',
        queryExpansion: {
          originalQuery: query,
          expandedQueries: ['capital of France Paris European countries', 'France capital city'],
          semanticTerms: ['capital', 'France', 'Paris', 'European', 'countries'],
          contextTerms: ['European', 'countries', 'learning'],
          intent: 'factual' as const,
          confidence: 0.9
        }
      };

      vi.spyOn(metaSearchAgent as any, 'enhanceQuery').mockResolvedValue(mockEnhancement);

      const result = await (metaSearchAgent as any).enhanceQuery(
        query,
        history,
        mockEmbeddings,
        mockLLM,
        'balanced'
      );

      expect(result).toEqual(mockEnhancement);
      expect(result.enhancedQuery).toBe('capital of France Paris European countries');
      expect(result.queryExpansion).toBeDefined();
      expect(result.queryExpansion.intent).toBe('factual');
    });

    it('should handle mode-specific enhancement strategies', async () => {
      const query = 'How to bake a chocolate cake?';
      const history: any[] = [];

      // Test speed mode
      vi.spyOn(metaSearchAgent as any, 'enhanceQuery').mockResolvedValue({
        enhancedQuery: 'chocolate cake baking recipe',
        queryExpansion: null
      });

      const speedResult = await (metaSearchAgent as any).enhanceQuery(
        query,
        history,
        mockEmbeddings,
        mockLLM,
        'speed'
      );

      expect(speedResult.enhancedQuery).toBeDefined();

      // Test quality mode
      const qualityResult = await (metaSearchAgent as any).enhanceQuery(
        query,
        history,
        mockEmbeddings,
        mockLLM,
        'quality'
      );

      expect(qualityResult.enhancedQuery).toBeDefined();
    });

    it('should fallback to original query when enhancement fails', async () => {
      const query = 'Test query';
      const history: any[] = [];

      // Mock enhancement to fail
      vi.spyOn(metaSearchAgent as any, 'enhanceQuery').mockRejectedValue(new Error('Enhancement failed'));

      const result = await (metaSearchAgent as any).enhanceQuery(
        query,
        history,
        mockEmbeddings,
        mockLLM,
        'balanced'
      );

      expect(result.enhancedQuery).toBe(query);
      expect(result.queryExpansion).toBeNull();
    });
  });

  describe('Intent-Specific Search Strategies', () => {
    it('should handle factual queries with authoritative sources', async () => {
      const factualQuery = 'What is the speed of light?';
      const result = await queryEnhancer.enhanceQuery(factualQuery);
      
      expect(result.intent).toBe('factual');
      expect(result.expandedQueries.length).toBeGreaterThan(0);
      
      // Factual queries should expand to include related scientific terms
      const expandedQueries = result.expandedQueries.join(' ').toLowerCase();
      expect(expandedQueries).toContain('light');
      expect(expandedQueries).toContain('speed');
      expect(expandedQueries).toContain('physics');
    });

    it('should handle instructional queries with step-by-step focus', async () => {
      const instructionalQuery = 'How do I change a car tire?';
      const result = await queryEnhancer.enhanceQuery(instructionalQuery);
      
      expect(result.intent).toBe('instructional');
      expect(result.expandedQueries.length).toBeGreaterThan(0);
      
      // Instructional queries should include procedural terms
      const expandedQueries = result.expandedQueries.join(' ').toLowerCase();
      expect(expandedQueries).toContain('change');
      expect(expandedQueries).toContain('tire');
      expect(expandedQueries).toContain('step');
    });

    it('should handle opinion queries with diverse perspectives', async () => {
      const opinionQuery = 'What is the best smartphone to buy?';
      const result = await queryEnhancer.enhanceQuery(opinionQuery);
      
      expect(result.intent).toBe('opinion');
      expect(result.expandedQueries.length).toBeGreaterThan(0);
      
      // Opinion queries should include comparison terms
      const expandedQueries = result.expandedQueries.join(' ').toLowerCase();
      expect(expandedQueries).toContain('best');
      expect(expandedQueries).toContain('smartphone');
      expect(expandedQueries).toContain('buy');
    });

    it('should handle comparative queries with alternatives', async () => {
      const comparativeQuery = 'iPhone vs Samsung which is better?';
      const result = await queryEnhancer.enhanceQuery(comparativeQuery);
      
      expect(result.intent).toBe('comparative');
      expect(result.expandedQueries.length).toBeGreaterThan(0);
      
      // Comparative queries should include comparison terms
      const expandedQueries = result.expandedQueries.join(' ').toLowerCase();
      expect(expandedQueries).toContain('iphone');
      expect(expandedQueries).toContain('samsung');
      expect(expandedQueries).toContain('compare');
    });
  });

  describe('Context-Aware Enhancement', () => {
    it('should consider chat history for context refinement', async () => {
      const chatHistory = [
        'User: I am interested in learning programming',
        'Assistant: Programming is a great skill to learn!',
        'User: Which language should I start with?',
        'Assistant: Python is often recommended for beginners',
        'User: Tell me more about Python features'
      ];

      const query = 'What are the best resources for learning Python?';
      const result = await queryEnhancer.enhanceQuery(query, chatHistory);
      
      expect(result.contextTerms.length).toBeGreaterThan(0);
      expect(result.contextTerms).toContain('python');
      expect(result.contextTerms).toContain('learning');
      expect(result.contextTerms).toContain('programming');
    });

    it('should extract relevant context terms from history', async () => {
      const chatHistory = [
        'User: I am looking for information about artificial intelligence',
        'Assistant: AI is fascinating! What specifically interests you?',
        'User: I want to understand machine learning algorithms',
        'Assistant: Machine learning is a subset of AI...'
      ];

      const query = 'How do neural networks work?';
      const result = await queryEnhancer.enhanceQuery(query, chatHistory);
      
      // Should extract AI-related terms from context
      expect(result.contextTerms).toContain('artificial');
      expect(result.contextTerms).toContain('intelligence');
      expect(result.contextTerms).toContain('machine');
      expect(result.contextTerms).toContain('learning');
    });

    it('should handle long chat history correctly', async () => {
      const longChatHistory = Array.from({ length: 20 }, (_, i) => 
        `Message ${i + 1}: This is a test message about various topics.`
      );

      const query = 'What is the weather today?';
      const result = await queryEnhancer.enhanceQuery(query, longChatHistory);
      
      // Should respect context analysis depth limit
      expect(result.contextTerms.length).toBeLessThanOrEqual(8);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle LLM timeouts gracefully', async () => {
      // Mock slow LLM response
      vi.spyOn(mockLLM, 'invoke').mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({ content: '{"intent": "factual", "confidence": 0.8}' } as any), 1000))
      );

      const startTime = Date.now();
      const result = await queryEnhancer.enhanceQuery('Test query');
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within reasonable time
    });

    it('should handle embedding service failures', async () => {
      // Mock embedding failure
      vi.spyOn(mockEmbeddings, 'embedQuery').mockRejectedValue(new Error('Service unavailable'));

      const result = await queryEnhancer.enhanceQuery('Test query');

      expect(result).toBeDefined();
      expect(result.expandedQueries).toContain('Test query'); // Should fallback to original
    });

    it('should maintain performance under load', async () => {
      const queries = Array.from({ length: 10 }, (_, i) => `Test query ${i + 1}`);

      const startTime = Date.now();
      const promises = queries.map(query => queryEnhancer.enhanceQuery(query));
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(results.every((result: any) => result.originalQuery)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Configuration Integration', () => {
    it('should respect configuration settings', async () => {
      const limitedEnhancer = new QueryEnhancer(mockEmbeddings, mockLLM, {
        maxExpandedQueries: 2,
        expansionDepth: 'lightweight',
        contextAnalysisDepth: 2,
        enableSemanticExpansion: false,
      });

      const result = await limitedEnhancer.enhanceQuery('Test query');

      expect(result.expandedQueries.length).toBeLessThanOrEqual(2);
      expect(result.semanticTerms.length).toBe(0); // Disabled
    });

    it('should use mode-specific configurations', async () => {
      const speedConfig = queryEnhancer.getModeConfig('speed');
      const qualityConfig = queryEnhancer.getModeConfig('quality');

      expect(speedConfig.maxExpandedQueries).toBeLessThan(qualityConfig.maxExpandedQueries);
      expect(speedConfig.contextAnalysisDepth).toBeLessThan(qualityConfig.contextAnalysisDepth);
    });
  });
});