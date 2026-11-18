# Hometown Heroes: player list for review

Research for the Hometown Heroes game (Task 5). Compiled 2026-11-17. Each row is the town the player **grew up in** (not just the birthplace). Current teams come from NHL.com team rosters (api-web.nhle.com) fetched the same day; for players no longer in the NHL the team is the last one.

How to read it:
- **Kraken?** = played at least 20 games for Seattle (2021-22 to now).
- **Confidence**: high = a team, junior/college or news source says this is where he grew up; medium = birthplace or a single/conflicting source, so please eyeball it before launch.
- Coordinates are the town centre (Nominatim/OpenStreetMap), 4 decimals; a few were corrected by hand where the lookup picked the wrong place (Larsson, Connor, Kane) or found nothing.
- Rows marked ?? are in the second table only and are NOT in the PLAYERS array.
- Russia, Belarus, Kazakhstan etc. were left out on purpose.

## Table

| # | Name | Team | Kraken? | Grew up in | Birthplace (if different) | Lat | Lng | Source | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Jared McCann | Seattle Kraken | Yes | Stratford, ON | - | 43.3701 | -80.9818 | https://en.wikipedia.org/wiki/Jared_McCann | high |
| 2 | Matty Beniers | Seattle Kraken | Yes | Hingham, MA | - | 42.2418 | -70.8898 | https://teamusa.com/profiles/matty-beniers-1227939 | high |
| 3 | Jordan Eberle | Seattle Kraken | Yes | Regina, SK (to ~age 14-15, then Calgary) | - | 50.4480 | -104.6159 | https://globalnews.ca/news/10360742/jordan-eberle-career-milestone-regina-memories | high |
| 4 | Vince Dunn | Seattle Kraken | Yes | Lindsay, ON | Mississauga, ON | 44.3551 | -78.7370 | https://sportsforecaster.com/nhl/p/21199/Vince_Dunn | medium |
| 5 | Adam Larsson | Seattle Kraken | Yes | Skelleftea, Sweden | - | 64.7507 | 20.9528 | https://thehockeywriters.com/docs/adam-larsson/ | high |
| 6 | Jamie Oleksiak | Vancouver Canucks | Yes | Toronto, ON | - | 43.6535 | -79.3839 | https://www.nhl.com/news/history-in-the-making-jamie-oleksiak-ft | high |
| 7 | Jaden Schwartz | Colorado Avalanche | Yes | Wilcox, SK | Melfort, SK | 50.0977 | -104.7258 | https://www.sportskeeda.com/us/nhl/jaden-schwartz-hometown | high |
| 8 | Yanni Gourde | Tampa Bay Lightning | Yes | Saint-Narcisse, QC | - | 46.4837 | -71.2331 | https://en.wikipedia.org/wiki/Yanni_Gourde | high |
| 9 | Will Borgen | Boston Bruins | Yes | Moorhead, MN | - | 46.8739 | -96.7539 | https://www.kvrr.com/tag/will-borgen | high |
| 10 | Joey Daccord | Seattle Kraken | Yes | North Andover, MA | Boston, MA | 42.7030 | -71.1309 | https://thehockeywriters.com/?p=861989 | high |
| 11 | Oliver Bjorkstrand | New York Rangers | Yes | Herning, Denmark | - | 56.1380 | 8.9747 | https://www.iihf.com/en/events/2018/wm/news/2600/herning-home-boy | high |
| 12 | Andre Burakovsky | Ottawa Senators | Yes | Bunkeflostrand (Malmo), Sweden | Klagenfurt, Austria | 55.5498 | 12.9299 | https://www.pressreader.com/canada/calgary-herald/20180606/282016148018951 | medium |
| 13 | Philipp Grubauer | Seattle Kraken | Yes | Rosenheim, Germany | - | 47.8558 | 12.1273 | https://www.nhl.com/kraken/news/seattle-kraken-team-germany-olympic-goaltender-philipp-grubauer-ft | high |
| 14 | Kaapo Kakko | Seattle Kraken | Yes | Turku, Finland | - | 60.4516 | 22.2670 | https://www.nhl.com/kraken/news/seattle-kraken-kaapo-kakko-youth-hockey-hero-nhl-global-series | high |
| 15 | Eeli Tolvanen | New York Rangers | Yes | Vihti, Finland (Huhmari area per some sources) | - | 60.4170 | 24.3237 | https://en.wikipedia.org/wiki/Eeli_Tolvanen | medium |
| 16 | Morgan Geekie | Boston Bruins | Yes | Strathclair, MB | - | 50.4045 | -100.3955 | https://www.portageonline.com/local-sports/geekie-excited-for-fresh-start-in-seattle | high |
| 17 | Shane Wright | Nashville Predators | Yes | Burlington, ON | - | 43.3249 | -79.7967 | https://tsn.ca/shane-wright-enjoying-life-in-first-full-season-with-seattle-kraken-1.2197638 | high |
| 18 | Ryker Evans | Seattle Kraken | Yes | Calgary, AB | - | 51.0456 | -114.0575 | https://nhl.com/kraken/news/ryker-evans-recounts-draft-day-334698870 | high |
| 19 | Tye Kartye | New York Rangers | Yes | Kingston, ON | - | 44.3054 | -76.4284 | https://chl.ca/ohl-greyhounds/feature-hounds-at-home-featuring-12-tye-kartye/ | high |
| 20 | Chandler Stephenson | Seattle Kraken | Yes | Saskatoon, SK | - | 52.1318 | -106.6608 | https://www.nhl.com/news/capitals-stephenson-gives-back-to-community-in-day-with-cup/c-299842138 | high |
| 21 | Brandon Montour | Seattle Kraken | Yes | Ohsweken (Six Nations), ON | Brantford, ON | 43.0687 | -80.1180 | https://nhl.com/news/panthers-brandon-montour-brings-stanley-cup-to-six-nations-hometown | high |
| 22 | Ryan Lindgren | Seattle Kraken | Yes | Burnsville, MN (UMN roster lists Minneapolis) | - | 44.7671 | -93.2774 | https://www.lines.com/nhl/players/ryan-lindgren-3184 | medium |
| 23 | Frederick Gaudreau | Seattle Kraken | Yes | Bromont, QC | - | 45.3187 | -72.6463 | https://thehockeywriters.com/docs/frederick-gaudreau/ | high |
| 24 | Ryan Donato | Chicago Blackhawks | Yes | Scituate, MA | Boston, MA | 42.1924 | -70.7262 | https://teamusa.com/profiles/ryan-donato-1086672 | high |
| 25 | Alexander Wennberg | San Jose Sharks | Yes | Nacka (Stockholm), Sweden | Stockholm, Sweden | 59.3121 | 18.2074 | https://thehockeywriters.com/?p=835831 | medium |
| 26 | Mason Appleton | Detroit Red Wings | Yes | Green Bay, WI | - | 44.5126 | -88.0126 | https://msuspartans.com/news/2015/9/25/Meet_the_Freshman_Mason_Appleton | high |
| 27 | Brian Dumoulin | Los Angeles Kings | Yes | Biddeford, ME | - | 43.4926 | -70.4534 | https://www.pressherald.com/2018/06/25/local-hero-gives-back/ | high |
| 28 | Berkly Catton | Seattle Kraken | Yes | Saskatoon, SK | - | 52.1318 | -106.6608 | https://neutralzone.com/player/Berkly-Catton-53003 | medium |
| 29 | Cale Fleury | Seattle Kraken | Yes | Carlyle, SK (family moved to Calgary ~2002) | - | 49.6338 | -102.2670 | https://www.sasktoday.ca/south/local-sports/the-fleurys-are-brothers-and-nhl-teammates-5027824 | medium |
| 30 | Haydn Fleury | Winnipeg Jets | Yes | Carlyle, SK (family moved to Calgary ~2002) | - | 49.6338 | -102.2670 | https://www.sasktoday.ca/south/local-sports/the-fleurys-are-brothers-and-nhl-teammates-5027824 | medium |
| 31 | Josh Mahura | Seattle Kraken | Yes | St. Albert, AB | - | 53.6332 | -113.6288 | https://www.stalbertgazette.com/local-news/mahura-shares-the-stanley-cup-with-st-albert-9252193 | high |
| 32 | Bobby McMann | Seattle Kraken | Yes | Wainwright, AB | - | 52.8403 | -110.8514 | https://thehockeywriters.com/docs/bobby-mcmann/ | high |
| 33 | Jacob Melanson | Seattle Kraken | Yes | Amherst, NS | - | 45.8193 | -64.2334 | https://www.nhl.com/kraken/news/summer-training-amherst-nova-scotia-jacob-melanson-cj-jackson-ft | high |
| 34 | Ben Meyers | Seattle Kraken | Yes | Delano, MN | - | 45.0419 | -93.7891 | https://www.nhl.com/kraken/news/ben-meyers-seattle-kraken-minnesota-high-school-hockey-ft | high |
| 35 | Jani Nyman | Seattle Kraken | Yes | Valkeakoski, Finland | - | 61.2656 | 24.0305 | https://nhlentrydraft.com/players/jani-nyman | medium |
| 36 | Ryan Winterton | Seattle Kraken | Yes | Markham, ON | - | 43.8564 | -79.3377 | https://thehockeywriters.com/docs/ryan-winterton | medium |
| 37 | Colin Blackwell | Dallas Stars | Yes | North Andover, MA | - | 42.7030 | -71.1309 | https://sportskeeda.com/us/nhl/colin-blackwell-family | high |
| 38 | Michael Eyssimont | Boston Bruins | Yes | Littleton, CO | - | 39.6133 | -105.0166 | https://minnesotahockeymag.com/?p=20781 | medium |
| 39 | Kailer Yamamoto | Utah (UTA) | Yes | Spokane, WA | - | 47.6572 | -117.4235 | https://www.nhl.com/news/draft-profile-kailer-yamamoto/c-289609092 | high |
| 40 | Mark Giordano | Toronto Maple Leafs | Yes | North York (Toronto), ON | - | 43.7543 | -79.4491 | https://streetsoftoronto.com/city/10-things-to-know-about-the-newest-maple-leaf-mark-giordano/ | medium |
| 41 | Calle Jarnkrok | Toronto Maple Leafs | Yes | Gavle, Sweden | - | 60.6749 | 17.1413 | https://www.nhl.com/sv/news/calle-jarnkrok-om-nhl-global-series-i-gavle | high |
| 42 | Connor McDavid | Edmonton Oilers | No | Newmarket, ON | Richmond Hill, ON | 44.0563 | -79.4617 | https://thecanadianencyclopedia.ca/en/article/connor-mcdavid | high |
| 43 | Leon Draisaitl | Edmonton Oilers | No | Cologne, Germany | - | 50.9384 | 6.9600 | https://api-web.nhle.com/v1/roster/EDM/current | medium |
| 44 | Auston Matthews | Toronto Maple Leafs | No | Scottsdale, AZ | San Ramon, CA | 33.5967 | -111.8910 | https://thehockeynews.com/news/news/auston-matthews-from-the-arizona-desert-to-the-center-of-the-hockey-universe | high |
| 45 | Nathan MacKinnon | Colorado Avalanche | No | Cole Harbour, NS | Halifax, NS (per NHL.com) | 44.6736 | -63.4877 | https://api-web.nhle.com/v1/roster/COL/current | medium |
| 46 | Cale Makar | Colorado Avalanche | No | Calgary, AB (northwest) | - | 51.0456 | -114.0575 | https://www.nhlpa.com/news/after-the-buzzer-cale-makar | high |
| 47 | David Pastrnak | Boston Bruins | No | Havirov, Czechia | - | 49.7798 | 18.4369 | https://api-web.nhle.com/v1/roster/BOS/current | medium |
| 48 | Victor Hedman | Tampa Bay Lightning | No | Ornskoldsvik, Sweden | - | 63.2909 | 18.7153 | https://api-web.nhle.com/v1/roster/TBL/current | medium |
| 49 | Elias Pettersson | Vancouver Canucks | No | Sundsvall, Sweden | - | 62.3908 | 17.3071 | https://api-web.nhle.com/v1/roster/VAN/current | medium |
| 50 | Brock Boeser | Vancouver Canucks | No | Burnsville, MN | - | 44.7671 | -93.2774 | https://api-web.nhle.com/v1/roster/VAN/current | medium |
| 51 | Sebastian Aho | Carolina Hurricanes | No | Rauma, Finland | - | 61.1289 | 21.5039 | https://api-web.nhle.com/v1/roster/CAR/current | medium |
| 52 | Miro Heiskanen | Dallas Stars | No | Espoo, Finland | - | 60.2050 | 24.6560 | https://api-web.nhle.com/v1/roster/DAL/current | medium |
| 53 | Rasmus Dahlin | Buffalo Sabres | No | Lidkoping, Sweden | - | 58.5053 | 13.1577 | https://api-web.nhle.com/v1/roster/BUF/current | medium |
| 54 | Aleksander Barkov | Florida Panthers | No | Tampere, Finland | - | 61.4978 | 23.7616 | https://api-web.nhle.com/v1/roster/FLA/current | medium |
| 55 | Matthew Tkachuk | Florida Panthers | No | Creve Coeur, MO (some sources: Chesterfield, MO) | Scottsdale, AZ | 38.6613 | -90.4424 | https://en.wikipedia.org/wiki/Matthew_Tkachuk | medium |
| 56 | Filip Forsberg | Nashville Predators | No | Ostervala, Sweden | - | 60.1833 | 17.2000 | https://api-web.nhle.com/v1/roster/NSH/current | medium |
| 57 | Roman Josi | Nashville Predators | No | Bern, Switzerland | - | 46.9485 | 7.4522 | https://api-web.nhle.com/v1/roster/NSH/current | medium |
| 58 | Nico Hischier | New Jersey Devils | No | Naters, Switzerland | - | 46.3243 | 7.9884 | https://api-web.nhle.com/v1/roster/NJD/current | medium |
| 59 | Mathew Barzal | New York Islanders | No | Coquitlam, BC | - | 49.2843 | -122.7933 | https://nhl.com/islanders/news/raising-the-barzal-292277290 | high |
| 60 | Adam Fox | New York Rangers | No | Jericho, NY | - | 40.7874 | -73.5435 | https://gocrimson.com/roster.aspx?rp_id=5056 | high |
| 61 | Tim Stutzle | Ottawa Senators | No | Viersen, Germany | - | 51.2562 | 6.3905 | https://api-web.nhle.com/v1/roster/OTT/current | medium |
| 62 | Sidney Crosby | Pittsburgh Penguins | No | Cole Harbour, NS | - | 44.6736 | -63.4877 | https://www.nhl.com/news/sidney-crosby-still-a-star-in-his-hometown-281177960 | high |
| 63 | Macklin Celebrini | San Jose Sharks | No | North Vancouver, BC | - | 49.3206 | -123.0738 | https://api-web.nhle.com/v1/roster/SJS/current | medium |
| 64 | Robert Thomas | St. Louis Blues | No | Aurora, ON | - | 43.9997 | -79.4675 | https://www.aurora.ca/your-government/office-of-the-mayor/key-to-the-town/ | high |
| 65 | Kyle Connor | Winnipeg Jets | No | Shelby Township, MI | - | 42.6700 | -83.0330 | https://mgoblue.com/news/2015/9/11/Freshman_Focus_with_Kyle_Connor | high |
| 66 | Connor Bedard | Chicago Blackhawks | No | North Vancouver, BC | - | 49.3206 | -123.0738 | https://api-web.nhle.com/v1/roster/CHI/current | medium |
| 67 | Patrick Kane | Chicago Blackhawks | No | South Buffalo, NY | - | 42.8450 | -78.8200 | https://www.aol.com/2014/02/13/patrick-kane-olympics-hometown-south-buffalo-new-york/ | high |
| 68 | Steven Stamkos | Nashville Predators | No | Unionville (Markham), ON | - | 43.8517 | -79.3143 | https://en.wikipedia.org/wiki/Steven_Stamkos | high |
| 69 | Leo Carlsson | Anaheim Ducks | No | Karlstad, Sweden | - | 59.3809 | 13.5028 | https://thehockeywriters.com/docs/leo-carlsson/ | high |
| 70 | Matt Boldy | Minnesota Wild | No | Millis, MA | Milford, MA | 42.1675 | -71.3573 | https://www.bostonsportsjournal.com/2021/09/03/new-england-roots-millis-matthew-boldy-rise-potential-top-10-draft-pick | high |
| 71 | Zach Werenski | Columbus Blue Jackets | No | Grosse Pointe, MI | - | 42.3861 | -82.9119 | https://wxyz.com/sports/grosse-pointe-native-zach-werenski-excited-to-face-hometown-team-former-teammate-dylan-larkin | high |
| 72 | Jack Eichel | Vegas Golden Knights | No | North Chelmsford, MA | - | 42.6390 | -71.3828 | https://www.nhl.com/news/jack-eichel-brings-stanley-cup-to-hometown-345346584 | high |
| 73 | Sean Couturier | Philadelphia Flyers | No | Bathurst, NB | Phoenix, AZ | 47.6209 | -65.6538 | https://www.nhl.com/news/flyers-sean-couturier-street-named-in-hometown-281225922 | high |
| 74 | Lucas Raymond | Detroit Red Wings | No | Gothenburg, Sweden | - | 57.7072 | 11.9670 | https://api-web.nhle.com/v1/roster/DET/current | medium |
| 75 | Adrian Kempe | Los Angeles Kings | No | Kramfors, Sweden | - | 62.9167 | 17.6667 | https://api-web.nhle.com/v1/roster/LAK/current | medium |
| 76 | Nick Suzuki | Montreal Canadiens | No | London, ON | - | 42.9837 | -81.2496 | https://api-web.nhle.com/v1/roster/MTL/current | medium |
| 77 | Jonathan Huberdeau | Calgary Flames | No | Saint-Jerome, QC | - | 45.7804 | -74.0036 | https://api-web.nhle.com/v1/roster/CGY/current | medium |
| 78 | Tom Wilson | Washington Capitals | No | Toronto, ON | - | 43.6535 | -79.3839 | https://api-web.nhle.com/v1/roster/WSH/current | medium |
| 79 | Juraj Slafkovsky | Montreal Canadiens | No | Kosice, Slovakia | - | 48.7164 | 21.2611 | https://api-web.nhle.com/v1/roster/MTL/current | medium |

