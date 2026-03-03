# Stage 1: Build
FROM gradle:8.5-jdk17-alpine AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S appgrp && adduser -S appuser -G appgrp

COPY --from=build /app/build/libs/comparison-engine.jar app.jar

RUN chown -R appuser:appgrp /app

USER appuser

EXPOSE 8082

ENV JAVA_OPTS="-Xms512m -Xmx1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
