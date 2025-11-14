# התחל מסביבת Java 21 רשמית
FROM eclipse-temurin:21-jdk-jammy

# הגדר את תיקיית העבודה בתוך הסביבה
WORKDIR /app

# העתק את כל הפרויקט (מה-Root Directory שהגדרנו) פנימה
COPY . .

# תן הרשאת הרצה ל-gradlew (כמו שעשינו קודם)
RUN chmod +x ./gradlew

# הרץ את פקודת הבנייה
RUN ./gradlew build --no-daemon

# חשוף את הפורט שספרינג עובד עליו
EXPOSE 8080

# זו הפקודה שתריץ את השרת כשהוא עולה
CMD ["java", "-jar", "build/libs/*.jar"]