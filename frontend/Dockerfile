FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

# Default backend URL (overridden by BACKEND_URL env var in Render or custom deployments)
ENV BACKEND_URL=http://api:4000

COPY --from=builder /app/dist /usr/share/nginx/html

# Support both template envsubst (official Nginx image feature) and static default
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
