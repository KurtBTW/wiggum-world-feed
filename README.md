# Wiggum World Feed

A calm, optimistic, non-sensational "world changes" feed presented as 5 tiles that refresh hourly.

## Features

- **5 Category Tiles**: Technology, Crypto, AI, Business, Market Movements
- **Calm Summaries**: All headlines rewritten to remove sensationalism
- **20-Pass Wiggum Loop**: Iterative refinement engine for optimal content selection
- **"No New? Keep Tile"**: Tiles persist when no qualifying updates exist
- **GPT-5.2 Integration**: "Explain" button and chat terminal for deeper insights
- **Hourly Refresh**: Automated ingestion and scoring pipeline

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- SQLite (included) or PostgreSQL
- OpenAI API key (for GPT-5.2 features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/wiggum-world-feed.git
cd wiggum-world-feed

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Initialize database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

### Environment Variables

```env
# Database (SQLite default, PostgreSQL ready)
DATABASE_URL="file:./prisma/dev.db"

# OpenAI API Key (required for chat features)
OPENAI_API_KEY="sk-..."

# Optional: Market data provider
ALPHA_VANTAGE_API_KEY=""

# Optional: Vercel Cron secret
CRON_SECRET=""
```

## Architecture

### Categories (Tiles)

1. **Technology**: Optimistic outlooks, releases, prototypes, R&D, discoveries
2. **Crypto**: New developments, tech, chains, credible token developments  
3. **AI**: Optimistic outlooks, releases, prototypes, R&D, discoveries
4. **Business**: MAJOR companies only (S&P 500 + top private sector)
5. **Market Movements**: Days where |daily move| >= 5% for S&P 500, Gold, BTC

### Ingestion Pipeline

```
RSS Feeds → Deduplication → Scoring → Wiggum Loop → Tile Snapshot
```

- **Sources**: Configured in `config/sources.json`
- **24-hour window**: Only recent items considered
- **Deduplication**: By canonical URL and title similarity (85% threshold)

### Scoring System

Each item receives scores for:
- **Optimism**: Positive language, forward-looking content
- **Sensationalism**: Penalized for clickbait, doom, panic
- **Forward Progress**: Release, launch, discovery indicators
- **Freshness**: Exponential decay based on age
- **Credibility**: Primary source > reputable outlet > social
- **Topic Fit**: Category-specific keyword matching

### Wiggum Loop

A 20-pass iterative refinement engine:

1. Select top N items with current weights
2. Generate calm summaries
3. Evaluate against acceptance criteria
4. If not accepted, adjust parameters and retry
5. Hard constraints NEVER relaxed (sensationalism cap)

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tiles` | GET | Get current tile snapshots |
| `/api/tiles` | POST | Trigger manual refresh |
| `/api/item/:id` | GET | Get item details |
| `/api/chat` | POST | Send chat message |
| `/api/chat` | GET | Get chat history |
| `/api/cron` | GET | Hourly update trigger |

## Configuration

### Adding Sources

Edit `config/sources.json`:

```json
{
  "technology": {
    "rss": [
      {
        "url": "https://your-feed.com/rss",
        "name": "Your Feed",
        "credibility": "high"
      }
    ],
    "keywords": ["release", "launch", "innovation"]
  }
}
```

### Adjusting Thresholds

Edit `config/thresholds.json`:

```json
{
  "categories": {
    "technology": {
      "targetItemCount": 5,
      "maxSensationalism": 0.25,
      "minOptimism": 0.5,
      "minForwardProgressPct": 0.6
    }
  }
}
```

### Company Lists

- `config/sp500.json`: S&P 500 companies
- `config/private_major.json`: Major private companies

## Scheduler

### Local Development

```bash
# Run once
npx ts-node scripts/scheduler.ts

# Or use the API
curl -X POST http://localhost:3000/api/tiles
```

### Production (Vercel Cron)

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 * * * *"
  }]
}
```

### Self-Hosted (Cron)

```bash
# Run every hour
0 * * * * cd /path/to/app && npx ts-node scripts/scheduler.ts
```

## Market Data Provider

The market data service is pluggable. Default uses Yahoo Finance API.

To use Alpha Vantage:
1. Set `ALPHA_VANTAGE_API_KEY` in `.env`
2. Update `config/sources.json` market_movements section

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- scoring.test.ts
```

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM, SQLite (dev) / PostgreSQL (prod)
- **AI**: OpenAI GPT-5.2
- **Data**: RSS Parser, Yahoo Finance API

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Docker

```bash
docker build -t wiggum-world-feed .
docker run -p 3000:3000 wiggum-world-feed
```

### Manual

```bash
npm run build
npm start
```

## Project Structure

```
wiggum-world-feed/
├── config/                 # Configuration files
│   ├── sources.json       # RSS feed sources
│   ├── thresholds.json    # Scoring thresholds
│   ├── sp500.json         # S&P 500 companies
│   └── private_major.json # Private companies
├── prisma/
│   └── schema.prisma      # Database schema
├── scripts/
│   └── scheduler.ts       # Hourly job runner
├── src/
│   ├── app/               # Next.js app router
│   │   ├── api/           # API routes
│   │   └── page.tsx       # Main page
│   ├── components/        # React components
│   ├── services/          # Business logic
│   │   ├── ingestion.ts   # RSS ingestion
│   │   ├── scoring.ts     # Item scoring
│   │   ├── wiggum-loop.ts # Iteration engine
│   │   ├── calm-summary.ts# Summary generation
│   │   ├── tiles.ts       # Tile management
│   │   ├── chat.ts        # GPT integration
│   │   └── market-data.ts # Market tracking
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
└── tests/                 # Test files
```

## License

MIT
