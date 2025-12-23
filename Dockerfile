# Build stage: install dependencies
FROM dhi.io/node:24-alpine3.22-dev AS build
WORKDIR /app

# Copy everything, so that it uses local dependencies
COPY . .
RUN npm install && npm cache clean --force

# Runtime stage
FROM dhi.io/node:24-alpine3.22 AS runtime

EXPOSE 8080

# Configure some default values
ENV TRIFID_CONFIG="instances/docker-sparql/config.yaml"

# Some default values for the 'docker-fetch' instance
ENV FETCH_HANDLER_FILE="https://raw.githubusercontent.com/zazuko/tbbt-ld/master/dist/tbbt.nt"
ENV FETCH_HANDLER_FILE_TYPE="application/n-triples"

WORKDIR /app/packages/trifid

ENTRYPOINT [ "/app/packages/trifid/server.js" ]

COPY --from=build /app/ /app/
