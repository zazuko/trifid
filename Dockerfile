FROM node:6.10-onbuild

RUN npm install pm2 -g

CMD ["pm2-docker", "pm2-config.yml"]

EXPOSE 8080
