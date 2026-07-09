# Time Series Cache Generation Guide

## Overview

The StockMapper app now supports cached time series data (trendline/chart data) in CANNED_DATA mode. This allows you to display historical price charts for stocks without needing live API access.

## What is Time Series Data?

When you click on a stock in the app, it shows price charts with different time ranges:
- **Intraday (1 day)**: Shows today's price movement at 5-minute intervals
- **5-day**: Shows the last 5 days of hourly price data
- **Daily**: Shows long-term historical data (1-2 years of daily prices)

## The Notebook

I've created a comprehensive Jupyter notebook: **`generate_timeseries_cache.ipynb`**

### What it does:

1. Reads all stock symbols from `stocks.csv` (~1860 stocks)
2. Fetches historical data from Yahoo Finance using `yfinance`
3. Formats data in the exact structure the app expects
4. Saves cache files as JSON in `public/data/nyse/cache/`

### File naming convention:
```
{SYMBOL}_intraday.json   # 1-day data
{SYMBOL}_5day.json       # 5-day data
{SYMBOL}_daily.json      # Long-term daily data
```

### Data format:
```json
{
  "headers": ["t", "price", "volume"],
  "data": [
    [1783483200000, 313.39, 38466049],
    [1783486800000, 314.22, 42138765],
    ...
  ]
}
```

## How to Use the Notebook

### Step 1: Open the notebook
Open `generate_timeseries_cache.ipynb` in VS Code

### Step 2: Run the first 7 sections
These sections set up functions and load the stock list. Just run each cell in order.

### Step 3: Test with 10 stocks first
Section 8 is configured to process only the first 10 stocks as a test:
```python
test_symbols = all_symbols[:10]  # Start with 10 stocks
```

Run this cell and verify it creates cache files successfully.

### Step 4: Process all stocks
Once verified, change the line in section 8 to:
```python
test_symbols = all_symbols  # Process ALL stocks
```

**⚠️ This will take 2-3 hours** to process all ~1860 stocks due to API rate limiting.

### Step 5: Verify
Run section 9 to verify all cache files were created successfully.

## Processing Tips

### For large batches:
- Run overnight or during off-hours
- Progress is saved as you go (each stock is saved individually)
- You can stop and resume anytime
- Process in chunks if needed:
  ```python
  # Process stocks 0-500
  test_symbols = all_symbols[0:500]
  
  # Later, process 500-1000
  test_symbols = all_symbols[500:1000]
  ```

### If you hit API rate limits:
Increase the delay in section 2:
```python
RATE_LIMIT_DELAY = 1.0  # Increase from 0.5 to 1.0 seconds
```

## Server Code Update

✅ **Already done!** I've updated `lib/yahoo_data_source.js` to automatically:
1. Check if running in CANNED_DATA mode
2. Look for cache files in `public/data/nyse/cache/`
3. Return cached data if available
4. Fall back to live data if cache missing

## Testing

After generating cache files:

1. Restart the server:
   ```bash
   DATA_DOMAIN=nyse CANNED_DATA=true PORT=3000 node app.js
   ```

2. Open http://localhost:3000

3. Click on any stock (e.g., AAPL)

4. The detail panel should show charts with your cached data

5. Check the terminal for any "Cache file not found" messages

## Estimated Time Requirements

| Task | Time |
|------|------|
| Test run (10 stocks) | ~1-2 minutes |
| Full run (1860 stocks) | ~2-3 hours |
| Cache file size | ~100KB per stock (all 3 types) |
| Total cache size | ~180MB for all stocks |

## Troubleshooting

### "No data" for some stocks
- Some symbols may be delisted or have no trading data
- This is normal - the notebook will continue with other stocks

### API rate limit errors
- Increase `RATE_LIMIT_DELAY` to 1.0 or higher
- Wait a few minutes and resume

### Cache files not being used
- Check the terminal output for error messages
- Verify cache files exist in `public/data/nyse/cache/`
- Make sure `CANNED_DATA=true` is set when starting the server

## File Locations

- **Notebook**: `/Users/hermannair/Documents/GitHub/stockmapper/generate_timeseries_cache.ipynb`
- **Cache directory**: `/Users/hermannair/Documents/GitHub/stockmapper/public/data/nyse/cache/`
- **Server code**: `/Users/hermannair/Documents/GitHub/stockmapper/lib/yahoo_data_source.js`
