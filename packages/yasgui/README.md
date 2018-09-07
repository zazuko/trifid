# trifid-plugin-yasgui

YASGUI for Trifid.
This middleware does the static file hosting for all YASGUI files and renders an index page that points to the given endpoint URL.
 
# Usage

The following options are supported:

- `endpointUrl`: URL to the SPARQL endpoint which will be used in the YASGUI interface
- `template`: Path to an alternative template (default: `views/index.html`)

An example for a customized trifid configuration using an alternative template looks like this:

	{
	  ...
	  "yasgui" : {
	    "default": {
	      "template": "cwd:views/yasgui.html"
	    }
	  },
	  ...
	}
