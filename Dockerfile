FROM docker.io/library/node:16-alpine

EXPOSE 8080

ENV TRIFID_CONFIG="config.json"

WORKDIR /app

# use tini for PID1
# https://github.com/krallin/tini
RUN apk add --no-cache tini

# copy package.json and install dependencies
COPY package.json ./
COPY .npmrc ./
RUN npm install --only=production
COPY . .
RUN ln -s /app/server.js /usr/local/bin/trifid

# run as nobody
USER 65534:65534

ENTRYPOINT ["tini", "--", "/app/server.js"]

HEALTHCHECK CMD wget -q -O- http://localhost:8080/health
