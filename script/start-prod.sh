#!/bin/bash

# go to the docker folder in case of script is running from an other place
BASEDIR=$(dirname "$0")
cd $BASEDIR/..

# load env file
export $(grep -v '^#' .env | xargs)

if [ $ZEN_ENV != "production" ] && [ $ZEN_ENV != "qa" ]; then
  echo "ERROR: ZEN_ENV would be set to 'production' or 'qa' but it is set to : '$ZEN_ENV'.";
  exit 1;
fi

if [ $ZEN_ENV = "production" ]; then
  echo "DOCKER BUILD PRODUCTION ...."
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
  echo "DOCKER UP PRODUCTION ...."
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build
else
  echo "DOCKER BUILD QA ...."
  docker-compose -f docker-compose.yml -f docker-compose.qa.yml build
  echo "DOCKER UP QA ...."
  docker-compose -f docker-compose.yml -f docker-compose.qa.yml up -d --no-build
fi
