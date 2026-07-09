#!/usr/bin/env python3
"""
Fetch current S&P 500 and NASDAQ-100 constituents and update the index groups
"""

import pandas as pd
import yfinance as yf
import json
import os
import time
from tqdm import tqdm

CACHE_DIR = 'public/data/nyse/cache'
STK_FILE = 'public/data/nyse/stk.csv'
GROUPS_FILE = 'public/data/nyse/groups.json'

# Industry mapping
INDUSTRY_MAP = {
    'Technology': 'Technology',
    'Healthcare': 'Health Care',
    'Financial Services': 'Financials',
    'Communication Services': 'Services',
    'Consumer Cyclical': 'Goods',
    'Industrials': 'Industrials',
    'Consumer Defensive': 'Goods',
    'Energy': 'Oil & Gas',
    'Basic Materials': 'Materials',
    'Real Estate': 'Financials',
    'Utilities': 'Utilities'
}

def fetch_sp500_constituents():
    """Fetch S&P 500 constituents from Wikipedia"""
    print("Fetching S&P 500 constituents from Wikipedia...")
    try:
        url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        
        # Fetch with headers to avoid 403
        import urllib.request
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            html = response.read()
        
        tables = pd.read_html(html)
        sp500_df = tables[0]
        
        # Extract ticker symbols - replace . with - for Yahoo Finance
        tickers = sp500_df['Symbol'].str.replace('.', '-', regex=False).tolist()
        
        print(f"  Found {len(tickers)} S&P 500 stocks")
        return tickers
    except Exception as e:
        print(f"  Error: {e}")
        return None

def fetch_nasdaq100_constituents():
    """Fetch NASDAQ-100 constituents from Wikipedia"""
    print("Fetching NASDAQ-100 constituents from Wikipedia...")
    try:
        url = 'https://en.wikipedia.org/wiki/Nasdaq-100'
        
        # Fetch with headers to avoid 403
        import urllib.request
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            html = response.read()
        
        tables = pd.read_html(html)
        nasdaq100_df = tables[4]  # The constituents table
        
        # Extract ticker symbols
        tickers = nasdaq100_df['Ticker'].tolist()
        
        print(f"  Found {len(tickers)} NASDAQ-100 stocks")
        return tickers
    except Exception as e:
        print(f"  Error: {e}")
        return None

