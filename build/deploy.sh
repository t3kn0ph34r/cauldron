#!/usr/bin/env bash
# Set the script file as the CWD
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
cd ${DIR};

if [ $# -lt 2 ]; then
    node ./deploy.js --env $1
else
    node ./deploy.js --env $1 --function $2
fi

if [ $? -eq 0 ] ; then
    cd ..
    if [ $# -lt 2 ]; then
        echo "Deploying Serverless functions"

        sls resources deploy -r us-east-1 -s $1
        sls function deploy -a -s $1
    else
        echo "Deploying Serverless function"

        sls resources deploy -r us-east-1 -s $1
        sls function deploy $2 -s $1
    fi

    ENDPOINTS=$(node ./build/endpoints.js --env $1 --function $2)

    sls endpoint deploy -r us-east-1 -s $1 $ENDPOINTS

    echo "Deployment done."
else
    echo "Deployment Failed!"
fi