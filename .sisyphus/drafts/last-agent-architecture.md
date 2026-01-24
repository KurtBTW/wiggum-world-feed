# Last Agent - Architecture Draft

> "The last network you'll ever need"

## Vision

An AI-powered command center for DeFi on Hyperliquid that:
- Aggregates real-time intelligence from partner protocols
- Provides actionable insights and guidance
- Executes DeFi actions through the Mewnberg terminal
- Connects users to the network of protocols and teams

---

## Core Components

### 1. Knowledge Layer (Data Ingestion)

**Sources:**
- Partner protocol tweets (already ingesting 11 accounts)
- News stories and announcements
- On-chain data (TVL, volume, yields)
- Protocol documentation and roadmaps
- Team/investor information

**Storage:**
- Supabase with pgvector extension
- Embeddings via OpenAI text-embedding-3-small
- Structured metadata (protocol, category, timestamp, source)

**Processing Pipeline:**
```
Tweet/News → Classify → Generate Embedding → Store in Vector DB
                ↓
         Extract entities (protocols, people, metrics)
                ↓
         Link to protocol profiles
```

### 2. Conversation Layer (AI Agent)

**Capabilities:**
- Answer questions about any partner protocol
- Synthesize information across multiple sources
- Provide directional guidance based on data
- Remember conversation context
- Cite sources (link to original tweets/news)

**Tech Stack:**
- Vercel AI SDK with streaming
- OpenAI GPT-4o for reasoning
- RAG (Retrieval Augmented Generation) from vector DB
- Conversation memory in Postgres

**Example Interactions:**
```
User: "What's happening with lhype lately?"
Agent: "Based on recent tweets from @lhypefi:
        - They launched a new vault strategy 3 days ago
        - TVL increased 40% this week
        - Team announced partnership with [protocol]
        Would you like to deposit to their vault?"

User: "What are the best yield opportunities right now?"
Agent: "Analyzing partner protocols...
        1. lhype vault: 12% APY (stable)
        2. [Protocol X]: 18% APY (higher risk)
        Based on your risk profile, I'd recommend..."
```

### 3. Action Layer (Mewnberg Terminal)

**Wallet Integration:**
- WalletConnect / Privy / RainbowKit
- Support for popular wallets (MetaMask, Rabby, etc.)
- Multi-chain support (Hyperliquid L1, EVM)

**Actions:**
- Deposit to partner vaults
- View positions and balances
- Execute swaps/trades
- Manage LP positions

**Protocol Integrations:**
- Each partner protocol exposes actions via API/SDK
- Standard interface for deposit/withdraw/claim
- Real-time position tracking

### 4. Network Layer (Partner Ecosystem)

**Protocol Profiles:**
- Name, logo, description
- Team members (with Twitter links)
- Investors/backers
- Roadmap and milestones
- Documentation links
- Integration endpoints (vaults, APIs)

**Application Flow:**
- Public can use AI agent
- Protocols apply to join network
- On approval:
  - Twitter accounts added to ingestion
  - Protocol profile created
  - Integration endpoints configured
  - Team added to network directory

---

## Data Models

### Vector Store (Supabase pgvector)

```sql
-- Knowledge items (tweets, news, docs)
CREATE TABLE knowledge_items (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  
  -- Metadata
  source_type TEXT, -- 'tweet', 'news', 'docs', 'announcement'
  source_url TEXT,
  protocol_id UUID REFERENCES protocols(id),
  author TEXT,
  
  -- Classification
  category TEXT, -- 'announcement', 'metrics', 'roadmap', 'team'
  sentiment FLOAT,
  importance_score FLOAT,
  
  -- Timestamps
  published_at TIMESTAMP,
  ingested_at TIMESTAMP DEFAULT NOW()
);

-- Similarity search index
CREATE INDEX ON knowledge_items 
  USING ivfflat (embedding vector_cosine_ops);
```

### Protocol Profiles

```sql
CREATE TABLE protocols (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  
  -- Social
  twitter_handle TEXT,
  discord TEXT,
  
  -- Integration
  vault_address TEXT,
  api_endpoint TEXT,
  supported_actions JSONB, -- ['deposit', 'withdraw', 'claim']
  
  -- Network
  member_id UUID REFERENCES network_members(id),
  status TEXT DEFAULT 'active'
);
```

### Conversations

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT, -- 'user', 'assistant', 'system'
  content TEXT,
  
  -- Context
  sources JSONB, -- Referenced knowledge items
  actions_taken JSONB, -- Terminal actions executed
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Phases

### Phase 1: AI Chat Interface (MVP)
- [ ] Set up Supabase with pgvector
- [ ] Migrate tweets to vector store with embeddings
- [ ] Build chat UI component (floating or sidebar)
- [ ] Implement RAG pipeline
- [ ] Basic Q&A about partner protocols

### Phase 2: Enhanced Knowledge
- [ ] Add news ingestion (RSS, APIs)
- [ ] Add on-chain data feeds (DeFiLlama, etc.)
- [ ] Protocol profile pages with aggregated info
- [ ] Source citations in responses

### Phase 3: Mewnberg Terminal
- [ ] Wallet connection (WalletConnect/Privy)
- [ ] Display connected wallet balances
- [ ] Partner vault integrations (lhype first)
- [ ] Deposit/withdraw actions
- [ ] Transaction history

### Phase 4: Network Effects
- [ ] Protocol application → approval → integration pipeline
- [ ] Automated Twitter ingestion for new partners
- [ ] Team directory with connection requests
- [ ] Protocol analytics dashboard

### Phase 5: Advanced Agent
- [ ] Multi-step reasoning for complex queries
- [ ] Proactive alerts (important announcements)
- [ ] Personalized recommendations based on portfolio
- [ ] Natural language trading ("deposit 100 USDC to lhype")

---

## Decisions Made

1. **Wallet Infrastructure**: RainbowKit
2. **Partner Integrations**: Build infrastructure now, add specific vaults later
3. **Chat UI**: Floating button (Intercom-style), always accessible
4. **User Identity**: TBD - wallet auth via RainbowKit, existing email auth for network members

## Open Questions

1. **Data Sources**: What news sources should we ingest? (CT accounts, RSS feeds?)
2. **Mobile**: Should the terminal work on mobile from day 1?

---

## Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React, Tailwind |
| AI | OpenAI GPT-4o, Vercel AI SDK |
| Vector DB | Supabase pgvector |
| Database | Neon PostgreSQL (existing) |
| Wallet | Privy or WalletConnect |
| Charts | TradingView Lightweight Charts |
| Hosting | Vercel |

