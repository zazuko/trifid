FROM node:6.10

RUN npm install pm2 -g
RUN npm install trifid -g

CMD pm2-docker start npm -- docker

EXPOSE 8080
