import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ExternalLink,
  Loader2,
  Minus,
  Newspaper,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useNews } from "../hooks/useQueries";
import type { Coin, KlineData } from "../types/crypto";
import { computeSignal, getSignalColors } from "../utils/signals";

interface RightPanelProps {
  selectedCoin: Coin | null;
  klineData: KlineData[];
}

function formatTimeAgo(timestampSeconds: bigint | number): string {
  const ts =
    typeof timestampSeconds === "bigint"
      ? Number(timestampSeconds)
      : timestampSeconds;
  const ms = ts > 1e12 ? ts / 1e6 : ts * 1000;
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const signalDotColor = (sig: "buy" | "sell" | "neutral") =>
  sig === "buy" ? "#22C55E" : sig === "sell" ? "#EF4444" : "#60A5FA";

// Semicircular gauge component
function SignalGauge({ score }: { score: number }) {
  const cx = 90;
  const cy = 80;
  const r = 62;
  // Arc path: semicircle curving UPWARD (rainbow/speedometer shape)
  // sweep-flag=1 means clockwise, which from left to right goes upward
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // Needle angle: score 0 = left (180°), score 100 = right (0°)
  const angle = Math.PI * (1 - score / 100);
  const needleLen = r * 0.8;
  const needleX = cx + needleLen * Math.cos(angle);
  const needleY = cy - needleLen * Math.sin(angle);

  const scoreColor =
    score >= 70 ? "#22C55E" : score >= 45 ? "#F5C542" : "#EF4444";

  const zone = score >= 65 ? "BUY" : score >= 36 ? "NEUTRAL" : "SELL";
  const zoneColor =
    zone === "BUY" ? "#22C55E" : zone === "NEUTRAL" ? "#F5C542" : "#EF4444";

  return (
    <div className="flex flex-col items-center">
      <svg
        width="180"
        height="110"
        viewBox="0 0 180 110"
        aria-label="AI Signal Gauge"
        role="img"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#F5C542" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>

        {/* Background track arc */}
        <path
          d={arcPath}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />

        {/* Colored gradient arc */}
        <path
          d={arcPath}
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Needle shadow */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX + 1}
          y2={needleY + 1}
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#E8F0FA"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Needle pivot */}
        <circle cx={cx} cy={cy} r="4" fill="#E8F0FA" />
        <circle cx={cx} cy={cy} r="2.5" fill="#0E1823" />

        {/* Needle tip dot */}
        <circle cx={needleX} cy={needleY} r="2.5" fill={scoreColor} />

        {/* SELL label */}
        <text
          x={cx - r + 4}
          y={cy + 16}
          fontSize="7"
          fontWeight="700"
          fill="#EF4444"
          textAnchor="middle"
        >
          SELL
        </text>

        {/* BUY label */}
        <text
          x={cx + r - 4}
          y={cy + 16}
          fontSize="7"
          fontWeight="700"
          fill="#22C55E"
          textAnchor="middle"
        >
          BUY
        </text>

        {/* Score number */}
        <text
          x={cx}
          y={cy - 22}
          fontSize="18"
          fontWeight="900"
          fill={scoreColor}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {score}
        </text>

        {/* /100 subscript */}
        <text
          x={cx}
          y={cy - 8}
          fontSize="8"
          fontWeight="600"
          fill="rgba(255,255,255,0.35)"
          textAnchor="middle"
        >
          /100
        </text>
      </svg>

      {/* Zone label */}
      <span
        className="text-[11px] font-black tracking-widest -mt-2"
        style={{ color: zoneColor }}
      >
        {zone}
      </span>
    </div>
  );
}

