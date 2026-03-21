import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { useTopCoins } from "../hooks/useQueries";
import type { Coin } from "../types/crypto";

interface CoinListProps {
  selectedCoin: Coin | null;
  onSelectCoin: (coin: Coin) => void;
}

function formatPrice(price: number): string {
  if (price >= 1000)
    return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (price >= 1)
    return price.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return price.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
  return `$${(vol / 1e3).toFixed(1)}K`;
}

export function CoinList({ selectedCoin, onSelectCoin }: CoinListProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<
    "name" | "price" | "change" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { data: coins, isLoading, isError } = useTopCoins();

  const filtered =
    coins?.filter(
      (c) =>
        c.baseAsset.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  function handleSort(field: "name" | "price" | "change") {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let v = 0;
    if (sortField === "name") v = a.baseAsset.localeCompare(b.baseAsset);
    else if (sortField === "price") v = a.price - b.price;
    else if (sortField === "change") v = a.change24h - b.change24h;
    return sortDir === "asc" ? v : -v;
  });

  const colDefs = [
    { label: "COIN", field: "name" as const },
    { label: "PRICE", field: "price" as const },
    { label: "24H", field: "change" as const },
  ];

  return (
    <aside
      className="flex flex-col border-r"
      style={{
        width: 240,
        minWidth: 240,
        background: "oklch(0.11 0.03 240)",
        borderColor: "oklch(0.22 0.03 240)",
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-3 border-b"
        style={{ borderColor: "oklch(0.22 0.03 240)" }}
      >
        <p
          className="text-[10px] font-bold tracking-widest mb-2"
          style={{ color: "oklch(0.67 0.04 240)" }}
        >
          TOP 50 COINS
        </p>
        <div className="relative">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "oklch(0.67 0.04 240)" }}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-7 h-7 text-xs border-0"
            style={{ background: "oklch(0.16 0.035 240)", color: "#E8F0FA" }}
            data-ocid="coinlist.search_input"
          />
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid grid-cols-3 px-3 py-1.5 text-[10px] font-semibold"
        style={{
          borderBottom: "1px solid oklch(0.22 0.03 240)",
        }}
      >
        {colDefs.map((col, i) => {
          const active = sortField === col.field;
          return (
            <button
              key={col.label}
              type="button"
              onClick={() => handleSort(col.field)}
              className={`flex items-center gap-0.5 ${i > 0 ? "justify-end" : ""} hover:opacity-80`}
              style={{ color: active ? "#22C55E" : "oklch(0.55 0.04 240)" }}
              data-ocid={`coinlist.${col.field}.toggle`}
            >
              {col.label}
              {active &&
                (sortDir === "asc" ? (
                  <ChevronUp className="w-2.5 h-2.5" />
                ) : (
                  <ChevronDown className="w-2.5 h-2.5" />
                ))}
            </button>
          );
        })}
      </div>

      {/* Coin list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div
            className="flex items-center justify-center py-8"
            data-ocid="coinlist.loading_state"
          >
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: "#22C55E" }}
            />
          </div>
        )}
        {isError && (
          <div
            className="text-center py-8 text-xs"
            style={{ color: "oklch(0.63 0.21 27)" }}
            data-ocid="coinlist.error_state"
          >
            Failed to load coins
          </div>
        )}
        {!isLoading && !isError && sorted.length === 0 && (
          <div
            className="text-center py-8 text-xs"
            style={{ color: "oklch(0.55 0.04 240)" }}
            data-ocid="coinlist.empty_state"
          >
            No coins found
          </div>
        )}
        {sorted.map((coin, idx) => (
          <button
            type="button"
            key={coin.symbol}
            onClick={() => onSelectCoin(coin)}
            className="w-full grid grid-cols-3 px-3 py-2 text-xs transition-colors hover:bg-accent/60 text-left"
            style={{
              background:
                selectedCoin?.symbol === coin.symbol
                  ? "oklch(0.19 0.04 240)"
                  : undefined,
              borderLeft:
                selectedCoin?.symbol === coin.symbol
                  ? "2px solid #22C55E"
                  : "2px solid transparent",
            }}
            data-ocid={`coinlist.item.${idx + 1}`}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                style={{ background: "oklch(0.22 0.04 240)", color: "#E8F0FA" }}
              >
                {coin.baseAsset.slice(0, 2)}
              </div>
              <div>
                <div
                  className="font-semibold"
                  style={{ color: "#E8F0FA", fontSize: 11 }}
                >
                  {coin.baseAsset}
                </div>
                <div style={{ color: "oklch(0.55 0.04 240)", fontSize: 9 }}>
                  {formatVolume(coin.volume)}
                </div>
              </div>
            </div>
            <div
              className="text-right font-mono"
              style={{ color: "#E8F0FA", fontSize: 10 }}
            >
              {formatPrice(coin.price)}
            </div>
            <div
              className="text-right font-semibold"
              style={{
                color: coin.change24h >= 0 ? "#22C55E" : "#EF4444",
                fontSize: 10,
              }}
            >
              {coin.change24h >= 0 ? "+" : ""}
              {coin.change24h.toFixed(2)}%
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
