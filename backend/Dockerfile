# Fixed Node.js version — pinned for reproducibility (LTS as of this build)
FROM node:20.14.0-alpine

WORKDIR /app

# Install git — required for simple-git (blame, diff, log)
RUN apk add --no-cache git

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]