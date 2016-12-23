# trifid-yasgui

YASGUI for Trifid.
This middleware does the static file hosting for all YASGUI files and renders a index page that points to the given endpoint URL.
 
# Usage

The following options are supported:

- `endpointUrl`: URL to the SPARQL endpoint which will be used in the YASGUI interface
- `template`: Path to an alternative template (default: `templates/index.html`)
