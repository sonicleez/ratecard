FROM node:20-slim AS base
WORKDIR /app

FROM base AS build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM base AS final
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
