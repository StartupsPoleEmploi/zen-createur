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

echo "Load last NGINX build ..."
docker load -i docker-build-$ZEN_ENV/nginx
echo "Load last API build ..."
docker load -i docker-build-$ZEN_ENV/api

docker-compose -f docker-compose.yml -f docker-compose.$ZEN_ENV.yml up -d --no-build