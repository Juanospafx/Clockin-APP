# Dockerfile para tu app Vite/React

FROM node:18-alpine

# 1) Directorio de trabajo
WORKDIR /app

# 2) Copia package.json y package-lock.json e instala dependencias
COPY package.json package-lock.json ./
RUN npm ci

# 3) Copia TODO tu proyecto: src/, public/, src/styles/, etc.
COPY . .

# 4) Depuración: confirma que el CSS global existe
RUN ls -l src/styles/global.css

# 5) Construye la app con Vite (solo vite build)
RUN npm run build

# 6) Instala un servidor estático ligero
RUN npm install -g serve

# 7) Expón el puerto que vas a usar
EXPOSE 3000

# 8) Sirve el build estático
CMD ["serve", "-s", "dist", "-l", "3000"]
