import pandas as pd
import yfinance as yf
import json
from pathlib import Path
from datetime import datetime, timedelta
import time
from tqdm import tqdm

# Paths
BASE_DIR = Path('/Users/hermannair/Documents/GitHub/stockmapper')
DATA_DIR = BASE_DIR / 'public' / 'data' / 'nyse'
STOCKS_CSV = DATA_DIR / 'stocks.csv'
STK_CSV = DATA_DIR / 'stk.csv'
CACHE_DIR = DATA_DIR / 'cache'

RATE_LIMIT_DELAY = 0.5  # Seconds between API calls

print("=" * 70)
print("ADDING EUROPEAN STOCKS - Euro Stoxx 50 & FTSE 100")
print("=" * 70)

# Euro Stoxx 50 constituents (as of 2026)
EURO_STOXX_50 = [
    'AIR.PA', 'AI.PA', 'MT.AS', 'ASML.AS', 'CS.PA', 'BNP.PA', 'EN.PA', 
    'ENGI.PA', 'OR.PA', 'SAN.PA', 'SGO.PA', 'SU.PA', 'VIE.PA', 'DG.PA',
    'MC.PA', 'RMS.PA', 'SAF.PA', 'DSY.PA', 'DTE.DE', 'ALV.DE', 'BAS.DE',
    'BAYN.DE', 'BMW.DE', 'DAI.DE', 'DBK.DE', 'DB1.DE', 'DPW.DE', 'DHL.DE',
    'EOAN.DE', 'FRE.DE', 'HEI.DE', 'HEN3.DE', 'IFX.DE', 'LIN.DE', 'MBG.DE',
    'MUV2.DE', 'RWE.DE', 'SAP.DE', 'SIE.DE', 'VOW3.DE', 'ABI.BR', 'AD.AS',
    'INGA.AS', 'PHIA.AS', 'IBE.MC', 'ITX.MC', 'REP.MC', 'TEF.MC', 'BBVA.MC',
    'SAN.MC', 'ENEL.MI'
]

# FTSE 100 constituents (major stocks)
FTSE_100 = [
    'AZN.L', 'SHEL.L', 'HSBA.L', 'ULVR.L', 'DGE.L', 'BP.L', 'GSK.L',
    'RIO.L', 'BATS.L', 'REL.L', 'NG.L', 'LLOY.L', 'VOD.L', 'BARC.L',
    'PRU.L', 'BT-A.L', 'RKT.L', 'LSEG.L', 'CRH.L', 'AAL.L', 'GLEN.L',
    'IMB.L', 'BA.L', 'AV.L', 'NWG.L', 'EXPN.L', 'STAN.L', 'RR.L',
    'III.L', 'LAND.L', 'SMDS.L', 'SGE.L', 'WTB.L', 'ANTO.L', 'CRDA.L',
    'AUTO.L', 'SPX.L', 'ABF.L', 'BKG.L', 'CCH.L', 'DCC.L', 'HIK.L',
    'INF.L', 'IHG.L', 'JD.L', 'KGF.L', 'MNG.L', 'NXT.L', 'PSON.L',
    'RTO.L', 'SBRY.L', 'SDR.L', 'SGRO.L', 'SKG.L', 'SMWH.L', 'SSE.L',
    'STJ.L', 'TSCO.L', 'TW.L', 'WEIR.L', 'WPP.L'
]

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

def fetch_and_save_cache(symbol):
    """Fetch and save cache files for a stock."""
    results = {'intraday': False, '5day': False, 'daily': False}
    
    try:
        ticker = yf.Ticker(symbol)
        
        # Intraday (1 day, 5-minute intervals)
        try:
            hist = ticker.history(period='1d', interval='5m')
            if not hist.empty:
                data = format_timeseries_data(hist)
                if data:
                    filepath = CACHE_DIR / f"{symbol}_intraday.json"
                    with open(filepath, 'w') as f:
                        json.dump(data, f, separators=(',', ':'))
                    results['intraday'] = True
        except Exception as e:
            pass
        
        time.sleep(RATE_LIMIT_DELAY)
        
        # 5-day (hourly intervals)
        try:
            hist = ticker.history(period='5d', interval='1h')
            if not hist.empty:
                data = format_timeseries_data(hist)
                if data:
                    filepath = CACHE_DIR / f"{symbol}_5day.json"
                    with open(filepath, 'w') as f:
                        json.dump(data, f, separators=(',', ':'))
                    results['5day'] = True
        except Exception as e:
            pass
        
        time.sleep(RATE_LIMIT_DELAY)
        
        # Daily (2 years)
        try:
            hist = ticker.history(period='2y', interval='1d')
            if not hist.empty:
                data = format_timeseries_data(hist)
                if data:
                    filepath = CACHE_DIR / f"{symbol}_daily.json"
                    with open(filepath, 'w') as f:
                        json.dump(data, f, separators=(',', ':'))
                    results['daily'] = True
        except Exception as e:
            pass
        
    except Exception as e:
        print(f"    ✗ Error processing {symbol}: {e}")
    
    return results

