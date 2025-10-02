# Imagen base
FROM node:18-alpine
 
# Configurar directorio de trabajo en el contenedor
WORKDIR /app
 
# Copiar archivos esenciales para instalar dependencias
COPY package.json package-lock.json ./
 
 
# Instalar dependencias (incluye el postinstall para ejecutar `npx prisma generate`)
RUN npm install
 
# Copiar el resto del proyecto
COPY . .
 
# Copiar el archivo example.env y renombrarlo a .env
RUN cp example.env .env
 
# Construir la aplicación
RUN npm run build
 
# Exponer el puerto de la aplicación
EXPOSE 3000
 
# Comando por defecto para iniciar el servidor
CMD ["npm", "start"]