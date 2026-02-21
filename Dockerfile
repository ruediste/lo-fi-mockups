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

FROM base AS build-xwiki-frontend
COPY . .
RUN npm run build-webjar

FROM maven:3.9.12-eclipse-temurin-25-alpine as build-xwiki
WORKDIR /app/xwiki
COPY xwiki/pom.xml pom.xml
# RUN mvn dependency:go-offline -B
COPY xwiki/src src
COPY --from=build-xwiki-frontend /app/dist/ src/main/webjar/
RUN mvn clean package -P!local

FROM scratch
COPY --from=build-native /app/native/lofi-release.zip /native/native.zip
COPY --from=build-pages /app/dist/ /pages/
COPY --from=build-xwiki /app/xwiki/target/lo-fi-mockups-xwiki-*.jar /xwiki/lo-fi-mockups-xwiki.jar
