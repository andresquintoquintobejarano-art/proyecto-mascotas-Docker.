FROM node:22-alpine

WORKDIR /usr/src/app

# Instalar dependencias primero (aprovecha la caché de capas de Docker)
COPY package.json ./
RUN npm install --omit=dev

# Copiar el resto del código fuente
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
