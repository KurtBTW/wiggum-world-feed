async function testYahooFinance() {
  console.log('Testing Yahoo Finance commodity prices...\n');
  
  const symbols = [
    { symbol: 'GC=F', name: 'Gold' },
    { symbol: 'SI=F', name: 'Silver' },
    { symbol: 'HG=F', name: 'Copper' },
    { symbol: 'CL=F', name: 'Crude Oil' },
    { symbol: 'URA', name: 'Uranium ETF' },
  ];
  
  for (const { symbol, name } of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`✗ ${name} (${symbol}): HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (!result) {
        console.log(`✗ ${name} (${symbol}): No data`);
        continue;
      }
      
      const meta = result.meta;
      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose || meta.chartPreviousClose;
      const change = prevClose ? ((price - prevClose) / prevClose * 100) : 0;
      
      console.log(`✓ ${name} (${symbol}): $${price.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`);
    } catch (error) {
      console.log(`✗ ${name} (${symbol}): ${error.message}`);
    }
  }
  
  console.log('\nTesting CoinGecko crypto prices...\n');
  
  try {
    const ids = 'bitcoin,ethereum,solana,hyperliquid';
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currency=usd&include_24hr_change=true`
    );
    
    if (!res.ok) {
      console.log('✗ CoinGecko: HTTP', res.status);
      return;
    }
    
    const data = await res.json();
    
    for (const [id, values] of Object.entries(data)) {
      const v = values;
      console.log(`✓ ${id}: $${v.usd.toLocaleString()} (${v.usd_24h_change >= 0 ? '+' : ''}${v.usd_24h_change.toFixed(2)}%)`);
    }
  } catch (error) {
    console.log('✗ CoinGecko:', error.message);
  }
}

testYahooFinance();
