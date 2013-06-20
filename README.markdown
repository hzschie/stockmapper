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
!!!! Configurize min-group width in groups view
Generalize "stocks" to "components"(?)
52wk lo/hi is not very well generalized. Uses the blufin json structure instead of StockMapper's
If data timestamp same as what client has, skip the update


## Deploy checklist
A.  Desktop version
  1.  Search
  2.  Back & Forward Buttons
  3.  State restoration on reload
B.  iPad version
C.  iPhone version


## To SSH
* **Blufin Production:** ssh ec2-user@54.251.131.161
* **Blufin Staging:** ssh ec2-user@54.251.116.122


## Blufin data servers
* **Production:** https://www.blufinresearch.com/ (was http://54.251.130.77:8080)
* **UAT:** uat.blufin.in (was 46.137.212.140:8080)


