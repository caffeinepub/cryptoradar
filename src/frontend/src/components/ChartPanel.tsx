import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
} from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";
import {
  BarChart2,
  CandlestickChart,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Settings2,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADX,
  ATR,
  BollingerBands,
  CCI,
  EMA,
  MACD,
  MFI,
  OBV,
  RSI,
  SMA,
  Stochastic,
  WilliamsR,
} from "technicalindicators";
import type {
  ChartType,
  Coin,
  IndicatorId,
  KlineData,
  Timeframe,
} from "../types/crypto";
import {
  INDICATOR_GROUPS,
  INDICATOR_LABELS,
  PANEL_INDICATORS,
  TIMEFRAME_OPTIONS,
} from "../types/crypto";

// Chart colors (must be literals, not CSS vars)
const CHART_BG = "#0E1823";
const CHART_TEXT = "#8FA4B8";
const CHART_GRID = "#1E2A36";
const CHART_BORDER = "#1E2A36";
const GREEN = "#22C55E";
const RED = "#EF4444";
const YELLOW = "#F5C542";
const CYAN = "#34D399";
const BLUE = "#60A5FA";
const PURPLE = "#A78BFA";
const ORANGE = "#FB923C";
const WHITE = "#E8F0FA";
const LIME = "#84CC16";
const PINK = "#F472B6";

const TF_INTERVAL: Record<string, number> = {
  "1m": 60,
  "3m": 180,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "2h": 7200,
  "4h": 14400,
  "6h": 21600,
  "12h": 43200,
  "1d": 86400,
  "3d": 259200,
  "1w": 604800,
};

// Multi-instance indicator model
export interface IndicatorInstance {
  instanceId: string;
  id: IndicatorId;
  params: Record<string, number>;
  hidden: boolean;
}

const DEFAULT_PARAMS: Record<string, Record<string, number>> = {
  RSI: { period: 14 },
  MACD: { fast: 12, slow: 26, signal: 9 },
  SMA: { period: 20 },
  EMA: { period: 20 },
  BB: { period: 20, stdDev: 2 },
  STOCH: { period: 14, signalPeriod: 3 },
  ATR: { period: 14 },
  CCI: { period: 20 },
  WILLIAMS_R: { period: 14 },
  ADX: { period: 14 },
  MFI: { period: 14 },
  AROON: { period: 25 },
  SUPERTREND: { period: 14, multiplier: 3 },
  DEMA: { period: 20 },
  TEMA: { period: 20 },
  HULL_MA: { period: 20 },
  VWAP: { anchorPeriod: 1 },
  ICHIMOKU: { tenkan: 9, kijun: 26, senkouB: 52 },
  PSAR: { step: 2, maxStep: 20 },
  SMC: { lookback: 50 },
  OBV: { smoothing: 3 },
  PIVOT: { levels: 3 },
};

function getChipLabel(id: IndicatorId, params: Record<string, number>): string {
  const p = params;
  switch (id) {
    case "RSI":
      return `RSI(${p.period ?? 14})`;
    case "MACD":
      return `MACD(${p.fast ?? 12},${p.slow ?? 26},${p.signal ?? 9})`;
    case "SMA":
      return `SMA(${p.period ?? 20})`;
    case "EMA":
      return `EMA(${p.period ?? 20})`;
    case "BB":
      return `BB(${p.period ?? 20})`;
    case "STOCH":
      return `STOCH(${p.period ?? 14})`;
    case "ATR":
      return `ATR(${p.period ?? 14})`;
    case "CCI":
      return `CCI(${p.period ?? 20})`;
    case "WILLIAMS_R":
      return `%R(${p.period ?? 14})`;
    case "ADX":
      return `ADX(${p.period ?? 14})`;
    case "MFI":
      return `MFI(${p.period ?? 14})`;
    case "AROON":
      return `Aroon(${p.period ?? 25})`;
    case "SUPERTREND":
      return `ST(${p.period ?? 14},${p.multiplier ?? 3})`;
    case "DEMA":
      return `DEMA(${p.period ?? 20})`;
    case "TEMA":
      return `TEMA(${p.period ?? 20})`;
    case "HULL_MA":
      return `HMA(${p.period ?? 20})`;
    case "SMC":
      return `SMC(${p.lookback ?? 50})`;
    case "VWAP":
      return "VWAP";
    case "ICHIMOKU":
      return `Ichi(${p.tenkan ?? 9},${p.kijun ?? 26})`;
    case "PSAR":
      return `PSAR(${p.step ?? 2})`;
    case "OBV":
      return `OBV(${p.smoothing ?? 3})`;
    case "PIVOT":
      return `Pivot(${p.levels ?? 3})`;
    default:
      return INDICATOR_LABELS[id] ?? id;
  }
}

function getInstanceLabel(
  instance: IndicatorInstance,
  allInstances: IndicatorInstance[],
): string {
  const sameType = allInstances.filter((i) => i.id === instance.id);
  const base = getChipLabel(instance.id, instance.params);
  if (sameType.length > 1) {
    const num =
      sameType.findIndex((i) => i.instanceId === instance.instanceId) + 1;
    return `${base} #${num}`;
  }
  return base;
}

function alignTimeSeries(
  klineData: KlineData[],
  values: number[],
): { time: number; value: number }[] {
  const offset = klineData.length - values.length;
  return values.map((v, i) => ({
    time: klineData[i + offset].time,
    value: v,
  }));
}

function calcEMA(values: number[], period: number): number[] {
  return EMA.calculate({ period, values });
}

function calcWMA(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    let weightedSum = 0;
    let weightSum = 0;
    for (let j = 0; j < period; j++) {
      weightedSum += values[i - j] * (period - j);
      weightSum += period - j;
    }
    result.push(weightedSum / weightSum);
  }
  return result;
}

function calcATRArr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): number[] {
  const tr: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    tr.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1]),
      ),
    );
  }
  const atr: number[] = [];
  let sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
  atr.push(sum / period);
  for (let i = period; i < tr.length; i++) {
    atr.push((atr[atr.length - 1] * (period - 1) + tr[i]) / period);
  }
  return atr;
}

