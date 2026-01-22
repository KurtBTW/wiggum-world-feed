'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface WatchlistToken {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank: number | null;
}

export function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistToken[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hypurr-watchlist');
    if (saved) {
      try {
        const ids = JSON.parse(saved) as string[];
        if (ids.length > 0) {
          fetchTokenPrices(ids);
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Refresh prices every minute
  useEffect(() => {
    if (watchlist.length === 0) return;
    
    const interval = setInterval(() => {
      const ids = watchlist.map(t => t.id);
      fetchTokenPrices(ids);
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [watchlist]);

  // Save watchlist IDs to localStorage
  const saveWatchlist = (tokens: WatchlistToken[]) => {
    const ids = tokens.map(t => t.id);
    localStorage.setItem('hypurr-watchlist', JSON.stringify(ids));
  };

  // Fetch token prices from CoinGecko
  const fetchTokenPrices = async (ids: string[]) => {
    if (ids.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await res.json();

      // Also fetch names/symbols for new tokens
      const detailsRes = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc`
      );
      const details = await detailsRes.json();

      const tokens: WatchlistToken[] = details.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: data[coin.id]?.usd || 0,
        change24h: data[coin.id]?.usd_24h_change || 0,
      }));

      setWatchlist(tokens);
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for tokens
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setSearchResults(data.coins?.slice(0, 8) || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Add token to watchlist
  const addToken = async (token: SearchResult) => {
    if (watchlist.find(t => t.id === token.id)) {
      setIsSearchOpen(false);
      setSearchQuery('');
      return;
    }

    const newIds = [...watchlist.map(t => t.id), token.id];
    await fetchTokenPrices(newIds);
    saveWatchlist([...watchlist, { id: token.id, symbol: token.symbol.toUpperCase(), name: token.name, price: 0, change24h: 0 }]);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove token from watchlist
  const removeToken = (id: string) => {
    const updated = watchlist.filter(t => t.id !== id);
    setWatchlist(updated);
    saveWatchlist(updated);
  };

  return (
    <div className="mt-6 pt-4 border-t border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">Watchlist</h3>
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="p-1 rounded hover:bg-white/[0.05] text-zinc-400 hover:text-[#50e2c3] transition-colors"
        >
          {isSearchOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Search Input */}
      {isSearchOpen && (
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
              autoFocus
            />
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 || isSearching) && (
            <div className="mt-2 bg-[#151515] border border-white/[0.08] rounded-lg overflow-hidden">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                </div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => addToken(result)}
                    disabled={watchlist.some(t => t.id === result.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.03] transition-colors disabled:opacity-50"
                  >
                    <div>
                      <span className="text-sm font-medium text-zinc-300">{result.symbol.toUpperCase()}</span>
                      <span className="text-xs text-zinc-500 ml-2">{result.name}</span>
                    </div>
                    {result.market_cap_rank && (
                      <span className="text-xs text-zinc-600">#{result.market_cap_rank}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
        </div>
      ) : watchlist.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-2">
          Click + to add tokens
        </p>
      ) : (
        <div className="space-y-1">
          {watchlist.map((token) => (
            <div
              key={token.id}
              className="group flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-zinc-300">{token.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm text-white font-mono">
                    ${token.price > 1000 
                      ? token.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) 
                      : token.price < 0.01 
                        ? token.price.toFixed(6)
                        : token.price.toFixed(2)}
                  </div>
                  <div className={`text-xs flex items-center justify-end gap-0.5 ${token.change24h >= 0 ? 'text-[#50e2c3]' : 'text-red-500'}`}>
                    {token.change24h >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </div>
                </div>
                <button
                  onClick={() => removeToken(token.id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.05] text-zinc-500 hover:text-red-500 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
