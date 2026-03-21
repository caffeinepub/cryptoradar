import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScanSearch, Shield } from "lucide-react";
import { useState } from "react";

const SCAN_RESULTS = [
  {
    symbol: "BTC",
    price: "$84,230",
    signal: "STRONG BUY",
    strength: 92,
    reason: "RSI oversold + EMA golden cross",
    timeframe: "4h",
  },
  {
    symbol: "ETH",
    price: "$2,180",
    signal: "BUY",
    strength: 78,
    reason: "MACD bullish divergence + support hold",
    timeframe: "1h",
  },
  {
    symbol: "SOL",
    price: "$132.40",
    signal: "STRONG BUY",
    strength: 88,
    reason: "SuperTrend bullish + Ichimoku cloud breakout",
    timeframe: "4h",
  },
  {
    symbol: "BNB",
    price: "$598.70",
    signal: "BUY",
    strength: 71,
    reason: "ADX trending up + MFI oversold bounce",
    timeframe: "1d",
  },
  {
    symbol: "ADA",
    price: "$0.6520",
    signal: "BUY",
    strength: 65,
    reason: "RSI(7) oversold + Volume spike detected",
    timeframe: "1h",
  },
  {
    symbol: "XRP",
    price: "$2.105",
    signal: "STRONG BUY",
    strength: 85,
    reason: "SMC BoS breakout + Order block support",
    timeframe: "4h",
  },
  {
    symbol: "DOGE",
    price: "$0.1840",
    signal: "BUY",
    strength: 68,
    reason: "BB squeeze + Momentum building",
    timeframe: "1h",
  },
  {
    symbol: "AVAX",
    price: "$22.35",
    signal: "STRONG BUY",
    strength: 91,
    reason: "Hull MA cross + ATR expansion",
    timeframe: "4h",
  },
  {
    symbol: "MATIC",
    price: "$0.4210",
    signal: "BUY",
    strength: 72,
    reason: "CCI oversold recovery + VWAP hold",
    timeframe: "1h",
  },
  {
    symbol: "DOT",
    price: "$6.48",
    signal: "BUY",
    strength: 69,
    reason: "Aroon bullish crossover + EMA support",
    timeframe: "1d",
  },
];

const TOS_TEXT = `IMPORTANT DISCLAIMER — PLEASE READ CAREFULLY

Parag's Crypto Radar ("the Website") is provided for informational and educational purposes only. Nothing on this Website constitutes financial, investment, legal, or tax advice.

RISK WARNING: Cryptocurrency and financial markets are highly volatile. Past performance is not indicative of future results. The AI-generated signals, predictions, technical indicators, and any other data displayed on this Website may be inaccurate, incomplete, or outdated due to factors beyond our control, including but not limited to market conditions, data feed errors, and algorithmic limitations.

NO LIABILITY: By using this Website, you acknowledge and agree that:
• You use all information, signals, and data entirely at your own risk.
• The Website owner, developers, and contributors shall not be held liable for any financial losses, damages, or adverse consequences arising from your use of or reliance on any information displayed on this Website.
• This Website is provided free of charge with no warranties, express or implied, regarding accuracy, reliability, or fitness for any particular purpose.

NOT FINANCIAL ADVICE: The AI predictions and trade signals shown are experimental tools and do not represent professional financial advice. Always conduct your own research (DYOR) and consult a qualified financial advisor before making any investment decisions.

DATA ACCURACY: Market data is sourced from third-party providers (including Binance). We make no representations regarding the accuracy, completeness, or timeliness of any data displayed. Data may be delayed, incorrect, or unavailable at any time.

NO PROFESSIONAL RELATIONSHIP: Your use of this Website does not create any professional relationship (financial advisor, broker, or otherwise) between you and the Website operators.

GOVERNING LAW: These terms shall be governed by applicable laws. Any disputes arising from the use of this Website shall be subject to the exclusive jurisdiction of the relevant courts.

By continuing to use this Website, you accept these terms in full.`;

function getStrengthColor(strength: number): string {
  if (strength >= 80) return "#22C55E";
  if (strength >= 65) return "#F5C542";
  return "#FB923C";
}

