import Parser from 'rss-parser';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  summary?: string;
  imageUrl?: string;
}

const SYMBOL_TO_CRYPTOPANIC: Record<string, string> = {
  BTC: 'BTC',
  ETH: 'ETH',
  SOL: 'SOL',
  HYPE: 'HYPE',
  XRP: 'XRP',
  ADA: 'ADA',
  AVAX: 'AVAX',
  LINK: 'LINK',
  DOT: 'DOT',
  SUI: 'SUI',
};

const SYMBOL_KEYWORDS: Record<string, string[]> = {
  BTC: ['bitcoin', 'btc'],
  ETH: ['ethereum', 'eth'],
  SOL: ['solana', 'sol'],
  HYPE: ['hyperliquid', 'hype'],
  XRP: ['ripple', 'xrp'],
  ADA: ['cardano', 'ada'],
  AVAX: ['avalanche', 'avax'],
  LINK: ['chainlink', 'link'],
  DOT: ['polkadot', 'dot'],
  SUI: ['sui'],
  XAU: ['gold', 'xau', 'precious metal'],
  XAG: ['silver', 'xag', 'precious metal'],
  OIL: ['crude oil', 'wti', 'brent', 'oil price'],
  khype: ['kinetiq', 'khype', 'liquid staking'],
  lhype: ['looping', 'lhype', 'looped hype'],
  liminal: ['liminal', 'xhype', 'xbtc', 'delta neutral'],
  hypurrfi: ['hypurrfi', 'hypurr', 'trading vault'],
};

const RSS_FEEDS = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  { name: 'The Block', url: 'https://www.theblock.co/rss.xml' },
];

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
  },
});

async function fetchCryptoPanicNews(symbol: string): Promise<NewsItem[]> {
  const cryptoPanicSymbol = SYMBOL_TO_CRYPTOPANIC[symbol.toUpperCase()];
  if (!cryptoPanicSymbol) return [];

  try {
    const url = `https://cryptopanic.com/api/free/v1/posts/?currencies=${cryptoPanicSymbol}&filter=hot&public=true`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error('CryptoPanic API error:', res.status);
      return [];
    }

    const data = await res.json();
    
    if (!data.results) return [];

    return data.results.slice(0, 10).map((item: {
      id: number;
      title: string;
      url: string;
      source: { title: string };
      published_at: string;
      metadata?: { image?: string; description?: string };
    }) => ({
      id: `cp-${item.id}`,
      title: item.title,
      url: item.url,
      source: item.source?.title || 'CryptoPanic',
      publishedAt: new Date(item.published_at),
      summary: item.metadata?.description,
      imageUrl: item.metadata?.image,
    }));
  } catch (error) {
    console.error('Failed to fetch CryptoPanic news:', error);
    return [];
  }
}

async function fetchRSSNews(symbol: string): Promise<NewsItem[]> {
  const keywords = SYMBOL_KEYWORDS[symbol.toUpperCase()] || SYMBOL_KEYWORDS[symbol.toLowerCase()];
  if (!keywords) return [];

  const allItems: NewsItem[] = [];

  const feedPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      
      const relevantItems = (parsed.items || [])
        .filter((item) => {
          const text = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
          return keywords.some(keyword => text.includes(keyword.toLowerCase()));
        })
        .slice(0, 5)
        .map((item) => ({
          id: `rss-${feed.name}-${item.guid || item.link || item.title}`,
          title: item.title || 'Untitled',
          url: item.link || '',
          source: feed.name,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          summary: item.contentSnippet?.slice(0, 200),
          imageUrl: item.enclosure?.url,
        }));

      return relevantItems;
    } catch (error) {
      console.error(`Failed to fetch RSS from ${feed.name}:`, error);
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  results.forEach(items => allItems.push(...items));

  return allItems;
}

export async function fetchNewsForSymbol(symbol: string, limit = 15): Promise<NewsItem[]> {
  const [cryptoPanicNews, rssNews] = await Promise.all([
    fetchCryptoPanicNews(symbol),
    fetchRSSNews(symbol),
  ]);

  const allNews = [...cryptoPanicNews, ...rssNews];

  const uniqueNews = allNews.reduce((acc, item) => {
    const titleKey = item.title.toLowerCase().slice(0, 50);
    if (!acc.has(titleKey)) {
      acc.set(titleKey, item);
    }
    return acc;
  }, new Map<string, NewsItem>());

  const sortedNews = Array.from(uniqueNews.values())
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, limit);

  return sortedNews;
}
