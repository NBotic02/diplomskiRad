# =====================================================================
# Multi-stage Docker build for case-service.
# Stage 1 builds the fat JAR with Maven; stage 2 ships only the JRE
# and the JAR for a small runtime image (~250 MB).
# =====================================================================
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Cache dependency download separately from source code to speed up
# subsequent builds when only Java sources change.
COPY pom.xml ./
RUN mvn -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -B -ntp clean package -DskipTests

# ---------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root for safety.
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build /workspace/target/*.jar app.jar

EXPOSE 8081

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
