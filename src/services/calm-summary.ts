// Calm Summary Service - Generate non-sensational summaries
import { getCalmSummaryConfig } from './config';
import type { Category, IngestedItemWithScores, CalmSummaryResponse } from '@/types';

const config = getCalmSummaryConfig();

/**
 * Generate calm summaries for a set of items
 * Uses rule-based rewriting with LLM fallback for complex cases
 */
export async function generateCalmSummaries(
  items: IngestedItemWithScores[],
  category: Category
): Promise<IngestedItemWithScores[]> {
  return items.map(item => ({
    ...item,
    // Add calm versions to the item (stored separately in TileItem)
    calmHeadline: generateCalmHeadline(item.originalTitle),
    calmSummary: generateCalmSummary(item.originalTitle, item.excerpt || '', category)
  })) as (IngestedItemWithScores & { calmHeadline: string; calmSummary: string })[];
}

/**
 * Generate a calm headline from original title
 */
export function generateCalmHeadline(originalTitle: string): string {
  let headline = originalTitle;
  
  // Remove sensational words
  for (const word of config.bannedWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    headline = headline.replace(regex, '');
  }
  
  // Remove excessive punctuation
  headline = headline
    .replace(/!+/g, '.')
    .replace(/\?+/g, '?')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Convert all caps to title case
  if (headline === headline.toUpperCase() && headline.length > 10) {
    headline = toTitleCase(headline);
  }
  
  // Remove leading/trailing punctuation artifacts
  headline = headline.replace(/^[\s.,;:-]+|[\s.,;:-]+$/g, '').trim();
  
  // Truncate if too long
  if (headline.length > config.maxHeadlineLength) {
    headline = headline.slice(0, config.maxHeadlineLength - 3) + '...';
  }
  
  // Ensure it doesn't start with lowercase
  if (headline.length > 0) {
    headline = headline.charAt(0).toUpperCase() + headline.slice(1);
  }
  
  return headline || originalTitle; // Fallback to original if completely empty
}

/**
 * Generate a calm 1-2 sentence summary
 */
export function generateCalmSummary(
  title: string,
  excerpt: string,
  category: Category
): string {
  // Use excerpt if available, otherwise derive from title
  let summary = excerpt || title;
  
  // Clean up the text
  summary = cleanText(summary);
  
  // Remove sensational language
  for (const word of config.bannedWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    summary = summary.replace(regex, '');
  }
  
  // Clean up whitespace
  summary = summary.replace(/\s+/g, ' ').trim();
  
  // Extract first 1-2 sentences if longer
  const sentences = summary.match(/[^.!?]+[.!?]+/g) || [summary];
  summary = sentences.slice(0, 2).join(' ').trim();
  
  // Add category-specific context if summary is too short
  if (summary.length < 50 && title !== summary) {
    const prefix = getCategoryPrefix(category);
    summary = `${prefix} ${summary}`;
  }
  
  // Truncate if too long
  if (summary.length > config.maxSummaryLength) {
    // Find last complete word before limit
    const truncated = summary.slice(0, config.maxSummaryLength);
    const lastSpace = truncated.lastIndexOf(' ');
    summary = truncated.slice(0, lastSpace) + '...';
  }
  
  // Ensure proper capitalization
  if (summary.length > 0) {
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
  }
  
  return summary;
}

/**
 * Clean text of HTML and other artifacts
 */
function cleanText(text: string): string {
  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert text to title case
 */
function toTitleCase(str: string): string {
  const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
  
  return str.toLowerCase().split(' ').map((word, index) => {
    if (index === 0 || !smallWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
}

/**
 * Get category-specific prefix for short summaries
 */
function getCategoryPrefix(category: Category): string {
  switch (category) {
    case 'technology':
      return 'In technology news,';
    case 'crypto':
      return 'In cryptocurrency developments,';
    case 'ai':
      return 'In AI research,';
    case 'business':
      return 'In business news,';
    case 'market_movements':
      return 'Market update:';
    default:
      return '';
  }
}

/**
 * Validate that a summary meets calm requirements
 */
export function validateCalmSummary(headline: string, summary: string): boolean {
  const text = `${headline} ${summary}`.toLowerCase();
  
  // Check for banned words
  for (const word of config.bannedWords) {
    if (text.includes(word.toLowerCase())) {
      return false;
    }
  }
  
  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.3) {
    return false;
  }
  
  // Check for excessive punctuation
  const punctCount = (text.match(/[!?]/g) || []).length;
  if (punctCount > 2) {
    return false;
  }
  
  return true;
}
