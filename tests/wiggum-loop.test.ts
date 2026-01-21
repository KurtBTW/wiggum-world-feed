import type { IngestedItemWithScores, WiggumLoopMetrics, CategoryThresholds } from '../src/types';

// Mock data for testing
const mockCandidates: IngestedItemWithScores[] = [
  {
    id: '1',
    title: 'Company launches innovative product',
    originalTitle: 'Company launches innovative product',
    url: 'https://example.com/1',
    source: 'https://techcrunch.com/feed',
    sourceName: 'TechCrunch',
    category: 'technology',
    publishedAt: new Date(),
    fetchedAt: new Date(),
    excerpt: 'A breakthrough in technology',
    scores: {
      optimismScore: 0.8,
      sensationalismScore: 0.1,
      forwardProgressScore: 0.9,
      freshnessScore: 0.95,
      credibilityScore: 0.8,
      topicFitScore: 0.7,
      totalScore: 0.85
    }
  },
  {
    id: '2',
    title: 'Research team achieves milestone',
    originalTitle: 'Research team achieves milestone',
    url: 'https://example.com/2',
    source: 'https://theverge.com/feed',
    sourceName: 'The Verge',
    category: 'technology',
    publishedAt: new Date(),
    fetchedAt: new Date(),
    scores: {
      optimismScore: 0.7,
      sensationalismScore: 0.15,
      forwardProgressScore: 0.8,
      freshnessScore: 0.9,
      credibilityScore: 0.7,
      topicFitScore: 0.8,
      totalScore: 0.78
    }
  },
  {
    id: '3',
    title: 'SHOCKING market CRASH devastates everyone!!!',
    originalTitle: 'SHOCKING market CRASH devastates everyone!!!',
    url: 'https://example.com/3',
    source: 'https://sensational.com/feed',
    sourceName: 'Sensational News',
    category: 'technology',
    publishedAt: new Date(),
    fetchedAt: new Date(),
    scores: {
      optimismScore: 0.1,
      sensationalismScore: 0.95,
      forwardProgressScore: 0.1,
      freshnessScore: 0.9,
      credibilityScore: 0.3,
      topicFitScore: 0.5,
      totalScore: 0.25
    }
  }
];

