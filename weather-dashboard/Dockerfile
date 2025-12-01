# Dockerfile - build e preview de produção com Vite

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Gera o build de produção (dist/)
RUN npm run build

# Vite preview server
EXPOSE 5173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
