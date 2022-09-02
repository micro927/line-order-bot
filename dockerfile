FROM node:lts-alpine

ENV NODE_ENV=production

WORKDIR /

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

# EXPOSE 8182
CMD [ "node", "index.js"]