### Left out of PLAYERS (?? or team unverified)

| Name | Team | Kraken? | Confidence | Candidates | Why |
|---|---|---|---|---|---|
| Mason Marchment | San Jose Sharks | Yes | ?? | Uxbridge, ON (birthplace only) | no source found for where he grew up |
| Moritz Seider | Detroit Red Wings | No | ?? | Zell (Mosel) / Erfurt / Mannheim, Germany | sources disagree on hometown |
| Clayton Keller | Utah (UTA) | No | ?? | Chesterfield, MO vs Swansea, IL | born Chesterfield, raised across the river in Swansea |
| William Nylander | Toronto Maple Leafs | No | ?? | Calgary vs Stockholm | born Calgary, moved a lot, Sweden from about age 14 |
| Carson Soucy | (not on a current NHL roster) | Yes | high (town) / team unknown | Irma, AB | current/last team not checked. Source https://dailyhive.com/vancouver/soucy-making-oilers-fans-alberta-cheer-canucks |
| Tomas Tatar | (not on a current NHL roster) | Yes | high (town) / team unknown | Dubnica nad Vahom, Slovakia (born Ilava) | current/last team not checked. Source https://www.nhlpa.com/news/my-hometown-tomas-tatar |
| Justin Schultz | (not on a current NHL roster) | Yes | high (town) / team unknown | West Kelowna, BC (born Kelowna) | current/last team not checked. Source https://www.hockeycanada.ca/news/down-in-the-valley-out-on-the-ice-okanagan-unsuspecting-hockey-hotbed |

