FROM node:22

WORKDIR /app

EXPOSE 5555 8080

cmd npm install \
    && npm run dev