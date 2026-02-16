"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface TimeframeData {
  percent: number;
  txns: number;
  buys: number;
  sells: number;
  volume: string;
  buyVol: string;
  sellVol: string;
  makers: number;
  buyers: number;
  sellers: number;
}

export interface TokenData {
  name?: string;
  image?: string;
  marketCap?: string;
  marketCapRaw?: number;
  change1h?: number;
  price?: string;
  priceUsd?: number;
  priceMon?: number;
  fdv?: string;
  fdvRaw?: number;
  volumeUsd?: string;
  volumeMon?: number;
  holderCount?: number;
  athPriceUsd?: number;
  marketType?: string;
  timeframes?: Record<string, TimeframeData>;
}

const SUBSCRIPT_DIGITS = "₀₁₂₃₄₅₆₇₈₉";

function toSubscript(n: number): string {
  return String(n)
    .split("")
    .map((d) => SUBSCRIPT_DIGITS[parseInt(d)] || d)
    .join("");
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  const str = n.toFixed(10);
  const match = str.match(/^0\.(0+)/);
  if (match) {
    const zeros = match[1].length;
    if (zeros > 1) {
      return `$0.0${toSubscript(zeros)}${str.slice(2 + zeros, 2 + zeros + 4)}`;
    }
    return `$0.00${str.slice(3, 7)}`;
  }
  return `$${n.toFixed(6)}`;
}

function formatSmallPrice(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.001) return `$${n.toFixed(4)}`;
  const str = n.toFixed(18);
  const match = str.match(/^0\.(0+)(\d{2,4})/);
  if (match) {
    const zeros = match[1].length;
    const sig = match[2];
    if (zeros > 1) {
      return `$0.0${toSubscript(zeros)}${sig}`;
    }
    return `$0.00${sig}`;
  }
  return `$${n.toPrecision(4)}`;
}

const TokenDataContext = createContext<{
  tokenData: TokenData | null;
  isLoading: boolean;
  refetch: () => void;
}>({ tokenData: null, isLoading: true, refetch: () => {} });

export function TokenDataProvider({ children }: { children: ReactNode }) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/token");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      if (!data.found) {
        setTokenData({ marketCap: "—", price: "—" });
        setIsLoading(false);
        return;
      }

      const fdvRaw = data.fdv || 0;
      const mcapRaw = fdvRaw;
      const tf1h = data.timeframes?.["1H"];

      setTokenData({
        name: data.name || undefined,
        image: data.image || undefined,
        marketCap: formatUsd(mcapRaw),
        marketCapRaw: mcapRaw,
        change1h: tf1h?.percent ?? 0,
        price: formatSmallPrice(data.priceUsd || 0),
        priceUsd: data.priceUsd,
        priceMon: data.priceMon,
        fdv: formatUsd(fdvRaw),
        fdvRaw,
        volumeUsd: formatUsd(data.volumeUsd || 0),
        volumeMon: data.volumeMon,
        holderCount: data.holderCount,
        athPriceUsd: data.athPriceUsd,
        marketType: data.marketType,
        timeframes: data.timeframes,
      });
    } catch {
      setTokenData({ marketCap: "—", price: "—" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <TokenDataContext.Provider
      value={{ tokenData, isLoading, refetch: fetchData }}
    >
      {children}
    </TokenDataContext.Provider>
  );
}

export function useTokenData() {
  return useContext(TokenDataContext);
}
