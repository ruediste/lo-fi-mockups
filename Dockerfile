# node:lts-alpine3.22
FROM node@sha256:d28696cabe6a72c5addbb608b344818e5a158d849174abd4b1ae85ab48536280 AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build-native
COPY neutralino.config.json ./
RUN npm run native-download
COPY . .
RUN npm run native-build

FROM base AS build-pages
COPY . .
RUN npm run build-pages

FROM scratch
COPY --from=build-native /app/native/lofi-release.zip /native/native.zip
COPY --from=build-pages /app/dist/ /pages/
