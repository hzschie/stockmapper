#!/usr/bin/env python3
"""
Analyze cache coverage for S&P 500 and Nasdaq 100 stocks.
"""
import os
import json
import pandas as pd
from pathlib import Path

def get_cached_symbols():
    """Get all stock symbols that have cached data."""
    cache_dir = Path('/Users/hermannair/Documents/GitHub/stockmapper/public/data/nyse/cache')
    cached_files = list(cache_dir.glob('*_daily.json'))
    symbols = sorted([f.stem.replace('_daily', '') for f in cached_files])
    return symbols

def get_sp500_stocks():
    """Fetch complete S&P 500 stock list from Wikipedia."""
    try:
        import requests
        from io import StringIO
        
        # Use headers to avoid 403
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        response = requests.get(url, headers=headers)
        tables = pd.read_html(StringIO(response.text))
        sp500_df = tables[0]
        
        # Extract symbol and company name
        stocks = []
        for _, row in sp500_df.iterrows():
            symbol = str(row['Symbol']).strip()
            name = str(row['Security']).strip()
            stocks.append((symbol, name))
        
        return stocks
    except Exception as e:
        print(f"Error fetching S&P 500: {e}")
        return []

def get_nasdaq100_stocks():
    """Fetch Nasdaq 100 stock list from Wikipedia."""
    try:
        import requests
        from io import StringIO
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        url = 'https://en.wikipedia.org/wiki/Nasdaq-100'
        response = requests.get(url, headers=headers)
        tables = pd.read_html(StringIO(response.text))
        nasdaq_df = tables[6]  # The constituent stocks table (Table 6)
        
        stocks = []
        for _, row in nasdaq_df.iterrows():
            symbol = str(row['Ticker']).strip()
            name = str(row['Company']).strip()
            stocks.append((symbol, name))
        
        return stocks
    except Exception as e:
        print(f"Error fetching Nasdaq 100: {e}")
        return []

def get_stock_name_from_yfinance(symbol):
    """Try to get stock name from yfinance."""
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return info.get('longName') or info.get('shortName') or symbol
    except:
        return symbol

def main():
    print("Analyzing cache coverage...\n")
    
    # Get cached symbols
    cached_symbols = get_cached_symbols()
    print(f"Total cached stocks: {len(cached_symbols)}")
    
    # Get S&P 500 stocks
    print("\nFetching S&P 500 list...")
    sp500_stocks = get_sp500_stocks()
    sp500_symbols = {symbol for symbol, name in sp500_stocks}
    print(f"S&P 500 stocks: {len(sp500_symbols)}")
    
    # Get Nasdaq 100 stocks
    print("Fetching Nasdaq 100 list...")
    nasdaq100_stocks = get_nasdaq100_stocks()
    nasdaq100_symbols = {symbol for symbol, name in nasdaq100_stocks}
    print(f"Nasdaq 100 stocks: {len(nasdaq100_symbols)}")
    
    # Find overlaps
    cached_set = set(cached_symbols)
    sp500_cached = sp500_symbols & cached_set
    nasdaq100_cached = nasdaq100_symbols & cached_set
    
    print(f"\n=== COVERAGE ANALYSIS ===")
    print(f"S&P 500 stocks with cache: {len(sp500_cached)} / {len(sp500_symbols)}")
    print(f"Nasdaq 100 stocks with cache: {len(nasdaq100_cached)} / {len(nasdaq100_symbols)}")
    print(f"Total unique stocks in S&P 500 + Nasdaq 100: {len(sp500_symbols | nasdaq100_symbols)}")
    print(f"Total cached from both indices: {len(sp500_cached | nasdaq100_cached)}")
    print(f"Total cached (all stocks): {len(cached_symbols)}")
    
    # Find missing stocks
    sp500_missing = sp500_symbols - cached_set
    nasdaq100_missing = nasdaq100_symbols - cached_set
    
    if sp500_missing:
        print(f"\nMissing S&P 500 stocks ({len(sp500_missing)}):")
        print(", ".join(sorted(sp500_missing)))
    
    if nasdaq100_missing:
        print(f"\nMissing Nasdaq 100 stocks ({len(nasdaq100_missing)}):")
        print(", ".join(sorted(nasdaq100_missing)))
    
    # Create master stock list with all cached stocks
    print("\n=== Building master stock list ===")
    
    # Create dict of symbols to names from index lists
    symbol_to_name = {}
    for symbol, name in sp500_stocks:
        symbol_to_name[symbol] = name
    for symbol, name in nasdaq100_stocks:
        if symbol not in symbol_to_name:
            symbol_to_name[symbol] = name
    
    # Build stock list data
    stock_data = []
    for symbol in cached_symbols:
        name = symbol_to_name.get(symbol, symbol)
        stock_data.append([symbol, name])
    
    # Save to stocks.json
    stocks_json = {
        "headers": ["id", "name"],
        "data": stock_data
    }
    
    output_path = '/Users/hermannair/Documents/GitHub/stockmapper/public/data/nyse/stocks.json'
    with open(output_path, 'w') as f:
        json.dump(stocks_json, f, indent=2)
    
    print(f"✓ Updated {output_path}")
    print(f"✓ Added {len(stock_data)} stocks with cached data")
    
    # Also save CSV version
    csv_path = '/Users/hermannair/Documents/GitHub/stockmapper/public/data/nyse/stocks.csv'
    df = pd.DataFrame(stock_data, columns=['Symbol', 'Name'])
    df.to_csv(csv_path, index=False)
    print(f"✓ Updated {csv_path}")

if __name__ == '__main__':
    main()
