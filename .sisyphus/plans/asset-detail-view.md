# Asset Detail View - Stocktwits-Style Asset Pages

## Context

### Original Request
Create comprehensive asset detail views in the Command Center showing price, change %, market stats (market cap, volume, FDV, supply), candlestick charts, latest news, and info tabs - similar to Stocktwits/CoinGecko asset pages.

### Current State
- **Price ticker** exists with basic price + 24h change
- **PriceChartModal** exists with lightweight-charts candlestick chart
- **Price history API** `/api/prices/history` returns OHLC data
- **CoinGecko integration** in `src/services/prices.ts` for price data
- **Tweet feed** can be filtered by asset/mentions
- Command Center shows asset name + basic stats but NO chart, NO market stats, NO news

### Target Layout (Stocktwits-style)
```
┌─────────────────────────────────────────────────────────────┐
│ [Icon] HYPE                                                 │
│        Hyperliquid                                          │
│                                                             │
│ $21.45                                              ↑ 3.2%  │
│ Updated: 04:51 PM EST                               Today   │
├─────────────────────────────────────────────────────────────┤
│ Mkt Cap    │ 24H Volume │   FDV    │ Circ Supply │ Supply   │
│ $1.75T     │ $53.23B    │ $1.75T   │ 19.98M      │ 19.98M   │
├─────────────────────────────────────────────────────────────┤
│ [Featured News Article with image]                          │
│  "HYPE hits new ATH as Hyperliquid..."                     │
│  @HyperliquidX • 2h ago                                    │
├─────────────────────────────────────────────────────────────┤
│ Chart | News | Info                                         │
├─────────────────────────────────────────────────────────────┤
│ [1D] [1W] [1M] [3M] [1Y] [ALL]              Compact View ↗ │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                    📈 Candlestick Chart                 ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│ [Price] [Mkt Cap]         [1D] [1W] [1M] [3M] [YTD] [1Y]  │
└─────────────────────────────────────────────────────────────┘
```

---

## Work Objectives

### Core Objective
Transform the Command Center asset view from basic info into a comprehensive Stocktwits-style asset page with real-time market data, interactive charts, and relevant news.

### Concrete Deliverables
1. **Enhanced Price API** - `/api/prices/[symbol]` returning full market data
2. **Asset Detail Component** - Full view with price, stats, chart, news, tabs
3. **News filtering** - Show tweets mentioning the selected asset
4. **Tabs system** - Chart (default), News, Info

### Definition of Done
- [ ] Selecting any asset shows price with live % change
- [ ] Market stats grid shows: Market Cap, 24H Volume, FDV, Circulating Supply, Total Supply
- [ ] Candlestick chart displays with timeframe buttons (1D, 1W, 1M, 3M, 1Y, ALL)
- [ ] News tab shows tweets mentioning the asset
- [ ] Info tab shows asset description and links
- [ ] Data refreshes every 60 seconds

### Must Have
- Price with $ amount and % change (green/red)
- Market stats grid (Mkt Cap, Volume, FDV, Circ Supply, Total Supply)
- Candlestick chart with timeframe selector
- Tab navigation: Chart | News | Info
- Featured news article at top (if available)

### Must NOT Have (Guardrails)
- Do NOT add TradingView embed (use existing lightweight-charts)
- Do NOT create external API dependencies beyond CoinGecko
- Do NOT remove existing deposit functionality for protocols
- Do NOT modify the PriceTicker component

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (project has build/lint)
- **User wants tests**: Manual verification only
- **QA approach**: Build verification + visual inspection

---

## Architecture

### Data Flow
```
CoinGecko API ─────→ /api/prices/[symbol] ─────→ AssetDetail component
                          │
Yahoo Finance ─────────────┘ (fallback)

Tweet Feed API ────→ Filter by asset ─────────→ News tab
```

