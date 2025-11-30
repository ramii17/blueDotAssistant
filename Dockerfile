FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build React app
COPY . .
RUN npm run build

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "server.js"]
