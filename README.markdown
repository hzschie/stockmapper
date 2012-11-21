## To Run
*  **NYSE version:** `WEBSOCKET=true DATA_DOMAIN=nyse port=3000 node app.js`
*  **Blufin version:** `PORT=3001 DYNAMIC=true DATA_DOMAIN=blufin DATA_HOST=54.251.130.77:8080 node app.js`

## Hosts/Deploys
*  **blufin_web:** `ssh ec2-user@54.251.131.161`
*  **blufin_export:** `node export_blufin_version.js` `cp -R temp/export/* ../stockmapper_blufin/` `git push blufin_web`

## Known Issues
*   Currently maps $tag is subscribed to mouseover events multiple times

*   Expect issues in IE7 for css :after selector.


TODO:
!!!! BLUFIN make stocks={} at the beginning of createStocks, otherwise dynamic refresh won't work if stocks are removed.
Generalize "stocks" to "components"(?)


## Deploy checklist
A.  Desktop version
  1.  Search
  2.  Back & Forward Buttons
  3.  State restoration on reload
B.  iPad version
C.  iPhone version


## To SSH
* **Blufin:** ssh ec2-user@54.251.131.161