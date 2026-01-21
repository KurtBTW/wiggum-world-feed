describe('Deduplication', () => {
  describe('URL Canonicalization', () => {
    function extractCanonicalUrl(url: string): string {
      try {
        const parsed = new URL(url);
        const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source'];
        for (const param of trackingParams) {
          parsed.searchParams.delete(param);
        }
        return parsed.toString();
      } catch {
        return url;
      }
    }

    it('should remove UTM parameters', () => {
      const url = 'https://example.com/article?utm_source=twitter&utm_medium=social&id=123';
      const canonical = extractCanonicalUrl(url);
      
      expect(canonical).not.toContain('utm_source');
      expect(canonical).not.toContain('utm_medium');
      expect(canonical).toContain('id=123');
    });

    it('should handle URLs without tracking params', () => {
      const url = 'https://example.com/article/slug-here';
      const canonical = extractCanonicalUrl(url);
      
      expect(canonical).toBe('https://example.com/article/slug-here');
    });

    it('should handle invalid URLs gracefully', () => {
      const url = 'not-a-valid-url';
      const canonical = extractCanonicalUrl(url);
      
      expect(canonical).toBe(url);
    });
  });

  describe('Title Similarity', () => {
    function calculateTitleSimilarity(title1: string, title2: string): number {
      const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const t1 = normalize(title1);
      const t2 = normalize(title2);
      
      if (t1 === t2) return 1;
      
      // Simple word overlap
      const words1 = new Set(t1.split(/\s+/));
      const words2 = new Set(t2.split(/\s+/));
      
      const intersection = new Set([...words1].filter(w => words2.has(w)));
      const union = new Set([...words1, ...words2]);
      
      return intersection.size / union.size;
    }

    it('should detect identical titles', () => {
      const similarity = calculateTitleSimilarity(
        'Apple announces new iPhone',
        'Apple announces new iPhone'
      );
      
      expect(similarity).toBe(1);
    });

    it('should detect similar titles with minor differences', () => {
      const similarity = calculateTitleSimilarity(
        'Apple announces new iPhone 16',
        'Apple announces the new iPhone 16!'
      );
      
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should detect different titles', () => {
      const similarity = calculateTitleSimilarity(
        'Apple announces new iPhone',
        'Microsoft releases Windows update'
      );
      
      expect(similarity).toBeLessThan(0.3);
    });

    it('should handle case insensitivity', () => {
      const similarity = calculateTitleSimilarity(
        'BREAKING NEWS TODAY',
        'breaking news today'
      );
      
      expect(similarity).toBe(1);
    });
  });

  describe('Duplicate Detection', () => {
    const existingItems = [
      { url: 'https://example.com/article-1', title: 'First article about technology' },
      { url: 'https://example.com/article-2', title: 'Second article about business' },
    ];

    function isDuplicate(
      newUrl: string, 
      newTitle: string,
      existing: typeof existingItems,
      similarityThreshold: number
    ): boolean {
      // Check URL match
      const urlMatch = existing.some(e => e.url === newUrl);
      if (urlMatch) return true;

      // Check title similarity
      for (const item of existing) {
        const words1 = new Set(item.title.toLowerCase().split(/\s+/));
        const words2 = new Set(newTitle.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);
        const similarity = intersection.size / union.size;
        
        if (similarity >= similarityThreshold) return true;
      }

      return false;
    }

    it('should detect URL duplicates', () => {
      const result = isDuplicate(
        'https://example.com/article-1',
        'Completely different title',
        existingItems,
        0.85
      );
      
      expect(result).toBe(true);
    });

    it('should detect title duplicates', () => {
      const result = isDuplicate(
        'https://different-site.com/new-article',
        'First article about technology news', // Very similar to existing
        existingItems,
        0.5 // Lower threshold for more sensitive duplicate detection
      );
      
      expect(result).toBe(true);
    });

    it('should allow truly new items', () => {
      const result = isDuplicate(
        'https://new-site.com/unique-article',
        'Completely unique headline about different topic',
        existingItems,
        0.85
      );
      
      expect(result).toBe(false);
    });
  });
});
