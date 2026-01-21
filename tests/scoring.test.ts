import { calculateScores } from '../src/services/scoring';
import { generateCalmHeadline, generateCalmSummary, validateCalmSummary } from '../src/services/calm-summary';

describe('Scoring Service', () => {
  describe('calculateScores', () => {
    it('should give high sensationalism score to sensational headlines', () => {
      const scores = calculateScores(
        'BREAKING: Shocking market CRASH devastates investors!!!',
        null,
        0.5,
        new Date(),
        'business'
      );
      
      expect(scores.sensationalismScore).toBeGreaterThan(0.5);
    });

    it('should give low sensationalism score to calm headlines', () => {
      const scores = calculateScores(
        'Company announces quarterly earnings, meets expectations',
        null,
        0.5,
        new Date(),
        'business'
      );
      
      expect(scores.sensationalismScore).toBeLessThan(0.3);
    });

    it('should give high optimism score to positive content', () => {
      const scores = calculateScores(
        'New breakthrough in cancer research shows promising results',
        'Scientists achieve milestone with innovative treatment approach',
        0.8,
        new Date(),
        'technology'
      );
      
      expect(scores.optimismScore).toBeGreaterThan(0.5);
    });

    it('should detect forward-progress indicators', () => {
      const scores = calculateScores(
        'Company launches new product prototype',
        'The release marks a major milestone in development',
        0.7,
        new Date(),
        'technology'
      );
      
      expect(scores.forwardProgressScore).toBeGreaterThan(0.5);
    });

    it('should give higher freshness score to recent items', () => {
      const recentScores = calculateScores(
        'Test headline',
        null,
        0.5,
        new Date(), // Now
        'technology'
      );
      
      const oldScores = calculateScores(
        'Test headline',
        null,
        0.5,
        new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        'technology'
      );
      
      expect(recentScores.freshnessScore).toBeGreaterThan(oldScores.freshnessScore);
    });
  });
});

describe('Calm Summary Service', () => {
  describe('generateCalmHeadline', () => {
    it('should remove sensational words', () => {
      const headline = generateCalmHeadline('BREAKING: Massive explosion rocks the city!!!');
      
      expect(headline.toLowerCase()).not.toContain('breaking');
      expect(headline.toLowerCase()).not.toContain('massive');
      expect(headline).not.toContain('!!!');
    });

    it('should convert all caps to title case', () => {
      const headline = generateCalmHeadline('APPLE ANNOUNCES NEW IPHONE MODEL');
      
      expect(headline).not.toBe('APPLE ANNOUNCES NEW IPHONE MODEL');
      expect(headline.charAt(0)).toBe(headline.charAt(0).toUpperCase());
    });

    it('should truncate long headlines', () => {
      const longTitle = 'A'.repeat(150);
      const headline = generateCalmHeadline(longTitle);
      
      expect(headline.length).toBeLessThanOrEqual(103); // 100 + '...'
    });
  });

  describe('generateCalmSummary', () => {
    it('should remove HTML tags', () => {
      const summary = generateCalmSummary(
        'Test',
        '<p>This is a <strong>test</strong> excerpt.</p>',
        'technology'
      );
      
      expect(summary).not.toContain('<p>');
      expect(summary).not.toContain('<strong>');
    });

    it('should limit to 1-2 sentences', () => {
      const longExcerpt = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
      const summary = generateCalmSummary('Test', longExcerpt, 'technology');
      
      const sentenceCount = (summary.match(/[.!?]+/g) || []).length;
      expect(sentenceCount).toBeLessThanOrEqual(3);
    });
  });

  describe('validateCalmSummary', () => {
    it('should reject summaries with banned words', () => {
      const isValid = validateCalmSummary(
        'BREAKING news alert',
        'This is a shocking development'
      );
      
      expect(isValid).toBe(false);
    });

    it('should accept calm summaries', () => {
      const isValid = validateCalmSummary(
        'Company reports quarterly results',
        'The financial results met analyst expectations.'
      );
      
      expect(isValid).toBe(true);
    });
  });
});
