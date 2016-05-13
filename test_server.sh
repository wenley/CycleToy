#!/bin/bash
set -e

echo "Try getting model..."
curl -v http://127.0.0.1:5000/models/1

echo "\n\nTry changing model..."
curl -v http://127.0.0.1:5000/models/1 -X PUT -d id=1 -d value=Hello

echo "\n\nTry fetching updated model..."
curl -v http://127.0.0.1:5000/models/1

echo "\n\nTry making new model..."
curl -v http://127.0.0.1:5000/models -X POST -d value=Hi

echo "\n\nTry fetching new model..."
curl -v http://127.0.0.1:5000/models/2
