FROM docker.io/library/node:20-alpine

EXPOSE 8080

# Configure some default values
ENV TRIFID_CONFIG="instances/docker-sparql/config.yaml"
ENV SPARQL_ENDPOINT_USERNAME="public"
ENV SPARQL_ENDPOINT_PASSWORD="public"
ENV SPARQL_PROXY_CACHE_PREFIX="default"
ENV SPARQL_PROXY_CACHE_CLEAR_AT_STARTUP="false"

# Some default values for the 'docker-fetch' instance
ENV FETCH_HANDLER_FILE="https://raw.githubusercontent.com/zazuko/tbbt-ld/master/dist/tbbt.nt"
ENV FETCH_HANDLER_FILE_TYPE="application/n-triples"

# Use tini for PID1
# https://github.com/krallin/tini
RUN apk add --no-cache tini

# Run as node user
USER 1000:1000
WORKDIR /app

# Copy everything, so that it uses local dependencies
COPY --chown=1000:1000 . .
RUN npm install && npm cache clean --force

WORKDIR /app/packages/trifid

ENTRYPOINT ["tini", "--", "/app/packages/trifid/server.js"]

HEALTHCHECK CMD wget -q -O- http://localhost:8080/health
