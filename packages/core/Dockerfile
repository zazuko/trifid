FROM node:carbon

# install pm2 process manager
RUN npm install pm2 -g

# install trifid globaly accessible
RUN mkdir -p /opt/trifid
WORKDIR /opt/trifid
COPY . /opt/trifid
RUN npm install -g --only=production

# create application directory
RUN mkdir -p /usr/src/app
RUN ln -s /opt/trifid/node_modules /usr/src/app
WORKDIR /usr/src/app
# copy necessary files, overwrite for your instance
COPY config.json ./
COPY views ./views
COPY public ./public

CMD ["pm2-docker", "trifid"]

EXPOSE 8080
