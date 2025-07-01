# Dockerfile para tu app Vite/React

FROM node:18-alpine as build

WORKDIR /app

RUN rm -rf node_modules package-lock.json

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Copiar certificados
COPY ./backend/certs /etc/nginx/certs

# Configuración de Nginx para HTTPS
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]