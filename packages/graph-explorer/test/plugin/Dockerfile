FROM ghcr.io/zazuko/trifid:v2.3.10

WORKDIR /trifid-plugin
USER root
COPY package.json .
RUN npm install --only=production
COPY index.js .
COPY views/index.html views/index.html

WORKDIR /app
RUN cp views/header.html views/navigation.html views/footer.html /trifid-plugin/views/
COPY test/plugin/config.json config-test.json

# run as nobody
USER 65534:65534

ENV TRIFID_CONFIG=config-test.json