describe('Wiggum Loop Logic', () => {
  describe('Item Selection', () => {
    it('should filter out items exceeding sensationalism threshold', () => {
      const maxSensationalism = 0.3;
      const filtered = mockCandidates.filter(
        item => item.scores.sensationalismScore <= maxSensationalism
      );
      
      expect(filtered.length).toBe(2);
      expect(filtered.find(i => i.id === '3')).toBeUndefined();
    });

    it('should sort items by total score', () => {
      const sorted = [...mockCandidates].sort(
        (a, b) => b.scores.totalScore - a.scores.totalScore
      );
      
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
    });

    it('should enforce source diversity', () => {
      const maxSameSourceItems = 2;
      const candidates = [
        ...mockCandidates.slice(0, 2),
        { ...mockCandidates[0], id: '4', sourceName: 'TechCrunch' },
        { ...mockCandidates[0], id: '5', sourceName: 'TechCrunch' },
      ];
      
      const sourceCounts: Record<string, number> = {};
      const selected = candidates.filter(item => {
        const count = sourceCounts[item.sourceName] || 0;
        if (count >= maxSameSourceItems) return false;
        sourceCounts[item.sourceName] = count + 1;
        return true;
      });
      
      const techCrunchCount = selected.filter(i => i.sourceName === 'TechCrunch').length;
      expect(techCrunchCount).toBeLessThanOrEqual(maxSameSourceItems);
    });
  });

  describe('Metrics Calculation', () => {
    function calculateMetrics(items: IngestedItemWithScores[]): WiggumLoopMetrics {
      if (items.length === 0) {
        return {
          avgSensationalism: 0,
          avgOptimism: 0,
          forwardProgressPct: 0,
          itemCount: 0,
          sourceDiversity: 0,
          sources: []
        };
      }
      
      const avgSensationalism = items.reduce((sum, i) => sum + i.scores.sensationalismScore, 0) / items.length;
      const avgOptimism = items.reduce((sum, i) => sum + i.scores.optimismScore, 0) / items.length;
      const forwardProgressItems = items.filter(i => i.scores.forwardProgressScore >= 0.5);
      const forwardProgressPct = forwardProgressItems.length / items.length;
      const sources = [...new Set(items.map(i => i.sourceName))];
      
      return {
        avgSensationalism,
        avgOptimism,
        forwardProgressPct,
        itemCount: items.length,
        sourceDiversity: sources.length,
        sources
      };
    }

    it('should calculate correct average sensationalism', () => {
      const goodItems = mockCandidates.filter(i => i.scores.sensationalismScore < 0.5);
      const metrics = calculateMetrics(goodItems);
      
      expect(metrics.avgSensationalism).toBeLessThan(0.3);
    });

    it('should calculate correct forward progress percentage', () => {
      const metrics = calculateMetrics(mockCandidates.slice(0, 2));
      
      expect(metrics.forwardProgressPct).toBe(1); // Both items have > 0.5 forward progress
    });

    it('should count unique sources for diversity', () => {
      const metrics = calculateMetrics(mockCandidates);
      
      expect(metrics.sourceDiversity).toBe(3);
      expect(metrics.sources).toContain('TechCrunch');
      expect(metrics.sources).toContain('The Verge');
    });
  });

  describe('Acceptance Criteria', () => {
    const thresholds: CategoryThresholds = {
      targetItemCount: 5,
      minItemCount: 3,
      maxItemCount: 8,
      maxSensationalism: 0.3,
      minOptimism: 0.4,
      minForwardProgressPct: 0.5,
      maxSameSourceItems: 2
    };

    function evaluateAcceptance(metrics: WiggumLoopMetrics, thresholds: CategoryThresholds) {
      const failureReasons: string[] = [];
      
      if (metrics.itemCount < thresholds.minItemCount) {
        failureReasons.push(`Item count ${metrics.itemCount} below minimum ${thresholds.minItemCount}`);
      }
      if (metrics.avgSensationalism > thresholds.maxSensationalism) {
        failureReasons.push(`Avg sensationalism ${metrics.avgSensationalism} above max ${thresholds.maxSensationalism}`);
      }
      if (metrics.forwardProgressPct < thresholds.minForwardProgressPct) {
        failureReasons.push(`Forward progress below minimum`);
      }
      if (metrics.avgOptimism < thresholds.minOptimism) {
        failureReasons.push(`Avg optimism below minimum`);
      }
      
      return {
        accepted: failureReasons.length === 0,
        failureReasons
      };
    }

    it('should reject when item count is too low', () => {
      const metrics: WiggumLoopMetrics = {
        avgSensationalism: 0.1,
        avgOptimism: 0.8,
        forwardProgressPct: 0.8,
        itemCount: 1,
        sourceDiversity: 1,
        sources: ['TechCrunch']
      };
      
      const result = evaluateAcceptance(metrics, thresholds);
      expect(result.accepted).toBe(false);
      expect(result.failureReasons[0]).toContain('Item count');
    });

    it('should reject when sensationalism is too high', () => {
      const metrics: WiggumLoopMetrics = {
        avgSensationalism: 0.5,
        avgOptimism: 0.8,
        forwardProgressPct: 0.8,
        itemCount: 5,
        sourceDiversity: 3,
        sources: ['A', 'B', 'C']
      };
      
      const result = evaluateAcceptance(metrics, thresholds);
      expect(result.accepted).toBe(false);
      expect(result.failureReasons[0]).toContain('sensationalism');
    });

    it('should accept when all criteria are met', () => {
      const metrics: WiggumLoopMetrics = {
        avgSensationalism: 0.15,
        avgOptimism: 0.7,
        forwardProgressPct: 0.8,
        itemCount: 5,
        sourceDiversity: 3,
        sources: ['A', 'B', 'C']
      };
      
      const result = evaluateAcceptance(metrics, thresholds);
      expect(result.accepted).toBe(true);
      expect(result.failureReasons.length).toBe(0);
    });
  });

  describe('Sensationalism Cap Enforcement', () => {
    it('should NEVER relax sensationalism above strict cap', () => {
      const strictCap = 0.4;
      const currentMax = 0.35;
      const step = 0.05;
      
      // Simulate adjustment logic
      const newMax = Math.min(strictCap, currentMax + step);
      
      expect(newMax).toBeLessThanOrEqual(strictCap);
    });

    it('should not allow sensationalism adjustment when already at cap', () => {
      const strictCap = 0.4;
      const currentMax = 0.4;
      
      const canAdjust = currentMax < strictCap;
      expect(canAdjust).toBe(false);
    });
  });
});

describe('No New Keep Tile Behavior', () => {
  it('should detect when no new qualifying items exist', () => {
    const lastSnapshotItemIds = new Set(['1', '2', '3']);
    const currentCandidates = mockCandidates.slice(0, 2);
    
    const newItems = currentCandidates.filter(c => 
      !lastSnapshotItemIds.has(c.id) &&
      c.scores.totalScore > 0.5
    );
    
    expect(newItems.length).toBe(0);
  });

  it('should detect when new qualifying items exist', () => {
    const lastSnapshotItemIds = new Set(['old-1', 'old-2']);
    const currentCandidates = mockCandidates.filter(c => c.scores.totalScore > 0.5);
    
    const newItems = currentCandidates.filter(c => 
      !lastSnapshotItemIds.has(c.id) &&
      c.scores.totalScore > 0.5
    );
    
    expect(newItems.length).toBeGreaterThan(0);
  });
});
