import { useState } from "react";
import { ChartPanel } from "./components/ChartPanel";
import { CoinList } from "./components/CoinList";
import { Header } from "./components/Header";
import { RightPanel } from "./components/RightPanel";
import { useKlines } from "./hooks/useQueries";
import type { Coin, Timeframe } from "./types/crypto";

export default function App() {
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");

  const { data: klineData = [], isLoading: klineLoading } = useKlines(
    selectedCoin?.symbol ?? null,
    timeframe,
  );

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #071018 0%, #0B1622 100%)",
      }}
    >
      <Header />

      {/* Main 3-column layout */}
      <main className="flex flex-1 overflow-hidden">
        <CoinList selectedCoin={selectedCoin} onSelectCoin={setSelectedCoin} />

        <ChartPanel
          selectedCoin={selectedCoin}
          klineData={klineData}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          isLoading={klineLoading}
        />

        <RightPanel selectedCoin={selectedCoin} klineData={klineData} />
      </main>
    </div>
  );
}
