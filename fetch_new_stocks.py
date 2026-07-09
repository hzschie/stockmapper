#!/usr/bin/env python3
"""
Fetch timeseries data for new stocks.
This script processes stocks listed in new_stocks_to_fetch.txt
"""

import pandas as pd
import numpy as np
import yfinance as yf
import json
from pathlib import Path
from datetime import datetime, timedelta
import time

# Define paths
BASE_DIR = Path('/Users/hermannair/Documents/GitHub/stockmapper')
DATA_DIR = BASE_DIR / 'public' / 'data' / 'nyse'
CACHE_DIR = DATA_DIR / 'cache'
NEW_STOCKS_FILE = BASE_DIR / 'new_stocks_to_fetch.txt'

# Configuration
RATE_LIMIT_DELAY = 0.5  # Seconds between API calls
MAX_RETRIES = 3

print("="*60)
print("Fetching timeseries data for new stocks")
print("="*60)

# Load new stocks list
with open(NEW_STOCKS_FILE, 'r') as f:
    new_symbols = [line.strip() for line in f if line.strip()]

print(f"\n✓ Loaded {len(new_symbols)} new stocks to process")
print(f"Estimated time: ~{len(new_symbols) * 3 * RATE_LIMIT_DELAY / 60:.1f} minutes\n")

def format_timeseries_data(hist_df):
    """Convert yfinance history DataFrame to StockMapper format."""
    if hist_df is None or hist_df.empty:
        return None
    
    data_rows = []
    for timestamp, row in hist_df.iterrows():
        ts_ms = int(timestamp.timestamp() * 1000)
        price = round(row['Close'], 2)
        volume = int(row['Volume']) if not pd.isna(row['Volume']) else 0
        data_rows.append([ts_ms, price, volume])
    
    return {
        "headers": ["t", "price", "volume"],
        "data": data_rows
    }

def fetch_intraday_data(symbol):
    """Fetch intraday data (1 day at 5-minute intervals)."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='1d', interval='5m')
        if hist.empty:
            return None
        return format_timeseries_data(hist)
    except Exception as e:
        print(f"    ✗ Error fetching intraday for {symbol}: {e}")
        return None

def fetch_5day_data(symbol):
    """Fetch 5-day intraday data."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='5d', interval='1h')
        if hist.empty:
            return None
        return format_timeseries_data(hist)
    except Exception as e:
        print(f"    ✗ Error fetching 5day for {symbol}: {e}")
        return None

def fetch_daily_data(symbol):
    """Fetch daily historical data."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period='2y', interval='1d')
        if hist.empty:
            return None
        return format_timeseries_data(hist)
    except Exception as e:
        print(f"    ✗ Error fetching daily for {symbol}: {e}")
        return None

def save_cache_file(symbol, data_type, data):
    """Save time series data as JSON cache file."""
    if data is None:
        return None
    
    try:
        filename = f"{symbol}_{data_type}.json"
        filepath = CACHE_DIR / filename
        with open(filepath, 'w') as f:
            json.dump(data, f, separators=(',', ':'))
        return filepath
    except Exception as e:
        print(f"    ✗ Error saving cache for {symbol} {data_type}: {e}")
        return None

def process_stock(symbol):
    """Fetch and cache all time series data for a single stock."""
    results = {
        'symbol': symbol,
        'intraday': False,
        '5day': False,
        'daily': False,
        'success': False
    }
    
    try:
        print(f"  Processing {symbol}...", flush=True)
        
        # Fetch intraday data
        intraday_data = fetch_intraday_data(symbol)
        if intraday_data:
            save_cache_file(symbol, 'intraday', intraday_data)
            results['intraday'] = True
            print(f"    ✓ Intraday: {len(intraday_data['data'])} data points")
        
        time.sleep(RATE_LIMIT_DELAY)
        
        # Fetch 5-day data
        day5_data = fetch_5day_data(symbol)
        if day5_data:
            save_cache_file(symbol, '5day', day5_data)
            results['5day'] = True
            print(f"    ✓ 5-day: {len(day5_data['data'])} data points")
        
        time.sleep(RATE_LIMIT_DELAY)
        
        # Fetch daily data
        daily_data = fetch_daily_data(symbol)
        if daily_data:
            save_cache_file(symbol, 'daily', daily_data)
            results['daily'] = True
            print(f"    ✓ Daily: {len(daily_data['data'])} data points")
        
        results['success'] = any([results['intraday'], results['5day'], results['daily']])
        
    except Exception as e:
        print(f"    ✗ Error processing {symbol}: {e}")
    
    return results

# Process all new stocks
success_count = 0
failed_symbols = []

for i, symbol in enumerate(new_symbols):
    print(f"\n[{i+1}/{len(new_symbols)}]", end=" ")
    result = process_stock(symbol)
    
    if result['success']:
        success_count += 1
    else:
        failed_symbols.append(symbol)
    
    time.sleep(RATE_LIMIT_DELAY)

# Print summary
print(f"\n{'='*60}")
print(f"✓ Processing complete!")
print(f"  Success: {success_count}/{len(new_symbols)}")
print(f"  Failed: {len(failed_symbols)}")
if failed_symbols:
    print(f"\n  Failed symbols: {', '.join(failed_symbols)}")
print(f"{'='*60}")

print(f"\n✓ Next step: Run 'python3 generate_nyse_data.py' to update heatmap.cache")
