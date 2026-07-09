#!/usr/bin/env python3
"""
Fetch cache data for US stocks that are missing cache files
"""

import os
import time
import yfinance as yf
import json
import pandas as pd
from tqdm import tqdm

CACHE_DIR = 'public/data/nyse/cache'
STK_FILE = 'public/data/nyse/stk.csv'

def fetch_and_save_cache(symbol):
    """Fetch all three cache types for a symbol"""
    ticker = yf.Ticker(symbol)
    
    try:
        # Fetch intraday (5-minute intervals, last day)
        intraday = ticker.history(period='1d', interval='5m')
        if not intraday.empty:
            intraday_data = {
                'headers': ['t', 'price', 'volume'],
                'data': [[int(idx.timestamp() * 1000), row['Close'], int(row['Volume'])] 
                        for idx, row in intraday.iterrows()]
            }
            with open(f'{CACHE_DIR}/{symbol}_intraday.json', 'w') as f:
                json.dump(intraday_data, f)
        
        # Fetch 5-day (1-hour intervals)
        five_day = ticker.history(period='5d', interval='1h')
        if not five_day.empty:
            five_day_data = {
                'headers': ['t', 'price', 'volume'],
                'data': [[int(idx.timestamp() * 1000), row['Close'], int(row['Volume'])] 
                        for idx, row in five_day.iterrows()]
            }
            with open(f'{CACHE_DIR}/{symbol}_5day.json', 'w') as f:
                json.dump(five_day_data, f)
        
        # Fetch daily (2 years)
        daily = ticker.history(period='2y', interval='1d')
        if not daily.empty:
            daily_data = {
                'headers': ['t', 'price', 'volume'],
                'data': [[int(idx.timestamp() * 1000), row['Close'], int(row['Volume'])] 
                        for idx, row in daily.iterrows()]
            }
            with open(f'{CACHE_DIR}/{symbol}_daily.json', 'w') as f:
                json.dump(daily_data, f)
        
        return True
    except Exception as e:
        print(f"\n  Error fetching {symbol}: {e}")
        return False

def main():
    # Read stocks from stk.csv
    df = pd.read_csv(STK_FILE, skiprows=1)
    
    # Filter US stocks
    us_exchanges = ['NYSE Euronext', 'NASDAQ Global Select', 'NASDAQ', 'NYSE', 'AMEX']
    us_stocks = df[df['EXCHANGE'].isin(us_exchanges)]
    
    # Check which are missing cache
    cache_files = set(os.listdir(CACHE_DIR))
    missing = []
    
    for ticker in us_stocks['TICKER']:
        if f"{ticker}_daily.json" not in cache_files:
            missing.append(ticker)
    
    print(f"Found {len(missing)} US stocks without cache data")
    print(f"Total US stocks: {len(us_stocks)}")
    
    if not missing:
        print("All US stocks already have cache data!")
        return
    
    # Show first few
    print(f"First 10: {missing[:10]}")
    
    response = input(f"\nFetch cache data for all {len(missing)} stocks? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled")
        return
    
    success = 0
    failed = []
    
    for symbol in tqdm(missing, desc="Fetching cache data"):
        if fetch_and_save_cache(symbol):
            success += 1
        else:
            failed.append(symbol)
        
        # Rate limiting
        time.sleep(0.5)
    
    print(f"\n✅ Successfully fetched: {success}/{len(missing)}")
    if failed:
        print(f"❌ Failed: {len(failed)}")
        print(f"   {failed[:10]}")

if __name__ == '__main__':
    main()
