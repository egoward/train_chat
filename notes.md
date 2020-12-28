docker build . --tag wsrelay
docker images
docker 

docker run -p 8081:8080 wsrelay
docker ps

aws --profile edonica --region  eu-west-1  ecr get-authorization-token --query authorizationData[].authorizationToken --output text
docker login --username AWS --password-stdin 953175599357.dkr.ecr.eu-west-2.amazonaws.com

Don't do this??
  Powershell modular installar thing.  From administrative powershell prompt:
  Install-Module -Name AWS.Tools.Installer
  Install-AWSToolsModule AWS.Tools.ECR

Run this:
  aws --profile edonica --region eu-west-2 ecr get-login 
  Copy the resulting docker command which includes a huge password, remove the "-e none" (why??) and run it.

docker build . --tag wsrelay
docker image tag wsrelay 953175599357.dkr.ecr.eu-west-2.amazonaws.com/wsrelay
docker push 953175599357.dkr.ecr.eu-west-2.amazonaws.com/wsrelay
