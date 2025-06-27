FROM node:18-alpine

WORKDIR /app

# 1. Copia solo los archivos necesarios para instalar dependencias
COPY ../package.json ../package-lock.json ./

# 2. Instala dependencias
RUN npm ci

# 3. Copia el resto de los archivos del frontend
COPY . .

# 4. Construye la app con variables de entorno
RUN npm run build

# 5. Instala servidor estático
RUN npm install -g serve

EXPOSE 3000

# 6. Inicia el servidor
CMD ["serve", "-s", "dist", "-l", "3000"]