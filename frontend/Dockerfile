# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm, which is the project's package manager
RUN npm install -g pnpm

# Copy package definition files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using the lockfile for consistency
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN pnpm build

# Stage 2: Create the final production image
FROM node:18-alpine

WORKDIR /app

# Install pnpm again in the new stage
RUN npm install -g pnpm

# Copy only the necessary production dependencies manifest from the builder stage
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy the built application artifacts and public assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose the port the app runs on
EXPOSE 3000

# The default command to start the application in production mode
CMD ["pnpm", "start"] 