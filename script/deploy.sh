#!/bin/bash

# go to the docker folder in case of script is running from an other place
BASEDIR=$(dirname "$0")
cd ${BASEDIR}/..

MODE=${1}

if [ ${MODE} != "production" ] && [ ${MODE} != "qa" ]; then
  echo "ERROR: Should receive PARAM 'production' or 'qa'";
  exit 1;
fi

# load env file
export $(grep -v '^#' .env.${MODE} | xargs)
if [ ${ZEN_ENV} != ${MODE} ]; then
  echo "ERROR: ZEN_ENV is set to '${ZEN_ENV}' but it should be '${MODE}'.";
  exit 1;
fi

PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
export BUILD_VERSION=${PACKAGE_VERSION}
echo "BUILD_VERSION=${BUILD_VERSION}"

# ---------------------------- Generate CUSTOM build (NGINX, API and CRON)   ----------------------------
echo "DOCKER BUILD ${ZEN_ENV} ...."
docker-compose -f docker-compose.yml -f docker-compose.${ZEN_ENV}.yml build # --force-rm --parallel --no-cache
rm -rf images-docker-${ZEN_ENV} && mkdir images-docker-${ZEN_ENV}
echo "Save docker NGINX ...." 
docker save -o ./images-docker-${ZEN_ENV}/nginx_${BUILD_VERSION} zen-createur-nginx_${ZEN_ENV}:${BUILD_VERSION}
echo "Save docker API ...." 
docker save -o ./images-docker-${ZEN_ENV}/api_${BUILD_VERSION} zen-createur-api_${ZEN_ENV}:${BUILD_VERSION}

# ---------------------------- Send CUSTOM build (NGINX, API and CRON) to the server  ----------------------------
echo "SCP useful files to ${ZEN_ENV} server ...."
scp docker-compose.yml \
    docker-compose.${ZEN_ENV}.yml \
    .env.${ZEN_ENV} \
    zen-createur-${ZEN_ENV}:/home/docker/zen-createur

echo "SCP script"
scp -r script zen-createur-${ZEN_ENV}:/home/docker/zen-createur

echo "SCP docker to ${ZEN_ENV} server ...."
scp -r ./images-docker-${ZEN_ENV} zen-createur-${ZEN_ENV}:/home/docker/zen-createur
