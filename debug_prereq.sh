#!/usr/bin/env bash
echo "Checking node:"
command -v node || echo "node NOT FOUND with command -v"
which node || echo "node NOT FOUND with which"

echo "Checking version extraction for node:"
NODE_VER=$(node -v 2>&1)
echo "Raw node -v: $NODE_VER"
extracted=$(echo "$NODE_VER" | head -1 | grep -oP '\d+\.\d+' | head -1)
echo "Extracted with grep -oP '\d+\.\d+': '$extracted'"

echo "Checking java:"
command -v java || echo "java NOT FOUND with command -v"
which java || echo "java NOT FOUND with which"

echo "Checking version extraction for java:"
JAVA_VER=$(java -version 2>&1)
echo "Raw java -version: $JAVA_VER"
extracted=$(echo "$JAVA_VER" | head -1 | grep -oP '\d+\.\d+' | head -1)
echo "Extracted with grep -oP '\d+\.\d+': '$extracted'"
