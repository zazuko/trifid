---
"@zazuko/trifid-plugin-sparql-proxy": patch
---

Fixes Service Description to only respond to requests without **any** query strings, as it is required by the [spec](https://www.w3.org/TR/2013/REC-sparql11-service-description-20130321/#accessing).
