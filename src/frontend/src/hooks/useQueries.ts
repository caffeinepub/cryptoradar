import { useQuery } from "@tanstack/react-query";
import type { Coin, KlineData, Timeframe } from "../types/crypto";
import { useActor } from "./useActor";

export function useTopCoins() {
  return useQuery<Coin[]>({
    queryKey: ["topCoins"],
    queryFn: async () => {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      if (!res.ok) throw new Error("Failed to fetch coins");
      const data = await res.json();
      return (data as any[])
        .filter(
          (t) =>
            t.symbol.endsWith("USDT") &&
            !t.symbol.includes("DOWNUSDT") &&
            !t.symbol.includes("UPUSDT"),
        )
        .sort(
          (a, b) =>
            Number.parseFloat(b.quoteVolume) - Number.parseFloat(a.quoteVolume),
        )
        .slice(0, 150)
        .map((t) => ({
          symbol: t.symbol,
          baseAsset: t.symbol.replace("USDT", ""),
          price: Number.parseFloat(t.lastPrice),
          change24h: Number.parseFloat(t.priceChangePercent),
          volume: Number.parseFloat(t.quoteVolume),
        }));
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

export function useKlines(symbol: string | null, interval: Timeframe) {
  return useQuery<KlineData[]>({
    queryKey: ["klines", symbol, interval],
    queryFn: async () => {
      if (!symbol) return [];
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`,
      );
      if (!res.ok) throw new Error("Failed to fetch klines");
      const data = await res.json();
      return (data as any[][]).map((k) => ({
        time: Math.floor(k[0] / 1000),
        open: Number.parseFloat(k[1]),
        high: Number.parseFloat(k[2]),
        low: Number.parseFloat(k[3]),
        close: Number.parseFloat(k[4]),
        volume: Number.parseFloat(k[5]),
      }));
    },
    enabled: !!symbol,
    staleTime: 60000,
    refetchInterval: 60000,
  });
}

export function useNews(baseAsset: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["news", baseAsset],
    queryFn: async () => {
      if (!actor || !baseAsset) return [];
      try {
        return await actor.getNews(baseAsset);
      } catch (_e) {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!baseAsset,
    staleTime: 300000,
    refetchInterval: 300000,
  });
}
