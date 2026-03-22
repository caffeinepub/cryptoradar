import {
  ADX,
  CCI,
  EMA,
  MACD,
  MFI,
  OBV,
  RSI,
  Stochastic,
  WilliamsR,
} from "technicalindicators";
import type { KlineData, SignalLabel, SignalResult } from "../types/crypto";

export function fmtPrice(p: number): string {
  if (p >= 1000)
    return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(3)}`;
  if (p >= 0.01) return `$${p.toFixed(5)}`;
  return `$${p.toFixed(7)}`;
}

function calcPSAR(
  highs: number[],
  lows: number[],
  af0 = 0.02,
  afMax = 0.2,
): number[] {
  const result: number[] = [];
  let bull = true;
  let af = af0;
  let ep = lows[0];
  let psar = highs[0];
  for (let i = 2; i < highs.length; i++) {
    if (bull) {
      psar = Math.min(psar, lows[i - 1], lows[i - 2] ?? lows[i - 1]);
      if (highs[i] > ep) {
        ep = highs[i];
        af = Math.min(af + af0, afMax);
      }
      if (lows[i] < psar) {
        bull = false;
        psar = ep;
        ep = lows[i];
        af = af0;
      } else {
        psar = psar + af * (ep - psar);
      }
    } else {
      psar = Math.max(psar, highs[i - 1], highs[i - 2] ?? highs[i - 1]);
      if (lows[i] < ep) {
        ep = lows[i];
        af = Math.min(af + af0, afMax);
      }
      if (highs[i] > psar) {
        bull = true;
        psar = ep;
        ep = highs[i];
        af = af0;
      } else {
        psar = psar - af * (psar - ep);
      }
    }
    result.push(psar);
  }
  return result;
}

export function detectSmcBias(
  klineData: KlineData[],
): "bullish" | "bearish" | "neutral" {
  if (klineData.length < 20) return "neutral";
  const window = 5;
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  for (let i = window; i < klineData.length - window; i++) {
    const h = klineData[i].high;
    const l = klineData[i].low;
    let isHigh = true;
    let isLow = true;
    for (let j = i - window; j <= i + window; j++) {
      if (j === i) continue;
      if (klineData[j].high >= h) isHigh = false;
      if (klineData[j].low <= l) isLow = false;
    }
    if (isHigh) swingHighs.push(h);
    if (isLow) swingLows.push(l);
  }
  const lastClose = klineData[klineData.length - 1].close;
  if (swingHighs.length > 0 && lastClose > swingHighs[swingHighs.length - 1])
    return "bullish";
  if (swingLows.length > 0 && lastClose < swingLows[swingLows.length - 1])
    return "bearish";
  return "neutral";
}

export function computeSignal(klineData: KlineData[]): SignalResult {
  if (klineData.length < 30) {
    return {
      score: 50,
      label: "NEUTRAL",
      confidence: 0,
      strategies: [],
      details: [],
      entryPrice:
        klineData.length > 0
          ? klineData[klineData.length - 1].close
          : undefined,
      takeProfitPrice: null,
      stopLossPrice: null,
      riskRewardRatio: null,
    };
  }

  const closes = klineData.map((k) => k.close);
  const highs = klineData.map((k) => k.high);
  const lows = klineData.map((k) => k.low);
  const volumes = klineData.map((k) => k.volume);

  const details: SignalResult["details"] = [];
  let _bullCount = 0;
  let _bearCount = 0;
  let totalWeight = 0;
  let weightedScore = 0;

  function addSignal(
    name: string,
    sig: "buy" | "sell" | "neutral",
    value: string,
    weight: number,
  ) {
    details.push({ name, signal: sig, value });
    totalWeight += weight;
    if (sig === "buy") {
      weightedScore += weight;
      _bullCount++;
    } else if (sig === "sell") {
      _bearCount++;
    } else {
      weightedScore += weight * 0.5;
    }
  }

  // RSI
  try {
    const rsiValues = RSI.calculate({ period: 14, values: closes });
    if (rsiValues.length > 0) {
      const rsi = rsiValues[rsiValues.length - 1];
      const sig = rsi < 35 ? "buy" : rsi > 65 ? "sell" : "neutral";
      addSignal("RSI", sig, rsi.toFixed(1), 15);
    }
  } catch (_e) {
    /* ignore */
  }

  // MACD
  try {
    const macdValues = MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: closes,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    if (macdValues.length > 0) {
      const last = macdValues[macdValues.length - 1];
      const prev = macdValues[macdValues.length - 2];
      if (
        last.MACD !== undefined &&
        last.signal !== undefined &&
        prev?.MACD !== undefined &&
        prev?.signal !== undefined
      ) {
        const bullishCross =
          last.MACD > last.signal && prev.MACD <= prev.signal;
        const bearishCross =
          last.MACD < last.signal && prev.MACD >= prev.signal;
        const sig = bullishCross
          ? "buy"
          : bearishCross
            ? "sell"
            : last.MACD > last.signal
              ? "buy"
              : "sell";
        addSignal(
          "MACD",
          sig,
          `${last.MACD.toFixed(4)} / ${last.signal.toFixed(4)}`,
          15,
        );
      }
    }
  } catch (_e) {
    /* ignore */
  }

  // EMA crossover
  try {
    const ema20 = EMA.calculate({ period: 20, values: closes });
    const ema50 = EMA.calculate({ period: 50, values: closes });
    if (ema20.length > 0 && ema50.length > 0) {
      const price = closes[closes.length - 1];
      const e20 = ema20[ema20.length - 1];
      const e50 = ema50[ema50.length - 1];
      const sig =
        price > e20 && e20 > e50
          ? "buy"
          : price < e20 && e20 < e50
            ? "sell"
            : "neutral";
      addSignal("EMA Cross", sig, `${e20.toFixed(2)} / ${e50.toFixed(2)}`, 12);
    }
  } catch (_e) {
    /* ignore */
  }

  // Stochastic
  try {
    const stochValues = Stochastic.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
      signalPeriod: 3,
    });
    if (stochValues.length > 0) {
      const stoch = stochValues[stochValues.length - 1];
      const sig = stoch.k < 25 ? "buy" : stoch.k > 75 ? "sell" : "neutral";
      addSignal("Stochastic", sig, `K:${stoch.k.toFixed(1)}`, 10);
    }
  } catch (_e) {
    /* ignore */
  }

  // CCI
  try {
    const cciValues = CCI.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 20,
    });
    if (cciValues.length > 0) {
      const cci = cciValues[cciValues.length - 1];
      const sig = cci < -100 ? "buy" : cci > 100 ? "sell" : "neutral";
      addSignal("CCI", sig, cci.toFixed(1), 8);
    }
  } catch (_e) {
    /* ignore */
  }

  // ADX (trend strength gating)
  let adxStrong = false;
  try {
    const adxValues = ADX.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    });
    if (adxValues.length > 0) {
      const last = adxValues[adxValues.length - 1];
      adxStrong = last.adx > 25;
      const sig = last.pdi > last.mdi ? "buy" : "sell";
      addSignal(
        "ADX",
        sig,
        `${last.adx.toFixed(1)} (${adxStrong ? "Strong" : "Weak"})`,
        10,
      );
    }
  } catch (_e) {
    /* ignore */
  }

  // PSAR direction
  try {
    const psarValues = calcPSAR(highs, lows);
    if (psarValues.length > 0) {
      const price = closes[closes.length - 1];
      const psar = psarValues[psarValues.length - 1];
      const sig = price > psar ? "buy" : "sell";
      addSignal("PSAR", sig, psar.toFixed(4), 8);
    }
  } catch (_e) {
    /* ignore */
  }

  // MFI
  try {
    const mfiValues = MFI.calculate({
      high: highs,
      low: lows,
      close: closes,
      volume: volumes,
      period: 14,
    });
    if (mfiValues.length > 0) {
      const mfi = mfiValues[mfiValues.length - 1];
      const sig = mfi < 20 ? "buy" : mfi > 80 ? "sell" : "neutral";
      addSignal("MFI", sig, mfi.toFixed(1), 8);
    }
  } catch (_e) {
    /* ignore */
  }

  // OBV trend slope
  try {
    const obvValues = OBV.calculate({ close: closes, volume: volumes });
    if (obvValues.length > 5) {
      const recent = obvValues.slice(-5);
      const slope = recent[4] - recent[0];
      const sig = slope > 0 ? "buy" : slope < 0 ? "sell" : "neutral";
      addSignal("OBV", sig, slope > 0 ? "Rising" : "Falling", 8);
    }
  } catch (_e) {
    /* ignore */
  }

  // Williams %R
  try {
    const wrValues = WilliamsR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    });
    if (wrValues.length > 0) {
      const wr = wrValues[wrValues.length - 1];
      const sig = wr < -80 ? "buy" : wr > -20 ? "sell" : "neutral";
      addSignal("Williams %R", sig, wr.toFixed(1), 6);
    }
  } catch (_e) {
    /* ignore */
  }

  // SMC Bias
  const smcBias = detectSmcBias(klineData);
  const smcSig: "buy" | "sell" | "neutral" =
    smcBias === "bullish" ? "buy" : smcBias === "bearish" ? "sell" : "neutral";
  addSignal(
    "SMC Bias",
    smcSig,
    smcBias.charAt(0).toUpperCase() + smcBias.slice(1),
    10,
  );

  // Calculate final score
  const score =
    totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 50;

  // Confidence: how many non-neutral agree with final direction
  const isBull = score >= 50;
  const agreeing = details.filter((d) =>
    isBull ? d.signal === "buy" : d.signal === "sell",
  ).length;
  const confidence = Math.round((agreeing / details.length) * 100);

  // Strategies
  const strategies: string[] = [];
  if (adxStrong) strategies.push("Trend Following");
  const rsiDetail = details.find((d) => d.name === "RSI");
  const stochDetail = details.find((d) => d.name === "Stochastic");
  if (rsiDetail?.signal !== "neutral" || stochDetail?.signal !== "neutral")
    strategies.push("Momentum");
  if (smcBias === "bullish") strategies.push("SMC Bullish Bias");
  else if (smcBias === "bearish") strategies.push("SMC Bearish Bias");
  const obvDetail = details.find((d) => d.name === "OBV");
  const mfiDetail = details.find((d) => d.name === "MFI");
  if (
    obvDetail &&
    mfiDetail &&
    obvDetail.signal !== "neutral" &&
    obvDetail.signal === mfiDetail.signal
  )
    strategies.push("Volume Confirmed");
  if (strategies.length === 0) strategies.push("Mixed Signals");

  let label: SignalLabel;
  if (score >= 75) label = "STRONG BUY";
  else if (score >= 60) label = "BUY";
  else if (score >= 40) label = "NEUTRAL";
  else if (score >= 25) label = "SELL";
  else label = "STRONG SELL";

  // --- Price levels: entry, take profit, stop loss ---
  const lastClose = klineData[klineData.length - 1].close;

  // ATR for SL/TP calculation
  const atrPeriod = 14;
  let atrValue = lastClose * 0.02; // fallback 2%
  if (klineData.length > atrPeriod + 1) {
    const trs: number[] = [];
    for (let i = 1; i < klineData.length; i++) {
      trs.push(
        Math.max(
          klineData[i].high - klineData[i].low,
          Math.abs(klineData[i].high - klineData[i - 1].close),
          Math.abs(klineData[i].low - klineData[i - 1].close),
        ),
      );
    }
    const recentTRs = trs.slice(-atrPeriod);
    atrValue = recentTRs.reduce((a, b) => a + b, 0) / recentTRs.length;
  }

  const isBuySignal = score >= 55;
  const isSellSignal = score <= 45;

  const entryPrice = lastClose;
  let takeProfitPrice: number | null = null;
  let stopLossPrice: number | null = null;

  if (isBuySignal) {
    takeProfitPrice = lastClose + atrValue * 2.5 * (score / 70);
    stopLossPrice = lastClose - atrValue * 1.2;
  } else if (isSellSignal) {
    takeProfitPrice = lastClose - atrValue * 2.5 * ((100 - score) / 70);
    stopLossPrice = lastClose + atrValue * 1.2;
  }

  const riskRewardRatio =
    takeProfitPrice !== null && stopLossPrice !== null
      ? Math.abs(takeProfitPrice - entryPrice) /
        Math.abs(stopLossPrice - entryPrice)
      : null;

  return {
    score,
    label,
    confidence,
    strategies,
    details,
    entryPrice,
    takeProfitPrice,
    stopLossPrice,
    riskRewardRatio,
  };
}

export function getSignalColors(label: SignalLabel): {
  bg: string;
  text: string;
  border: string;
} {
  switch (label) {
    case "STRONG BUY":
      return {
        bg: "linear-gradient(135deg, #0B3A2A 0%, #157A4A 100%)",
        text: "#22C55E",
        border: "#22C55E",
      };
    case "BUY":
      return {
        bg: "linear-gradient(135deg, #0D2A1A 0%, #0F4A2A 100%)",
        text: "#34D399",
        border: "#34D399",
      };
    case "NEUTRAL":
      return {
        bg: "linear-gradient(135deg, #0A1628 0%, #122040 100%)",
        text: "#60A5FA",
        border: "#60A5FA",
      };
    case "SELL":
      return {
        bg: "linear-gradient(135deg, #2A0D0D 0%, #4A1515 100%)",
        text: "#F87171",
        border: "#F87171",
      };
    case "STRONG SELL":
      return {
        bg: "linear-gradient(135deg, #3A0A0A 0%, #6B1010 100%)",
        text: "#EF4444",
        border: "#EF4444",
      };
  }
}