export function RightPanel({ selectedCoin, klineData }: RightPanelProps) {
  const { data: newsItems, isLoading: newsLoading } = useNews(
    selectedCoin?.baseAsset ?? null,
  );

  const signal = klineData.length > 0 ? computeSignal(klineData) : null;
  const signalColors = signal ? getSignalColors(signal.label) : null;

  const SignalIcon =
    signal?.label === "STRONG BUY" || signal?.label === "BUY"
      ? TrendingUp
      : signal?.label === "STRONG SELL" || signal?.label === "SELL"
        ? TrendingDown
        : Minus;

  return (
    <aside
      className="flex flex-col border-l overflow-hidden"
      style={{
        width: 300,
        minWidth: 300,
        background: "oklch(0.11 0.03 240)",
        borderColor: "oklch(0.22 0.03 240)",
      }}
    >
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {/* Trade Signal Card */}
          <div>
            <p
              className="text-[10px] font-bold tracking-widest mb-2"
              style={{ color: "oklch(0.55 0.04 240)" }}
            >
              AI TRADE SIGNAL
            </p>

            {!selectedCoin && (
              <div
                className="rounded-lg p-4 text-center"
                style={{
                  background: "oklch(0.16 0.035 240)",
                  border: "1px solid oklch(0.22 0.03 240)",
                }}
                data-ocid="signal.empty_state"
              >
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                >
                  Select a coin for signal analysis
                </p>
              </div>
            )}

            {selectedCoin && !signal && (
              <div
                className="rounded-lg p-4 flex items-center justify-center"
                style={{ background: "oklch(0.16 0.035 240)" }}
                data-ocid="signal.loading_state"
              >
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ color: "#22C55E" }}
                />
              </div>
            )}

            {selectedCoin && signal && signalColors && (
              <div
                className="rounded-lg relative overflow-hidden"
                style={{
                  background: signalColors.bg,
                  border: `1px solid ${signalColors.border}33`,
                }}
                data-ocid="signal.card"
              >
                {/* Semicircular gauge */}
                <div
                  className="flex justify-center pt-3 pb-1"
                  style={{ background: "rgba(0,0,0,0.15)" }}
                >
                  <SignalGauge score={signal.score} />
                </div>

                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p
                        className="text-[10px] font-bold tracking-wider mb-1"
                        style={{ color: signalColors.text }}
                      >
                        {selectedCoin.baseAsset}/USDT
                      </p>
                      <p
                        className="text-xl font-black tracking-tight"
                        style={{ color: signalColors.text }}
                      >
                        {signal.label}
                      </p>
                    </div>
                    <SignalIcon
                      className="w-6 h-6 opacity-80"
                      style={{ color: signalColors.text }}
                    />
                  </div>

                  {/* Score bar */}
                  <div className="space-y-1 mb-2">
                    <div
                      className="flex justify-between text-[10px]"
                      style={{ color: `${signalColors.text}CC` }}
                    >
                      <span>Score</span>
                      <span className="font-bold">{signal.score}/100</span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${signal.score}%`,
                          background: signalColors.text,
                        }}
                      />
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="space-y-1 mb-2">
                    <div
                      className="flex justify-between text-[10px]"
                      style={{ color: `${signalColors.text}CC` }}
                    >
                      <span>Confidence</span>
                      <span className="font-bold">{signal.confidence}%</span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${signal.confidence}%`,
                          background: `${signalColors.text}BB`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Strategy badges */}
                  {signal.strategies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {signal.strategies.map((s) => (
                        <Badge
                          key={s}
                          className="text-[9px] px-1.5 py-0.5 font-semibold"
                          style={{
                            background: "rgba(0,0,0,0.3)",
                            color: signalColors.text,
                            border: `1px solid ${signalColors.border}44`,
                          }}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Indicator details table */}
                  <div
                    className="rounded overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.2)" }}
                  >
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <th
                            className="text-left px-2 py-1 font-semibold"
                            style={{ color: `${signalColors.text}88` }}
                          >
                            Indicator
                          </th>
                          <th
                            className="text-center px-1 py-1 font-semibold"
                            style={{ color: `${signalColors.text}88` }}
                          >
                            Sig
                          </th>
                          <th
                            className="text-right px-2 py-1 font-semibold"
                            style={{ color: `${signalColors.text}88` }}
                          >
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {signal.details.map((d, i) => (
                          <tr
                            key={d.name}
                            style={{
                              borderBottom:
                                i < signal.details.length - 1
                                  ? "1px solid rgba(255,255,255,0.04)"
                                  : "none",
                            }}
                          >
                            <td
                              className="px-2 py-0.5"
                              style={{ color: `${signalColors.text}CC` }}
                            >
                              {d.name}
                            </td>
                            <td className="px-1 py-0.5 text-center">
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ background: signalDotColor(d.signal) }}
                              />
                            </td>
                            <td
                              className="px-2 py-0.5 text-right font-mono"
                              style={{ color: `${signalColors.text}99` }}
                            >
                              {d.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Latest News */}
          <div>
            <p
              className="text-[10px] font-bold tracking-widest mb-2 flex items-center gap-1.5"
              style={{ color: "oklch(0.55 0.04 240)" }}
            >
              <Newspaper className="w-3 h-3" />
              LATEST NEWS
            </p>

            {newsLoading && (
              <div
                className="flex items-center justify-center py-6"
                data-ocid="news.loading_state"
              >
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                />
              </div>
            )}

            {!newsLoading && (!newsItems || newsItems.length === 0) && (
              <div
                className="rounded-lg p-4 text-center"
                style={{
                  background: "oklch(0.14 0.03 240)",
                  border: "1px solid oklch(0.22 0.03 240)",
                }}
                data-ocid="news.empty_state"
              >
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.45 0.04 240)" }}
                >
                  {selectedCoin
                    ? "No news available"
                    : "Select a coin for news"}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {newsItems?.slice(0, 5).map((item, idx) => (
                <a
                  key={item.url || item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg p-3 transition-colors hover:bg-accent/60 group"
                  style={{
                    background: "oklch(0.14 0.03 240)",
                    border: "1px solid oklch(0.22 0.03 240)",
                  }}
                  data-ocid={`news.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p
                      className="text-xs font-semibold leading-tight line-clamp-2 flex-1"
                      style={{ color: "#E8F0FA" }}
                    >
                      {item.title}
                    </p>
                    <ExternalLink
                      className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                      style={{ color: "oklch(0.55 0.04 240)" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: "oklch(0.55 0.04 240)" }}
                    >
                      {item.sourceName}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "oklch(0.45 0.04 240)" }}
                    >
                      {formatTimeAgo(item.publishedTime)}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Powered by footer */}
      <div
        className="px-3 py-2 text-center border-t flex-shrink-0"
        style={{ borderColor: "oklch(0.22 0.03 240)" }}
      >
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] transition-colors hover:opacity-80"
          style={{ color: "oklch(0.45 0.04 240)" }}
        >
          © {new Date().getFullYear()} Built with ❤️ using caffeine.ai
        </a>
      </div>
    </aside>
  );
}
