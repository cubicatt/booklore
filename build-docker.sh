#!/bin/bash

# Define variables
PROJECT_ROOT=$(pwd)
UI_DIR="$PROJECT_ROOT/booklore-ui"
API_DIR="$PROJECT_ROOT/booklore-api"
H2_JAR="$PROJECT_ROOT/h2-2.3.232.jar"
DOCKER_IMAGE_NAME="booklore-app"

# Step 1: Build Angular frontend
echo "Building Angular frontend..."
cd "$UI_DIR" || exit
npm install
npm run build --prod || { echo "Angular build failed"; exit 1; }
echo "Angular build completed."

# Step 2: Package Spring Boot API
echo "Packaging Spring Boot API..."
cd "$API_DIR" || exit
mvn clean package -DskipTests || { echo "Spring Boot build failed"; exit 1; }
API_JAR=$(find target -name "*.jar" | head -n 1)
echo "Spring Boot API packaged: $API_JAR"

# Step 3: Build Docker image
cd "$PROJECT_ROOT" || exit
echo "Building Docker image..."
docker build -t "$DOCKER_IMAGE_NAME" . || { echo "Docker build failed"; exit 1; }
echo "Docker image built: $DOCKER_IMAGE_NAME"

# Step 4: Clean up (optional)
echo "Cleaning up intermediate files..."
rm -rf "$UI_DIR/node_modules"

echo "Build process completed successfully!"