function calcPSARArr(
  highs: number[],
  lows: number[],
  af0 = 0.02,
  afMax = 0.2,
): { value: number; bull: boolean }[] {
  const result: { value: number; bull: boolean }[] = [];
  let bull = true;
  let af = af0;
  let ep = lows[0];
  let psar = highs[0];
  for (let i = 2; i < highs.length; i++) {
    if (bull) {
      psar = Math.min(
        psar + af * (ep - psar),
        lows[i - 1],
        lows[i - 2] ?? lows[i - 1],
      );
      if (highs[i] > ep) {
        ep = highs[i];
        af = Math.min(af + af0, afMax);
      }
      if (lows[i] < psar) {
        bull = false;
        psar = ep;
        ep = lows[i];
        af = af0;
      }
    } else {
      psar = Math.max(
        psar - af * (psar - ep),
        highs[i - 1],
        highs[i - 2] ?? highs[i - 1],
      );
      if (lows[i] < ep) {
        ep = lows[i];
        af = Math.min(af + af0, afMax);
      }
      if (highs[i] > psar) {
        bull = true;
        psar = ep;
        ep = highs[i];
        af = af0;
      }
    }
    result.push({ value: psar, bull });
  }
  return result;
}

const CHART_OPTIONS = {
  layout: {
    background: { type: ColorType.Solid, color: CHART_BG },
    textColor: CHART_TEXT,
    fontSize: 11,
  },
  grid: {
    vertLines: { color: CHART_GRID, style: LineStyle.Solid },
    horzLines: { color: CHART_GRID, style: LineStyle.Solid },
  },
  crosshair: { mode: CrosshairMode.Normal },
  rightPriceScale: { borderColor: CHART_BORDER },
  timeScale: {
    borderColor: CHART_BORDER,
    timeVisible: true,
    secondsVisible: false,
  },
  handleScroll: true,
  handleScale: true,
};

interface SubPanelProps {
  instance: IndicatorInstance;
  label: string;
  klineData: KlineData[];
  mainChartRef: React.RefObject<IChartApi | null>;
  chartKey: number;
}

