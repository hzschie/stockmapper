# StockMapper NYSE - Running Instructions

## Summary
This old stock visualization app has been updated to run with modern systems and real stock data. The original Yahoo Finance API no longer works, so we've set it up to use cached stock data instead.

## What Was Done

1. **Generated Real Stock Data**: Created a Python script (`generate_nyse_data.py`) that fetches current stock prices from Yahoo Finance using the `yfinance` library and generates a `heatmap.cache` file with 49 major stocks including:
   - Major indices: ^NYA, ^GSPC (S&P 500), ^NDX (NASDAQ 100)
   - Popular stocks: AAPL, MSFT, AMZN, TSLA, NVDA, JPM, and more

2. **Fixed Compatibility Issues**:
   - Modified `package.json` to use HTTPS instead of git:// protocol
   - Made the `time` module optional when using canned data
   - Disabled the asset bundler (`bundle-up`) to avoid Node.js version conflicts
   - Created simple replacements for `renderStyles()` and `renderJs()` functions

3. **Result**: The app now runs in "CANNED_DATA" mode, serving static pre-generated stock data for demonstration purposes.

## How to Run the App

### Start the Server
```bash
cd /Users/hermannair/Documents/GitHub/stockmapper
DATA_DOMAIN=nyse CANNED_DATA=true PORT=3000 node app.js
```

### Access the App
Open your web browser and navigate to:
```
http://localhost:3000
```

### Stopping the Server
Press `Ctrl+C` in the terminal where the server is running.

## Updating the Stock Data

To refresh the stock data with current prices:

```bash
cd /Users/hermannair/Documents/GitHub/stockmapper
source venv/bin/activate
python3 generate_nyse_data.py
```

This will fetch the latest stock prices and update the `public/data/nyse/heatmap.cache` file.

## Technical Details

- **Node Version**: Tested with Node.js 8.17.0 (as specified in package.json)
- **Data Mode**: CANNED_DATA (static cache file, no live data fetching)
- **Stock Data File**: `public/data/nyse/heatmap.cache`
- **Port**: 3000 (configurable via PORT environment variable)

## Features

The app provides:
- Interactive heat map visualization of stock performance
- Color-coded display showing gains (green) and losses (red)
- Stock grouping by sector, index, and region
- Search functionality
- Individual stock details and charts

## Notes

- The data is static and won't update automatically
- Run `generate_nyse_data.py` whenever you want to refresh the data
- The original app supported live data updates, but this requires a working API
- Some features may not work perfectly due to compatibility workarounds
