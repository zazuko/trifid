# trifid-plugin-yasgui

YASGUI for Trifid.
This middleware does the static file hosting for all YASGUI files and renders an index page that points to the given endpoint URL.

# Usage

The following options are supported:

- `endpointUrl`: URL to the SPARQL endpoint which will be used in the YASGUI interface
- `urlShortener`: URL of an URL Shortener service. It will be called like this (assuming `urlShortener` is `http://example.com/short/`): `http://example.com/short/?url=url-to-your-query` and should return a short URL as plain text (`http://foobar.baz/x8Z1a`). If `urlShortener` is not defined (more generally falsy), the short URL feature will be disabled in YASGUI.
- `template`: Path to an alternative template (default: `views/yasgui.hbs`)

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