function getSignalBadgeStyle(signal: string): React.CSSProperties {
  if (signal === "STRONG BUY")
    return {
      background: "#0B3A2A",
      color: "#22C55E",
      border: "1px solid #22C55E44",
    };
  if (signal === "BUY")
    return {
      background: "#0D2A1A",
      color: "#34D399",
      border: "1px solid #34D39944",
    };
  return {
    background: "#1A1A0A",
    color: "#F5C542",
    border: "1px solid #F5C54244",
  };
}

export function Header() {
  const [aiScanOpen, setAiScanOpen] = useState(false);
  const [tosOpen, setTosOpen] = useState(false);

  return (
    <>
      <header
        className="h-14 flex items-center justify-between px-4 border-b flex-shrink-0"
        style={{
          background: "oklch(0.11 0.03 240)",
          borderColor: "oklch(0.22 0.03 240)",
        }}
      >
        {/* Brand — PCR logo image */}
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/uploads/pcrlogo-2.png"
            alt="PCR Logo"
            className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
            style={{ filter: "drop-shadow(0 0 6px rgba(34,197,94,0.3))" }}
          />
          <span className="text-base font-bold tracking-tight">
            <span style={{ color: "#E8F0FA" }}>Parag&apos;s </span>
            <span style={{ color: "oklch(0.55 0.04 240)" }}>Crypto </span>
            <span style={{ color: "#22C55E" }}>Radar</span>
          </span>
        </div>

        {/* Center — action buttons */}
        <div className="flex items-center gap-2">
          {/* AI Scan button */}
          <Button
            size="sm"
            onClick={() => setAiScanOpen(true)}
            className="h-8 px-3 gap-1.5 text-xs font-bold rounded-full"
            style={{
              background: "linear-gradient(135deg, #0F4A2A 0%, #157A4A 100%)",
              color: "#22C55E",
              border: "1px solid #22C55E55",
              boxShadow: "0 0 12px #22C55E22",
            }}
            data-ocid="header.ai_scan.open_modal_button"
          >
            <ScanSearch className="w-3.5 h-3.5" />
            AI Scan
          </Button>

          {/* Terms button */}
          <Button
            size="sm"
            onClick={() => setTosOpen(true)}
            className="h-8 px-3 gap-1.5 text-xs font-semibold rounded-full"
            style={{
              background: "oklch(0.16 0.035 240)",
              color: "oklch(0.55 0.04 240)",
              border: "1px solid oklch(0.22 0.03 240)",
            }}
            data-ocid="header.tos.open_modal_button"
          >
            <Shield className="w-3.5 h-3.5" />
            Disclaimer
          </Button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] transition-colors hover:opacity-80 hidden md:block"
            style={{ color: "oklch(0.45 0.04 240)" }}
          >
            Built with caffeine.ai
          </a>
          <span
            className="text-[9px] hidden md:block"
            style={{ color: "oklch(0.35 0.03 240)" }}
          >
            © {new Date().getFullYear()} Parag&apos;s Crypto Radar
          </span>
        </div>
      </header>

      {/* AI Scan Modal */}
      <Dialog open={aiScanOpen} onOpenChange={setAiScanOpen}>
        <DialogContent
          className="max-w-4xl w-full p-0 overflow-hidden"
          style={{
            background: "oklch(0.10 0.03 240)",
            border: "1px solid oklch(0.22 0.03 240)",
          }}
          data-ocid="header.ai_scan.dialog"
        >
          <DialogHeader
            className="px-6 pt-5 pb-3 border-b"
            style={{ borderColor: "oklch(0.22 0.03 240)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #0F4A2A, #157A4A)",
                }}
              >
                <ScanSearch className="w-4 h-4" style={{ color: "#22C55E" }} />
              </div>
              <div>
                <DialogTitle
                  className="text-base font-bold"
                  style={{ color: "#E8F0FA" }}
                >
                  AI Scan — Buy Zone Alerts
                </DialogTitle>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "oklch(0.55 0.04 240)" }}
                >
                  Coins currently showing strong buy signals based on AI signal
                  engine
                </p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="px-4 py-3">
              <div className="overflow-x-auto">
                <Table data-ocid="header.ai_scan.table">
                  <TableHeader>
                    <TableRow style={{ borderColor: "oklch(0.22 0.03 240)" }}>
                      {[
                        "Symbol",
                        "Price",
                        "Signal",
                        "Strength",
                        "Key Reason",
                        "TF",
                      ].map((h) => (
                        <TableHead
                          key={h}
                          className="text-[11px] font-bold h-8"
                          style={{ color: "oklch(0.55 0.04 240)" }}
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SCAN_RESULTS.map((row, i) => (
                      <TableRow
                        key={row.symbol}
                        style={{ borderColor: "oklch(0.18 0.03 240)" }}
                        data-ocid={`header.ai_scan.item.${i + 1}`}
                      >
                        <TableCell className="py-2">
                          <span
                            className="text-xs font-bold"
                            style={{ color: "#E8F0FA" }}
                          >
                            {row.symbol}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span
                            className="text-xs font-mono"
                            style={{ color: "#8FA4B8" }}
                          >
                            {row.price}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={getSignalBadgeStyle(row.signal)}
                          >
                            {row.signal}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 min-w-[100px]">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={row.strength}
                              className="h-1.5 flex-1"
                              style={{
                                // @ts-ignore
                                "--progress-bg": getStrengthColor(row.strength),
                              }}
                            />
                            <span
                              className="text-[10px] font-bold w-8"
                              style={{ color: getStrengthColor(row.strength) }}
                            >
                              {row.strength}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span
                            className="text-[11px]"
                            style={{ color: "#8FA4B8" }}
                          >
                            {row.reason}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{
                              background: "oklch(0.16 0.035 240)",
                              color: "oklch(0.67 0.04 240)",
                            }}
                          >
                            {row.timeframe}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ScrollArea>

          <div
            className="px-6 py-3 border-t flex items-center justify-between"
            style={{ borderColor: "oklch(0.22 0.03 240)" }}
          >
            <p
              className="text-[10px]"
              style={{ color: "oklch(0.45 0.04 240)" }}
            >
              ⚠️ For informational purposes only. Not financial advice.
            </p>
            <Button
              size="sm"
              onClick={() => setAiScanOpen(false)}
              className="h-7 px-3 text-xs"
              style={{
                background: "oklch(0.16 0.035 240)",
                color: "#E8F0FA",
                border: "1px solid oklch(0.22 0.03 240)",
              }}
              data-ocid="header.ai_scan.close_button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TOS / Disclaimer Modal */}
      <Dialog open={tosOpen} onOpenChange={setTosOpen}>
        <DialogContent
          className="max-w-2xl w-full p-0 overflow-hidden"
          style={{
            background: "oklch(0.10 0.03 240)",
            border: "1px solid oklch(0.22 0.03 240)",
          }}
          data-ocid="header.tos.dialog"
        >
          <DialogHeader
            className="px-6 pt-5 pb-3 border-b"
            style={{ borderColor: "oklch(0.22 0.03 240)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(0.18 0.035 240)" }}
              >
                <Shield className="w-4 h-4" style={{ color: "#60A5FA" }} />
              </div>
              <DialogTitle
                className="text-base font-bold"
                style={{ color: "#E8F0FA" }}
              >
                Terms of Use & Disclaimer
              </DialogTitle>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="px-6 py-4">
              {TOS_TEXT.split("\n\n").map((para, i) => (
                <p
                  key={para.slice(0, 30)}
                  className="text-xs leading-relaxed mb-3"
                  style={{
                    color:
                      i === 0
                        ? "#F472B6"
                        : para.startsWith("RISK")
                          ? "#FCA5A5"
                          : para.startsWith("NO LIABILITY") ||
                              para.startsWith("NOT FINANCIAL") ||
                              para.startsWith("DATA ACCURACY") ||
                              para.startsWith("NO PROFESSIONAL") ||
                              para.startsWith("GOVERNING")
                            ? "#93C5FD"
                            : "#8FA4B8",
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
          </ScrollArea>

          <div
            className="px-6 py-3 border-t flex justify-end"
            style={{ borderColor: "oklch(0.22 0.03 240)" }}
          >
            <Button
              size="sm"
              onClick={() => setTosOpen(false)}
              className="h-7 px-4 text-xs font-semibold"
              style={{
                background: "oklch(0.16 0.035 240)",
                color: "#E8F0FA",
                border: "1px solid oklch(0.22 0.03 240)",
              }}
              data-ocid="header.tos.close_button"
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