def fetch_stock_info(symbol):
    """Fetch stock metadata from Yahoo Finance."""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        name = info.get('longName') or info.get('shortName') or symbol
        exchange = info.get('exchange', 'Euronext')
        country = info.get('country', 'United Kingdom' if '.L' in symbol else 'Various')
        sector = info.get('sector', '')
        
        # Map sector to industry category
        industry_map = {
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
        industry = industry_map.get(sector, 'Services')
        
        return {
            'TICKER': symbol,
            'NAME': name,
            'EXCHANGE': exchange,
            'COUNTRY': country,
            'INDUS': industry
        }
    except Exception as e:
        print(f"    ✗ Error fetching info for {symbol}: {e}")
        return None

# Load existing data
print("\n1. Loading existing stock data...")
stocks_df = pd.read_csv(STOCKS_CSV)
stk_df = pd.read_csv(STK_CSV, skiprows=1)

existing_symbols = set(stocks_df['Symbol'].tolist())
existing_tickers = set(stk_df['TICKER'].tolist())

print(f"   ✓ Current stocks in database: {len(existing_symbols)}")

# Combine European stocks
all_european_stocks = EURO_STOXX_50 + FTSE_100
new_stocks = [s for s in all_european_stocks if s not in existing_symbols]

print(f"\n2. European Stocks to Add:")
print(f"   Euro Stoxx 50: {len(EURO_STOXX_50)} stocks")
print(f"   FTSE 100: {len(FTSE_100)} stocks")
print(f"   Already in database: {len(all_european_stocks) - len(new_stocks)}")
print(f"   New stocks to add: {len(new_stocks)}")

if len(new_stocks) == 0:
    print("\n✓ All European stocks are already in the database!")
    exit(0)

# Process new stocks
print(f"\n3. Processing {len(new_stocks)} new European stocks...")
print("   This will take approximately {:.1f} minutes\n".format(len(new_stocks) * 3 * RATE_LIMIT_DELAY / 60))

new_stocks_data = []
new_metadata = []
success_count = 0
failed_stocks = []

for symbol in tqdm(new_stocks, desc="Processing"):
    # Fetch metadata
    metadata = fetch_stock_info(symbol)
    
    if metadata:
        new_metadata.append(metadata)
        
        # Add to stocks.csv format
        new_stocks_data.append({
            'Symbol': symbol,
            'Name': metadata['NAME']
        })
        
        # Fetch and save cache data
        cache_results = fetch_and_save_cache(symbol)
        
        if any(cache_results.values()):
            success_count += 1
        else:
            failed_stocks.append(symbol)
    else:
        failed_stocks.append(symbol)
    
    time.sleep(RATE_LIMIT_DELAY)

# Update stocks.csv
if new_stocks_data:
    print(f"\n4. Updating {STOCKS_CSV.name}...")
    new_stocks_df = pd.DataFrame(new_stocks_data)
    updated_stocks_df = pd.concat([stocks_df, new_stocks_df], ignore_index=True)
    updated_stocks_df = updated_stocks_df.sort_values('Symbol')
    updated_stocks_df.to_csv(STOCKS_CSV, index=False)
    print(f"   ✓ Added {len(new_stocks_data)} stocks to stocks.csv")

# Update stk.csv
if new_metadata:
    print(f"\n5. Updating {STK_CSV.name}...")
    new_metadata_df = pd.DataFrame(new_metadata)
    updated_stk_df = pd.concat([stk_df, new_metadata_df], ignore_index=True)
    updated_stk_df = updated_stk_df.sort_values('TICKER')
    
    with open(STK_CSV, 'w') as f:
        f.write('"New Stock List as of 1/17/2014",,,,\n')
        updated_stk_df.to_csv(f, index=False)
    
    print(f"   ✓ Added {len(new_metadata)} stocks to stk.csv")

# Summary
print("\n" + "=" * 70)
print("✅ EUROPEAN STOCKS ADDED SUCCESSFULLY!")
print("=" * 70)
print(f"Total stocks processed: {len(new_stocks)}")
print(f"Successfully added: {success_count}")
print(f"Failed: {len(failed_stocks)}")

if failed_stocks:
    print(f"\nFailed stocks (may be delisted): {', '.join(failed_stocks[:10])}")
    if len(failed_stocks) > 10:
        print(f"... and {len(failed_stocks) - 10} more")

# Show distribution
print("\n📊 Updated Stock Distribution:")
print(f"Total stocks in database: {len(updated_stocks_df)}")
print(f"Total with metadata: {len(updated_stk_df)}")

print("\nIndustry breakdown:")
industry_counts = updated_stk_df['INDUS'].value_counts()
for industry, count in industry_counts.head(10).items():
    print(f"  {industry:20s}: {count:4d}")

print("\n✓ Done! Restart your server to see the new European stocks.")
