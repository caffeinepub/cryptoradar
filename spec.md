# CryptoRadar

## Current State
Full-stack crypto charting app with 22 indicators, AI signals, AI Scan modal, SMC overlay, Renko chart, sub-panel indicators (RSI, MACD, etc.), and a right panel showing signal gauge + news. Indicator controls overlay exists at top-left of chart with eye toggle, remove (✕), and settings gear (but only for indicators with non-empty DEFAULT_PARAMS — VWAP, ICHIMOKU, PSAR, OBV, PIVOT have empty params so they show NO gear). Indicators are tracked as `Set<IndicatorId>` so only one instance per indicator type is allowed. AI Scan uses hardcoded static prices. SMC labels use `lastValueVisible: true` + `title` which puts labels on the price axis scale, not on the chart line. Sub-panel indicator charts call `fitContent()` independently which causes visible time-range mismatch. AI predictions show no entry/exit pricing.

## Requested Changes (Diff)

### Add
- Settings gear for VWAP (anchorPeriod), ICHIMOKU (tenkan, kijun, senkouB params), PSAR (step, max), OBV (no meaningful param but show gear with a note), PIVOT (no param but show gear) — for consistency all indicators show the gear; if no configurable params, show a small info panel instead
- Multi-instance indicator support: change indicator state from `Set<IndicatorId>` to `Array<{instanceId: string, id: IndicatorId, params: Record<string,number>, hidden: boolean}>`. Each "Add" creates a new instance with a unique ID. The chip label shows instance number if >1 of same type (e.g. HMA #1, HMA #2)
- Entry price + Take Profit + Stop Loss in AI signal panel: compute entry as current close, TP using recent swing high (for BUY) or swing low (for SELL) scaled by signal strength, SL using ATR-based calculation
- Fetch live Binance prices for AI Scan via public REST API `https://api.binance.com/api/v3/ticker/price` so prices reflect actual market
- Force AI Scan to use 4h timeframe analysis; display badge "Analysis: 4h Chart" in the scan modal header; the main chart AI signal remains timeframe-dependent

### Modify
- Sub-panel indicators: Remove `chart.timeScale().fitContent()` call; instead immediately apply main chart's visible logical range after chart creation, before setting up the subscription handler. This ensures sub-panels are always aligned to main chart from initial render
- Sub-panel indicators: Fix indicator lag — after computing values, the sub-panel should NOT call `fitContent()` so the time axis stays synced with main. Rely entirely on main chart range sync
- SMC labels: Replace `lastValueVisible: true` + `title` with `series.setMarkers()` to place text labels directly on the line at the end-candle position (the break candle or latest candle), not on the price scale
- Indicators dropdown: Allow selecting the same indicator multiple times (each click adds a new instance)

### Remove
- Nothing removed

## Implementation Plan
1. **ChartPanel.tsx — Multi-instance indicators**: Replace `Set<IndicatorId>` + separate `indicatorParams` + `hiddenIndicators` with `IndicatorInstance[]` where each instance has `{instanceId, id, params, hidden}`. Update all toggle/remove/settings handlers. Update the indicator chip overlay to use instance objects. Update sub-panel rendering to use instances.
2. **ChartPanel.tsx — Settings for all indicators**: Add non-empty DEFAULT_PARAMS entries for VWAP (anchorMode display-only), ICHIMOKU (tenkanPeriod:9, kijunPeriod:26, senkouBPeriod:52), PSAR (step:0.02, max:0.2), OBV (smoothing:1), PIVOT (pivotType:1). Wire these params into their calculation code.
3. **ChartPanel.tsx — Sub-panel sync fix**: In SubPanel useEffect, after creating chart and computing data, set visible range from mainChart immediately (before fitContent). Remove the `chart.timeScale().fitContent()` call. This ensures the sub-panel range always matches main.
4. **ChartPanel.tsx — SMC labels on lines**: Replace `lastValueVisible + title` approach with `series.setMarkers([{time, position:'inBar', color, shape:'text', text: label}])` so the text appears ON the chart at the line end position.
5. **Header.tsx — Live Binance prices**: Add a `useEffect` in Header that fetches `https://api.binance.com/api/v3/ticker/price?symbols=[...]` for the scan symbols and updates state. Display live prices in the table. Show a loading spinner while fetching. Add "Analysis: 4h Chart" badge to the scan modal header.
6. **RightPanel.tsx — Entry/TP/SL**: Extend `computeSignal` to also return `entryPrice`, `takeProfitPrice`, `stopLossPrice`. In RightPanel, display these three values below the signal card with clear labels and color coding.
7. **signals.ts — TP/SL computation**: Calculate entry=last close, TP using recent swing structure (1.5x ATR above for BUY, below for SELL), SL using 1x ATR opposite direction.
