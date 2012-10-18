## Known Issues
*   ~~There are inconsistencies with counts. To duplicate:~~
    1. ~~Open two instances of app, with cached data~~
    2. ~~Restart server~~
    3. ~~Refresh one of the instances~~
    
    ~~At this point, the two instances will have different counts (but same stock renderings on the map)~~

*   The way upsAndDowns counts are implemented might prove to be very inefficient, as it creates a new array (via concat()) each time counts are incremented. Furthermore, during startup, the counts are updated once for each stock that's added to the group, or updated, which in turn triggers loads of events that are dispatched to the panel.

*   If groups were to be populated with stocks that already have changePct data, they wouldn't get added to the upsAndDowns counts.

*   Currently width and height of $tags are hardcoded in inspector.js

*   Currently maps $tag is subscribed to mouseover events multiple times

*   If no tagsOrder is defined, panel does a bunch of work for what amounts to sequentially adding elements

*   Not using Date and Time, but when we do, Timezones will come into play.

*   Expect issues in IE7 for css :after selector.


## Questions
*   What to do with timezones? (IST for everyone)

*   What unit is Market Cap in? (Append Cr)

*   Can we get Average Volume and what's the difference between Volume and TotalVolume (Pending)


TODO:
Generalize "stocks" to "components"