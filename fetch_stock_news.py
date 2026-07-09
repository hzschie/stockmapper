#!/usr/bin/env python3
"""
Fetch news for all stocks and cache them as JSON files.

This script fetches news from Yahoo Finance via yfinance for each stock
in stk.csv and saves them in the format StockMapper expects.
"""

import yfinance as yf
import json
import csv
from pathlib import Path
from datetime import datetime
import time
from tqdm import tqdm

# Configuration
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / 'public' / 'data' / 'nyse'
STOCKS_FILE = DATA_DIR / 'stk.csv'
NEWS_CACHE_DIR = DATA_DIR / 'news_cache'
RATE_LIMIT_DELAY = 0.3  # Seconds between requests
MAX_NEWS_PER_STOCK = 10

# Create news cache directory
NEWS_CACHE_DIR.mkdir(parents=True, exist_ok=True)

def fetch_stock_news(symbol):
    """
    Fetch news for a stock symbol using yfinance.
    
    Returns:
        list of news items in StockMapper format:
        [{ t: timestamp_ms, title: string, source: string, href: url }, ...]
    """
    try:
        ticker = yf.Ticker(symbol)
        news = ticker.news
        
        # Check if news is None or empty
        if not news or news is None:
            return []
        
        formatted_news = []
        for item in news[:MAX_NEWS_PER_STOCK]:
            # Handle case where item might be None
            if item is None:
                continue
                
            content = item.get('content', {})
            
            # Skip if content is None or empty
            if not content:
                continue
            
            # Get timestamp
            pub_date = content.get('pubDate', '')
            if pub_date:
                try:
                    dt = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                    timestamp_ms = int(dt.timestamp() * 1000)
                except:
                    timestamp_ms = int(datetime.now().timestamp() * 1000)
            else:
                timestamp_ms = int(datetime.now().timestamp() * 1000)
            
            # Get title
            title = content.get('title', 'No title')
            
            # Get source
            provider = content.get('provider', {})
            source = provider.get('displayName', 'Yahoo Finance')
            
            # Get URL
            click_through = content.get('clickThroughUrl', {})
            href = click_through.get('url', content.get('canonicalUrl', {}).get('url', ''))
            
            if title and href:  # Only include if we have both title and link
                formatted_news.append({
                    't': timestamp_ms,
                    'title': title,
                    'source': source,
                    'href': href
                })
        
        return formatted_news
    
    except Exception as e:
        print(f"    ✗ Error fetching news for {symbol}: {e}")
        return []

def save_news_cache(symbol, news):
    """Save news to cache file."""
    try:
        # Use same filename format as other cache files
        filename = f"{symbol}_news.json"
        filepath = NEWS_CACHE_DIR / filename
        
        with open(filepath, 'w') as f:
            json.dump(news, f, separators=(',', ':'))
        
        return filepath
    except Exception as e:
        print(f"    ✗ Error saving news cache for {symbol}: {e}")
        return None

def load_stock_symbols():
    """Load stock symbols from stk.csv."""
    symbols = []
    with open(STOCKS_FILE, 'r') as f:
        # Skip first line (special header)
        f.readline()
        reader = csv.DictReader(f)
        for row in reader:
            ticker = row.get('TICKER', '').strip()
            if ticker:
                symbols.append(ticker)
    return symbols

def main():
    """Main execution."""
    print("=" * 60)
    print("Stock News Fetcher")
    print("=" * 60)
    print(f"Data directory: {DATA_DIR}")
    print(f"News cache directory: {NEWS_CACHE_DIR}")
    print()
    
    # Load stock symbols
    print("Loading stock symbols...")
    symbols = load_stock_symbols()
    print(f"✓ Loaded {len(symbols)} stock symbols")
    print()
    
    # Limit to first 100 for initial test (comment out for full run)
    # symbols = symbols[:100]
    # print(f"⚠️  Limited to first {len(symbols)} stocks for testing")
    # print()
    
    # Add index symbols
    index_symbols = ['^GSPC', '^NDX']
    all_symbols = index_symbols + symbols
    
    # Fetch news for each stock
    print(f"Fetching news for {len(all_symbols)} stocks (including {len(index_symbols)} indices)...")
    print(f"Estimated time: ~{len(all_symbols) * RATE_LIMIT_DELAY / 60:.1f} minutes")
    print()
    
    success_count = 0
    failed_count = 0
    empty_count = 0
    
    for i, symbol in enumerate(tqdm(all_symbols, desc="Processing stocks")):
        
        # Fetch news
        news = fetch_stock_news(symbol)
        
        if news:
            # Save to cache
            save_news_cache(symbol, news)
            success_count += 1
            if i < 5:  # Show details for first 5
                print(f"\n  {symbol}: {len(news)} news items")
        else:
            empty_count += 1
        
        # Rate limiting
        time.sleep(RATE_LIMIT_DELAY)
    
    # Summary
    print()
    print("=" * 60)
    print("✓ News fetching complete!")
    print(f"  Success: {success_count} stocks with news")
    print(f"  Empty: {empty_count} stocks with no news")
    print(f"  Total files: {len(list(NEWS_CACHE_DIR.glob('*.json')))}")
    print("=" * 60)

if __name__ == '__main__':
    main()
