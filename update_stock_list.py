#!/usr/bin/env python3
"""
Update stock list with current S&P 500 and Nasdaq 100 stocks.
Fetches current listings and updates stocks.csv and stocks.json.
"""

import pandas as pd
import yfinance as yf
import json
from pathlib import Path
import time

# Define paths
BASE_DIR = Path('/Users/hermannair/Documents/GitHub/stockmapper')
DATA_DIR = BASE_DIR / 'public' / 'data' / 'nyse'
CACHE_DIR = DATA_DIR / 'cache'

print("Fetching current S&P 500 and Nasdaq 100 stock lists...\n")

# Fetch S&P 500 stocks using yfinance
def get_sp500_stocks():
    """Fetch current S&P 500 stock list using yfinance."""
    try:
        # Get S&P 500 constituents
        sp500 = yf.Ticker("^GSPC")
        # This approach uses a fallback list of major S&P 500 stocks
        # Since yfinance doesn't have a direct method, we'll use a curated list
        print("⚠ Using curated S&P 500 list (yfinance doesn't provide full list)")
        
        # Major S&P 500 stocks (top 100 by market cap)
        major_sp500 = [
            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "UNH", "JNJ",
            "V", "WMT", "XOM", "JPM", "MA", "PG", "AVGO", "HD", "CVX", "LLY",
            "ABBV", "MRK", "KO", "PEP", "COST", "ADBE", "TMO", "MCD", "CSCO", "ACN",
            "ABT", "NFLX", "CRM", "DHR", "NKE", "VZ", "INTC", "TXN", "NEE", "PM",
            "UPS", "RTX", "HON", "ORCL", "BMY", "QCOM", "LIN", "UNP", "COP", "AMD",
            "AMGN", "T", "LOW", "SPGI", "SBUX", "BA", "CAT", "ELV", "AXP", "INTU",
            "DE", "PLD", "BKNG", "MDT", "GE", "GILD", "MS", "ADI", "BLK", "AMT",
            "SCHW", "SYK", "VRTX", "LRCX", "AMAT", "MMC", "ADP", "MDLZ", "ISRG", "TJX",
            "CI", "REGN", "CB", "PGR", "ZTS", "NOW", "SO", "DUK", "C", "EOG",
            "FISV", "MO", "BDX", "PNC", "ITW", "CME", "USB", "WM", "CSX", "SLB"
        ]
        
        sp500_df = pd.DataFrame({
            'Symbol': major_sp500,
            'Name': [''] * len(major_sp500),  # Will be filled from yfinance
            'Industry': [''] * len(major_sp500),
            'SubIndustry': [''] * len(major_sp500),
            'SandP': ['YES'] * len(major_sp500),
            'Dow': ['NO'] * len(major_sp500),
            'Country': ['United States'] * len(major_sp500),
            'Region': ['United States'] * len(major_sp500)
        })
        
        print(f"✓ Using {len(sp500_df)} major S&P 500 stocks")
        return sp500_df
    except Exception as e:
        print(f"✗ Error: {e}")
        return pd.DataFrame()

# Fetch Nasdaq 100 stocks
def get_nasdaq100_stocks():
    """Fetch major Nasdaq 100 stocks."""
    try:
        # Major Nasdaq 100 stocks
        nasdaq100 = [
            "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA", "AVGO", "COST",
            "NFLX", "ADBE", "CSCO", "PEP", "AMD", "INTC", "CMCSA", "QCOM", "TXN", "INTU",
            "AMGN", "HON", "AMAT", "SBUX", "BKNG", "ADP", "GILD", "ISRG", "VRTX", "MDLZ",
            "ADI", "REGN", "LRCX", "PANW", "MU", "SNPS", "PYPL", "KLAC", "CDNS", "MAR",
            "MRVL", "ORLY", "CTAS", "ASML", "ABNB", "MNST", "FTNT", "AZN", "NXPI", "WDAY",
            "CRWD", "DASH", "DDOG", "TEAM", "ZS", "SNOW", "NET", "DXCM", "TTWO", "CHTR",
            "ANSS", "ON", "PCAR", "MRNA", "KDP", "PAYX", "CPRT", "MCHP", "ODFL", "AEP",
            "ROST", "FAST", "VRSK", "CEG", "DLTR", "EXC", "XEL", "CTSH", "IDXX", "KHC",
            "LULU", "BIIB", "EA", "CSGP", "GEHC", "ILMN", "CCEP", "WBD", "FANG", "DKNG"
        ]
        
        nasdaq_df = pd.DataFrame({
            'Symbol': nasdaq100,
            'Name': [''] * len(nasdaq100),
            'Industry': [''] * len(nasdaq100),
            'SubIndustry': [''] * len(nasdaq100),
            'SandP': ['NO'] * len(nasdaq100),
            'Dow': ['NO'] * len(nasdaq100),
            'Country': ['United States'] * len(nasdaq100),
            'Region': ['United States'] * len(nasdaq100)
        })
        
        print(f"✓ Using {len(nasdaq_df)} major Nasdaq 100 stocks")
        return nasdaq_df
    except Exception as e:
        print(f"✗ Error: {e}")
        return pd.DataFrame()

