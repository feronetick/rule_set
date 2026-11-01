# Reviewed Xray categories

These public category definitions are extracted without reclassification from the installed Xray DAT snapshots used by the reviewed exit. They are deliberately frozen until another source snapshot is reviewed, not substituted with HaGeZi or an independently updating geosite feed.

| Xray selector | Source DAT SHA-256 | SRS |
|---|---|---|
| `geosite:category-ads-all` | `ea8d817c4782a84db4104ba416329bb14024f69568c666f5cca6c4303ef1942e` | `category-ads-all.srs` |
| `geoip:private` | `cdf411fce977a1f48adb6a3b224e3e2bd7eccfcd4d6e2e30c6dc443f1a0e8e52` | `private-ips.srs` |

`private-ips` includes the exact DAT ranges (including CGNAT, documentation, benchmark and multicast ranges), not sing-box's `ip_is_private` heuristic. The category action remains in each consumer's ordered routing rules; these files alone do not enable blocking.

Regenerate a reviewed snapshot with `python3 scripts/xray_categories.py geosite category-ads-all /protected/geosite.dat categories/category-ads-all.json` (and `geoip private` for the IP file). Only the named public category is extracted; do not commit entire installed DAT files or infrastructure configuration. The normal build compiles both snapshots, checks semantic round trips and records hashes in manifest.json. Existing configured categories, combined proxy SRS and DAT outputs remain unchanged.
