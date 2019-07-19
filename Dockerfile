FROM node:lts-alpine

WORKDIR /app

# Copy the package.json and install the dependencies
COPY package.json ./
COPY .npmrc ./
RUN npm install --only=production
COPY . .
RUN ln -s /app/server.js /usr/local/bin/trifid

USER nobody:nobody

LABEL org.label-schema.name="Trifid" \
      org.label-schema.description="Lightweight Linked Data Server and Proxy" \
      org.label-schema.url="https://github.com/zazuko/trifid" \
      org.label-schema.vcs-url="https://github.com/zazuko/trifid" \
      org.label-schema.vendor="Zazuko" \
      org.label-schema.schema-version="1.0"

ENTRYPOINT []

# Using npm scripts for running the app allows two things:
#  - Handle signals correctly (Node does not like to be PID1)
#  - Let Skaffold detect it's a node app so it can attach the Node debugger
CMD ["npm", "run", "start"]

EXPOSE 8080
HEALTHCHECK CMD wget -q -O- http://localhost:8080/health
