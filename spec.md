# CryptoRadar

## Current State
Full crypto radar app with header, coin list, chart panel with sub-panels, and right panel with AI signal gauge and news.

## Requested Changes (Diff)

### Add
- SMC settings: add `lookback` param (default 50 candles) to SMC indicator in DEFAULT_PARAMS and settings overlay
- CoinList column sorting: sortable COIN (by name), PRICE, and 24H columns with toggle asc/desc

### Modify
1. **AI Signal Gauge (RightPanel)**: Arc sweep-flag is wrong — change from `0 0 0` to `0 1 0` so arc curves upward (speedometer shape). Adjust SVG viewBox/cy if needed so score text and SELL/BUY labels fit correctly inside the upper arc.
2. **Pan/zoom sync (ChartPanel)**: SubPanel subscribes to main chart range changes inside a useEffect that runs at same time as main chart recreation. Fix: add a `chartKey` number prop to SubPanel (incremented in ChartPanel state after main chart is created), include it in SubPanel useEffect deps so it re-subscribes after main chart is ready.
3. **Header**: Remove Donate button (Heart icon). Remove top-right Bell/notification icon button. Add copyright/caffeine notice to footer in RightPanel (already has one, keep it) and to Header's right area as text only.
4. **AI Scan prices**: Replace static hardcoded prices in SCAN_RESULTS with realistic 2026 prices per coin (BTC~$85k, ETH~$2k, SOL~$130, BNB~$600, ADA~$0.65, XRP~$2.10, DOGE~$0.18, AVAX~$22, MATIC~$0.42, DOT~$6.50).
5. **SMC labels on chart lines**: The drawSegment function currently puts label as `title` on a priceLine which renders on the price axis. Instead, add a text label on the line itself using a separate 0-width series or by drawing a text marker via a separate invisible series with lastValueVisible label. Best approach: use a short LineSeries with just 2 points and set `title` to empty, then add a separate single-point LineSeries at the midpoint of the segment with `lastValueVisible: true`, `priceLineVisible: false`, `title: labelText` and color matching the line.
6. **Logo**: Replace the PCR SVG text logo in Header with `<img src="/assets/uploads/pcrlogo-2.png" alt="PCR Logo" className="w-9 h-9 object-contain rounded-lg" />`
7. **All panels scrollbars**: Ensure RightPanel ScrollArea fills full height (flex-1 overflow-hidden container). AI Scan modal: wrap table in a div with `overflow-x-auto overflow-y-auto max-h-[60vh]` with both scroll directions. CoinList already has overflow-y-auto.

### Remove
- Donate button from Header
- Bell/notification icon button from Header right side

## Implementation Plan
1. Fix SignalGauge arc in RightPanel.tsx (sweep-flag 0→1, adjust cy/viewBox)
2. Add chartKey state in ChartPanel, pass to SubPanel, fix sync
3. Add SMC lookback param
4. Update Header: remove donate, remove bell, fix scan prices, use PCR logo image
5. Add CoinList sorting
6. Fix SMC labels on lines
7. Ensure scroll areas work
