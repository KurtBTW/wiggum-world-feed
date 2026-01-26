# Command Center Redesign

## Context

### Original Request
Redesign the Command Center page (`/network/feed`) to consolidate portfolio, yield protocols, Twitter feed, and Telegram into a unified dashboard.

### Current State
- Left sidebar: "Latest Tweets" (needs rename to "Live Tweets Feed")
- Middle: 4-column category grid (Announcements, Metrics, Commentary, Threads) - **REMOVE**
- Right sidebar: Telegram panel (needs expand functionality)
- Missing: Portfolio display, Protocol tiles with APY

### Target Layout
```
┌───────────────┬───────────────────────────────────┬─────────────────────┐
│ LIVE TWEETS   │           PORTFOLIO               │     TELEGRAM        │
│ FEED          │  HYPE | USDC | USDT0 | positions │                     │
│ [expandable]  ├───────────────────────────────────┤    [expandable]     │
│               │        PROTOCOL TILES             │                     │
│ @user tweet   │  ┌───────┐ ┌───────┐ ┌───────┐   │  Messages           │
│ @user tweet   │  │ xHYPE │ │ kHYPE │ │ LHYPE │   │                     │
│               │  │ 4.4%  │ │ 4.2%  │ │ 3.4%  │   │  [Reply...]         │
│               │  └───────┘ └───────┘ └───────┘   │                     │
└───────────────┴───────────────────────────────────┴─────────────────────┘
```

---

## Work Objectives

### Core Objective
Transform the Command Center from a tweet-category view into a unified dashboard with portfolio overview, yield protocol tiles sorted by APY, and expandable sidebars.

### Concrete Deliverables
- Modified `src/app/network/feed/page.tsx` with new layout
- Portfolio section showing HYPE, USDC, USDT0 balances and staked positions
- Protocol tiles grid sorted by highest APY
- Expandable sidebars for tweets and Telegram
- Inline deposit functionality when clicking protocol tiles

### Definition of Done
- [ ] Page loads without errors: `npm run build` passes
- [ ] Portfolio displays wallet balances when connected
- [ ] Protocol tiles show APY from DeFiLlama/Looping API
- [ ] Tiles are sorted by APY (highest first)
- [ ] Left sidebar expands/collapses with chevron button
- [ ] Right sidebar expands/collapses with chevron button
- [ ] Clicking "Deposit" on a tile shows inline deposit form
- [ ] 4-column category grid is removed

### Must Have
- Portfolio section with: HYPE, USDC, USDT0, kHYPE, LHYPE, xHYPE, xBTC balances
- Protocol tiles: Kinetiq (kHYPE), Looping (LHYPE), Liminal xHYPE, Liminal xBTC
- APY display fetched from yields.ts and looping.ts
- Expand/collapse toggles on both sidebars
- RainbowKit ConnectButton in portfolio section

### Must NOT Have (Guardrails)
- Do NOT keep the 4-column CategoryCard grid
- Do NOT create separate component files (keep changes in feed/page.tsx)
- Do NOT modify the navigation bar or PriceTicker
- Do NOT change the TelegramPanel or TelegramAuth components
- Do NOT add any new API routes

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (project has build/lint)
- **User wants tests**: Manual verification only
- **QA approach**: Build verification + visual inspection

---

## Task Flow

```
Task 1 (Remove CategoryCards) 
    ↓
Task 2 (Add Portfolio section with wagmi hooks)
    ↓
Task 3 (Add Protocol Tiles with APY)
    ↓
Task 4 (Add sidebar expand/collapse)
    ↓
Task 5 (Build and deploy)
```

---

## TODOs

