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

EXPOSE 8080

# Render's 512 MB limit covers heap, metaspace, code cache, thread stacks and
# native WebSocket/Tomcat buffers. Explicit launcher flags win even if an old
# JAVA_TOOL_OPTIONS value is still configured in the Render dashboard.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=45.0", "-XX:InitialRAMPercentage=20.0", "-Xss512k", "-XX:MaxMetaspaceSize=128m", "-XX:ReservedCodeCacheSize=64m", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
