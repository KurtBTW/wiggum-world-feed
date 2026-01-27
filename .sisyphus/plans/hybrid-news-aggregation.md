# Hybrid News Aggregation System

## Context

### Original Request
Add news aggregation for all clickable assets on the Last Network Command Center. News should be fetched on-demand when user views a ticker. Sources include CryptoPanic API (free tier) and RSS feeds from quality crypto news sites.

### Requirements
- **Coverage**: All clickable assets (partnered protocols + ticker cryptos + commodities)
- **Refresh**: On-demand only (fetch when user clicks)
- **Sources**: CryptoPanic API (free tier, 5 req/min) + RSS feeds (CoinDesk, Cointelegraph, Decrypt, The Block)

---

## Work Objectives

### Core Objective
Build a hybrid news aggregation system that fetches relevant news for any ticker/asset from multiple sources and displays it in the existing News tab.

### Concrete Deliverables
- `src/services/news.ts` - News fetching service
- `src/app/api/news/[symbol]/route.ts` - API endpoint for news
- Updated `TickerAssetModal.tsx` - Fetch news from API
- Updated `AssetDetail.tsx` - Fetch news from API

### Definition of Done
- [ ] News loads for crypto tickers (BTC, ETH, HYPE, etc.)
- [ ] News loads for partnered protocols (Kinetiq, Liminal, Looping, HypurrFi)
- [ ] News loads for commodities (Gold, Silver, Oil) via RSS keyword matching
- [ ] News is deduplicated and sorted by date
- [ ] No breaking changes to existing functionality

### Must Have
- CryptoPanic integration for crypto tickers
- RSS feed parsing for broader coverage
- Keyword-based relevancy filtering
- Error handling for failed API/RSS calls

### Must NOT Have (Guardrails)
- No database storage (on-demand only for now)
- No paid API keys required
- No changes to ticker/asset selection UI
- No caching beyond Next.js built-in revalidation

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (manual verification)
- **QA approach**: Manual verification via browser

### Manual Verification
For each task, verify by:
1. Running `npm run build` - should pass
2. Running `npm run dev` - should start
3. Clicking ticker/asset and checking News tab loads

---

## TODOs

- [ ] 1. Install rss-parser package

  **What to do**:
  - Run `npm install rss-parser`
  - Verify package.json updated

  **Parallelizable**: YES

  **References**:
  - `package.json` - Add dependency

  **Acceptance Criteria**:
  - [ ] `npm install rss-parser` completes without error
  - [ ] `package.json` contains "rss-parser" in dependencies

  **Commit**: NO (group with 2)

---

- [ ] 2. Create news service

  **What to do**:
  - Create `src/services/news.ts`
  - Implement `fetchCryptoPanicNews(symbol)` - calls CryptoPanic free API
  - Implement `fetchRSSNews(symbol)` - parses RSS feeds, filters by keywords
  - Implement `fetchNewsForSymbol(symbol, limit)` - combines both, dedupes, sorts
  - Define symbol-to-keyword mappings for all assets

  **Must NOT do**:
  - Do not add database storage
  - Do not add paid API integrations

  **Parallelizable**: NO (depends on 1)

  **References**:
  - CryptoPanic API: `https://cryptopanic.com/api/free/v1/posts/?currencies=BTC&filter=hot&public=true`
  - RSS feeds: CoinDesk, Cointelegraph, Decrypt, The Block
  - `src/services/prices.ts` - Pattern for service structure
  - `src/services/yields.ts` - Pattern for external API calls

  **Symbol Mappings**:
  ```
  Crypto: BTC, ETH, SOL, HYPE, XRP, ADA, AVAX, LINK, DOT, SUI
  Protocols: khype (kinetiq keywords), lhype (looping keywords), liminal, hypurrfi
  Commodities: XAU (gold keywords), XAG (silver keywords), OIL (crude oil keywords)
  ```

  **Acceptance Criteria**:
  - [ ] File exists at `src/services/news.ts`
  - [ ] Exports `fetchNewsForSymbol(symbol, limit)` function
  - [ ] Returns array of `{ id, title, url, source, publishedAt, summary?, imageUrl? }`
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(news): add hybrid news aggregation service`
  - Files: `src/services/news.ts`, `package.json`, `package-lock.json`

---

- [ ] 3. Create news API endpoint

  **What to do**:
  - Create `src/app/api/news/[symbol]/route.ts`
  - GET handler that calls `fetchNewsForSymbol`
  - Return JSON array of news items
  - Add error handling for invalid symbols

  **Parallelizable**: NO (depends on 2)

  **References**:
  - `src/app/api/prices/[symbol]/route.ts` - Pattern for dynamic route
  - `src/services/news.ts` - Import fetchNewsForSymbol

  **Acceptance Criteria**:
  - [ ] `GET /api/news/BTC` returns JSON array
  - [ ] `GET /api/news/HYPE` returns JSON array
  - [ ] `GET /api/news/invalid` returns empty array (not error)
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(api): add /api/news/[symbol] endpoint`
  - Files: `src/app/api/news/[symbol]/route.ts`

