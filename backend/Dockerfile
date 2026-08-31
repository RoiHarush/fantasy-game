FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /workspace

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle settings.gradle ./

RUN chmod +x gradlew \
    && ./gradlew dependencies --no-daemon

COPY src src

RUN ./gradlew clean bootJar --no-daemon

FROM eclipse-temurin:21-jre-jammy

RUN groupadd --system fantasy \
    && useradd --system --gid fantasy --home-dir /app fantasy

WORKDIR /app

COPY --from=build --chown=fantasy:fantasy /workspace/build/libs/app.jar app.jar

USER fantasy

# Leave explicit native-memory headroom for Tomcat threads, WebSocket buffers,
# metaspace and the JVM itself. Render enforces the container limit, not only
# the Java heap limit.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=55.0 -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
