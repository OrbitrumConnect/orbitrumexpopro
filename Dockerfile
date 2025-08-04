# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies including TypeScript
RUN npm install -g typescript
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build the server
RUN cd server && npm run build

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start:prod"] 