function SubPanel({
  instance,
  label,
  klineData,
  mainChartRef,
  chartKey,
}: SubPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { id: indicatorId, params } = instance;

  // biome-ignore lint/correctness/useExhaustiveDependencies: chartKey triggers re-render
  useEffect(() => {
    if (!containerRef.current || !klineData.length) return;

    const closes = klineData.map((k) => k.close);
    const highs = klineData.map((k) => k.high);
    const lows = klineData.map((k) => k.low);
    const volumes = klineData.map((k) => k.volume);

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      ...CHART_OPTIONS,
      width: containerRef.current.clientWidth,
      height: 110,
      timeScale: { ...CHART_OPTIONS.timeScale, visible: false },
      handleScroll: false,
      handleScale: false,
    });
    chartRef.current = chart;

    try {
      const rsiPeriod = params.period ?? 14;
      const macdFast = params.fast ?? 12;
      const macdSlow = params.slow ?? 26;
      const macdSignal = params.signal ?? 9;
      const stochPeriod = params.period ?? 14;
      const stochSignalPeriod = params.signalPeriod ?? 3;
      const atrPeriod = params.period ?? 14;
      const cciPeriod = params.period ?? 20;
      const wrPeriod = params.period ?? 14;
      const adxPeriod = params.period ?? 14;
      const mfiPeriod = params.period ?? 14;
      const aroonPeriod = params.period ?? 25;

      if (indicatorId === "RSI") {
        const values = RSI.calculate({ period: rsiPeriod, values: closes });
        const series = chart.addSeries(LineSeries, {
          color: PURPLE,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        // Use full klineData alignment to avoid lag at the end
        series.setData(alignTimeSeries(klineData, values) as any);
        series.createPriceLine({
          price: 70,
          color: RED,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
        series.createPriceLine({
          price: 30,
          color: GREEN,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
      } else if (indicatorId === "MACD") {
        const macdData = MACD.calculate({
          fastPeriod: macdFast,
          slowPeriod: macdSlow,
          signalPeriod: macdSignal,
          values: closes,
          SimpleMAOscillator: false,
          SimpleMASignal: false,
        });
        const offset = klineData.length - macdData.length;
        const histData = macdData.map((d, i) => ({
          time: klineData[i + offset].time,
          value: d.histogram ?? 0,
          color: (d.histogram ?? 0) >= 0 ? GREEN : RED,
        }));
        const macdLine = macdData.map((d, i) => ({
          time: klineData[i + offset].time,
          value: d.MACD ?? 0,
        }));
        const signalLine = macdData.map((d, i) => ({
          time: klineData[i + offset].time,
          value: d.signal ?? 0,
        }));
        chart
          .addSeries(HistogramSeries, { color: BLUE, priceLineVisible: false })
          .setData(histData as any);
        chart
          .addSeries(LineSeries, {
            color: BLUE,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          .setData(macdLine as any);
        chart
          .addSeries(LineSeries, {
            color: ORANGE,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          .setData(signalLine as any);
      } else if (indicatorId === "STOCH") {
        const stochData = Stochastic.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: stochPeriod,
          signalPeriod: stochSignalPeriod,
        });
        const offset = klineData.length - stochData.length;
        const kLine = stochData.map((d, i) => ({
          time: klineData[i + offset].time,
          value: d.k,
        }));
        const dLine = stochData.map((d, i) => ({
          time: klineData[i + offset].time,
          value: d.d,
        }));
        const kSeries = chart.addSeries(LineSeries, {
          color: BLUE,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        kSeries.setData(kLine as any);
        kSeries.createPriceLine({
          price: 80,
          color: RED,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
        kSeries.createPriceLine({
          price: 20,
          color: GREEN,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
        chart
          .addSeries(LineSeries, {
            color: ORANGE,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          .setData(dLine as any);
      } else if (indicatorId === "ATR") {
        const values = ATR.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: atrPeriod,
        });
        chart
          .addSeries(LineSeries, {
            color: ORANGE,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
          })
          .setData(alignTimeSeries(klineData, values) as any);
      } else if (indicatorId === "OBV") {
        const rawValues = OBV.calculate({ close: closes, volume: volumes });
        // Apply smoothing SMA
        const smoothingPeriod = params.smoothing ?? 3;
        let values = rawValues;
        if (smoothingPeriod > 1 && rawValues.length >= smoothingPeriod) {
          const smoothed: number[] = [];
          for (let i = smoothingPeriod - 1; i < rawValues.length; i++) {
            const slice = rawValues.slice(i - smoothingPeriod + 1, i + 1);
            smoothed.push(slice.reduce((a, b) => a + b, 0) / smoothingPeriod);
          }
          values = smoothed;
        }
        chart
          .addSeries(LineSeries, {
            color: WHITE,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
          })
          .setData(alignTimeSeries(klineData, values) as any);
      } else if (indicatorId === "CCI") {
        const values = CCI.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: cciPeriod,
        });
        const series = chart.addSeries(LineSeries, {
          color: LIME,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        series.setData(alignTimeSeries(klineData, values) as any);
        series.createPriceLine({
          price: 100,
          color: RED,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
        series.createPriceLine({
          price: -100,
          color: GREEN,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
      } else if (indicatorId === "WILLIAMS_R") {
        const values = WilliamsR.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: wrPeriod,
        });
        const series = chart.addSeries(LineSeries, {
          color: PINK,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        series.setData(alignTimeSeries(klineData, values) as any);
        series.createPriceLine({
          price: -20,
          color: RED,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
        series.createPriceLine({
          price: -80,
          color: GREEN,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
      } else if (indicatorId === "ADX") {
        const values = ADX.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: adxPeriod,
        });
        const offset = klineData.length - values.length;
        const adxLine = values.map((d, i) => ({
          time: klineData[i + offset].time,
          value: d.adx,
        }));
        const diPlusLine = values.map((d, i) => ({
          time: klineData[i + offset].time,
          value: d.pdi,
        }));
        const diMinusLine = values.map((d, i) => ({
          time: klineData[i + offset].time,
          value: d.mdi,
        }));
        const adxSeries = chart.addSeries(LineSeries, {
          color: WHITE,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        adxSeries.setData(adxLine as any);
        adxSeries.createPriceLine({
          price: 25,
          color: YELLOW,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "25",
        });
        chart
          .addSeries(LineSeries, {
            color: GREEN,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          .setData(diPlusLine as any);
        chart
          .addSeries(LineSeries, {
            color: RED,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          .setData(diMinusLine as any);
      } else if (indicatorId === "MFI") {
        const values = MFI.calculate({
          high: highs,
          low: lows,
          close: closes,
          volume: volumes,
          period: mfiPeriod,
        });
        const series = chart.addSeries(LineSeries, {
          color: PINK,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        series.setData(alignTimeSeries(klineData, values) as any);
        series.createPriceLine({
          price: 80,
          color: RED,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
        series.createPriceLine({
          price: 20,
          color: GREEN,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
      } else if (indicatorId === "AROON") {
        const period = aroonPeriod;
        const aroonUp: number[] = [];
        const aroonDown: number[] = [];
        for (let i = period; i < highs.length; i++) {
          const sliceH = highs.slice(i - period, i + 1);
          const sliceL = lows.slice(i - period, i + 1);
          const highIdx = sliceH.indexOf(Math.max(...sliceH));
          const lowIdx = sliceL.indexOf(Math.min(...sliceL));
          aroonUp.push(((period - (period - highIdx)) / period) * 100);
          aroonDown.push(((period - (period - lowIdx)) / period) * 100);
        }
        const offset = klineData.length - aroonUp.length;
        chart
          .addSeries(LineSeries, {
            color: GREEN,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
          })
          .setData(
            aroonUp.map((v, i) => ({
              time: klineData[i + offset].time,
              value: v,
            })) as any,
          );
        chart
          .addSeries(LineSeries, {
            color: RED,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
          })
          .setData(
            aroonDown.map((v, i) => ({
              time: klineData[i + offset].time,
              value: v,
            })) as any,
          );
      } else if (indicatorId === "PIVOT") {
        if (klineData.length > 1) {
          const prev = klineData[klineData.length - 2];
          const pivot = (prev.high + prev.low + prev.close) / 3;
          const r1 = 2 * pivot - prev.low;
          const s1 = 2 * pivot - prev.high;
          const r2 = pivot + (prev.high - prev.low);
          const s2 = pivot - (prev.high - prev.low);
          const r3 = pivot + 2 * (prev.high - prev.low);
          const s3 = pivot - 2 * (prev.high - prev.low);
          const numLevels = params.levels ?? 3;
          const series = chart.addSeries(LineSeries, {
            color: YELLOW,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          series.setData(
            klineData.map((k) => ({ time: k.time, value: pivot })) as any,
          );
          const allLevels = [
            { price: pivot, color: YELLOW, lbl: "P" },
            { price: r1, color: RED, lbl: "R1" },
            { price: s1, color: GREEN, lbl: "S1" },
            ...(numLevels >= 2
              ? [
                  { price: r2, color: `${RED}99`, lbl: "R2" },
                  { price: s2, color: `${GREEN}99`, lbl: "S2" },
                ]
              : []),
            ...(numLevels >= 3
              ? [
                  { price: r3, color: `${RED}55`, lbl: "R3" },
                  { price: s3, color: `${GREEN}55`, lbl: "S3" },
                ]
              : []),
          ];
          for (const { price, color, lbl } of allLevels) {
            series.createPriceLine({
              price,
              color,
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              axisLabelVisible: true,
              title: lbl,
            });
          }
        }
      }
      // NOTE: fitContent() intentionally removed — sync with main chart below handles the range
    } catch (_e) {
      // Ignore indicator errors
    }

    // Sync with main chart: apply current range immediately, then subscribe
    const mainChart = mainChartRef.current;
    let syncHandler: ((range: any) => void) | null = null;
    if (mainChart) {
      const range = mainChart.timeScale().getVisibleLogicalRange();
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range);
      }
      syncHandler = (r: any) => {
        if (r && chartRef.current) {
          chartRef.current.timeScale().setVisibleLogicalRange(r);
        }
      };
      mainChart.timeScale().subscribeVisibleLogicalRangeChange(syncHandler);
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (syncHandler && mainChart) {
        try {
          mainChart
            .timeScale()
            .unsubscribeVisibleLogicalRangeChange(syncHandler);
        } catch (_e) {
          // ignore
        }
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [instance, klineData, mainChartRef, chartKey]);

  return (
    <div className="border-t" style={{ borderColor: CHART_GRID }}>
      <div
        className="px-3 py-0.5 text-[9px] font-bold tracking-wider"
        style={{ background: "#0A1520", color: CHART_TEXT }}
      >
        {label.toUpperCase()}
      </div>
      <div ref={containerRef} style={{ height: 110 }} />
    </div>
  );
}

interface ChartPanelProps {
  selectedCoin: Coin | null;
  klineData: KlineData[];
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  isLoading: boolean;
}

export function ChartPanel({
  selectedCoin,
  klineData,
  timeframe,
  onTimeframeChange,
  isLoading,
}: ChartPanelProps) {
  const [chartType, setChartType] = useState<ChartType>("candlestick");

  // Multi-instance indicator state
  const [instances, setInstances] = useState<IndicatorInstance[]>(() => [
    {
      instanceId: "EMA_0",
      id: "EMA",
      params: { ...DEFAULT_PARAMS.EMA },
      hidden: false,
    },
    {
      instanceId: "RSI_0",
      id: "RSI",
      params: { ...DEFAULT_PARAMS.RSI },
      hidden: false,
    },
  ]);

  const [chartKey, setChartKey] = useState(0);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const addInstance = useCallback((id: IndicatorId) => {
    const instanceId = `${id}_${Date.now()}`;
    setInstances((prev) => [
      ...prev,
      {
        instanceId,
        id,
        params: { ...(DEFAULT_PARAMS[id] ?? {}) },
        hidden: false,
      },
    ]);
  }, []);

  const removeInstance = useCallback((instanceId: string) => {
    setInstances((prev) =>
      prev.filter((inst) => inst.instanceId !== instanceId),
    );
  }, []);

  const toggleInstanceVisibility = useCallback((instanceId: string) => {
    setInstances((prev) =>
      prev.map((inst) =>
        inst.instanceId === instanceId
          ? { ...inst, hidden: !inst.hidden }
          : inst,
      ),
    );
  }, []);

  const updateInstanceParam = useCallback(
    (instanceId: string, key: string, value: number) => {
      setInstances((prev) =>
        prev.map((inst) =>
          inst.instanceId === instanceId
            ? { ...inst, params: { ...inst.params, [key]: value } }
            : inst,
        ),
      );
    },
    [],
  );

  // Build main chart
  useEffect(() => {
    if (!mainContainerRef.current || !klineData.length) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const closes = klineData.map((k) => k.close);
    const highs = klineData.map((k) => k.high);
    const lows = klineData.map((k) => k.low);
    const container = mainContainerRef.current;
    const chart = createChart(container, {
      ...CHART_OPTIONS,
      width: container.clientWidth,
      height: container.clientHeight || 360,
    });
    chartRef.current = chart;
    setTimeout(() => setChartKey((k) => k + 1), 50);

    try {
      // --- Main series ---
      if (chartType === "renko") {
        const atrValues = calcATRArr(highs, lows, closes, 14);
        const lastAtr =
          atrValues.length > 0
            ? atrValues[atrValues.length - 1]
            : closes[closes.length - 1] * 0.005;
        const brickSize = Math.max(
          lastAtr * 0.5,
          closes[closes.length - 1] * 0.002,
        );
        const interval = TF_INTERVAL[timeframe] ?? 3600;
        const bricks: {
          open: number;
          high: number;
          low: number;
          close: number;
          up: boolean;
        }[] = [];
        let currentBrick = closes[0];
        for (let i = 1; i < klineData.length; i++) {
          const price = klineData[i].close;
          const diff = price - currentBrick;
          if (Math.abs(diff) >= brickSize) {
            const steps = Math.floor(Math.abs(diff) / brickSize);
            for (let s = 0; s < steps; s++) {
              const dir = diff > 0 ? 1 : -1;
              const bOpen = currentBrick;
              const bClose = currentBrick + dir * brickSize;
              bricks.push({
                open: bOpen,
                high: Math.max(bOpen, bClose),
                low: Math.min(bOpen, bClose),
                close: bClose,
                up: dir > 0,
              });
              currentBrick = bClose;
            }
          }
        }
        if (bricks.length > 0) {
          const baseTime = klineData[0].time;
          const series = chart.addSeries(CandlestickSeries, {
            upColor: GREEN,
            downColor: RED,
            borderUpColor: GREEN,
            borderDownColor: RED,
            wickUpColor: GREEN,
            wickDownColor: RED,
          });
          series.setData(
            bricks.map((b, idx) => ({
              time: (baseTime + idx * interval) as any,
              open: b.up ? b.low : b.high,
              high: b.high,
              low: b.low,
              close: b.up ? b.high : b.low,
            })),
          );
        }
      } else if (chartType === "candlestick") {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: GREEN,
          downColor: RED,
          borderUpColor: GREEN,
          borderDownColor: RED,
          wickUpColor: GREEN,
          wickDownColor: RED,
        });
        series.setData(
          klineData.map((k) => ({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
          })) as any,
        );
      } else if (chartType === "line") {
        const series = chart.addSeries(LineSeries, {
          color: BLUE,
          lineWidth: 2,
        });
        series.setData(
          klineData.map((k) => ({ time: k.time, value: k.close })) as any,
        );
      } else {
        const series = chart.addSeries(BarSeries, {
          upColor: GREEN,
          downColor: RED,
        });
        series.setData(
          klineData.map((k) => ({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
          })) as any,
        );
      }

      // --- Overlay & SMC indicators from instances ---
      for (const inst of instances) {
        if (inst.hidden) continue;
        // Skip panel indicators (they render in SubPanel)
        if (PANEL_INDICATORS.includes(inst.id)) continue;

        const p = inst.params;

        if (inst.id === "SMA") {
          const period = p.period ?? 20;
          const values = SMA.calculate({ period, values: closes });
          chart
            .addSeries(LineSeries, {
              color: YELLOW,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(alignTimeSeries(klineData, values) as any);
        } else if (inst.id === "EMA") {
          const period = p.period ?? 20;
          const values = calcEMA(closes, period);
          chart
            .addSeries(LineSeries, {
              color: CYAN,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(alignTimeSeries(klineData, values) as any);
        } else if (inst.id === "BB") {
          const period = p.period ?? 20;
          const stdDev = p.stdDev ?? 2;
          const bbData = BollingerBands.calculate({
            period,
            stdDev,
            values: closes,
          });
          const offset = klineData.length - bbData.length;
          chart
            .addSeries(LineSeries, {
              color: `${BLUE}99`,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
              lineStyle: LineStyle.Dashed,
            })
            .setData(
              bbData.map((d, i) => ({
                time: klineData[i + offset].time,
                value: d.upper,
              })) as any,
            );
          chart
            .addSeries(LineSeries, {
              color: `${BLUE}66`,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(
              bbData.map((d, i) => ({
                time: klineData[i + offset].time,
                value: d.middle,
              })) as any,
            );
          chart
            .addSeries(LineSeries, {
              color: `${BLUE}99`,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
              lineStyle: LineStyle.Dashed,
            })
            .setData(
              bbData.map((d, i) => ({
                time: klineData[i + offset].time,
                value: d.lower,
              })) as any,
            );
        } else if (inst.id === "VWAP") {
          const typicalPrices = klineData.map(
            (k) => (k.high + k.low + k.close) / 3,
          );
          let cumTPV = 0;
          let cumVol = 0;
          const vwapData = klineData.map((k, i) => {
            cumTPV += typicalPrices[i] * k.volume;
            cumVol += k.volume;
            return {
              time: k.time,
              value: cumVol > 0 ? cumTPV / cumVol : typicalPrices[i],
            };
          });
          chart
            .addSeries(LineSeries, {
              color: YELLOW,
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: true,
            })
            .setData(vwapData as any);
        } else if (inst.id === "ICHIMOKU") {
          const tenkanPeriod = p.tenkan ?? 9;
          const kijunPeriod = p.kijun ?? 26;
          const senkouBPeriod = p.senkouB ?? 52;
          function ichimokuLine(
            data: KlineData[],
            period: number,
          ): { time: number; value: number }[] {
            return data
              .map((k, i) => {
                if (i < period - 1) return null;
                const slice = data.slice(i - period + 1, i + 1);
                const high = Math.max(...slice.map((d) => d.high));
                const low = Math.min(...slice.map((d) => d.low));
                return { time: k.time, value: (high + low) / 2 };
              })
              .filter(Boolean) as { time: number; value: number }[];
          }
          const tenkan = ichimokuLine(klineData, tenkanPeriod);
          const kijun = ichimokuLine(klineData, kijunPeriod);
          const senkouB = ichimokuLine(klineData, senkouBPeriod);
          chart
            .addSeries(LineSeries, {
              color: BLUE,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(tenkan as any);
          chart
            .addSeries(LineSeries, {
              color: ORANGE,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(kijun as any);
          chart
            .addSeries(LineSeries, {
              color: `${GREEN}77`,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(senkouB as any);
        } else if (inst.id === "PSAR") {
          const af0 = (p.step ?? 2) / 100;
          const afMax = (p.maxStep ?? 20) / 100;
          const psarData = calcPSARArr(highs, lows, af0, afMax);
          const offset = klineData.length - psarData.length;
          const bullData = psarData
            .map((d, i) => ({
              time: klineData[i + offset].time,
              value: d.bull ? d.value : null,
            }))
            .filter((d) => d.value !== null);
          const bearData = psarData
            .map((d, i) => ({
              time: klineData[i + offset].time,
              value: !d.bull ? d.value : null,
            }))
            .filter((d) => d.value !== null);
          chart
            .addSeries(LineSeries, {
              color: GREEN,
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(bullData as any);
          chart
            .addSeries(LineSeries, {
              color: RED,
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(bearData as any);
        } else if (inst.id === "SUPERTREND") {
          const stPeriod = p.period ?? 14;
          const multiplier = p.multiplier ?? 3;
          const atrValues = calcATRArr(highs, lows, closes, stPeriod);
          const atrOffset = closes.length - atrValues.length;
          const upperBand: number[] = [];
          const lowerBand: number[] = [];
          const supertrend: { value: number; bull: boolean }[] = [];
          for (let i = 0; i < atrValues.length; i++) {
            const idx = i + atrOffset;
            const hl2 = (highs[idx] + lows[idx]) / 2;
            upperBand.push(hl2 + multiplier * atrValues[i]);
            lowerBand.push(hl2 - multiplier * atrValues[i]);
          }
          let bull = true;
          for (let i = 0; i < atrValues.length; i++) {
            const idx = i + atrOffset;
            if (i > 0) {
              const prevUpper = upperBand[i - 1];
              const prevLower = lowerBand[i - 1];
              upperBand[i] =
                upperBand[i] < prevUpper || closes[idx - 1] > prevUpper
                  ? upperBand[i]
                  : prevUpper;
              lowerBand[i] =
                lowerBand[i] > prevLower || closes[idx - 1] < prevLower
                  ? lowerBand[i]
                  : prevLower;
              if (
                supertrend[i - 1].value === prevUpper &&
                closes[idx] > upperBand[i]
              )
                bull = true;
              else if (
                supertrend[i - 1].value === prevLower &&
                closes[idx] < lowerBand[i]
              )
                bull = false;
            }
            supertrend.push({
              value: bull ? lowerBand[i] : upperBand[i],
              bull,
            });
          }
          const bullST = supertrend
            .map((d, i) => ({
              time: klineData[i + atrOffset].time,
              value: d.bull ? d.value : null,
            }))
            .filter((d) => d.value !== null);
          const bearST = supertrend
            .map((d, i) => ({
              time: klineData[i + atrOffset].time,
              value: !d.bull ? d.value : null,
            }))
            .filter((d) => d.value !== null);
          chart
            .addSeries(LineSeries, {
              color: GREEN,
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(bullST as any);
          chart
            .addSeries(LineSeries, {
              color: RED,
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(bearST as any);
        } else if (inst.id === "DEMA") {
          const period = p.period ?? 20;
          const ema1 = calcEMA(closes, period);
          const ema2 = calcEMA(ema1, period);
          const dema = ema2.map((v, i) => {
            const e1idx = ema1.length - ema2.length + i;
            return 2 * ema1[e1idx] - v;
          });
          const offset = closes.length - dema.length;
          chart
            .addSeries(LineSeries, {
              color: CYAN,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(
              dema.map((v, i) => ({
                time: klineData[i + offset].time,
                value: v,
              })) as any,
            );
        } else if (inst.id === "TEMA") {
          const period = p.period ?? 20;
          const ema1 = calcEMA(closes, period);
          const ema2 = calcEMA(ema1, period);
          const ema3 = calcEMA(ema2, period);
          const minLen = ema3.length;
          const tema = ema3.map((v, i) => {
            const e2idx = ema2.length - minLen + i;
            const e1idx = ema1.length - minLen + i;
            return 3 * ema1[e1idx] - 3 * ema2[e2idx] + v;
          });
          const offset = closes.length - tema.length;
          chart
            .addSeries(LineSeries, {
              color: LIME,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(
              tema.map((v, i) => ({
                time: klineData[i + offset].time,
                value: v,
              })) as any,
            );
        } else if (inst.id === "HULL_MA") {
          const n = p.period ?? 20;
          const halfN = Math.floor(n / 2);
          const sqrtN = Math.round(Math.sqrt(n));
          const wmaFull = calcWMA(closes, n);
          const wmaHalf = calcWMA(closes, halfN);
          const minLen = Math.min(wmaFull.length, wmaHalf.length);
          const raw = Array.from(
            { length: minLen },
            (_, i) =>
              2 * wmaHalf[wmaHalf.length - minLen + i] -
              wmaFull[wmaFull.length - minLen + i],
          );
          const hull = calcWMA(raw, sqrtN);
          const offset = closes.length - hull.length;
          chart
            .addSeries(LineSeries, {
              color: ORANGE,
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            })
            .setData(
              hull.map((v, i) => ({
                time: klineData[i + offset].time,
                value: v,
              })) as any,
            );
        } else if (inst.id === "SMC") {
          // --- SMC Overlay (bounded segments) ---
          const swingWindow = 5;
          const lookback = Math.min(klineData.length, p.lookback ?? 50);
          const slice = klineData.slice(klineData.length - lookback);
          const swingHighs: { idx: number; price: number }[] = [];
          const swingLows: { idx: number; price: number }[] = [];

          for (let i = swingWindow; i < slice.length - swingWindow; i++) {
            let isHigh = true;
            let isLow = true;
            for (let j = i - swingWindow; j <= i + swingWindow; j++) {
              if (j === i) continue;
              if (slice[j].high >= slice[i].high) isHigh = false;
              if (slice[j].low <= slice[i].low) isLow = false;
            }
            if (isHigh) swingHighs.push({ idx: i, price: slice[i].high });
            if (isLow) swingLows.push({ idx: i, price: slice[i].low });
          }

          const findBreak = (
            fromIdx: number,
            price: number,
            isHighLevel: boolean,
          ): number => {
            for (let i = fromIdx + 1; i < slice.length; i++) {
              if (isHighLevel && slice[i].close > price) return i;
              if (!isHighLevel && slice[i].close < price) return i;
            }
            return slice.length - 1;
          };

          // Draw a segment line and add a text marker at the end point
          const drawSegment = (
            t1: number,
            t2: number,
            price: number,
            color: string,
            lStyle: LineStyle,
            lWidth: number,
            label?: string,
          ) => {
            if (t1 >= t2) return;
            const seg = chart.addSeries(LineSeries, {
              color,
              lineWidth: lWidth as any,
              lineStyle: lStyle,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
              title: "",
            });
            seg.setData([
              { time: t1 as any, value: price },
              { time: t2 as any, value: price },
            ]);
            // Place label as a marker directly on the chart at line end
            if (label) {
              try {
                (seg as any).setMarkers([
                  {
                    time: t2 as any,
                    position: "inBar" as any,
                    color: color,
                    shape: "text" as any,
                    text: label,
                    size: 1,
                  },
                ]);
              } catch (_e) {
                // fallback: no label if markers not supported
              }
            }
          };

          // Draw bounded swing high segments
          for (const sh of swingHighs.slice(-8)) {
            const breakIdx = findBreak(sh.idx, sh.price, true);
            const isBroken = breakIdx < slice.length - 1;
            const t1 = slice[sh.idx].time;
            const t2 = slice[breakIdx].time;
            drawSegment(
              t1,
              t2,
              sh.price,
              isBroken ? `${GREEN}66` : `${GREEN}AA`,
              isBroken ? LineStyle.Dotted : LineStyle.Dashed,
              1,
            );
          }

          // Draw bounded swing low segments
          for (const sl of swingLows.slice(-8)) {
            const breakIdx = findBreak(sl.idx, sl.price, false);
            const isBroken = breakIdx < slice.length - 1;
            const t1 = slice[sl.idx].time;
            const t2 = slice[breakIdx].time;
            drawSegment(
              t1,
              t2,
              sl.price,
              isBroken ? `${RED}66` : `${RED}AA`,
              isBroken ? LineStyle.Dotted : LineStyle.Dashed,
              1,
            );
          }

          // BoS: last broken swing high
          const brokenHighs = swingHighs.filter((sh) => {
            const bIdx = findBreak(sh.idx, sh.price, true);
            return bIdx < slice.length - 1;
          });
          if (brokenHighs.length > 0) {
            const lastBH = brokenHighs[brokenHighs.length - 1];
            const bIdx = findBreak(lastBH.idx, lastBH.price, true);
            drawSegment(
              slice[lastBH.idx].time,
              slice[bIdx].time,
              lastBH.price,
              GREEN,
              LineStyle.Dotted,
              2,
              "BoS",
            );
          }

          // CHoCH: last broken swing low
          const brokenLows = swingLows.filter((sl) => {
            const bIdx = findBreak(sl.idx, sl.price, false);
            return bIdx < slice.length - 1;
          });
          if (brokenLows.length > 0) {
            const lastBL = brokenLows[brokenLows.length - 1];
            const bIdx = findBreak(lastBL.idx, lastBL.price, false);
            drawSegment(
              slice[lastBL.idx].time,
              slice[bIdx].time,
              lastBL.price,
              RED,
              LineStyle.Dotted,
              2,
              "CHoCH",
            );
          }

          // Strong/Weak high/low
          const lastClose = slice[slice.length - 1].close;
          if (swingHighs.length > 0) {
            const lh = swingHighs[swingHighs.length - 1];
            const unbroken =
              findBreak(lh.idx, lh.price, true) === slice.length - 1;
            if (unbroken) {
              drawSegment(
                slice[lh.idx].time,
                slice[slice.length - 1].time,
                lh.price,
                lastClose > lh.price ? GREEN : `${RED}CC`,
                LineStyle.Solid,
                2,
                lastClose > lh.price ? "Weak High" : "Strong High",
              );
            }
          }
          if (swingLows.length > 0) {
            const ll = swingLows[swingLows.length - 1];
            const unbroken =
              findBreak(ll.idx, ll.price, false) === slice.length - 1;
            if (unbroken) {
              drawSegment(
                slice[ll.idx].time,
                slice[slice.length - 1].time,
                ll.price,
                lastClose < ll.price ? RED : `${GREEN}CC`,
                LineStyle.Solid,
                2,
                lastClose < ll.price ? "Weak Low" : "Strong Low",
              );
            }
          }
        }
      }
    } catch (_e) {
      /* ignore */
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight || 360,
        });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [klineData, chartType, instances, timeframe]);

  // Panel instances (sub-panel indicators)
  const activePanelInstances = instances.filter(
    (inst) => PANEL_INDICATORS.includes(inst.id) && !inst.hidden,
  );

  const chartTypeIcon = {
    candlestick: <CandlestickChart className="w-3.5 h-3.5" />,
    line: <TrendingUp className="w-3.5 h-3.5" />,
    bar: <BarChart2 className="w-3.5 h-3.5" />,
    renko: <BarChart2 className="w-3.5 h-3.5" />,
  }[chartType];

  const groupLabels: { key: keyof typeof INDICATOR_GROUPS; label: string }[] = [
    { key: "overlay", label: "OVERLAY" },
    { key: "smc", label: "SMART MONEY" },
    { key: "momentum", label: "MOMENTUM" },
    { key: "trend", label: "TREND" },
    { key: "volume", label: "VOLUME" },
  ];

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: "oklch(0.12 0.025 240)" }}
    >
      {/* Chart header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ borderColor: CHART_GRID }}
      >
        <div className="flex items-center gap-3">
          <div>
            <span className="text-base font-bold" style={{ color: "#E8F0FA" }}>
              {selectedCoin
                ? `${selectedCoin.baseAsset}/USDT`
                : "Select a coin"}
            </span>
            {selectedCoin && (
              <span
                className="ml-2 text-xs font-semibold"
                style={{ color: selectedCoin.change24h >= 0 ? GREEN : RED }}
              >
                {selectedCoin.change24h >= 0 ? "+" : ""}
                {selectedCoin.change24h.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Timeframe */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-md"
            style={{ background: "oklch(0.16 0.035 240)" }}
          >
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                type="button"
                key={tf.value}
                onClick={() => onTimeframeChange(tf.value)}
                className="px-2 py-1 text-[10px] font-semibold rounded transition-colors"
                style={{
                  background:
                    timeframe === tf.value
                      ? "oklch(0.22 0.04 240)"
                      : "transparent",
                  color:
                    timeframe === tf.value ? "#E8F0FA" : "oklch(0.55 0.04 240)",
                }}
                data-ocid={`chart.timeframe_${tf.value}.toggle`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart type */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1 text-[10px] font-semibold"
                style={{
                  background: "oklch(0.16 0.035 240)",
                  color: "#E8F0FA",
                }}
                data-ocid="chart.chart_type.select"
              >
                {chartTypeIcon}
                <span className="capitalize">{chartType}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{
                background: "oklch(0.16 0.035 240)",
                border: "1px solid oklch(0.22 0.03 240)",
              }}
            >
              {(["candlestick", "line", "bar", "renko"] as ChartType[]).map(
                (type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => setChartType(type)}
                    className="capitalize text-xs cursor-pointer"
                    style={{ color: chartType === type ? GREEN : "#E8F0FA" }}
                    data-ocid={`chart.chart_type_${type}.button`}
                  >
                    {type}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Indicators — always ADD on click */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1 text-[10px] font-semibold"
                style={{
                  background: "oklch(0.16 0.035 240)",
                  color: "#E8F0FA",
                }}
                data-ocid="chart.indicators.open_modal_button"
              >
                <Plus className="w-3 h-3" />
                Indicators ({instances.length})
                <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-2 max-h-[70vh] overflow-y-auto"
              style={{
                background: "oklch(0.16 0.035 240)",
                border: "1px solid oklch(0.22 0.03 240)",
              }}
              data-ocid="chart.indicators.popover"
            >
              <p
                className="text-[9px] mb-2 px-1"
                style={{ color: "oklch(0.45 0.04 240)" }}
              >
                Click to add (multiple instances supported)
              </p>
              {groupLabels.map(({ key, label }) => (
                <div key={key}>
                  <p
                    className="text-[9px] font-bold tracking-widest mb-1 mt-2 px-1"
                    style={{ color: "oklch(0.55 0.04 240)" }}
                  >
                    {label}
                  </p>
                  {INDICATOR_GROUPS[key].map((id) => {
                    const count = instances.filter(
                      (inst) => inst.id === id,
                    ).length;
                    return (
                      <button
                        type="button"
                        key={id}
                        className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-accent/60 cursor-pointer text-xs"
                        style={{ color: "#E8F0FA" }}
                        onClick={() => addInstance(id)}
                        data-ocid={`chart.indicator_${id.toLowerCase()}.button`}
                      >
                        <span>{INDICATOR_LABELS[id]}</span>
                        {count > 0 && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "rgba(34,197,94,0.15)",
                              color: GREEN,
                            }}
                          >
                            {count}x
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <div
                    className="my-1"
                    style={{ borderTop: "1px solid oklch(0.22 0.03 240)" }}
                  />
                </div>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {!selectedCoin && (
          <div
            className="flex flex-col items-center justify-center h-full"
            style={{ color: "oklch(0.45 0.04 240)" }}
            data-ocid="chart.empty_state"
          >
            <CandlestickChart className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">Select a coin to view chart</p>
          </div>
        )}

        {selectedCoin && isLoading && (
          <div
            className="flex items-center justify-center h-64"
            data-ocid="chart.loading_state"
          >
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: GREEN }}
            />
          </div>
        )}

        {selectedCoin && !isLoading && (
          <>
            {/* Main chart with indicator overlay chips */}
            <div className="relative">
              {/* Indicator instances overlay — top-left */}
              {instances.length > 0 && (
                <div
                  className="absolute top-2 left-2 z-10 flex flex-col gap-1"
                  style={{ maxWidth: 240, pointerEvents: "auto" }}
                >
                  {instances.map((inst) => {
                    const instLabel = getInstanceLabel(inst, instances);
                    const paramKeys = Object.keys(inst.params);
                    return (
                      <div
                        key={inst.instanceId}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                        style={{
                          background: "rgba(10,21,32,0.88)",
                          border: "1px solid rgba(30,42,54,0.9)",
                          backdropFilter: "blur(4px)",
                          opacity: inst.hidden ? 0.5 : 1,
                        }}
                      >
                        <span
                          className="font-semibold flex-1 truncate"
                          style={{ color: inst.hidden ? "#4A6070" : "#A8C0D0" }}
                        >
                          {instLabel}
                        </span>

                        {/* Eye toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            toggleInstanceVisibility(inst.instanceId)
                          }
                          className="opacity-60 hover:opacity-100 transition-opacity"
                          title={inst.hidden ? "Show" : "Hide"}
                          data-ocid={`chart.indicator_${inst.instanceId.toLowerCase()}.toggle`}
                        >
                          {inst.hidden ? (
                            <EyeOff
                              className="w-3 h-3"
                              style={{ color: "#8FA4B8" }}
                            />
                          ) : (
                            <Eye
                              className="w-3 h-3"
                              style={{ color: "#8FA4B8" }}
                            />
                          )}
                        </button>

                        {/* Settings gear — always present since all indicators have params */}
                        {paramKeys.length > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="opacity-60 hover:opacity-100 transition-opacity"
                                title="Settings"
                                data-ocid={`chart.indicator_${inst.instanceId.toLowerCase()}.open_modal_button`}
                              >
                                <Settings2
                                  className="w-3 h-3"
                                  style={{ color: "#8FA4B8" }}
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="right"
                              className="p-3 w-52"
                              style={{
                                background: "oklch(0.14 0.03 240)",
                                border: "1px solid oklch(0.22 0.03 240)",
                              }}
                              data-ocid={`chart.indicator_${inst.instanceId.toLowerCase()}.popover`}
                            >
                              <p
                                className="text-[10px] font-bold mb-2 tracking-wider"
                                style={{ color: "#8FA4B8" }}
                              >
                                {INDICATOR_LABELS[inst.id]} SETTINGS
                              </p>
                              <div className="space-y-2">
                                {paramKeys.map((key) => (
                                  <div key={key}>
                                    <Label
                                      className="text-[9px] font-semibold capitalize"
                                      style={{ color: "#8FA4B8" }}
                                    >
                                      {key}
                                    </Label>
                                    <Input
                                      type="number"
                                      value={inst.params[key]}
                                      onChange={(e) => {
                                        const v = Number(e.target.value);
                                        if (!Number.isNaN(v) && v > 0) {
                                          updateInstanceParam(
                                            inst.instanceId,
                                            key,
                                            v,
                                          );
                                        }
                                      }}
                                      className="h-6 text-[11px] mt-0.5"
                                      style={{
                                        background: "oklch(0.18 0.035 240)",
                                        borderColor: "oklch(0.28 0.03 240)",
                                        color: "#E8F0FA",
                                      }}
                                      data-ocid={`chart.indicator_${inst.instanceId.toLowerCase()}_${key}.input`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeInstance(inst.instanceId)}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                          title="Remove"
                          data-ocid={`chart.indicator_${inst.instanceId.toLowerCase()}.close_button`}
                        >
                          <X className="w-3 h-3" style={{ color: "#8FA4B8" }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={mainContainerRef} style={{ height: 360 }} />
            </div>

            {/* Sub-panel indicators */}
            {activePanelInstances.map((inst) => (
              <SubPanel
                key={inst.instanceId}
                instance={inst}
                label={getInstanceLabel(inst, instances)}
                klineData={klineData}
                mainChartRef={chartRef}
                chartKey={chartKey}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
