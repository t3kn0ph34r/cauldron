#!/usr/bin/env bash
# Set the script file as the CWD
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
cd ${DIR};

AWS_PROFILE="cauldron"

# Get the environment names from the environment.json file
ENVIRONMENTS=$(node -e "console.log(require('./environments.json').environments.map(e => e.name).join(' '))")

# These two environment variables must be set
if [ -z $CAULDRON_ACCESS_KEY_ID ] || [ -z $CAULDRON_SECRET_ACCESS_KEY ]; then
    echo "CAULDRON_ACCESS_KEY_ID and CAULDRON_SECRET_ACCESS_KEY must be set as environment variables."
    exit 1
fi

# Create a credentials file if it doesn't already exist
CREDENTIALS_DIR="$HOME/.aws"
if [ ! -d "$CREDENTIALS_DIR" ]; then
    mkdir "$HOME/.aws"
fi

CREDENTIALS_FILE="$CREDENTIALS_DIR/credentials"
if [ ! -f "$CREDENTIALS_FILE" ]; then
    > "$CREDENTIALS_FILE"
fi

# Add an AWS profile if it doesn't already exist
if ! grep -q $AWS_PROFILE "$CREDENTIALS_FILE"; then
    printf "\n\n[$AWS_PROFILE]" >> "$CREDENTIALS_FILE"
    printf "\naws_access_key_id=$CAULDRON_ACCESS_KEY_ID" >> "$CREDENTIALS_FILE"
    printf "\naws_secret_access_key=$CAULDRON_SECRET_ACCESS_KEY" >> "$CREDENTIALS_FILE"
fi

cd ..
set -- $ENVIRONMENTS
REST_OF_ENVIRONMENTS=$(echo ${ENVIRONMENTS} | cut -d " " -f2-)

# if serverless has not been installed, set up stages
if [ ! -f "$DIR/../admin.env" ]; then
    # Set up project with first environment
    serverless project init -c -r us-east-1 -p $AWS_PROFILE -n $AWS_PROFILE -s $1

    # Set up stages for this project
    for ENV_NAME in $REST_OF_ENVIRONMENTS; do
        serverless stage create -s $ENV_NAME -r us-east-1 -p $AWS_PROFILE -c
    done

    # Build the project config
    npm run-script build
fi