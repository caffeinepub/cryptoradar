export interface Coin {
  symbol: string;
  baseAsset: string;
  price: number;
  change24h: number;
  volume: number;
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartType = "candlestick" | "line" | "bar" | "renko";

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";

export type IndicatorId =
  | "SMA"
  | "EMA"
  | "BB"
  | "RSI"
  | "MACD"
  | "STOCH"
  | "ATR"
  | "OBV"
  | "CCI"
  | "WILLIAMS_R"
  | "VWAP"
  | "ICHIMOKU"
  | "ADX"
  | "PSAR"
  | "PIVOT"
  | "SUPERTREND"
  | "MFI"
  | "AROON"
  | "DEMA"
  | "TEMA"
  | "HULL_MA"
  | "SMC";

export type SignalLabel =
  | "STRONG BUY"
  | "BUY"
  | "NEUTRAL"
  | "SELL"
  | "STRONG SELL";

export interface SignalResult {
  score: number;
  label: SignalLabel;
  confidence: number;
  strategies: string[];
  details: {
    name: string;
    signal: "buy" | "sell" | "neutral";
    value: string;
  }[];
  entryPrice?: number;
  takeProfitPrice?: number | null;
  stopLossPrice?: number | null;
  riskRewardRatio?: number | null;
}

export const OVERLAY_INDICATORS: IndicatorId[] = [
  "SMA",
  "EMA",
  "BB",
  "VWAP",
  "ICHIMOKU",
  "PSAR",
  "SUPERTREND",
  "HULL_MA",
  "DEMA",
  "TEMA",
];
export const PANEL_INDICATORS: IndicatorId[] = [
  "RSI",
  "MACD",
  "STOCH",
  "ATR",
  "OBV",
  "CCI",
  "WILLIAMS_R",
  "ADX",
  "MFI",
  "AROON",
  "PIVOT",
];

export const INDICATOR_GROUPS: {
  overlay: IndicatorId[];
  smc: IndicatorId[];
  momentum: IndicatorId[];
  trend: IndicatorId[];
  volume: IndicatorId[];
} = {
  overlay: [
    "SMA",
    "EMA",
    "BB",
    "VWAP",
    "ICHIMOKU",
    "PSAR",
    "SUPERTREND",
    "HULL_MA",
    "DEMA",
    "TEMA",
  ],
  smc: ["SMC"],
  momentum: ["RSI", "MACD", "STOCH", "CCI", "WILLIAMS_R", "MFI"],
  trend: ["ADX", "AROON", "PIVOT"],
  volume: ["ATR", "OBV"],
};

export const INDICATOR_LABELS: Record<IndicatorId, string> = {
  SMA: "SMA (20)",
  EMA: "EMA (20)",
  BB: "Bollinger Bands",
  RSI: "RSI (14)",
  MACD: "MACD",
  STOCH: "Stochastic",
  ATR: "ATR (14)",
  OBV: "OBV",
  CCI: "CCI (20)",
  WILLIAMS_R: "Williams %R",
  VWAP: "VWAP",
  ICHIMOKU: "Ichimoku Cloud",
  ADX: "ADX (14)",
  PSAR: "Parabolic SAR",
  PIVOT: "Pivot Points",
  SUPERTREND: "SuperTrend",
  MFI: "MFI (14)",
  AROON: "Aroon (25)",
  DEMA: "DEMA (20)",
  TEMA: "TEMA (20)",
  HULL_MA: "Hull MA (20)",
  SMC: "Smart Money Concept",
};

export const TIMEFRAME_OPTIONS: { label: string; value: Timeframe }[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
  { label: "1w", value: "1w" },
];
