# Use an official Node.js image as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Your app binds to port 3001
EXPOSE 3001

# Define the command to run your app
CMD [ "npm", "run", "dev" ]