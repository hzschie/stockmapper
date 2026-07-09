import pandas as pd
import yfinance as yf
from pathlib import Path
import time
from tqdm import tqdm

# Paths
BASE_DIR = Path('/Users/hermannair/Documents/GitHub/stockmapper')
DATA_DIR = BASE_DIR / 'public' / 'data' / 'nyse'
CACHE_DIR = DATA_DIR / 'cache'
STK_CSV = DATA_DIR / 'stk.csv'

print("Loading existing metadata from stk.csv...")
# Load existing metadata
stk_df = pd.read_csv(STK_CSV, skiprows=1)  # Skip header row
print(f"✓ Loaded {len(stk_df)} stocks from stk.csv")

# Get all cached stock symbols
print("\nScanning cache directory for stock symbols...")
cached_symbols = set()
for cache_file in CACHE_DIR.glob('*_daily.json'):
    symbol = cache_file.stem.replace('_daily', '')
    cached_symbols.add(symbol)

print(f"✓ Found {len(cached_symbols)} cached stocks")

# Find missing stocks
existing_tickers = set(stk_df['TICKER'].tolist())
missing_symbols = cached_symbols - existing_tickers

print(f"\n📊 Summary:")
print(f"  Stocks in stk.csv: {len(existing_tickers)}")
print(f"  Stocks with cache: {len(cached_symbols)}")
print(f"  Missing metadata: {len(missing_symbols)}")

if len(missing_symbols) == 0:
    print("\n✓ All cached stocks already have metadata!")
    exit(0)

# Industry mapping (common Yahoo Finance sectors to simplified categories)
INDUSTRY_MAP = {
    'Technology': 'Technology',
    'Healthcare': 'Health Care',
    'Financial Services': 'Financials',
    'Consumer Cyclical': 'Services',
    'Consumer Defensive': 'Goods',
    'Industrials': 'Industrials',
    'Basic Materials': 'Materials',
    'Energy': 'Oil & Gas',
    'Utilities': 'Utilities',
    'Real Estate': 'Financials',
    'Communication Services': 'Services',
}

def fetch_stock_metadata(symbol):
    """Fetch metadata for a stock symbol from Yahoo Finance"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        name = info.get('longName') or info.get('shortName') or symbol
        exchange = info.get('exchange', 'NYSE Euronext')
        country = info.get('country', 'United States')
        sector = info.get('sector', '')
        industry = INDUSTRY_MAP.get(sector, 'Services')
        
        return {
            'TICKER': symbol,
            'NAME': name,
            'EXCHANGE': exchange,
            'COUNTRY': country,
            'INDUS': industry
        }
    except Exception as e:
        print(f"    ✗ Error fetching {symbol}: {e}")
        return None

# Fetch metadata for missing stocks
new_stocks = []
failed_symbols = []

print(f"\n🔄 Fetching metadata for {len(missing_symbols)} missing stocks...")
print("This may take several minutes...\n")

for symbol in tqdm(sorted(list(missing_symbols)), desc="Processing"):
    metadata = fetch_stock_metadata(symbol)
    
    if metadata:
        new_stocks.append(metadata)
    else:
        failed_symbols.append(symbol)
    
    time.sleep(0.5)  # Rate limiting

# Combine and save
if new_stocks:
    new_df = pd.DataFrame(new_stocks)
    updated_df = pd.concat([stk_df, new_df], ignore_index=True)
    updated_df = updated_df.sort_values('TICKER')
    
    # Save with header row
    print(f"\n💾 Saving updated data to {STK_CSV.name}...")
    with open(STK_CSV, 'w') as f:
        f.write('"New Stock List as of 1/17/2014",,,,\n')
        updated_df.to_csv(f, index=False)
    
    print(f"\n✅ SUCCESS! Updated stk.csv with {len(new_stocks)} new stocks")
    print(f"  Total stocks now: {len(updated_df)}")
    if failed_symbols:
        print(f"  Failed to fetch: {len(failed_symbols)}")
        if len(failed_symbols) <= 10:
            print(f"  Failed symbols: {', '.join(failed_symbols)}")
else:
    print("\n⚠️  No new stocks were added")

# Print summary by industry
if new_stocks:
    print("\n📈 Distribution by industry:")
    industry_counts = updated_df['INDUS'].value_counts()
    for industry, count in industry_counts.items():
        print(f"  {industry}: {count}")

print("\n✓ Done! Restart your server to see the updated grouping.")
