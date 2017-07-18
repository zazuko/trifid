FROM node:6.11

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install pm2 -g
RUN npm install trifid -g

COPY . /usr/src/app

CMD pm2-docker start npm -- start

EXPOSE 8080