- [ ] 1. Remove 4-column CategoryCard grid from Command Center

  **What to do**:
  - Remove imports: `CategoryCard` from TweetCard, `Megaphone, BarChart3, MessageSquare, BookOpen` from lucide-react
  - Remove the `grouped` state variable
  - Remove the `setGrouped` call in fetchFeed
  - Remove the entire `<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">` section containing CategoryCards

  **Must NOT do**:
  - Do not remove the CompactTweetCard import (still used in left sidebar)
  - Do not remove the tweets state (still used)

  **Parallelizable**: NO (must be done first)

  **References**:
  - `src/app/network/feed/page.tsx:12` - CategoryCard import to remove
  - `src/app/network/feed/page.tsx:24` - grouped state to remove
  - `src/app/network/feed/page.tsx:209-238` - CategoryCard grid to remove

  **Acceptance Criteria**:
  - [ ] `npm run build` passes
  - [ ] Page loads without CategoryCard grid
  - [ ] Left sidebar still shows tweets

  **Commit**: NO (groups with Task 5)

---

- [ ] 2. Add Portfolio section with wallet balances

  **What to do**:
  - Add imports: `useAccount, useBalance, useReadContract` from wagmi, `formatUnits` from viem, `ConnectButton` from @rainbow-me/rainbowkit
  - Add imports for contracts: `LOOPING_CONTRACTS`, `KINETIQ_CONTRACTS`, `LIMINAL_CONTRACTS`
  - Add imports for ABIs: `LHYPE_TOKEN_ABI, KINETIQ_TOKEN_ABI, LIMINAL_SHARE_MANAGER_ABI, ERC20_ABI`
  - Add wallet hooks: `useAccount`, `useBalance` for HYPE, `useReadContract` for USDC, USDT0, kHYPE, LHYPE, xHYPE, xBTC
  - Create Portfolio section in main area with:
    - 6-column grid showing balances
    - ConnectButton for wallet connection
    - Conditional rendering based on `isConnected`

  **Must NOT do**:
  - Do not create a separate PortfolioPanel component
  - Do not duplicate the full dashboard page logic

  **Parallelizable**: NO (depends on Task 1)

  **References**:
  - `src/app/network/dashboard/page.tsx:1-86` - Reference for wagmi hooks and balance reading pattern
  - `src/contexts/ChatDepositContext.tsx:51-65` - Pattern for USDC/USDT0 balance reading
  - `src/services/looping.ts:32-39` - LOOPING_CONTRACTS addresses
  - `src/services/kinetiq.ts` - KINETIQ_CONTRACTS addresses
  - `src/services/liminal.ts` - LIMINAL_CONTRACTS addresses
  - `src/lib/abis.ts` - ABIs for token contracts

  **Acceptance Criteria**:
  - [ ] ConnectButton appears in portfolio section
  - [ ] When wallet connected: HYPE, USDC, USDT0 balances display
  - [ ] Staked positions (kHYPE, LHYPE, xHYPE, xBTC) show when > 0
  - [ ] "Connect wallet" message when not connected

  **Commit**: NO (groups with Task 5)

---

- [ ] 3. Add Protocol Tiles section with APY sorting

  **What to do**:
  - Add imports: `fetchAllYields, AllYields` from '@/services/yields', `fetchLHYPEData` from '@/services/looping'
  - Add deposit component imports: `LoopingDeposit, KinetiqDeposit, LiminalDeposit`
  - Add state: `yields`, `lhypeApy`, `activeDeposit`, `refreshKey`
  - Create `fetchYields` callback that fetches from both APIs
  - Create `handleDepositSuccess` callback for refetching balances
  - Create `protocols` array with id, name, token, apy, depositAsset, color, icon
  - Sort protocols by APY descending
  - Render 2-column grid of protocol cards with:
    - Protocol icon and name
    - APY percentage (green color)
    - Deposit button that toggles inline deposit form
    - Inline deposit component when active

  **Must NOT do**:
  - Do not create separate ProtocolTile component
  - Do not add new API routes

  **Parallelizable**: NO (depends on Task 2)

  **References**:
  - `src/services/yields.ts:70-123` - fetchAllYields function returning APY data
  - `src/services/looping.ts:12-30` - fetchLHYPEData for LHYPE APY
  - `src/app/network/dashboard/page.tsx:167-175` - Deposit component usage pattern
  - `src/components/LoopingDeposit.tsx` - Looping deposit component
  - `src/components/KinetiqDeposit.tsx` - Kinetiq deposit component  
  - `src/components/LiminalDeposit.tsx` - Liminal deposit component (handles both xHYPE and xBTC)

  **Acceptance Criteria**:
  - [ ] 4 protocol tiles display: xHYPE, kHYPE, LHYPE, xBTC
  - [ ] Tiles sorted by APY (highest first)
  - [ ] APY percentages display (or "—" if unavailable)
  - [ ] Clicking "Deposit" shows inline deposit form
  - [ ] Clicking "Close" hides deposit form
  - [ ] Deposit disabled when wallet not connected

  **Commit**: NO (groups with Task 5)