---

- [ ] 4. Update TickerAssetModal to use news API

  **What to do**:
  - Add state for news items and loading
  - Fetch from `/api/news/[symbol]` when News tab is active
  - Replace current tweet-filtered news with API news
  - Display news items with source, title, time, link

  **Must NOT do**:
  - Do not remove the existing tab structure
  - Do not change Chart or Info tabs

  **Parallelizable**: YES (with 5)

  **References**:
  - `src/components/TickerAssetModal.tsx:438-452` - Current News tab implementation
  - `src/components/TweetCard.tsx` - CompactTweetCard pattern (can reuse or create NewsCard)

  **Acceptance Criteria**:
  - [ ] Click ticker in price bar
  - [ ] Click "News" tab
  - [ ] News items load from API (not tweets)
  - [ ] Each item shows: source, title, time ago, clickable link
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(ui): update TickerAssetModal to use news API`
  - Files: `src/components/TickerAssetModal.tsx`

---

- [ ] 5. Update AssetDetail to use news API

  **What to do**:
  - Add state for news items and loading
  - Fetch from `/api/news/[symbol]` when News tab is active
  - Replace current tweet-filtered news with API news
  - Display news items with source, title, time, link

  **Must NOT do**:
  - Do not remove the existing tab structure
  - Do not change Chart or Info tabs
  - Do not break deposit functionality

  **Parallelizable**: YES (with 4)

  **References**:
  - `src/components/AssetDetail.tsx:394-407` - Current News tab implementation
  - Pattern from TickerAssetModal changes

  **Acceptance Criteria**:
  - [ ] Click partnered protocol (HYPE, Kinetiq, etc.)
  - [ ] Click "News" tab
  - [ ] News items load from API (not tweets)
  - [ ] Each item shows: source, title, time ago, clickable link
  - [ ] `npm run build` passes

  **Commit**: YES
  - Message: `feat(ui): update AssetDetail to use news API`
  - Files: `src/components/AssetDetail.tsx`

---

- [ ] 6. Deploy and verify

  **What to do**:
  - Run final build verification
  - Push to GitHub
  - Deploy to Vercel with `vercel --prod`
  - Test all clickable assets have news

  **Parallelizable**: NO (depends on all above)

  **Acceptance Criteria**:
  - [ ] `npm run build` passes
  - [ ] `git push origin main` succeeds
  - [ ] `vercel --prod` deploys successfully
  - [ ] https://lastnetwork.vercel.app/network/feed loads
  - [ ] Click BTC ticker → News tab shows news
  - [ ] Click HYPE protocol → News tab shows news
  - [ ] Click Kinetiq → News tab shows news

  **Commit**: NO (already committed above)

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 2 | `feat(news): add hybrid news aggregation service` | news.ts, package.json |
| 3 | `feat(api): add /api/news/[symbol] endpoint` | route.ts |
| 4 | `feat(ui): update TickerAssetModal to use news API` | TickerAssetModal.tsx |
| 5 | `feat(ui): update AssetDetail to use news API` | AssetDetail.tsx |

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Should pass with no errors
npm run dev    # Should start dev server
```

### Final Checklist
- [ ] All partnered protocols show relevant news
- [ ] All ticker cryptos show relevant news  
- [ ] Commodities show relevant news (via keyword matching)
- [ ] News is sorted by date (newest first)
- [ ] No duplicate news items
- [ ] Failed API calls don't break the UI (graceful fallback)
