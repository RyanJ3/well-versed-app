# frontend/Dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4200

# Use the proxy configuration for Docker
CMD ["npm", "run", "serve:docker"]