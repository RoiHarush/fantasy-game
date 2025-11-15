FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

COPY . .

RUN chmod +x ./gradlew

RUN ./gradlew build --no-daemon

EXPOSE 8080

CMD ["java", "-jar", "build/libs/app.jar"]