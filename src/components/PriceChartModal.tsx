'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { 
  createChart, 
  ColorType, 
  ISeriesApi,  
  CandlestickData, 
  Time,
  CandlestickSeries
} from 'lightweight-charts';

interface PriceChartModalProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  onClose: () => void;
}

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;

export function PriceChartModal({ symbol, name, currentPrice, change24h, onClose }: PriceChartModalProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceAtCursor, setPriceAtCursor] = useState<number | null>(null);
  const [timeAtCursor, setTimeAtCursor] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#71717a',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(80, 226, 195, 0.3)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: 'rgba(80, 226, 195, 0.3)',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: false,
      handleScroll: false,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    seriesRef.current = candleSeries;

    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData.size > 0) {
        const data = param.seriesData.get(candleSeries) as CandlestickData<Time>;
        if (data) {
          setPriceAtCursor(data.close);
          const date = new Date((param.time as number) * 1000);
          setTimeAtCursor(date.toLocaleString());
        }
      } else {
        setPriceAtCursor(null);
        setTimeAtCursor(null);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!seriesRef.current) return;
      
      setLoading(true);
      setError('');
      
      try {
        const res = await fetch(`/api/prices/history?symbol=${symbol}&timeframe=${timeframe}`);
        const data = await res.json();
        
        if (!data.data || data.data.length === 0) {
          setError('No data available');
          setLoading(false);
          return;
        }

        const candlestickData: CandlestickData<Time>[] = data.data.map((point: { time: number; open: number; high: number; low: number; close: number }) => ({
          time: point.time as Time,
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
        }));

        seriesRef.current.setData(candlestickData);

      } catch (err) {
        console.error('Failed to fetch chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [symbol, timeframe]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };

  const isPositive = change24h >= 0;
  const displayPrice = priceAtCursor ?? currentPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-[#0f0f0f] border border-white/[0.1] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{symbol}</h2>
                <span className="text-zinc-500 text-sm">{name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-white">
                  ${formatPrice(displayPrice)}
                </span>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(change24h).toFixed(2)}%
                </span>
              </div>
              {timeAtCursor && (
                <span className="text-xs text-zinc-500">{timeAtCursor}</span>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex gap-2 px-4 py-3 border-b border-white/[0.06]">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-[#50e2c3] text-black'
                  : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="relative h-[400px] p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f0f]/80 z-10">
              <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-zinc-500">{error}</p>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
