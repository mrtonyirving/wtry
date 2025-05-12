#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Make sure to set up dev-wayless with: aws configure --profile dev-wayless
AWS_PROFILE="dev-wayless"

if aws configure list-profiles | grep -q "$AWS_PROFILE"; then
  echo "Profile $AWS_PROFILE exists. Proceeding with deployment..."
else
  echo "Profile $AWS_PROFILE does not exist. Please configure it using 'aws configure --profile $AWS_PROFILE'."
  exit 1
fi

# Build the project
echo "Building project..."
yarn build || { echo "Yarn build failed"; exit 1; }

cd infrastructure

# Run the CDK deployment using the specified AWS profile
echo "Synthesizing CDK templates..."
cdk synth --profile $AWS_PROFILE || { echo "CDK synth failed"; exit 1; }

echo "Bootstrapping CDK..."
cdk bootstrap --profile $AWS_PROFILE || { echo "CDK bootstrap failed"; exit 1; }

echo "Deploying CDK stack..."
cdk deploy --profile $AWS_PROFILE || { echo "CDK deploy failed"; exit 1; }

cd ..
