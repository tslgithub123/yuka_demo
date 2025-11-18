# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application with a configured Nginx
FROM nginx:stable-alpine

# Copy the static assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# --- Modifications for React Router ---
# Remove the default Nginx server configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom nginx.conf from your project folder to the container
COPY nginx.conf /etc/nginx/conf.d/
# --- End of Modifications ---

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]