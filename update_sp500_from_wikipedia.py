#!/usr/bin/env python3
"""
Update S&P 500 composition from Wikipedia data provided by user
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

# Industry mapping from Yahoo sectors to simplified categories
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

# GICS Sector to simplified industry mapping
GICS_TO_INDUSTRY = {
    'Information Technology': 'Technology',
    'Health Care': 'Health Care',
    'Financials': 'Financials',
    'Communication Services': 'Services',
    'Consumer Discretionary': 'Goods',
    'Consumer Staples': 'Goods',
    'Industrials': 'Industrials',
    'Energy': 'Oil & Gas',
    'Materials': 'Materials',
    'Real Estate': 'Financials',
    'Utilities': 'Utilities'
}

# S&P 500 tickers from Wikipedia (provided by user)
SP500_WIKIPEDIA_DATA = """A	Agilent Technologies	Health Care
AAPL	Apple Inc.	Information Technology
ABBV	AbbVie	Health Care
ABNB	Airbnb	Consumer Discretionary
ABT	Abbott Laboratories	Health Care
ACGL	Arch Capital Group	Financials
ACN	Accenture	Information Technology
ADBE	Adobe Inc.	Information Technology
ADI	Analog Devices	Information Technology
ADM	Archer Daniels Midland	Consumer Staples
ADP	Automatic Data Processing	Industrials
ADSK	Autodesk	Information Technology
AEE	Ameren	Utilities
AEP	American Electric Power	Utilities
AES	AES Corporation	Utilities
AFL	Aflac	Financials
AIG	American International Group	Financials
AIZ	Assurant	Financials
AJG	Arthur J. Gallagher & Co.	Financials
AKAM	Akamai Technologies	Information Technology
ALB	Albemarle Corporation	Materials
ALGN	Align Technology	Health Care
ALL	Allstate	Financials
ALLE	Allegion	Industrials
AMAT	Applied Materials	Information Technology
AMCR	Amcor	Materials
AMD	Advanced Micro Devices	Information Technology
AME	Ametek	Industrials
AMGN	Amgen	Health Care
AMP	Ameriprise Financial	Financials
AMT	American Tower	Real Estate
AMZN	Amazon	Consumer Discretionary
ANET	Arista Networks	Information Technology
AON	Aon plc	Financials
AOS	A. O. Smith	Industrials
APA	APA Corporation	Energy
APD	Air Products	Materials
APH	Amphenol	Information Technology
APO	Apollo Global Management	Financials
APP	AppLovin	Information Technology
APTV	Aptiv	Consumer Discretionary
ARE	Alexandria Real Estate Equities	Real Estate
ARES	Ares Management	Financials
ATO	Atmos Energy	Utilities
AVB	AvalonBay Communities	Real Estate
AVGO	Broadcom	Information Technology
AVY	Avery Dennison	Materials
AWK	American Water Works	Utilities
AXON	Axon Enterprise	Industrials
AXP	American Express	Financials
AZO	AutoZone	Consumer Discretionary
BA	Boeing	Industrials
BAC	Bank of America	Financials
BALL	Ball Corporation	Materials
BAX	Baxter International	Health Care
BBY	Best Buy	Consumer Discretionary
BDX	Becton Dickinson	Health Care
BEN	Franklin Resources	Financials
BF.B	Brown–Forman	Consumer Staples
BG	Bunge Global	Consumer Staples
BIIB	Biogen	Health Care
BKNG	Booking Holdings	Consumer Discretionary
BKR	Baker Hughes	Energy
BLDR	Builders FirstSource	Industrials
BLK	BlackRock	Financials
BMY	Bristol Myers Squibb	Health Care
BNY	BNY Mellon	Financials
BR	Broadridge Financial Solutions	Industrials
BRK.B	Berkshire Hathaway	Financials
BRO	Brown & Brown	Financials
BSX	Boston Scientific	Health Care
BX	Blackstone Inc.	Financials
BXP	BXP, Inc.	Real Estate
C	Citigroup	Financials
CAH	Cardinal Health	Health Care
CARR	Carrier Global	Industrials
CASY	Casey's	Consumer Staples
CAT	Caterpillar Inc.	Industrials
CB	Chubb Limited	Financials
CBOE	Cboe Global Markets	Financials
CBRE	CBRE Group	Real Estate
CCI	Crown Castle	Real Estate
CCL	Carnival Corporation	Consumer Discretionary
CDNS	Cadence Design Systems	Information Technology
CDW	CDW Corporation	Information Technology
CEG	Constellation Energy	Utilities
CF	CF Industries	Materials
CFG	Citizens Financial Group	Financials
CHD	Church & Dwight	Consumer Staples
CHRW	C.H. Robinson	Industrials
CHTR	Charter Communications	Communication Services
CI	Cigna	Health Care
CIEN	Ciena	Information Technology
CINF	Cincinnati Financial	Financials
CL	Colgate-Palmolive	Consumer Staples
CLX	Clorox	Consumer Staples
CMCSA	Comcast	Communication Services
CME	CME Group	Financials
CMG	Chipotle Mexican Grill	Consumer Discretionary
CMI	Cummins	Industrials
CMS	CMS Energy	Utilities
CNC	Centene Corporation	Health Care
CNP	CenterPoint Energy	Utilities
COF	Capital One	Financials
COHR	Coherent Corp.	Information Technology
COIN	Coinbase	Financials
COO	Cooper Companies (The)	Health Care
COP	ConocoPhillips	Energy
COR	Cencora	Health Care
COST	Costco	Consumer Staples
CPAY	Corpay	Financials
CPRT	Copart	Industrials
CPT	Camden Property Trust	Real Estate
CRH	CRH plc	Materials
CRL	Charles River Laboratories	Health Care
CRM	Salesforce	Information Technology
CRWD	CrowdStrike	Information Technology
CSCO	Cisco	Information Technology
CSGP	CoStar Group	Real Estate
CSX	CSX Corporation	Industrials
CTAS	Cintas	Industrials
CTSH	Cognizant	Information Technology
CTVA	Corteva	Materials
CVNA	Carvana	Consumer Discretionary
CVS	CVS Health	Health Care
CVX	Chevron Corporation	Energy
D	Dominion Energy	Utilities
DAL	Delta Air Lines	Industrials
DASH	DoorDash	Consumer Discretionary
DD	DuPont	Materials
DDOG	Datadog	Information Technology
DE	Deere & Company	Industrials
DECK	Deckers Brands	Consumer Discretionary
DELL	Dell Technologies	Information Technology
DG	Dollar General	Consumer Staples
DGX	Quest Diagnostics	Health Care
DHI	D. R. Horton	Consumer Discretionary
DHR	Danaher Corporation	Health Care
DIS	Walt Disney Company (The)	Communication Services
DLR	Digital Realty	Real Estate
DLTR	Dollar Tree	Consumer Staples
DOC	Healthpeak Properties	Real Estate
DOV	Dover Corporation	Industrials
DOW	Dow Inc.	Materials
DPZ	Domino's	Consumer Discretionary
DRI	Darden Restaurants	Consumer Discretionary
DTE	DTE Energy	Utilities
DUK	Duke Energy	Utilities
DVA	DaVita	Health Care
DVN	Devon Energy	Energy
DXCM	Dexcom	Health Care
EA	Electronic Arts	Communication Services
EBAY	eBay Inc.	Consumer Discretionary
ECHO	EchoStar	Communication Services
ECL	Ecolab	Materials
ED	Consolidated Edison	Utilities
EFX	Equifax	Industrials
EG	Everest Group	Financials
EIX	Edison International	Utilities
EL	Estée Lauder Companies (The)	Consumer Staples
ELV	Elevance Health	Health Care
EME	Emcor	Industrials
EMR	Emerson Electric	Industrials
EOG	EOG Resources	Energy
EQIX	Equinix	Real Estate
EQR	Equity Residential	Real Estate
EQT	EQT Corporation	Energy
ERIE	Erie Indemnity	Financials
ES	Eversource Energy	Utilities
ESS	Essex Property Trust	Real Estate
ETN	Eaton Corporation	Industrials
ETR	Entergy	Utilities
EVRG	Evergy	Utilities
EW	Edwards Lifesciences	Health Care
EXC	Exelon	Utilities
EXE	Expand Energy	Energy
EXPD	Expeditors International	Industrials
EXPE	Expedia Group	Consumer Discretionary
EXR	Extra Space Storage	Real Estate
F	Ford Motor Company	Consumer Discretionary
FANG	Diamondback Energy	Energy
FAST	Fastenal	Industrials
FCX	Freeport-McMoRan	Materials
FDS	FactSet	Financials
FDX	FedEx	Industrials
FDXF	FedEx Freight	Industrials
FE	FirstEnergy	Utilities
FFIV	F5, Inc.	Information Technology
FICO	Fair Isaac	Information Technology
FIS	Fidelity National Information Services	Financials
FISV	Fiserv	Financials
FITB	Fifth Third Bancorp	Financials
FIX	Comfort Systems USA	Industrials
FLEX	Flex Ltd.	Information Technology
FOX	Fox Corporation (Class B)	Communication Services
FOXA	Fox Corporation (Class A)	Communication Services
FRT	Federal Realty Investment Trust	Real Estate
FSLR	First Solar	Information Technology
FTNT	Fortinet	Information Technology
FTV	Fortive	Industrials
GD	General Dynamics	Industrials
GDDY	GoDaddy	Information Technology
GE	GE Aerospace	Industrials
GEHC	GE HealthCare	Health Care
GEN	Gen Digital	Information Technology
GEV	GE Vernova	Industrials
GILD	Gilead Sciences	Health Care
GIS	General Mills	Consumer Staples
GL	Globe Life	Financials
GLW	Corning Inc.	Information Technology
GM	General Motors	Consumer Discretionary
GNRC	Generac	Industrials
GOOG	Alphabet Inc. (Class C)	Communication Services
GOOGL	Alphabet Inc. (Class A)	Communication Services
GPC	Genuine Parts Company	Consumer Discretionary
GPN	Global Payments	Financials
GRMN	Garmin	Consumer Discretionary
GS	Goldman Sachs	Financials
GWW	W. W. Grainger	Industrials
HAL	Halliburton	Energy
HAS	Hasbro	Consumer Discretionary
HBAN	Huntington Bancshares	Financials
HCA	HCA Healthcare	Health Care
HD	Home Depot (The)	Consumer Discretionary
HIG	Hartford (The)	Financials
HII	Huntington Ingalls Industries	Industrials
HLT	Hilton Worldwide	Consumer Discretionary
HON	Honeywell Technologies	Industrials
HONA	Honeywell Aerospace	Industrials
HOOD	Robinhood Markets	Financials
HPE	Hewlett Packard Enterprise	Information Technology
HPQ	HP Inc.	Information Technology
HRL	Hormel Foods	Consumer Staples
HSIC	Henry Schein	Health Care
HST	Host Hotels & Resorts	Real Estate
HSY	Hershey Company (The)	Consumer Staples
HUBB	Hubbell Incorporated	Industrials
HUM	Humana	Health Care
HWM	Howmet Aerospace	Industrials
IBKR	Interactive Brokers	Financials
IBM	IBM	Information Technology
ICE	Intercontinental Exchange	Financials
IDXX	Idexx Laboratories	Health Care
IEX	IDEX Corporation	Industrials
IFF	International Flavors & Fragrances	Materials
INCY	Incyte	Health Care
INTC	Intel	Information Technology
INTU	Intuit	Information Technology
INVH	Invitation Homes	Real Estate
IP	International Paper	Materials
IQV	IQVIA	Health Care
IR	Ingersoll Rand	Industrials
IRM	Iron Mountain	Real Estate
ISRG	Intuitive Surgical	Health Care
IT	Gartner	Information Technology
ITW	Illinois Tool Works	Industrials
IVZ	Invesco	Financials
J	Jacobs Solutions	Industrials
JBHT	J.B. Hunt	Industrials
JBL	Jabil	Information Technology
JCI	Johnson Controls	Industrials
JKHY	Jack Henry & Associates	Financials
JNJ	Johnson & Johnson	Health Care
JPM	JPMorgan Chase	Financials
KDP	Keurig Dr Pepper	Consumer Staples
KEY	KeyCorp	Financials
KEYS	Keysight Technologies	Information Technology
KHC	Kraft Heinz	Consumer Staples
KIM	Kimco Realty	Real Estate
KKR	KKR & Co.	Financials
KLAC	KLA Corporation	Information Technology
KMB	Kimberly-Clark	Consumer Staples
KMI	Kinder Morgan	Energy
KO	Coca-Cola Company (The)	Consumer Staples
KR	Kroger	Consumer Staples
KVUE	Kenvue	Consumer Staples
L	Loews Corporation	Financials
LDOS	Leidos	Industrials
LEN	Lennar	Consumer Discretionary
LH	Labcorp	Health Care
LHX	L3Harris	Industrials
LII	Lennox International	Industrials
LIN	Linde plc	Materials
LITE	Lumentum	Information Technology
LLY	Lilly (Eli)	Health Care
LMT	Lockheed Martin	Industrials
LNT	Alliant Energy	Utilities
LOW	Lowe's	Consumer Discretionary
LRCX	Lam Research	Information Technology
LULU	Lululemon Athletica	Consumer Discretionary
LUV	Southwest Airlines	Industrials
LVS	Las Vegas Sands	Consumer Discretionary
LYB	LyondellBasell	Materials
LYV	Live Nation Entertainment	Communication Services
MA	Mastercard	Financials
MAA	Mid-America Apartment Communities	Real Estate
MAR	Marriott International	Consumer Discretionary
MAS	Masco	Industrials
MCD	McDonald's	Consumer Discretionary
MCHP	Microchip Technology	Information Technology
MCK	McKesson Corporation	Health Care
MCO	Moody's Corporation	Financials
MDLZ	Mondelez International	Consumer Staples
MDT	Medtronic	Health Care
MET	MetLife	Financials
META	Meta Platforms	Communication Services
MGM	MGM Resorts	Consumer Discretionary
MKC	McCormick & Company	Consumer Staples
MLM	Martin Marietta Materials	Materials
MMM	3M	Industrials
MNST	Monster Beverage	Consumer Staples
MO	Altria	Consumer Staples
MOS	Mosaic Company (The)	Materials
MPC	Marathon Petroleum	Energy
MPWR	Monolithic Power Systems	Information Technology
MRK	Merck & Co.	Health Care
MRNA	Moderna	Health Care
MRSH	Marsh McLennan	Financials
MRVL	Marvell Technology	Information Technology
MS	Morgan Stanley	Financials
MSCI	MSCI Inc.	Financials
MSFT	Microsoft	Information Technology
MSI	Motorola Solutions	Information Technology
MTB	M&T Bank	Financials
MTD	Mettler Toledo	Health Care
MU	Micron Technology	Information Technology
NCLH	Norwegian Cruise Line Holdings	Consumer Discretionary
NDAQ	Nasdaq, Inc.	Financials
NDSN	Nordson Corporation	Industrials
NEE	NextEra Energy	Utilities
NEM	Newmont	Materials
NFLX	Netflix	Communication Services
NI	NiSource	Utilities
NKE	Nike, Inc.	Consumer Discretionary
NOC	Northrop Grumman	Industrials
NOW	ServiceNow	Information Technology
NRG	NRG Energy	Utilities
NSC	Norfolk Southern	Industrials
NTAP	NetApp	Information Technology
NTRS	Northern Trust	Financials
NUE	Nucor	Materials
NVDA	Nvidia	Information Technology
NVR	NVR, Inc.	Consumer Discretionary
NWS	News Corp (Class B)	Communication Services
NWSA	News Corp (Class A)	Communication Services
NXPI	NXP Semiconductors	Information Technology
O	Realty Income	Real Estate
ODFL	Old Dominion	Industrials
OKE	Oneok	Energy
OMC	Omnicom Group	Communication Services
ON	ON Semiconductor	Information Technology
ORCL	Oracle Corporation	Information Technology
ORLY	O'Reilly Automotive	Consumer Discretionary
OTIS	Otis Worldwide	Industrials
OXY	Occidental Petroleum	Energy
PANW	Palo Alto Networks	Information Technology
PAYX	Paychex	Industrials
PCAR	Paccar	Industrials
PCG	PG&E Corporation	Utilities
PEG	Public Service Enterprise Group	Utilities
PEP	PepsiCo	Consumer Staples
PFE	Pfizer	Health Care
PFG	Principal Financial Group	Financials
PG	Procter & Gamble	Consumer Staples
PGR	Progressive Corporation	Financials
PH	Parker Hannifin	Industrials
PHM	PulteGroup	Consumer Discretionary
PKG	Packaging Corporation of America	Materials
PLD	Prologis	Real Estate
PLTR	Palantir Technologies	Information Technology
PM	Philip Morris International	Consumer Staples
PNC	PNC Financial Services	Financials
PNR	Pentair	Industrials
PNW	Pinnacle West Capital	Utilities
PODD	Insulet Corporation	Health Care
PPG	PPG Industries	Materials
PPL	PPL Corporation	Utilities
PRU	Prudential Financial	Financials
PSA	Public Storage	Real Estate
PSKY	Paramount Skydance Corporation	Communication Services
PSX	Phillips 66	Energy
PTC	PTC Inc.	Information Technology
PWR	Quanta Services	Industrials
PYPL	PayPal	Financials
Q	Qnity Electronics	Information Technology
QCOM	Qualcomm	Information Technology
RCL	Royal Caribbean Group	Consumer Discretionary
REG	Regency Centers	Real Estate
REGN	Regeneron Pharmaceuticals	Health Care
RF	Regions Financial Corporation	Financials
RJF	Raymond James Financial	Financials
RL	Ralph Lauren Corporation	Consumer Discretionary
RMD	ResMed	Health Care
ROK	Rockwell Automation	Industrials
ROL	Rollins, Inc.	Industrials
ROP	Roper Technologies	Information Technology
ROST	Ross Stores	Consumer Discretionary
RSG	Republic Services	Industrials
RTX	RTX Corporation	Industrials
RVTY	Revvity	Health Care
SBAC	SBA Communications	Real Estate
SBUX	Starbucks	Consumer Discretionary
SCHW	Charles Schwab Corporation	Financials
SHW	Sherwin-Williams	Materials
SJM	J.M. Smucker Company (The)	Consumer Staples
SLB	Schlumberger	Energy
SMCI	Supermicro	Information Technology
SNA	Snap-on	Industrials
SNDK	Sandisk	Information Technology
SNPS	Synopsys	Information Technology
SO	Southern Company	Utilities
SOLV	Solventum	Health Care
SPG	Simon Property Group	Real Estate
SPGI	S&P Global	Financials
SRE	Sempra	Utilities
STE	Steris	Health Care
STLD	Steel Dynamics	Materials
STT	State Street Corporation	Financials
STX	Seagate Technology	Information Technology
STZ	Constellation Brands	Consumer Staples
SW	Smurfit Westrock	Materials
SWK	Stanley Black & Decker	Industrials
SWKS	Skyworks Solutions	Information Technology
SYF	Synchrony Financial	Financials
SYK	Stryker Corporation	Health Care
SYY	Sysco	Consumer Staples
T	AT&T	Communication Services
TAP	Molson Coors Beverage Company	Consumer Staples
TDG	TransDigm Group	Industrials
TDY	Teledyne Technologies	Information Technology
TECH	Bio-Techne	Health Care
TEL	TE Connectivity	Information Technology
TER	Teradyne	Information Technology
TFC	Truist Financial	Financials
TGT	Target Corporation	Consumer Staples
TJX	TJX Companies	Consumer Discretionary
TKO	TKO Group Holdings	Communication Services
TMO	Thermo Fisher Scientific	Health Care
TMUS	T-Mobile US	Communication Services
TPL	Texas Pacific Land Corporation	Energy
TPR	Tapestry, Inc.	Consumer Discretionary
TRGP	Targa Resources	Energy
TRMB	Trimble Inc.	Information Technology
TROW	T. Rowe Price	Financials
TRV	Travelers Companies (The)	Financials
TSCO	Tractor Supply	Consumer Discretionary
TSLA	Tesla, Inc.	Consumer Discretionary
TSN	Tyson Foods	Consumer Staples
TT	Trane Technologies	Industrials
TTD	Trade Desk (The)	Communication Services
TTWO	Take-Two Interactive	Communication Services
TXN	Texas Instruments	Information Technology
TXT	Textron	Industrials
TYL	Tyler Technologies	Information Technology
UAL	United Airlines Holdings	Industrials
UBER	Uber	Industrials
UDR	UDR, Inc.	Real Estate
UHS	Universal Health Services	Health Care
ULTA	Ulta Beauty	Consumer Discretionary
UNH	UnitedHealth Group	Health Care
UNP	Union Pacific Corporation	Industrials
UPS	United Parcel Service	Industrials
URI	United Rentals	Industrials
USB	U.S. Bancorp	Financials
V	Visa Inc.	Financials
VEEV	Veeva Systems	Health Care
VICI	Vici Properties	Real Estate
VLO	Valero Energy	Energy
VLTO	Veralto	Industrials
VMC	Vulcan Materials Company	Materials
VRSK	Verisk Analytics	Industrials
VRSN	Verisign	Information Technology
VRT	Vertiv	Industrials
VRTX	Vertex Pharmaceuticals	Health Care
VST	Vistra Corp.	Utilities
VTR	Ventas	Real Estate
VTRS	Viatris	Health Care
VZ	Verizon	Communication Services
WAB	Wabtec	Industrials
WAT	Waters Corporation	Health Care
WBD	Warner Bros. Discovery	Communication Services
WDAY	Workday, Inc.	Information Technology
WDC	Western Digital	Information Technology
WEC	WEC Energy Group	Utilities
WELL	Welltower	Real Estate
WFC	Wells Fargo	Financials
WM	Waste Management	Industrials
WMB	Williams Companies	Energy
WMT	Walmart	Consumer Staples
WRB	W. R. Berkley Corporation	Financials
WSM	Williams-Sonoma, Inc.	Consumer Discretionary
WST	West Pharmaceutical Services	Health Care
WTW	Willis Towers Watson	Financials
WY	Weyerhaeuser	Real Estate
WYNN	Wynn Resorts	Consumer Discretionary
XEL	Xcel Energy	Utilities
XOM	ExxonMobil	Energy
XYL	Xylem Inc.	Industrials
XYZ	Block, Inc.	Financials
YUM	Yum! Brands	Consumer Discretionary
ZBH	Zimmer Biomet	Health Care
ZBRA	Zebra Technologies	Information Technology
ZTS	Zoetis	Health Care"""

def parse_sp500_data():
    """Parse the S&P 500 data from Wikipedia"""
    lines = [line.strip() for line in SP500_WIKIPEDIA_DATA.strip().split('\n') if line.strip()]
    
    sp500_stocks = {}
    for line in lines:
        parts = line.split('\t')
        if len(parts) >= 3:
            ticker = parts[0].strip()
            name = parts[1].strip()
            sector = parts[2].strip()
            industry = GICS_TO_INDUSTRY.get(sector, 'Services')
            
            sp500_stocks[ticker] = {
                'name': name,
                'sector': sector,
                'industry': industry
            }
    
    return sp500_stocks

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
    print("="*70)
    print("UPDATING S&P 500 FROM WIKIPEDIA DATA")
    print("="*70)
    
    # Parse Wikipedia data
    sp500_wiki = parse_sp500_data()
    print(f"\nParsed {len(sp500_wiki)} stocks from Wikipedia")
    
    # Read current data
    df = pd.read_csv(STK_FILE, skiprows=1)
    existing_tickers = set(df['TICKER'].tolist())
    
    with open(GROUPS_FILE) as f:
        groups = json.load(f)
    
    sp500_group = next((g for g in groups if g['name'] == 'S&P 500'), None)
    current_sp500 = set(sp500_group['ids']) if sp500_group else set()
    
    # Find differences
    new_tickers = set(sp500_wiki.keys()) - current_sp500
    removed_tickers = current_sp500 - set(sp500_wiki.keys())
    
    print(f"\nCurrent S&P 500 in your data: {len(current_sp500)}")
    print(f"Wikipedia S&P 500: {len(sp500_wiki)}")
    print(f"New stocks to add: {len(new_tickers)}")
    print(f"Stocks removed from index: {len(removed_tickers)}")
    
    if new_tickers:
        print(f"\nNew S&P 500 stocks (sample): {list(new_tickers)[:20]}")
    if removed_tickers:
        print(f"Removed from S&P 500 (sample): {list(removed_tickers)[:20]}")
    
    # Find which new tickers need to be added to stk.csv
    tickers_to_add = new_tickers - existing_tickers
    tickers_already_exist = new_tickers & existing_tickers
    
    print(f"\nStocks to add to stk.csv: {len(tickers_to_add)}")
    print(f"Stocks already in stk.csv: {len(tickers_already_exist)}")
    
    cache_files = set(os.listdir(CACHE_DIR))
    tickers_needing_cache = [t for t in new_tickers if f"{t}_daily.json" not in cache_files]
    print(f"Stocks needing cache data: {len(tickers_needing_cache)}")
    
    print("\n" + "="*70)
    response = input("Proceed with update? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled")
        return
    
    # Add new stocks to stk.csv
    if tickers_to_add:
        print(f"\nFetching metadata for {len(tickers_to_add)} new stocks...")
        new_rows = []
        
        for ticker in tqdm(sorted(tickers_to_add), desc="Metadata"):
            wiki_data = sp500_wiki[ticker]
            metadata = fetch_stock_metadata(ticker)
            
            if metadata:
                new_rows.append({
                    'TICKER': ticker,
                    'NAME': metadata['name'],
                    'EXCHANGE': metadata['exchange'],
                    'COUNTRY': metadata['country'],
                    'INDUS': metadata['industry']
                })
            else:
                # Fallback to Wikipedia data
                new_rows.append({
                    'TICKER': ticker,
                    'NAME': wiki_data['name'],
                    'EXCHANGE': 'Unknown',
                    'COUNTRY': 'United States',
                    'INDUS': wiki_data['industry']
                })
            
            time.sleep(0.5)
        
        if new_rows:
            new_df = pd.DataFrame(new_rows)
            df = pd.concat([df, new_df], ignore_index=True)
            
            # Write to temporary file first, then rename (atomic operation)
            import shutil
            temp_file = STK_FILE + '.tmp'
            with open(temp_file, 'w') as f:
                f.write('"New Stock List as of 1/17/2014",,,\n')
                df.to_csv(f, index=False)
            
            # Backup original file
            shutil.copy2(STK_FILE, STK_FILE + '.backup')
            
            # Replace original with new file
            os.replace(temp_file, STK_FILE)
            
            print(f"✅ Added {len(new_rows)} new stocks to stk.csv")
            print(f"   (Backup saved as {STK_FILE}.backup)")
    
    # Fetch cache data
    if tickers_needing_cache:
        print(f"\nFetching cache data for {len(tickers_needing_cache)} stocks...")
        success = 0
        failed = []
        
        for ticker in tqdm(sorted(tickers_needing_cache), desc="Cache"):
            if fetch_and_save_cache(ticker):
                success += 1
            else:
                failed.append(ticker)
            time.sleep(0.5)
        
        print(f"✅ Fetched cache for {success}/{len(tickers_needing_cache)} stocks")
        if failed:
            print(f"❌ Failed: {len(failed)} stocks")
            if len(failed) <= 20:
                print(f"   {failed}")
    
    # Update S&P 500 group in groups.json
    print(f"\nUpdating S&P 500 group in groups.json...")
    
    if sp500_group:
        sp500_group['ids'] = sorted(sp500_wiki.keys())
    else:
        sp500_group = {
            'name': 'S&P 500',
            'nickname': 'S&P 500',
            'category': 'Index',
            'ids': sorted(sp500_wiki.keys()),
            'type': 'index',
            'id': '^GSPC'
        }
        groups.append(sp500_group)
    
    with open(GROUPS_FILE, 'w') as f:
        json.dump(groups, f, indent=2)
    
    print(f"✅ Updated S&P 500 group to {len(sp500_wiki)} stocks")
    
    print(f"\n{'='*70}")
    print("✅ UPDATE COMPLETE")
    print(f"{'='*70}")
    print(f"S&P 500: {len(sp500_wiki)} stocks")
    print()
    print("Next steps:")
    print("  1. Run: DATA_DOMAIN=nyse node build_definitions.js")
    print("  2. Restart your server")

if __name__ == '__main__':
    main()
