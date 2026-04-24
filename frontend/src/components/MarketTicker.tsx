'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { TickerData } from '@/types';

interface CryptoPrices {
  btc: { price: number; change: number };
  eth: { price: number; change: number };
}

interface MarketTickerProps {
  ticker: TickerData | null;
}

interface TickerItem {
  key: string;
  label: string;
  value?: string;
  valueColor?: string;
  suffix?: string;
  suffixColor?: string;
}

export default function MarketTicker({ ticker }: MarketTickerProps) {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const autoScrollPaused = useRef(false);

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/crypto/prices`);
        const data = await res.json();
        if (!data.success) return;

        setCryptoPrices({
          btc: { price: data.btc.price, change: data.btc.change },
          eth: { price: data.eth.price, change: data.eth.change },
        });
      } catch (err) {
        console.error('Crypto price fetch failed:', err);
      }
    };

    fetchCrypto();
    const interval = setInterval(fetchCrypto, 60_000);
    return () => clearInterval(interval);
  }, []);

  const items = useMemo<TickerItem[]>(() => {
    const list: TickerItem[] = [];

    if (ticker) {
      list.push({
        key: 'deals',
        label: '🔥 New Discounts Added:',
        value: `${ticker.activeDeals}`,
        valueColor: 'text-orange-300',
      });
      list.push({
        key: 'avg',
        label: '🍃 SavrLeaf Avg Savings Today:',
        value: `${ticker.avgDiscount.toFixed(1)}%`,
        valueColor: 'text-green-400',
      });
      if (ticker.maxDiscount > 0) {
        list.push({
          key: 'max',
          label: '📉 Biggest Drop Today:',
          value: `${ticker.maxDiscount}% off`,
          valueColor: 'text-yellow-400',
        });
      }

      ticker.topDeals?.slice(0, 3).forEach((deal, i) => {
        const where = deal.dispensaryName ? ` at ${deal.dispensaryName}` : '';
        list.push({
          key: `top-${i}`,
          label: `🏷️ ${deal.title}${where}:`,
          value: `${deal.discountTier}% off — $${deal.salePrice.toFixed(2)}`,
          valueColor: 'text-orange-300',
        });
      });
    }

    if (cryptoPrices) {
      const btcSign = cryptoPrices.btc.change >= 0 ? '+' : '-';
      const ethSign = cryptoPrices.eth.change >= 0 ? '+' : '-';
      const btcColor = cryptoPrices.btc.change >= 0 ? 'text-green-400' : 'text-red-400';
      const ethColor = cryptoPrices.eth.change >= 0 ? 'text-green-400' : 'text-red-400';

      list.push({
        key: 'btc',
        label: '₿ BTC:',
        value: `$${Math.round(cryptoPrices.btc.price).toLocaleString()}`,
        valueColor: 'text-white',
        suffix: `${btcSign}${Math.abs(cryptoPrices.btc.change).toFixed(1)}%`,
        suffixColor: btcColor,
      });
      list.push({
        key: 'eth',
        label: 'Ξ ETH:',
        value: `$${Math.round(cryptoPrices.eth.price).toLocaleString()}`,
        valueColor: 'text-white',
        suffix: `${ethSign}${Math.abs(cryptoPrices.eth.change).toFixed(1)}%`,
        suffixColor: ethColor,
      });
    }

    return list;
  }, [ticker, cryptoPrices]);

  // Mobile: auto-scroll swipe cards every 5s, pauses while user is touching
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback(() => {
    autoScrollPaused.current = true;
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    resumeTimeout.current = setTimeout(() => {
      autoScrollPaused.current = false;
    }, 3000);
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      if (autoScrollPaused.current) return;
      const container = mobileScrollRef.current;
      if (!container) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      if (container.scrollLeft >= maxScroll - 4) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const card = container.firstElementChild as HTMLElement | null;
        const cardWidth = card?.offsetWidth || 150;
        container.scrollBy({ left: cardWidth + 12, behavior: 'smooth' });
      }
    }, 5000);

    return () => {
      clearInterval(timer);
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    };
  }, [items.length]);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      // Small delay so the browser paints the initial state first
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [items.length > 0]);

  if (items.length === 0) return null;

  // Build the marquee string for desktop (items repeated for seamless loop)
  const marqueeItems = [...items, ...items];

  return (
    <div
      className="bg-green-950 border-b border-green-800 text-white w-full overflow-hidden transition-all duration-500 ease-out"
      style={{
        height: visible ? '36px' : '0px',
        opacity: visible ? 1 : 0,
      }}
    >

      {/* Desktop: continuous marquee scroll */}
      <div className="hidden md:flex items-center h-full">
        <div className="flex animate-ticker whitespace-nowrap">
          {marqueeItems.map((item, i) => (
            <span key={`${item.key}-${i}`} className="inline-flex items-center gap-1.5 mx-8 text-xs font-medium">
              <span className="text-white font-semibold">{item.label}</span>
              {item.value && (
                <span className={`font-bold ${item.valueColor || 'text-white'}`}>{item.value}</span>
              )}
              {item.suffix && (
                <span className={`font-bold ${item.suffixColor || 'text-white'}`}>{item.suffix}</span>
              )}
              <span className="text-green-800 mx-2">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Mobile: horizontal swipe cards */}
      <div className="flex md:hidden items-center h-full">
        <div
          ref={mobileScrollRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 h-full items-center w-full"
        >
          {items.map((item) => (
            <div
              key={item.key}
              className="snap-start shrink-0 flex items-center gap-1.5 bg-green-800/40 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium border border-green-700/30"
            >
              <span className="text-white font-semibold whitespace-nowrap">{item.label}</span>
              {item.value && (
                <span className={`font-bold whitespace-nowrap ${item.valueColor || 'text-white'}`}>
                  {item.value}
                </span>
              )}
              {item.suffix && (
                <span className={`font-bold whitespace-nowrap ${item.suffixColor || 'text-white'}`}>
                  {item.suffix}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
