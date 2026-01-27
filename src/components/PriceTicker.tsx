'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface TickerPriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  type: 'crypto' | 'commodity';
}

interface PriceTickerProps {
  onAssetSelect?: (asset: TickerPriceData) => void;
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
}

function PriceItem({ item, onClick }: { item: TickerPriceData; onClick: () => void }) {
  const isPositive = item.change24h > 0;
  const isNegative = item.change24h < 0;
  
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1 whitespace-nowrap hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
    >
      <span className="text-zinc-500 text-xs font-medium">{item.symbol}</span>
      <span className="text-white text-xs font-semibold">${formatPrice(item.price)}</span>
      <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
        isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-zinc-500'
      }`}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : isNegative ? (
          <TrendingDown className="w-3 h-3" />
        ) : (
          <Minus className="w-3 h-3" />
        )}
        {Math.abs(item.change24h).toFixed(2)}%
      </span>
    </button>
  );
}

export function PriceTicker({ onAssetSelect }: PriceTickerProps) {
  const [prices, setPrices] = useState<TickerPriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        setPrices(data.prices || []);
      } catch (err) {
        console.error('Failed to fetch prices:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || prices.length === 0) {
    return (
      <div className="h-8 bg-black/50 border-b border-white/[0.06] flex items-center justify-center">
        <span className="text-zinc-600 text-xs">Loading prices...</span>
      </div>
    );
  }

  const cryptoPrices = prices.filter(p => p.type === 'crypto');
  const commodityPrices = prices.filter(p => p.type === 'commodity');

  const handleClick = (item: TickerPriceData) => {
    if (onAssetSelect) {
      onAssetSelect(item);
    }
  };

  return (
    <div className="h-8 bg-black/50 border-b border-white/[0.06] overflow-hidden">
      <div className="h-full flex items-center animate-ticker">
        <div className="flex items-center">
          {cryptoPrices.map((item) => (
            <PriceItem 
              key={item.symbol} 
              item={item} 
              onClick={() => handleClick(item)}
            />
          ))}
          
          <div className="w-px h-4 bg-white/[0.1] mx-2" />
          
          {commodityPrices.map((item) => (
            <PriceItem 
              key={item.symbol} 
              item={item} 
              onClick={() => handleClick(item)}
            />
          ))}
        </div>
        
        <div className="flex items-center ml-8">
          {cryptoPrices.map((item) => (
            <PriceItem 
              key={`${item.symbol}-2`} 
              item={item} 
              onClick={() => handleClick(item)}
            />
          ))}
          
          <div className="w-px h-4 bg-white/[0.1] mx-2" />
          
          {commodityPrices.map((item) => (
            <PriceItem 
              key={`${item.symbol}-2`} 
              item={item} 
              onClick={() => handleClick(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
