#!/bin/bash

## 
# this script should be run from the qa server after running deploy.sh
# # 

# go to the docker folder in case of script is running from an other place
BASEDIR=$(dirname "$0")
cd $BASEDIR/..

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


VERSION=$(ls -1t images-docker-${ZEN_ENV}/api* | head -1 | sed "s/images-docker-${ZEN_ENV}\/api_//")
if [ $# -eq 2 ]; then
  VERSION=${2};
fi
export BUILD_VERSION=${VERSION}
echo "BUILD_VERSION=${BUILD_VERSION}"

echo "Load last NGINX build ... ${BUILD_VERSION}"
docker load -i images-docker-${ZEN_ENV}/nginx_${BUILD_VERSION}
echo "Load last API build ..."
docker load -i images-docker-${ZEN_ENV}/api_${BUILD_VERSION}

docker-compose -f docker-compose.yml -f docker-compose.${ZEN_ENV}.yml up -d --no-build
