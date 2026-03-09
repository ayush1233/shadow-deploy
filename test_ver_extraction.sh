#!/usr/bin/env bash

# Mock version extraction logic from updated setup.sh
extract_version() {
    local output="$1"
    echo "$output" | head -1 | sed -E 's/.*[^0-9.](([0-9]+\.[0-9]+)(\.[0-9]+)?).*/\1/' | grep -E '^[0-9]+\.[0-9]+' || echo "0.0"
}

echo "Testing Node.js output:"
NODE_V="v24.14.0"
echo "Input: $NODE_V"
echo "Extracted: $(extract_version "$NODE_V")"

echo -e "\nTesting Java output:"
JAVA_V="openjdk version \"17.0.18\" 2026-01-20"
echo "Input: $JAVA_V"
echo "Extracted: $(extract_version "$JAVA_V")"

echo -e "\nTesting Docker output:"
DOCKER_V="Docker version 29.2.0, build abcdef"
echo "Input: $DOCKER_V"
echo "Extracted: $(extract_version "$DOCKER_V")"

echo -e "\nTesting complex output:"
COMPLEX="Some tool 1.2.3 (build 456)"
echo "Input: $COMPLEX"
echo "Extracted: $(extract_version "$COMPLEX")"