def fetch_stock_metadata(symbol):
    """Fetch metadata for a stock from Yahoo Finance"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        if not info or 'symbol' not in info:
            return None
        
        name = info.get('longName', info.get('shortName', symbol))
        exchange = info.get('exchange', 'Unknown')
        country = info.get('country', 'United States')
        sector = info.get('sector', 'Unknown')
        
        # Map to simplified industry
        industry = INDUSTRY_MAP.get(sector, 'Services')
        
        return {
            'ticker': symbol,
            'name': name,
            'exchange': exchange,
            'country': country,
            'industry': industry
        }
    except Exception as e:
        print(f"    Error fetching {symbol}: {e}")
        return None

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
        return False

def main():
    # Fetch current index constituents
    sp500_tickers = fetch_sp500_constituents()
    nasdaq100_tickers = fetch_nasdaq100_constituents()
    
    if not sp500_tickers or not nasdaq100_tickers:
        print("Failed to fetch index constituents!")
        return
    
    print(f"\n{'='*70}")
    print("INDEX CONSTITUENTS SUMMARY")
    print(f"{'='*70}")
    print(f"S&P 500: {len(sp500_tickers)} stocks")
    print(f"NASDAQ-100: {len(nasdaq100_tickers)} stocks")
    print()
    
    # Read current data
    df = pd.read_csv(STK_FILE, skiprows=1)
    existing_tickers = set(df['TICKER'].tolist())
    cache_files = set(os.listdir(CACHE_DIR))
    
    with open(GROUPS_FILE) as f:
        groups = json.load(f)
    
    # Find current S&P 500 and NASDAQ-100 groups
    sp500_group = next((g for g in groups if g['name'] == 'S&P 500'), None)
    nasdaq100_group = next((g for g in groups if g['name'] == 'NASDAQ 100'), None)
    
    current_sp500 = set(sp500_group['ids']) if sp500_group else set()
    current_nasdaq100 = set(nasdaq100_group['ids']) if nasdaq100_group else set()
    
    # Analyze differences
    print(f"{'='*70}")
    print("ANALYSIS")
    print(f"{'='*70}")
    
    sp500_new = set(sp500_tickers) - current_sp500
    sp500_removed = current_sp500 - set(sp500_tickers)
    
    nasdaq100_new = set(nasdaq100_tickers) - current_nasdaq100
    nasdaq100_removed = current_nasdaq100 - set(nasdaq100_tickers)
    
    print(f"\nS&P 500:")
    print(f"  Current in your data: {len(current_sp500)}")
    print(f"  Current actual (2026): {len(sp500_tickers)}")
    print(f"  New stocks to add: {len(sp500_new)}")
    print(f"  Removed stocks: {len(sp500_removed)}")
    
    print(f"\nNASDAQ-100:")
    print(f"  Current in your data: {len(current_nasdaq100)}")
    print(f"  Current actual (2026): {len(nasdaq100_tickers)}")
    print(f"  New stocks to add: {len(nasdaq100_new)}")
    print(f"  Removed stocks: {len(nasdaq100_removed)}")
    
    # Show samples
    if sp500_new:
        print(f"\nSample new S&P 500 stocks: {list(sp500_new)[:10]}")
    if sp500_removed:
        print(f"Sample removed S&P 500 stocks: {list(sp500_removed)[:10]}")
    
    print(f"\n{'='*70}")
    response = input("Update index groups and fetch missing data? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled")
        return
    
    # Process new stocks
    all_new_tickers = sp500_new | nasdaq100_new
    new_stocks_data = []
    
    if all_new_tickers:
        print(f"\nFetching metadata for {len(all_new_tickers)} new stocks...")
        for ticker in tqdm(sorted(all_new_tickers), desc="Metadata"):
            metadata = fetch_stock_metadata(ticker)
            if metadata:
                new_stocks_data.append(metadata)
            time.sleep(0.5)
        
        # Add to stk.csv
        if new_stocks_data:
            print(f"\nAdding {len(new_stocks_data)} new stocks to stk.csv...")
            new_rows = []
            for stock in new_stocks_data:
                if stock['ticker'] not in existing_tickers:
                    new_rows.append({
                        'TICKER': stock['ticker'],
                        'NAME': stock['name'],
                        'EXCHANGE': stock['exchange'],
                        'COUNTRY': stock['country'],
                        'INDUS': stock['industry']
                    })
            
            if new_rows:
                new_df = pd.DataFrame(new_rows)
                df = pd.concat([df, new_df], ignore_index=True)
                
                # Write back to CSV
                with open(STK_FILE, 'w') as f:
                    f.write('"New Stock List as of 1/17/2014",,,\n')
                df.to_csv(f, index=False)
                
                print(f"  Added {len(new_rows)} new stocks to stk.csv")
        
        # Fetch cache data
        print(f"\nFetching cache data for new stocks...")
        success = 0
        for ticker in tqdm(sorted(all_new_tickers), desc="Cache"):
            if f"{ticker}_daily.json" not in cache_files:
                if fetch_and_save_cache(ticker):
                    success += 1
            time.sleep(0.5)
        
        print(f"  Fetched cache for {success}/{len(all_new_tickers)} stocks")
    
    # Update groups.json
    print(f"\nUpdating index groups in groups.json...")
    
    if sp500_group:
        sp500_group['ids'] = sorted(sp500_tickers)
    else:
        sp500_group = {
            'name': 'S&P 500',
            'nickname': 'S&P 500',
            'category': 'Index',
            'ids': sorted(sp500_tickers),
            'type': 'index',
            'id': '^GSPC'
        }
        groups.append(sp500_group)
    
    if nasdaq100_group:
        nasdaq100_group['ids'] = sorted(nasdaq100_tickers)
    else:
        nasdaq100_group = {
            'name': 'NASDAQ 100',
            'nickname': 'NASDAQ 100',
            'category': 'Index',
            'ids': sorted(nasdaq100_tickers),
            'type': 'index',
            'id': '^NDX'
        }
        groups.append(nasdaq100_group)
    
    with open(GROUPS_FILE, 'w') as f:
        json.dump(groups, f, indent=2)
    
    print(f"\n{'='*70}")
    print("✅ UPDATE COMPLETE")
    print(f"{'='*70}")
    print(f"S&P 500: Updated to {len(sp500_tickers)} stocks")
    print(f"NASDAQ-100: Updated to {len(nasdaq100_tickers)} stocks")
    print()
    print("Next steps:")
    print("  1. Run: DATA_DOMAIN=nyse node build_definitions.js")
    print("  2. Restart your server")

if __name__ == '__main__':
    main()
