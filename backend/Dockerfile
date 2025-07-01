FROM nginx:alpine

# Copiar certificados
COPY certs /etc/nginx/certs

# Configuración de Nginx para HTTPS
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]