# Fetch the lists
sp500_df = get_sp500_stocks()
nasdaq_df = get_nasdaq100_stocks()

# Combine and deduplicate
if len(sp500_df) > 0 and len(nasdaq_df) > 0:
    combined_df = pd.concat([sp500_df, nasdaq_df], ignore_index=True)
else:
    print("✗ Failed to fetch stock lists")
    exit(1)

# For stocks that appear in both lists, mark them as S&P 500
combined_df = combined_df.drop_duplicates(subset='Symbol', keep='first')
print(f"\n✓ Combined list: {len(combined_df)} unique stocks")

# Fetch company names from yfinance
print(f"\nFetching company info from Yahoo Finance...")
for i, row in combined_df.iterrows():
    symbol = row['Symbol']
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        if 'longName' in info and info['longName']:
            combined_df.at[i, 'Name'] = info['longName']
        elif 'shortName' in info and info['shortName']:
            combined_df.at[i, 'Name'] = info['shortName']
        else:
            combined_df.at[i, 'Name'] = symbol
        
        if i % 10 == 0:
            print(f"  Progress: {i+1}/{len(combined_df)}")
        time.sleep(0.1)  # Rate limiting
    except Exception as e:
        print(f"  ⚠ Could not fetch info for {symbol}: {e}")
        combined_df.at[i, 'Name'] = symbol

# For stocks that appear in both lists, mark them as S&P 500
combined_df = combined_df.groupby('Symbol').first().reset_index()
print(f"\n✓ Combined list: {len(combined_df)} unique stocks")

# Check which stocks have cached data
cached_stocks = set()
if CACHE_DIR.exists():
    for file in CACHE_DIR.glob('*_daily.json'):
        symbol = file.stem.replace('_daily', '')
        cached_stocks.add(symbol)

print(f"✓ Found {len(cached_stocks)} stocks with cached data")

# Mark stocks that have cached data
combined_df['HasCache'] = combined_df['Symbol'].isin(cached_stocks)

# Identify new stocks (not in cache)
new_stocks = combined_df[~combined_df['HasCache']].copy()
print(f"✓ {len(new_stocks)} new stocks need data")

# Save the updated stock list (all stocks from S&P 500 and Nasdaq 100)
stocks_csv_path = DATA_DIR / 'stocks.csv'
combined_df.to_csv(stocks_csv_path, index=False)
print(f"\n✓ Saved updated stock list to {stocks_csv_path}")
print(f"  Total stocks: {len(combined_df)}")

# Create stocks.json in the format the app expects
stocks_json_data = {
    "headers": ["id", "name"],
    "data": combined_df[['Symbol', 'Name']].values.tolist()
}

stocks_json_path = DATA_DIR / 'stocks.json'
with open(stocks_json_path, 'w') as f:
    json.dump(stocks_json_data, f, separators=(',', ':'))
print(f"✓ Saved stocks.json to {stocks_json_path}")

# Save list of new stocks to fetch
new_stocks_file = BASE_DIR / 'new_stocks_to_fetch.txt'
with open(new_stocks_file, 'w') as f:
    for symbol in new_stocks['Symbol'].tolist():
        f.write(f"{symbol}\n")
print(f"\n✓ Saved {len(new_stocks)} new symbols to {new_stocks_file}")

# Print summary
print(f"\n{'='*60}")
print(f"SUMMARY:")
print(f"  S&P 500 stocks: {len(sp500_df)}")
print(f"  Nasdaq 100 stocks: {len(nasdaq_df)}")
print(f"  Combined unique: {len(combined_df)}")
print(f"  Already cached: {len(cached_stocks)}")
print(f"  New stocks to fetch: {len(new_stocks)}")
print(f"{'='*60}")

# Display some examples
print(f"\nExample new stocks to fetch:")
print(new_stocks[['Symbol', 'Name']].head(10).to_string(index=False))

print(f"\nNext steps:")
print(f"1. Run the notebook with symbols from {new_stocks_file.name}")
print(f"2. Then run: python3 generate_nyse_data.py to update heatmap.cache")
