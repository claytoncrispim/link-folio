# Use an official Node.js image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json AND package-lock.json
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Expose the port your app runs on
EXPOSE 3001

# This is the new, combined startup command.
# It uses the "shell" form of CMD, which is perfect for chaining commands.
# It will run migrations, then generate the client, and only then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run dev"]