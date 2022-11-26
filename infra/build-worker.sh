cd ../src/fund-worker
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 176632549723.dkr.ecr.eu-central-1.amazonaws.com
docker build -t ence-worker .
docker tag ence-worker:latest 176632549723.dkr.ecr.eu-central-1.amazonaws.com/ence-worker:latest
docker push 176632549723.dkr.ecr.eu-central-1.amazonaws.com/ence-worker:latest