---
"trifid": patch
"trifid-plugin-graph-explorer": minor
---

Support Graph Explorer 2.0, which is built with React 19 and bundles its own copy of React.

The page used to load React 16 from a CDN and mount the workspace with the `ReactDOM.render` API, which was removed in React 18. Since the `graph-explorer-full.min.js` bundle now ships React 19 itself, the CDN scripts are gone and the workspace is mounted with the `renderTo` helper exposed by the library.

The explorer now also fills the whole viewport between the Trifid header and footer instead of being constrained to a fixed 750px height inside the centered content column.