### New API Endpoint
**`/api/prices/[symbol]/route.ts`**
```typescript
// Returns full market data for a single asset
{
  symbol: "HYPE",
  name: "Hyperliquid",
  price: 21.45,
  change24h: 3.2,
  change24hUsd: 0.65,
  marketCap: 1750000000,
  volume24h: 53230000000,
  fdv: 1750000000,
  circulatingSupply: 19980000,
  totalSupply: 19980000,
  lastUpdated: "2024-01-26T21:51:00Z"
}
```

### Asset Configuration
Extend existing `CRYPTO_SYMBOLS` array:
```typescript
{
  symbol: 'HYPE',
  name: 'Hyperliquid',
  coingecko: 'hyperliquid',
  description: 'Native token of the Hyperliquid L1 blockchain',
  website: 'https://hyperliquid.xyz',
  twitter: '@HyperliquidX',
  explorer: 'https://purrsec.com'
}
```

---

## Task Flow

```
Task 1 (API endpoint for market data)
    ↓
Task 2 (AssetDetail component with price/stats)
    ↓
Task 3 (Integrate chart into AssetDetail)
    ↓
Task 4 (Add News tab with filtered tweets)
    ↓
Task 5 (Add Info tab with asset details)
    ↓
Task 6 (Build and deploy)
```

---

## TODOs

- [ ] 1. Create API endpoint for full market data

  **What to do**:
  - Create `/api/prices/[symbol]/route.ts`
  - Fetch from CoinGecko `/coins/{id}` endpoint for full market data
  - Return: price, change24h, marketCap, volume24h, fdv, circulatingSupply, totalSupply
  - Add caching (60 second revalidation)
  - Handle fallback for assets not on CoinGecko (protocols like xHYPE)

  **Must NOT do**:
  - Do not modify existing `/api/prices` endpoint

  **Parallelizable**: NO (required first)

  **References**:
  - `src/services/prices.ts:30-43` - Existing CoinGecko fetch pattern
  - CoinGecko API: `https://api.coingecko.com/api/v3/coins/{id}`
  - `src/app/api/prices/route.ts` - Existing prices API pattern

  **Acceptance Criteria**:
  - [ ] `GET /api/prices/hype` returns full market data JSON
  - [ ] Response includes: price, change24h, marketCap, volume24h, fdv, supplies
  - [ ] 404 for unknown symbols
  - [ ] `npm run build` passes

  **Commit**: NO (groups with final)

---

- [ ] 2. Build AssetDetail component with price and stats grid

  **What to do**:
  - Create `src/components/AssetDetail.tsx`
  - Fetch market data from `/api/prices/[symbol]`
  - Display large price with change % (green/red arrow)
  - Display "Updated: HH:MM AM/PM EST • Today" timestamp
  - Stats grid with 5 columns: Mkt Cap, 24H Volume, FDV, Circ Supply, Total Supply
  - Format large numbers: $1.75T, $53.23B, 19.98M
  - Auto-refresh every 60 seconds

  **Must NOT do**:
  - Do not include chart yet (Task 3)
  - Do not include tabs yet (Task 4/5)

  **Parallelizable**: NO (depends on Task 1)

  **References**:
  - `src/components/PriceChartModal.tsx:160-164` - formatPrice function
  - `src/app/network/feed/page.tsx` - Current asset view structure
  - Screenshot reference: Stocktwits BTC page layout

  **Acceptance Criteria**:
  - [ ] Price displays with $ and large font
  - [ ] Change % shows with colored arrow (green up, red down)
  - [ ] Stats grid shows all 5 metrics
  - [ ] Large numbers formatted (T for trillion, B for billion, M for million)
  - [ ] Data refreshes automatically

  **Commit**: NO (groups with final)

---

