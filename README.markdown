## Known Issues
*   There are inconsistencies with counts. To duplicate:
1. Open two instances of app, with cached data
2. Restart server
3. Refresh one of the instances
At this point, the two instances will have different counts (but same stock renderings on the map)

*   The way upsAndDowns counts are implemented might prove to be very inefficient, as it creates a new array (via concat()) each time counts are incremented. Furthermore, during startup, the counts are updated once for each stock that's added to the group, or updated, which in turn triggers loads of events that are dispatched to the panel.