# Build Stage
FROM node:8.15 AS BUILD

WORKDIR /usr/src/app
# Copy content of git repo to container
COPY ./package.json /usr/src/app/
COPY ./package-lock.json /usr/src/app/

RUN npm install --only=production && npm prune --production

# Production Stage
FROM node:8.15-slim

# Copy tilemill and node modules to new container
WORKDIR /usr/src/app
COPY --chown=node:node --from=BUILD /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app

USER node
# Export port for tiles
EXPOSE 20008
# Export port for webpage
EXPOSE 20009

CMD ["node", "/usr/src/app/index.js", "--listenHost=0.0.0.0"]

