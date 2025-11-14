FROM node:18-alpine

WORKDIR /usr/src/app

# install dependencies first (use package-lock if present)
COPY package*.json ./
RUN npm ci --only=production

# copy app source
COPY . .

# ensure runtime port is taken from env
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["npm", "start"]
