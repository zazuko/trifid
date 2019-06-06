FROM node:lts-alpine

# dumb-init is needed as an entrypoint to fix signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy the package.json and install the dependencies
COPY package.json ./
RUN npm install --only=production
COPY . .
RUN ln -s /app/server.js /usr/local/bin/trifid

ARG BUILD_DATE
ARG COMMIT
ARG VERSION

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="Trifid" \
      org.label-schema.description="Lightweight Linked Data Server and Proxy" \
      org.label-schema.url="https://github.com/zazuko/trifid" \
      org.label-schema.vcs-url="https://github.com/zazuko/trifid" \
      org.label-schema.vcs-ref=$COMMIT \
      org.label-schema.vendor="Zazuko" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["trifid"]

EXPOSE 8080
