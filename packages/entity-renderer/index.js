import { dirname } from "path";
import { fileURLToPath } from "url";
import rdfFormats from "@rdfjs/formats-common";
import hijackResponse from "hijackresponse";

import rdf from "rdf-ext";
import { createEntityRenderer } from "./renderer/entity.js";
import { createMetadataProvider } from "./renderer/metadata.js";

const { parsers } = rdfFormats;

const currentDir = dirname(fileURLToPath(import.meta.url));

const getAcceptHeader = (req) => {
  const queryStringValue = req.query.format;

  const supportedQueryStringValues = {
    ttl: "text/turtle",
    jsonld: "application/ld+json",
    xml: "application/rdf+xml",
    nt: "application/n-triples",
  };

  if (
    Object.hasOwnProperty.call(supportedQueryStringValues, queryStringValue)
  ) {
    return supportedQueryStringValues[queryStringValue];
  }

  return req.headers.accept;
};

const factory = async (trifid) => {
  const { render, logger, config } = trifid;
  const entityRenderer = createEntityRenderer({ options: config, logger });
  const metadataProvider = createMetadataProvider({ options: config });

  const { path, ignorePaths } = config;
  const entityTemplatePath = path || `${currentDir}/views/render.hbs`;

  // if `ignorePaths` is not provided or invalid, we configure some defaults values
  let ignoredPaths = ignorePaths;
  if (!ignorePaths || !Array.isArray(ignorePaths)) {
    ignoredPaths = ["/query"];
  }

  return async (req, res, next) => {
    // check if it is a path that needs to be ignored (check of type is already done at the load of the middleware)
    if (ignoredPaths.includes(req.path)) {
      return next();
    }

    // update "Accept" HTTP header depending on the requested type
    req.headers.accept = getAcceptHeader(req);

    // only take care of the rendering if HTML is requested
    const accepts = req.accepts(["text/plain", "json", "html"]);
    if (accepts !== "html") {
      return next();
    }

    req.headers.accept = "application/n-quads";

    const { readable, writable } = await hijackResponse(res, next);

    const contentType = res.getHeader("Content-Type");
    if (!contentType) {
      return readable.pipe(writable);
    }

    const mimeType = contentType.toLowerCase().split(";")[0].trim();
    const hijackFormats = [
      "application/ld+json",
      "application/trig",
      "application/n-quads",
      "application/n-triples",
      "text/n3",
      "text/turtle",
      "application/rdf+xml",
    ];

    if (!hijackFormats.includes(mimeType)) {
      return readable.pipe(writable);
    }

    const quadStream = parsers.import(mimeType, readable);
    const dataset = await rdf.dataset().import(quadStream);

    let contentToForward;
    try {
      const { entityHtml, entityLabel, entityUrl } = await entityRenderer(
        req,
        res,
        { dataset },
      );
      const metadata = await metadataProvider(req, { dataset });
      contentToForward = await render(entityTemplatePath, {
        dataset: entityHtml,
        locals: res.locals,
        entityLabel,
        entityUrl,
        metadata,
        config,
      });
      res.setHeader("Content-Type", "text/html");
    } catch (e) {
      logger.error(e);
      return readable.pipe(writable);
    }

    writable.write(contentToForward);
    writable.end();
  };
};

export default factory;
