cd ../src/fund-dapp
npm ci
ng build
aws s3 sync ./dist/fund-dapp s3://ence-app