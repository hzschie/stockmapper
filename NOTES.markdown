Mobile startegy,
Git hub deploy
Using d3 csv on historical chart
Change to counts for "type":"LIST"
market hours 9 to 4
week hi/lo, 

320x480 @ 40 = 8x12 = 96


##
TODO: use CSS box-shadow for label drop-shadows. Yay.

## Links
Yahoo finance API reference: http://code.google.com/p/yahoo-finance-managed/wiki/csvHistQuotesDownload and http://cliffngan.net/a/13
YA csv module: https://github.com/koles/ya-csv/blob/master/lib/ya-csv.js
NYSE stocks CSV: http://www.nyse.com/indexes/nyaindex.csv
Quirksmode: http://www.quirksmode.org/css/contents.html
GitHub deploy keys: https://help.github.com/articles/managing-deploy-keys
Google pagespeed: https://developers.google.com/speed/pagespeed/
Just for fun Google APIs: http://googlecode.blogspot.com/2011/05/spring-cleaning-for-some-of-our-apis.html
JS/CSS/HTML Performance optimizations: http://www.developer.nokia.com/Community/Wiki/JavaScript_Performance_Best_Practices

## Blufin Service Urls
The heart of it all: http://46.137.212.140:8080/Service/equities.svc/GetLatestIndexConstituentsDataByIndexID?IndexID=1000
The heart of it all: http://46.137.212.140:8080/Service/equities.svc/GetLatestIndexDatabyIndexId?IndexID=0
Blufin stocks and indices historical can be accessed from: http://46.137.212.140/BMI/data/[SCRIPID/INDEXID]_bse_his.csv
Blufin last 4 days of data can be accessed from: http://46.137.212.140/BMI/data/[SCRIPID/INDEXID]_bse_4d.csv
Intraday: http://46.137.212.140:8080/Service/equities.svc/GetIntrdayData?ExchangeID=BSE&Key=LOVABLE
News: http://46.137.212.140:8080/Service/News.svc/GetLatestNews?query=fedbank
Index Intraday: http://46.137.212.140:8080/Service/equities.svc/GetIndexMinuteDataByTime?IndexId=108&timeStamp=08-17-2012%2015:18
Hi/Lo (is 52wk 52 week): http://46.137.212.140:8080/Service/Equities.svc/GetIndexConstiuentsHighLow?IndexID=1000

## Synonyms
Basic Materials => Materials
Consumer Services => Services
Oil and Gas => Oil & Gas
Consumer Goods => Goods
Telecommunications => Telecom
Asia-Pacific => Asia/Pacific
MidEast-Africa => MidEast/Africa


## Thoughts & Ideas
Titles for the various section
A list view
-X- Transition graph scale
-"X"- Collapse view section
Search box that filters the view

## Data Issues
Jocil Ltd has a blank symbol

## To do
Touch device layout (no fixed positioning on panel)
Use (optionally) ajax instead of socket.io
H Relayout on window resize
H Bubble positioning optimization to remain above screen
H Touch device events
H Redesign sort buttons
M Redesign indexes
H Intraday graphs
M Inspect more attributes (52 week, etc)
M Grouped sorting on map (i.e by industry)
L Logos and Flags
L re-heat map
L re-heat map
L Map subnav to rearange re-heat
L Reimport nya stocks
H Interval service
L Search box that filters the view