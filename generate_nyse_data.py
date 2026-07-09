#!/usr/bin/env python3
"""
Generate NYSE stock data for the StockMapper app using yfinance.
This creates a heatmap.cache file that the app can use in CANNED_DATA mode.
"""

import json
import yfinance as yf
from datetime import datetime
import time
import os
from pathlib import Path

# Read the list of stock symbols from quotes.json
with open('public/data/nyse/quotes.json', 'r') as f:
    all_symbols = json.load(f)

# Auto-detect which stocks have cached timeseries data
cache_dir = Path('public/data/nyse/cache')
cached_symbols = set()

if cache_dir.exists():
    for file in cache_dir.glob('*_daily.json'):
        symbol = file.stem.replace('_daily', '')
        cached_symbols.add(symbol)
    print(f"Found {len(cached_symbols)} stocks with cached timeseries data")

# Use cached stocks if available, otherwise fall back to popular stocks
if cached_symbols:
    symbols_to_fetch = sorted(list(cached_symbols))
else:
    # Fallback to popular stocks
    popular_symbols = [
        "^NYA", "^GSPC", "^NDX",  # Indices
        "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "BRK-B",
        "JPM", "JNJ", "V", "WMT", "PG", "MA", "UNH", "HD", "DIS", "BAC",
        "ADBE", "CSCO", "NFLX", "CRM", "INTC", "PEP", "KO", "TMO", "ABT", "COST",
        "MCD", "ORCL", "AVGO", "ACN", "TXN", "QCOM", "LLY", "DHR", "NEE", "UPS",
        "PM", "HON", "LOW", "BMY", "UNP", "AMD", "IBM", "GE", "CAT", "BA"
    ]
    # Filter to only symbols that exist in the original list
    symbols_to_fetch = [s for s in popular_symbols if s in all_symbols]

print(f"Fetching data for {len(symbols_to_fetch)} stocks...")

heatmap_data = []

for i, symbol in enumerate(symbols_to_fetch):
    try:
        print(f"Fetching {i+1}/{len(symbols_to_fetch)}: {symbol}")
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Get current quote
        hist = ticker.history(period="5d")
        if hist.empty:
            print(f"  No data available for {symbol}, skipping...")
            continue
            
        last_row = hist.iloc[-1]
        prev_row = hist.iloc[-2] if len(hist) > 1 else last_row
        
        last_price = last_row['Close']
        prev_close = prev_row['Close']
        change = last_price - prev_close
        change_percent = (change / prev_close * 100) if prev_close > 0 else 0
        
        # Get the timestamp
        last_date = hist.index[-1]
        timestamp = int(last_date.timestamp() * 1000)
        
        # Format market cap as a string with B/M/T suffix
        market_cap_raw = info.get('marketCap', 0)
        if market_cap_raw >= 1e12:
            market_cap_str = f"{market_cap_raw / 1e12:.2f}T"
        elif market_cap_raw >= 1e9:
            market_cap_str = f"{market_cap_raw / 1e9:.2f}B"
        elif market_cap_raw >= 1e6:
            market_cap_str = f"{market_cap_raw / 1e6:.2f}M"
        else:
            market_cap_str = str(market_cap_raw)
        
        # Build the data array in the format the app expects:
        # ['model', symbol, lastPrice, timestamp, null, change, prevClose, open, high, low, volume, 
        #  changePercent, marketCapString, avgVolume, 52weekLow, 52weekHigh]
        data_row = [
            "model",
            symbol,
            round(last_price, 2),
            timestamp,
            None,  # Time field (gets set to null after processing)
            round(change, 2),
            round(prev_close, 2),
            round(last_row['Open'], 2),
            round(last_row['High'], 2),
            round(last_row['Low'], 2),
            int(last_row['Volume']),
            f"{change_percent:+.2f}%",
            market_cap_str,  # Market cap as formatted string (e.g., "123.45B")
            info.get('averageVolume', int(last_row['Volume'])),
            info.get('fiftyTwoWeekLow', round(last_row['Low'], 2)),
            info.get('fiftyTwoWeekHigh', round(last_row['High'], 2))
        ]
        
        heatmap_data.append(data_row)
        print(f"  ✓ {symbol}: ${last_price:.2f} ({change:+.2f}, {change_percent:+.2f}%)")
        
        # Rate limiting - be nice to the API
        time.sleep(0.5)
        
    except Exception as e:
        print(f"  ✗ Error fetching {symbol}: {e}")
        continue

# Save to heatmap.cache file
output_file = 'public/data/nyse/heatmap.cache'
with open(output_file, 'w') as f:
    json.dump(heatmap_data, f)

print(f"\n✓ Successfully generated {output_file} with {len(heatmap_data)} stocks")
print(f"\nTo run the app in canned data mode:")
print(f"  DATA_DOMAIN=nyse CANNED_DATA=true PORT=3000 node app.js")
