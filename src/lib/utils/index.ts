import { cn, formatTimeDifference } from '../utils';
import { getDocumentsFromLinks } from './documents';
import { getEnhancedDocumentsFromLinks } from './enhancedDocuments';
import { getFileDetails } from './files';
import computeSimilarity from './computeSimilarity';
import formatChatHistoryAsString from './formatHistory';
import queryEnhancer from './queryEnhancer';
import { queryClassifier } from './queryClassifier';
import type { ClassificationResult } from './queryClassifier';
import { getQueryEnhancementConfig, type QueryEnhancementConfig } from '../config';

export {
  cn,
  formatTimeDifference,
  getDocumentsFromLinks,
  getEnhancedDocumentsFromLinks,
  getFileDetails,
  computeSimilarity,
  formatChatHistoryAsString,
  queryEnhancer,
  queryClassifier,
  type ClassificationResult,
  getQueryEnhancementConfig,
  type QueryEnhancementConfig,
};

export default {
  cn,
  formatTimeDifference,
  getDocumentsFromLinks,
  getEnhancedDocumentsFromLinks,
  getFileDetails,
  computeSimilarity,
  formatChatHistoryAsString,
  queryEnhancer,
  queryClassifier,
  getQueryEnhancementConfig,
};