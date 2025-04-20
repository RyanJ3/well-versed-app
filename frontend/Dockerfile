FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4200

# Remove --open flag and specify host 0.0.0.0
CMD ["npm", "run", "serve"]