---

- [ ] 4. Add sidebar expand/collapse functionality

  **What to do**:
  - Add `ChevronLeft, ChevronRight` icons to lucide-react imports
  - Add state: `leftExpanded`, `rightExpanded` (both default false)
  - Modify left sidebar:
    - Rename "Latest Tweets" to "Live Tweets Feed"
    - Add expand/collapse button with chevron icon
    - Width: 72 (default) → 96 (expanded)
    - Show more tweets when expanded (50 vs 25)
  - Modify right sidebar:
    - Add header with "Telegram" title and expand button
    - Width: 80 (default) → 420px (expanded)
  - Use CSS transition for smooth width changes

  **Must NOT do**:
  - Do not modify TelegramPanel component internals
  - Do not change the Telegram auth flow

  **Parallelizable**: NO (depends on Task 3)

  **References**:
  - `src/app/network/feed/page.tsx:162-196` - Current left sidebar structure
  - `src/app/network/feed/page.tsx:241-272` - Current right sidebar structure
  - Tailwind transition: `transition-all duration-300`

  **Acceptance Criteria**:
  - [ ] Left sidebar shows "Live Tweets Feed" title
  - [ ] Left sidebar has chevron button that toggles width
  - [ ] Left sidebar shows 50 tweets when expanded
  - [ ] Right sidebar has header with "Telegram" and chevron
  - [ ] Right sidebar expands to 420px when toggled
  - [ ] Transitions are smooth (300ms)

  **Commit**: NO (groups with Task 5)

---

- [ ] 5. Build, verify, and deploy

  **What to do**:
  - Run `npm run build` to verify no TypeScript/build errors
  - Run `npm run lint` to check for linting issues
  - Deploy to Vercel with `vercel --prod`
  - Verify deployment at https://lastnetwork.vercel.app/network/feed

  **Must NOT do**:
  - Do not deploy if build fails
  - Do not skip lint check

  **Parallelizable**: NO (final step)

  **References**:
  - `package.json` - build and lint scripts
  - `vercel.json` - Vercel configuration
  - Deployed URL: https://lastnetwork.vercel.app

  **Acceptance Criteria**:
  - [ ] `npm run build` → exits 0, no errors
  - [ ] `npm run lint` → no errors
  - [ ] `vercel --prod` → deployment successful
  - [ ] Browser: Navigate to https://lastnetwork.vercel.app/network/feed
  - [ ] Browser: Portfolio section visible with ConnectButton
  - [ ] Browser: Protocol tiles visible with APY
  - [ ] Browser: Left sidebar expandable
  - [ ] Browser: Right sidebar expandable
  - [ ] Browser: 4-column category grid is gone

  **Commit**: YES
  - Message: `feat(command-center): redesign with portfolio and protocol tiles`
  - Files: `src/app/network/feed/page.tsx`
  - Pre-commit: `npm run build && npm run lint`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 5 | `feat(command-center): redesign with portfolio and protocol tiles` | src/app/network/feed/page.tsx | npm run build && npm run lint |

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: exits 0
npm run lint   # Expected: no errors
vercel --prod  # Expected: deployment URL
```

### Final Checklist
- [ ] Portfolio section displays wallet balances
- [ ] Protocol tiles sorted by APY
- [ ] Inline deposit forms work
- [ ] Sidebars expand/collapse
- [ ] CategoryCard grid removed
- [ ] Deployed to production