- [ ] 3. Integrate candlestick chart into AssetDetail

  **What to do**:
  - Extract chart logic from `PriceChartModal.tsx` into reusable hook or component
  - Add chart section below stats grid in AssetDetail
  - Add timeframe buttons: 1D, 1W, 1M, 3M, 1Y, ALL
  - Use existing `/api/prices/history` endpoint
  - Chart should be inline (not modal)

  **Must NOT do**:
  - Do not remove PriceChartModal (still used by PriceTicker)
  - Do not change chart styling

  **Parallelizable**: NO (depends on Task 2)

  **References**:
  - `src/components/PriceChartModal.tsx:41-120` - Chart initialization logic
  - `src/components/PriceChartModal.tsx:122-158` - Data fetching logic
  - `src/app/api/prices/history/route.ts` - Existing history API

  **Acceptance Criteria**:
  - [ ] Candlestick chart renders inline in AssetDetail
  - [ ] Timeframe buttons change chart data
  - [ ] Chart is responsive to container width
  - [ ] Crosshair shows price/time on hover

  **Commit**: NO (groups with final)

---

- [ ] 4. Add tabs and News tab with filtered tweets

  **What to do**:
  - Add tab navigation: Chart (default) | News | Info
  - Create News tab content showing tweets mentioning the asset
  - Filter tweets by: symbol mention, hashtag, or account username
  - Use existing CompactTweetCard for display
  - Show "No news for {asset}" if empty

  **Must NOT do**:
  - Do not create new tweet fetching logic (reuse existing)
  - Do not modify TweetCard components

  **Parallelizable**: NO (depends on Task 3)

  **References**:
  - `src/app/network/feed/page.tsx` - Tweet fetching logic
  - `src/components/TweetCard.tsx` - CompactTweetCard component
  - Filter by: `tweet.text.includes(symbol)` or `tweet.hashtags?.includes(symbol)`

  **Acceptance Criteria**:
  - [ ] Tab bar with Chart | News | Info
  - [ ] Chart tab shows chart (default active)
  - [ ] News tab shows filtered tweets
  - [ ] Tabs switch content without page reload

  **Commit**: NO (groups with final)

---

- [ ] 5. Add Info tab with asset details

  **What to do**:
  - Create Info tab content
  - Show: Description, Website, Twitter, Block Explorer links
  - Add asset metadata to configuration
  - For protocols: show APY, TVL, deposit asset info
  - For native assets: show network info

  **Must NOT do**:
  - Do not hardcode info (use configuration)

  **Parallelizable**: NO (depends on Task 4)

  **References**:
  - `src/app/network/feed/page.tsx:127-187` - Current asset data structure
  - `src/services/yields.ts` - Protocol APY data

  **Acceptance Criteria**:
  - [ ] Info tab shows asset description
  - [ ] Website/Twitter/Explorer links work
  - [ ] Protocols show APY and TVL
  - [ ] Native assets show network info

  **Commit**: NO (groups with final)

---

- [ ] 6. Integrate into Command Center and deploy

  **What to do**:
  - Replace current asset view in feed/page.tsx with AssetDetail component
  - Ensure deposit functionality still works for protocols
  - Test all assets: HYPE, xHYPE, kHYPE, LHYPE, xBTC
  - Run build and deploy

  **Must NOT do**:
  - Do not remove protocol deposit forms
  - Do not change the sidebar layouts

  **Parallelizable**: NO (final step)

  **References**:
  - `src/app/network/feed/page.tsx` - Current page structure

  **Acceptance Criteria**:
  - [ ] `npm run build` passes
  - [ ] All assets display with full detail view
  - [ ] Charts load for all assets
  - [ ] Deposit forms still work for protocols
  - [ ] `vercel --prod` deploys successfully

  **Commit**: YES
  - Message: `feat(command-center): add stocktwits-style asset detail views`
  - Files: Multiple new/modified files
  - Pre-commit: `npm run build && npm run lint`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 6 | `feat(command-center): add stocktwits-style asset detail views` | Multiple | npm run build && npm run lint |

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: exits 0
npm run lint   # Expected: no errors
vercel --prod  # Expected: deployment URL
```

### Final Checklist
- [ ] HYPE shows: price, change%, market cap, volume, FDV, supply
- [ ] Chart displays with 6 timeframe options
- [ ] News tab shows relevant tweets
- [ ] Info tab shows asset description and links
- [ ] Protocol assets still have deposit functionality
- [ ] Data refreshes every 60 seconds
