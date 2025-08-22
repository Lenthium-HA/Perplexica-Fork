import { Embeddings } from '@langchain/core/embeddings';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export type QueryIntent = 
  | 'factual'      // Seeking factual information
  | 'instructional' // How-to guides, tutorials
  | 'opinion'      // Seeking opinions, reviews
  | 'comparative'  // Comparing options
  | 'explanatory'  // Understanding concepts
  | 'news'         // Recent information
  | 'academic'     // Research-oriented
  | 'commercial'    // Product/service related;

export interface QueryExpansion {
  originalQuery: string;
  expandedQueries: string[];
  semanticTerms: string[];
  contextTerms: string[];
  intent: QueryIntent;
  confidence: number;
}

export interface ContextRefinement {
  refinedQuery: string;
  focusAreas: string[];
  exclusionTerms: string[];
  timeSensitivity: 'low' | 'medium' | 'high';
  sourcePreferences: string[];
}

export interface QueryEnhancementConfig {
  maxExpandedQueries: number;
  expansionDepth: 'lightweight' | 'moderate' | 'deep';
  contextAnalysisDepth: number;
  intentClassificationThreshold: number;
  enableSemanticExpansion: boolean;
  enableContextRefinement: boolean;
}

export class QueryEnhancer {
  private embeddings: Embeddings;
  private llm: BaseChatModel;
  private config: QueryEnhancementConfig;

  constructor(
    embeddings: Embeddings,
    llm: BaseChatModel,
    config: Partial<QueryEnhancementConfig> = {}
  ) {
    this.embeddings = embeddings;
    this.llm = llm;
    this.config = {
      maxExpandedQueries: 5,
      expansionDepth: 'moderate',
      contextAnalysisDepth: 5,
      intentClassificationThreshold: 0.7,
      enableSemanticExpansion: true,
      enableContextRefinement: true,
      ...config
    };
  }

  /**
   * Classify the intent of a query
   */
  async classifyIntent(query: string, chatHistory?: string[]): Promise<{ intent: QueryIntent; confidence: number }> {
    const prompt = `
You are a query intent classifier. Analyze the following query and determine its primary intent category.

Query: "${query}"

Chat History (if available):
${chatHistory?.slice(-3).join('\n') || 'No chat history'}

Intent Categories:
- factual: Seeking factual information, definitions, data
- instructional: How-to guides, tutorials, step-by-step instructions
- opinion: Seeking opinions, reviews, personal perspectives
- comparative: Comparing options, pros/cons, alternatives
- explanatory: Understanding concepts, explanations, educational content
- news: Recent information, current events, updates
- academic: Research-oriented, scholarly, technical information
- commercial: Product/service related, shopping, business

Provide your response in JSON format:
{
  "intent": "intent_category",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your classification"
}
`;

    try {
      const response = await this.llm.invoke(prompt);
      const result = JSON.parse(response.content as string);
      
      return {
        intent: result.intent as QueryIntent,
        confidence: result.confidence
      };
    } catch (error) {
      // Fallback to rule-based classification
      return await this.fallbackIntentClassification(query);
    }
  }

  /**
   * Fallback rule-based intent classification
   */
  private fallbackIntentClassification(query: string): { intent: QueryIntent; confidence: number } {
    const lowerQuery = query.toLowerCase();
    
    // Rule-based classification patterns
    const patterns = {
      factual: ['what is', 'define', 'who', 'when', 'where', 'how many', 'list of'],
      instructional: ['how to', 'step by step', 'tutorial', 'guide', 'instructions'],
      opinion: ['best', 'worst', 'review', 'opinion', 'recommend', 'vs'],
      comparative: ['compare', 'difference between', 'versus', 'alternative', 'vs'],
      explanatory: ['explain', 'understand', 'how does', 'why', 'what are'],
      news: ['latest', 'recent', 'today', 'news', 'update', '2024'],
      academic: ['research', 'study', 'paper', 'analysis', 'methodology'],
      commercial: ['buy', 'price', 'product', 'service', 'shop', 'discount']
    };

    let bestIntent: QueryIntent = 'factual';
    let bestScore = 0;

    for (const [intent, keywords] of Object.entries(patterns)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (lowerQuery.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent as QueryIntent;
      }
    }

    return {
      intent: bestIntent,
      confidence: Math.min(bestScore * 0.3, 1.0)
    };
  }

  /**
   * Perform semantic query expansion using embeddings
   */
  async expandQuerySemantically(query: string): Promise<string[]> {
    if (!this.config.enableSemanticExpansion) {
      return [query];
    }

    try {
      // Get embedding for the original query
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      // Generate related terms using LLM
      const expansionPrompt = `
You are a query expansion expert. Given the query "${query}", generate 10-15 semantically related terms and phrases that could help improve search results.

Focus on:
- Synonyms and related concepts
- Technical terms and jargon
- Broader and narrower terms
- Alternative phrasings

Return only the terms/phrases, one per line.
`;

      const response = await this.llm.invoke(expansionPrompt);
      const relatedTerms = (response.content as string).split('\n')
        .map(term => term.trim())
        .filter(term => term.length > 0);

      // Combine original query with expanded terms
      const expandedQueries = [query];
      
      // Generate alternative queries using the expanded terms
      for (let i = 0; i < Math.min(this.config.maxExpandedQueries - 1, relatedTerms.length); i++) {
        const term = relatedTerms[i];
        const alternativeQuery = await this.generateAlternativeQuery(query, term);
        if (alternativeQuery && !expandedQueries.includes(alternativeQuery)) {
          expandedQueries.push(alternativeQuery);
        }
      }

      return expandedQueries.slice(0, this.config.maxExpandedQueries);
    } catch (error) {
      console.error('Semantic expansion failed:', error);
      return [query];
    }
  }

