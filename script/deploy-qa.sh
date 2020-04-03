#!/bin/bash

# go to the docker folder in case of script is running from an other place
BASEDIR=$(dirname "$0")
cd $BASEDIR/..

# load env file
export $(grep -v '^#' .env.qa | xargs)
if [ $ZEN_ENV != "qa" ]; then
  echo "ERROR: ZEN_ENV would be set to 'production' or 'qa' but it is set to : '$ZEN_ENV'.";
  exit 1;
fi

PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
export BUILD_VERSION=${PACKAGE_VERSION}
echo "BUILD_VERSION=$BUILD_VERSION"

echo "SCP useful files to $ZEN_ENV server ...."
scp docker-compose.yml \
    docker-compose.$ZEN_ENV.yml \
    .env.$ZEN_ENV \
    zen-createur-recette:/home/docker/zen-createur

# ---------------------------- Generate CUSTOM build (NGINX, API and CRON) and send it to the server  ----------------------------
echo "DOCKER BUILD $ZEN_ENV ...."
docker-compose -f docker-compose.yml -f docker-compose.$ZEN_ENV.yml build --force-rm --parallel --no-cache
rm -rf images-docker-$ZEN_ENV && mkdir images-docker-$ZEN_ENV
echo "Save docker NGINX ...." 
docker save -o ./images-docker-$ZEN_ENV/nginx_$BUILD_VERSION zen-createur-nginx_$ZEN_ENV:$BUILD_VERSION
echo "Save docker API ...." 
docker save -o ./images-docker-$ZEN_ENV/api_$BUILD_VERSION zen-createur-api_$ZEN_ENV:$BUILD_VERSION
echo "SCP docker to $ZEN_ENV server ...."
scp -r ./images-docker-$ZEN_ENV zen-createur-recette:/home/docker/zen-createur