Counts: 41 Kraken, 38 league, 7 left out.

## Ready to paste (Task 6)

```js
const PLAYERS = [
  { id: 'mccann', name: 'Jared McCann', team: 'Seattle Kraken', town: 'Stratford, ON', lat: 43.3701, lng: -80.9818, kraken: true },
  { id: 'beniers', name: 'Matty Beniers', team: 'Seattle Kraken', town: 'Hingham, MA', lat: 42.2418, lng: -70.8898, kraken: true },
  { id: 'eberle', name: 'Jordan Eberle', team: 'Seattle Kraken', town: 'Regina, SK', lat: 50.4480, lng: -104.6159, kraken: true },
  { id: 'dunn', name: 'Vince Dunn', team: 'Seattle Kraken', town: 'Lindsay, ON', lat: 44.3551, lng: -78.7370, kraken: true },
  { id: 'larsson', name: 'Adam Larsson', team: 'Seattle Kraken', town: 'Skelleftea, Sweden', lat: 64.7507, lng: 20.9528, kraken: true },
  { id: 'oleksiak', name: 'Jamie Oleksiak', team: 'Vancouver Canucks', town: 'Toronto, ON', lat: 43.6535, lng: -79.3839, kraken: true },
  { id: 'schwartz', name: 'Jaden Schwartz', team: 'Colorado Avalanche', town: 'Wilcox, SK', lat: 50.0977, lng: -104.7258, kraken: true },
  { id: 'gourde', name: 'Yanni Gourde', team: 'Tampa Bay Lightning', town: 'Saint-Narcisse, QC', lat: 46.4837, lng: -71.2331, kraken: true },
  { id: 'borgen', name: 'Will Borgen', team: 'Boston Bruins', town: 'Moorhead, MN', lat: 46.8739, lng: -96.7539, kraken: true },
  { id: 'daccord', name: 'Joey Daccord', team: 'Seattle Kraken', town: 'North Andover, MA', lat: 42.7030, lng: -71.1309, kraken: true },
  { id: 'bjorkstrand', name: 'Oliver Bjorkstrand', team: 'New York Rangers', town: 'Herning, Denmark', lat: 56.1380, lng: 8.9747, kraken: true },
  { id: 'burakovsky', name: 'Andre Burakovsky', team: 'Ottawa Senators', town: 'Bunkeflostrand (Malmo), Sweden', lat: 55.5498, lng: 12.9299, kraken: true },
  { id: 'grubauer', name: 'Philipp Grubauer', team: 'Seattle Kraken', town: 'Rosenheim, Germany', lat: 47.8558, lng: 12.1273, kraken: true },
  { id: 'kakko', name: 'Kaapo Kakko', team: 'Seattle Kraken', town: 'Turku, Finland', lat: 60.4516, lng: 22.2670, kraken: true },
  { id: 'tolvanen', name: 'Eeli Tolvanen', team: 'New York Rangers', town: 'Vihti, Finland', lat: 60.4170, lng: 24.3237, kraken: true },
  { id: 'geekie', name: 'Morgan Geekie', team: 'Boston Bruins', town: 'Strathclair, MB', lat: 50.4045, lng: -100.3955, kraken: true },
  { id: 'wright', name: 'Shane Wright', team: 'Nashville Predators', town: 'Burlington, ON', lat: 43.3249, lng: -79.7967, kraken: true },
  { id: 'evans', name: 'Ryker Evans', team: 'Seattle Kraken', town: 'Calgary, AB', lat: 51.0456, lng: -114.0575, kraken: true },
  { id: 'kartye', name: 'Tye Kartye', team: 'New York Rangers', town: 'Kingston, ON', lat: 44.3054, lng: -76.4284, kraken: true },
  { id: 'stephenson', name: 'Chandler Stephenson', team: 'Seattle Kraken', town: 'Saskatoon, SK', lat: 52.1318, lng: -106.6608, kraken: true },
  { id: 'montour', name: 'Brandon Montour', team: 'Seattle Kraken', town: 'Ohsweken (Six Nations), ON', lat: 43.0687, lng: -80.1180, kraken: true },
  { id: 'lindgren', name: 'Ryan Lindgren', team: 'Seattle Kraken', town: 'Burnsville, MN', lat: 44.7671, lng: -93.2774, kraken: true },
  { id: 'gaudreau', name: 'Frederick Gaudreau', team: 'Seattle Kraken', town: 'Bromont, QC', lat: 45.3187, lng: -72.6463, kraken: true },
  { id: 'donato', name: 'Ryan Donato', team: 'Chicago Blackhawks', town: 'Scituate, MA', lat: 42.1924, lng: -70.7262, kraken: true },
  { id: 'wennberg', name: 'Alexander Wennberg', team: 'San Jose Sharks', town: 'Nacka (Stockholm), Sweden', lat: 59.3121, lng: 18.2074, kraken: true },
  { id: 'appleton', name: 'Mason Appleton', team: 'Detroit Red Wings', town: 'Green Bay, WI', lat: 44.5126, lng: -88.0126, kraken: true },
  { id: 'dumoulin', name: 'Brian Dumoulin', team: 'Los Angeles Kings', town: 'Biddeford, ME', lat: 43.4926, lng: -70.4534, kraken: true },
  { id: 'catton', name: 'Berkly Catton', team: 'Seattle Kraken', town: 'Saskatoon, SK', lat: 52.1318, lng: -106.6608, kraken: true },
  { id: 'cfleury', name: 'Cale Fleury', team: 'Seattle Kraken', town: 'Carlyle, SK', lat: 49.6338, lng: -102.2670, kraken: true },
  { id: 'hfleury', name: 'Haydn Fleury', team: 'Winnipeg Jets', town: 'Carlyle, SK', lat: 49.6338, lng: -102.2670, kraken: true },
  { id: 'mahura', name: 'Josh Mahura', team: 'Seattle Kraken', town: 'St. Albert, AB', lat: 53.6332, lng: -113.6288, kraken: true },
  { id: 'mcmann', name: 'Bobby McMann', team: 'Seattle Kraken', town: 'Wainwright, AB', lat: 52.8403, lng: -110.8514, kraken: true },
  { id: 'melanson', name: 'Jacob Melanson', team: 'Seattle Kraken', town: 'Amherst, NS', lat: 45.8193, lng: -64.2334, kraken: true },
  { id: 'meyers', name: 'Ben Meyers', team: 'Seattle Kraken', town: 'Delano, MN', lat: 45.0419, lng: -93.7891, kraken: true },
  { id: 'nyman', name: 'Jani Nyman', team: 'Seattle Kraken', town: 'Valkeakoski, Finland', lat: 61.2656, lng: 24.0305, kraken: true },
  { id: 'winterton', name: 'Ryan Winterton', team: 'Seattle Kraken', town: 'Markham, ON', lat: 43.8564, lng: -79.3377, kraken: true },
  { id: 'blackwell', name: 'Colin Blackwell', team: 'Dallas Stars', town: 'North Andover, MA', lat: 42.7030, lng: -71.1309, kraken: true },
  { id: 'eyssimont', name: 'Michael Eyssimont', team: 'Boston Bruins', town: 'Littleton, CO', lat: 39.6133, lng: -105.0166, kraken: true },
  { id: 'yamamoto', name: 'Kailer Yamamoto', team: 'Utah (UTA)', town: 'Spokane, WA', lat: 47.6572, lng: -117.4235, kraken: true },
  { id: 'giordano', name: 'Mark Giordano', team: 'Toronto Maple Leafs', town: 'North York (Toronto), ON', lat: 43.7543, lng: -79.4491, kraken: true },
  { id: 'jarnkrok', name: 'Calle Jarnkrok', team: 'Toronto Maple Leafs', town: 'Gavle, Sweden', lat: 60.6749, lng: 17.1413, kraken: true },
  { id: 'mcdavid', name: 'Connor McDavid', team: 'Edmonton Oilers', town: 'Newmarket, ON', lat: 44.0563, lng: -79.4617, kraken: false },
  { id: 'draisaitl', name: 'Leon Draisaitl', team: 'Edmonton Oilers', town: 'Cologne, Germany', lat: 50.9384, lng: 6.9600, kraken: false },
  { id: 'matthews', name: 'Auston Matthews', team: 'Toronto Maple Leafs', town: 'Scottsdale, AZ', lat: 33.5967, lng: -111.8910, kraken: false },
  { id: 'mackinnon', name: 'Nathan MacKinnon', team: 'Colorado Avalanche', town: 'Cole Harbour, NS', lat: 44.6736, lng: -63.4877, kraken: false },
  { id: 'makar', name: 'Cale Makar', team: 'Colorado Avalanche', town: 'Calgary, AB', lat: 51.0456, lng: -114.0575, kraken: false },
  { id: 'pastrnak', name: 'David Pastrnak', team: 'Boston Bruins', town: 'Havirov, Czechia', lat: 49.7798, lng: 18.4369, kraken: false },
  { id: 'hedman', name: 'Victor Hedman', team: 'Tampa Bay Lightning', town: 'Ornskoldsvik, Sweden', lat: 63.2909, lng: 18.7153, kraken: false },
  { id: 'pettersson', name: 'Elias Pettersson', team: 'Vancouver Canucks', town: 'Sundsvall, Sweden', lat: 62.3908, lng: 17.3071, kraken: false },
  { id: 'boeser', name: 'Brock Boeser', team: 'Vancouver Canucks', town: 'Burnsville, MN', lat: 44.7671, lng: -93.2774, kraken: false },
  { id: 'aho', name: 'Sebastian Aho', team: 'Carolina Hurricanes', town: 'Rauma, Finland', lat: 61.1289, lng: 21.5039, kraken: false },
  { id: 'heiskanen', name: 'Miro Heiskanen', team: 'Dallas Stars', town: 'Espoo, Finland', lat: 60.2050, lng: 24.6560, kraken: false },
  { id: 'dahlin', name: 'Rasmus Dahlin', team: 'Buffalo Sabres', town: 'Lidkoping, Sweden', lat: 58.5053, lng: 13.1577, kraken: false },
  { id: 'barkov', name: 'Aleksander Barkov', team: 'Florida Panthers', town: 'Tampere, Finland', lat: 61.4978, lng: 23.7616, kraken: false },
  { id: 'tkachuk', name: 'Matthew Tkachuk', team: 'Florida Panthers', town: 'Creve Coeur, MO', lat: 38.6613, lng: -90.4424, kraken: false },
  { id: 'forsberg', name: 'Filip Forsberg', team: 'Nashville Predators', town: 'Ostervala, Sweden', lat: 60.1833, lng: 17.2000, kraken: false },
  { id: 'josi', name: 'Roman Josi', team: 'Nashville Predators', town: 'Bern, Switzerland', lat: 46.9485, lng: 7.4522, kraken: false },
  { id: 'hischier', name: 'Nico Hischier', team: 'New Jersey Devils', town: 'Naters, Switzerland', lat: 46.3243, lng: 7.9884, kraken: false },
  { id: 'barzal', name: 'Mathew Barzal', team: 'New York Islanders', town: 'Coquitlam, BC', lat: 49.2843, lng: -122.7933, kraken: false },
  { id: 'fox', name: 'Adam Fox', team: 'New York Rangers', town: 'Jericho, NY', lat: 40.7874, lng: -73.5435, kraken: false },
  { id: 'stutzle', name: 'Tim Stutzle', team: 'Ottawa Senators', town: 'Viersen, Germany', lat: 51.2562, lng: 6.3905, kraken: false },
  { id: 'crosby', name: 'Sidney Crosby', team: 'Pittsburgh Penguins', town: 'Cole Harbour, NS', lat: 44.6736, lng: -63.4877, kraken: false },
  { id: 'celebrini', name: 'Macklin Celebrini', team: 'San Jose Sharks', town: 'North Vancouver, BC', lat: 49.3206, lng: -123.0738, kraken: false },
  { id: 'thomas', name: 'Robert Thomas', team: 'St. Louis Blues', town: 'Aurora, ON', lat: 43.9997, lng: -79.4675, kraken: false },
  { id: 'connor', name: 'Kyle Connor', team: 'Winnipeg Jets', town: 'Shelby Township, MI', lat: 42.6700, lng: -83.0330, kraken: false },
  { id: 'bedard', name: 'Connor Bedard', team: 'Chicago Blackhawks', town: 'North Vancouver, BC', lat: 49.3206, lng: -123.0738, kraken: false },
  { id: 'kane', name: 'Patrick Kane', team: 'Chicago Blackhawks', town: 'South Buffalo, NY', lat: 42.8450, lng: -78.8200, kraken: false },
  { id: 'stamkos', name: 'Steven Stamkos', team: 'Nashville Predators', town: 'Unionville (Markham), ON', lat: 43.8517, lng: -79.3143, kraken: false },
  { id: 'carlsson', name: 'Leo Carlsson', team: 'Anaheim Ducks', town: 'Karlstad, Sweden', lat: 59.3809, lng: 13.5028, kraken: false },
  { id: 'boldy', name: 'Matt Boldy', team: 'Minnesota Wild', town: 'Millis, MA', lat: 42.1675, lng: -71.3573, kraken: false },
  { id: 'werenski', name: 'Zach Werenski', team: 'Columbus Blue Jackets', town: 'Grosse Pointe, MI', lat: 42.3861, lng: -82.9119, kraken: false },
  { id: 'eichel', name: 'Jack Eichel', team: 'Vegas Golden Knights', town: 'North Chelmsford, MA', lat: 42.6390, lng: -71.3828, kraken: false },
  { id: 'couturier', name: 'Sean Couturier', team: 'Philadelphia Flyers', town: 'Bathurst, NB', lat: 47.6209, lng: -65.6538, kraken: false },
  { id: 'raymond', name: 'Lucas Raymond', team: 'Detroit Red Wings', town: 'Gothenburg, Sweden', lat: 57.7072, lng: 11.9670, kraken: false },
  { id: 'kempe', name: 'Adrian Kempe', team: 'Los Angeles Kings', town: 'Kramfors, Sweden', lat: 62.9167, lng: 17.6667, kraken: false },
  { id: 'suzuki', name: 'Nick Suzuki', team: 'Montreal Canadiens', town: 'London, ON', lat: 42.9837, lng: -81.2496, kraken: false },
  { id: 'huberdeau', name: 'Jonathan Huberdeau', team: 'Calgary Flames', town: 'Saint-Jerome, QC', lat: 45.7804, lng: -74.0036, kraken: false },
  { id: 'wilson', name: 'Tom Wilson', team: 'Washington Capitals', town: 'Toronto, ON', lat: 43.6535, lng: -79.3839, kraken: false },
  { id: 'slafkovsky', name: 'Juraj Slafkovsky', team: 'Montreal Canadiens', town: 'Kosice, Slovakia', lat: 48.7164, lng: 21.2611, kraken: false },
];
```
