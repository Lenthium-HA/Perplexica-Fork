import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import QueryEnhancer, { type QueryExpansion, type QueryIntent } from './queryEnhancer';

// Mock dependencies
vi.mock('@langchain/openai');
vi.mock('@langchain/core/embeddings');

const mockLLM = new ChatOpenAI({
  openAIApiKey: 'test-key',
  modelName: 'gpt-3.5-turbo',
  temperature: 0,
});

const mockEmbeddings = new OpenAIEmbeddings({
  openAIApiKey: 'test-key',
});

describe('QueryEnhancer', () => {
  let queryEnhancer: QueryEnhancer;

  beforeEach(() => {
    queryEnhancer = new QueryEnhancer(mockEmbeddings, mockLLM);
  });

  describe('Intent Classification', () => {
    it('should classify factual queries correctly', async () => {
      const result = await queryEnhancer.classifyIntent('What is the capital of France?');
      
      expect(result.intent).toBe('factual');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify instructional queries correctly', async () => {
      const result = await queryEnhancer.classifyIntent('How do I bake a cake?');
      
      expect(result.intent).toBe('instructional');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify opinion queries correctly', async () => {
      const result = await queryEnhancer.classifyIntent('What is the best laptop for programming?');
      
      expect(result.intent).toBe('opinion');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify comparative queries correctly', async () => {
      const result = await queryEnhancer.classifyIntent('iPhone vs Android which is better?');
      
      expect(result.intent).toBe('comparative');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should use fallback classification when LLM fails', async () => {
      // Mock LLM to throw an error
      vi.spyOn(mockLLM, 'invoke').mockRejectedValue(new Error('LLM error'));
      
      const result = await queryEnhancer.classifyIntent('What is Python?');
      
      expect(result.intent).toBeDefined();
      expect(result.confidence).toBeDefined();
    });
  });

  describe('Semantic Query Expansion', () => {
    it('should expand queries with related terms', async () => {
      const expandedQueries = await queryEnhancer.expandQuerySemantically('What is machine learning?');
      
      expect(expandedQueries).toBeInstanceOf(Array);
      expect(expandedQueries.length).toBeGreaterThan(0);
      expect(expandedQueries[0]).toBe('What is machine learning?'); // Original query should be first
    });

    it('should return original query when expansion is disabled', async () => {
      const limitedEnhancer = new QueryEnhancer(mockEmbeddings, mockLLM, {
        enableSemanticExpansion: false,
      });
      
      const expandedQueries = await limitedEnhancer.expandQuerySemantically('Test query');
      
      expect(expandedQueries).toEqual(['Test query']);
    });

    it('should handle expansion failures gracefully', async () => {
      // Mock embeddings to throw an error
      vi.spyOn(mockEmbeddings, 'embedQuery').mockRejectedValue(new Error('Embedding error'));
      
      const expandedQueries = await queryEnhancer.expandQuerySemantically('Test query');
      
      expect(expandedQueries).toEqual(['Test query']);
    });
  });

  describe('Context Refinement', () => {
    it('should refine query based on chat history', async () => {
      const chatHistory = [
        'User: I am interested in learning programming',
        'Assistant: Great! What language would you like to start with?',
        'User: I think Python would be good for me'
      ];
      
      const refinement = await queryEnhancer.refineWithContext(
        'How do I get started?', 
        chatHistory, 
        'instructional'
      );
      
      expect(refinement.refinedQuery).toBeDefined();
      expect(refinement.focusAreas).toBeInstanceOf(Array);
      expect(refinement.exclusionTerms).toBeInstanceOf(Array);
    });

    it('should return original query when no chat history provided', async () => {
      const refinement = await queryEnhancer.refineWithContext(
        'Test query', 
        [], 
        'factual'
      );
      
      expect(refinement.refinedQuery).toBe('Test query');
    });

    it('should handle context refinement failures gracefully', async () => {
      // Mock LLM to throw an error
      vi.spyOn(mockLLM, 'invoke').mockRejectedValue(new Error('LLM error'));
      
      const refinement = await queryEnhancer.refineWithContext(
        'Test query', 
        ['some history'], 
        'factual'
      );
      
      expect(refinement.refinedQuery).toBe('Test query');
    });
  });

  describe('Full Query Enhancement Pipeline', () => {
    it('should enhance query with all components', async () => {
      const chatHistory = [
        'User: I am looking for information about artificial intelligence',
        'Assistant: AI is a broad field. What specifically interests you?'
      ];
      
      const result = await queryEnhancer.enhanceQuery(
        'What are the types of machine learning?',
        chatHistory
      );
      
      expect(result).toMatchObject<QueryExpansion>({
        originalQuery: 'What are the types of machine learning?',
        expandedQueries: expect.any(Array),
        semanticTerms: expect.any(Array),
        contextTerms: expect.any(Array),
        intent: expect.any(String),
        confidence: expect.any(Number)
      });
      
      expect(result.expandedQueries.length).toBeGreaterThan(0);
      expect(result.semanticTerms.length).toBeGreaterThan(0);
      expect(result.contextTerms.length).toBeGreaterThan(0);
    });

    it('should handle empty chat history', async () => {
      const result = await queryEnhancer.enhanceQuery('What is AI?');
      
      expect(result).toMatchObject<QueryExpansion>({
        originalQuery: 'What is AI?',
        expandedQueries: expect.any(Array),
        semanticTerms: expect.any(Array),
        contextTerms: expect.any(Array),
        intent: expect.any(String),
        confidence: expect.any(Number)
      });
    });
  });

  describe('Mode-Specific Configuration', () => {
    it('should return speed mode configuration', () => {
      const speedConfig = queryEnhancer.getModeConfig('speed');
      
      expect(speedConfig.maxExpandedQueries).toBe(3);
      expect(speedConfig.expansionDepth).toBe('lightweight');
      expect(speedConfig.contextAnalysisDepth).toBe(2);
    });

    it('should return balanced mode configuration', () => {
      const balancedConfig = queryEnhancer.getModeConfig('balanced');
      
      expect(balancedConfig.maxExpandedQueries).toBe(5);
      expect(balancedConfig.expansionDepth).toBe('moderate');
      expect(balancedConfig.contextAnalysisDepth).toBe(5);
    });

    it('should return quality mode configuration', () => {
      const qualityConfig = queryEnhancer.getModeConfig('quality');
      
      expect(qualityConfig.maxExpandedQueries).toBe(8);
      expect(qualityConfig.expansionDepth).toBe('deep');
      expect(qualityConfig.contextAnalysisDepth).toBe(10);
    });
  });

  describe('Stop Word Filtering', () => {
    it('should filter out common stop words', () => {
      const terms = queryEnhancer['extractSemanticTerms'](['What is the machine learning and AI']);
      
      expect(terms).not.toContain('the');
      expect(terms).not.toContain('is');
      expect(terms).not.toContain('and');
      expect(terms).toContain('machine');
      expect(terms).toContain('learning');
      expect(terms).toContain('ai');
    });

    it('should handle short words correctly', () => {
      const terms = queryEnhancer['extractSemanticTerms'](['AI ML DL']);
      
      expect(terms).not.toContain('ai');
      expect(terms).not.toContain('ml');
      expect(terms).not.toContain('dl');
    });
  });

  describe('Error Handling', () => {
    it('should handle LLM errors gracefully', async () => {
      // Mock all LLM calls to fail
      vi.spyOn(mockLLM, 'invoke').mockRejectedValue(new Error('LLM error'));
      
      const result = await queryEnhancer.enhanceQuery('Test query');
      
      // Should still return a valid result with fallback values
      expect(result.originalQuery).toBe('Test query');
      expect(result.expandedQueries).toContain('Test query');
      expect(result.intent).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should handle embedding errors gracefully', async () => {
      // Mock embeddings to fail
      vi.spyOn(mockEmbeddings, 'embedQuery').mockRejectedValue(new Error('Embedding error'));
      
      const result = await queryEnhancer.enhanceQuery('Test query');
      
      // Should still return a valid result
      expect(result.originalQuery).toBe('Test query');
      expect(result.expandedQueries).toContain('Test query');
    });
  });
});