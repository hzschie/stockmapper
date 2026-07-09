import pandas as pd
from pathlib import Path

BASE_DIR = Path('/Users/hermannair/Documents/GitHub/stockmapper')
DATA_DIR = BASE_DIR / 'public' / 'data' / 'nyse'
CACHE_DIR = DATA_DIR / 'cache'
STK_CSV = DATA_DIR / 'stk.csv'

print("📊 Stock Data Coverage Report")
print("=" * 60)

# Load metadata
print("\n1. Loading metadata from stk.csv...")
stk_df = pd.read_csv(STK_CSV, skiprows=1)
metadata_symbols = set(stk_df['TICKER'].tolist())
print(f"   ✓ Found {len(metadata_symbols)} stocks in metadata")

# Check cache files
print("\n2. Scanning cache directory...")
cached_symbols = set()
cache_types = {'intraday': 0, '5day': 0, 'daily': 0}

for cache_file in CACHE_DIR.glob('*.json'):
    if '_intraday.json' in cache_file.name:
        cache_types['intraday'] += 1
    elif '_5day.json' in cache_file.name:
        cache_types['5day'] += 1
    elif '_daily.json' in cache_file.name:
        cache_types['daily'] += 1
        symbol = cache_file.stem.replace('_daily', '')
        cached_symbols.add(symbol)

print(f"   ✓ Found {len(cached_symbols)} unique stocks with cache")
print(f"   ✓ Cache files: {cache_types['intraday']} intraday, {cache_types['5day']} 5-day, {cache_types['daily']} daily")

# Calculate coverage
with_both = metadata_symbols & cached_symbols
missing_metadata = cached_symbols - metadata_symbols
missing_cache = metadata_symbols - cached_symbols

print("\n3. Coverage Analysis")
print("=" * 60)
print(f"   Stocks with BOTH metadata AND cache:  {len(with_both):4d} ✓")
print(f"   Stocks with cache but NO metadata:    {len(missing_metadata):4d} ⚠️")
print(f"   Stocks with metadata but NO cache:    {len(missing_cache):4d} ℹ️")
print("=" * 60)

if missing_metadata:
    print(f"\n4. Stocks missing metadata (up to 20):")
    for symbol in sorted(list(missing_metadata))[:20]:
        print(f"   • {symbol}")
    if len(missing_metadata) > 20:
        print(f"   ... and {len(missing_metadata) - 20} more")
    print(f"\n   💡 Run 'python update_stock_metadata.py' to fix this")

if missing_cache:
    print(f"\n5. Stocks missing cache (up to 10):")
    for symbol in sorted(list(missing_cache))[:10]:
        print(f"   • {symbol}")
    if len(missing_cache) > 10:
        print(f"   ... and {len(missing_cache) - 10} more")

# Industry breakdown
print(f"\n6. Industry Distribution:")
industry_counts = stk_df['INDUS'].value_counts()
for industry, count in industry_counts.head(10).items():
    print(f"   {industry:20s}: {count:4d}")

print("\n" + "=" * 60)
print("Report complete!")