  /**
   * Generate an alternative query using a related term
   */
  private async generateAlternativeQuery(originalQuery: string, relatedTerm: string): Promise<string | null> {
    try {
      const prompt = `
Given the original query "${originalQuery}" and the related term "${relatedTerm}", create a new query that incorporates this term naturally.

Return only the new query, nothing else.
`;

      const response = await this.llm.invoke(prompt);
      const newQuery = (response.content as string).trim();
      
      return newQuery && newQuery !== originalQuery ? newQuery : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refine query based on context
   */
  async refineWithContext(
    query: string, 
    chatHistory: string[], 
    intent: QueryIntent
  ): Promise<ContextRefinement> {
    if (!this.config.enableContextRefinement || chatHistory.length === 0) {
      return {
        refinedQuery: query,
        focusAreas: [],
        exclusionTerms: [],
        timeSensitivity: 'low',
        sourcePreferences: []
      };
    }

    try {
      const contextPrompt = `
Analyze the conversation context and refine the query "${query}" based on the chat history.

Chat History:
${chatHistory.slice(-this.config.contextAnalysisDepth).join('\n')}

Detected Intent: ${intent}

Provide your analysis in JSON format:
{
  "refinedQuery": "Improved query incorporating context",
  "focusAreas": ["Key focus areas from context"],
  "exclusionTerms": ["Terms to exclude from search"],
  "timeSensitivity": "low|medium|high",
  "sourcePreferences": ["Preferred source types"]
}
`;

      const response = await this.llm.invoke(contextPrompt);
      const result = JSON.parse(response.content as string);

      return {
        refinedQuery: result.refinedQuery || query,
        focusAreas: result.focusAreas || [],
        exclusionTerms: result.exclusionTerms || [],
        timeSensitivity: result.timeSensitivity || 'low',
        sourcePreferences: result.sourcePreferences || []
      };
    } catch (error) {
      console.error('Context refinement failed:', error);
      return {
        refinedQuery: query,
        focusAreas: [],
        exclusionTerms: [],
        timeSensitivity: 'low',
        sourcePreferences: []
      };
    }
  }

  /**
   * Main query enhancement pipeline
   */
  async enhanceQuery(
    query: string,
    chatHistory: string[] = []
  ): Promise<QueryExpansion> {
    // Step 1: Classify intent
    const intentResult = await this.classifyIntent(query, chatHistory);
    
    // Step 2: Semantic expansion
    const expandedQueries = await this.expandQuerySemantically(query);
    
    // Step 3: Context refinement
    const contextRefinement = await this.refineWithContext(query, chatHistory, intentResult.intent);
    
    // Extract semantic and context terms
    const semanticTerms = this.extractSemanticTerms(expandedQueries);
    const contextTerms = this.extractContextTerms(chatHistory);

    return {
      originalQuery: query,
      expandedQueries,
      semanticTerms,
      contextTerms,
      intent: intentResult.intent,
      confidence: intentResult.confidence
    };
  }

  /**
   * Extract semantic terms from expanded queries
   */
  private extractSemanticTerms(queries: string[]): string[] {
    const terms = new Set<string>();
    
    queries.forEach(query => {
      // Simple extraction - in production, use more sophisticated NLP
      const words = query.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          terms.add(word);
        }
      });
    });

    return Array.from(terms).slice(0, 10);
  }

  /**
   * Extract context terms from chat history
   */
  private extractContextTerms(chatHistory: string[]): string[] {
    const terms = new Set<string>();
    
    chatHistory.slice(-this.config.contextAnalysisDepth).forEach(message => {
      const words = message.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          terms.add(word);
        }
      });
    });

    return Array.from(terms).slice(0, 8);
  }

  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with',
      'to', 'for', 'of', 'that', 'this', 'it', 'was', 'are', 'be', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'how', 'what', 'when', 'where', 'why', 'who', 'which', 'there', 'their',
      'them', 'then', 'than', 'so', 'such', 'just', 'only', 'very', 'really', 'actually'
    ]);
    
    return stopWords.has(word);
  }

  /**
   * Get mode-specific configuration
   */
  getModeConfig(mode: 'speed' | 'balanced' | 'quality'): QueryEnhancementConfig {
    const modeConfigs: Record<'speed' | 'balanced' | 'quality', QueryEnhancementConfig> = {
      speed: {
        maxExpandedQueries: 1,
        expansionDepth: 'lightweight',
        contextAnalysisDepth: 0,
        intentClassificationThreshold: 0.5,
        enableSemanticExpansion: false,
        enableContextRefinement: false
      },
      balanced: {
        maxExpandedQueries: 5,
        expansionDepth: 'moderate',
        contextAnalysisDepth: 5,
        intentClassificationThreshold: 0.7,
        enableSemanticExpansion: true,
        enableContextRefinement: true
      },
      quality: {
        maxExpandedQueries: 8,
        expansionDepth: 'deep',
        contextAnalysisDepth: 10,
        intentClassificationThreshold: 0.8,
        enableSemanticExpansion: true,
        enableContextRefinement: true
      }
    };

    return modeConfigs[mode];
  }

  /**
   * Simplified speed mode enhancement - minimal processing for maximum speed
   */
  async enhanceQuerySpeed(
    query: string,
    chatHistory: string[] = []
  ): Promise<QueryExpansion> {
    // For speed mode, just return basic expansion without complex LLM calls
    return {
      originalQuery: query,
      expandedQueries: [query], // Just use original query
      semanticTerms: this.extractSemanticTerms([query]),
      contextTerms: chatHistory.length > 0 ? this.extractContextTerms(chatHistory) : [],
      intent: 'factual', // Default intent
      confidence: 0.8 // High confidence for speed mode
    };
  }
}

export default QueryEnhancer;