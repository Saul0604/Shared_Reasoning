# Etapa 1: Construir el proyecto con Node.js
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código y construir la app
COPY . .
RUN npm run build

# Etapa 2: Servir los archivos estáticos con Nginx
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar la carpeta 'dist' generada en la etapa 1 al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto web
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
