FROM docker.io/library/node:18-alpine

EXPOSE 8080

# configure some default values
ENV TRIFID_CONFIG="instances/docker-sparql/config.yaml"
ENV SPARQL_ENDPOINT_USERNAME="public"
ENV SPARQL_ENDPOINT_PASSWORD="public"
ENV SPARQL_PROXY_CACHE_PREFIX="default"
ENV SPARQL_PROXY_CACHE_CLEAR_AT_STARTUP="false"

# some default values for the 'docker-fetch' instance
ENV FETCH_HANDLER_FILE="https://raw.githubusercontent.com/zazuko/tbbt-ld/master/dist/tbbt.nt"
ENV FETCH_HANDLER_FILE_TYPE="application/n-triples"

WORKDIR /app

# use tini for PID1
# https://github.com/krallin/tini
RUN apk add --no-cache tini

# copy package.json and install dependencies
COPY package.json ./
COPY .npmrc ./
RUN npm install --omit=dev
COPY . .
RUN ln -s /app/server.js /usr/local/bin/trifid

# set permissions to directory
RUN chown -R 1000:1000 /app

# run as node user
USER 1000:1000

ENTRYPOINT ["tini", "--", "/app/server.js"]

HEALTHCHECK CMD wget -q -O- http://localhost:8080/health
