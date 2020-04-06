#!/bin/bash

## 
# this script should be run from the qa server after running deploy-qa.sh
# # 

# go to the docker folder in case of script is running from an other place
BASEDIR=$(dirname "$0")
cd $BASEDIR/..

# load env file
export $(grep -v '^#' .env.qa | xargs)

if [ $ZEN_ENV != "qa" ]; then
  echo "ERROR: ZEN_ENV would be set to 'production' or 'qa' but it is set to : '$ZEN_ENV'.";
  exit 1;
fi

VERSION=$(ls -1t images-docker-$ZEN_ENV/api* | head -1 | sed "s/images-docker-$ZEN_ENV\/api_//")
if [ $# -eq 1 ]; then
  VERSION=$1;
fi
export BUILD_VERSION=${VERSION}
echo "BUILD_VERSION=${BUILD_VERSION}"

echo "Load last NGINX build ..."
docker load -i images-docker-$ZEN_ENV/nginx_${BUILD_VERSION}
echo "Load last API build ..."
docker load -i images-docker-$ZEN_ENV/api_${BUILD_VERSION}

docker-compose -f docker-compose.yml -f docker-compose.${ZEN_ENV}.yml up -d --no-build
