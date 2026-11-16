---
"trifid-plugin-ldforge": minor
"trifid": minor
"@zazuko/trifid-entity-renderer": patch
"trifid-plugin-graph-explorer": patch
---

Add trifid-plugin-ldforge as a native LDForge editor and result plugin integration.
Keep trifid-plugin-yasgui available with its existing API, assets and dependencies
so existing configurations continue to work. Bundled instances and entity-renderer
examples now use LDForge by default. Both editors can be mounted at separate paths;
the development preview serves LDForge at /sparql/ and Yasgui at /yasgui/.
Custom LDForge templates use the new DOM/config contract, and browser storage is
separate for each editor. Document that LDForge is the default in bundled
examples, Yasgui is a manually configured alternative, and there is no automatic
fallback on editor or query errors.

Include endpoint selection and catalogue suggestions, persistent query tabs,
formatting, prefixes, cancellation, CSV downloads, share links and optional URL
shortening. Register table, boolean, JSON, cards, charts, maps, network, timeline,
pivot and tree renderers. Preserve default and Swisstopo map configuration and
serve the editor and its assets correctly beneath a Trifid subpath. Escape embedded
configuration JSON, including query text and catalogue values, for safe HTML use.
Correct the Graph Explorer plugin configuration documentation.

Show Table, JSON, Map and Pivot directly in the result toolbar and include a
Trifid plugin source link beside About LDForge on the query page.
