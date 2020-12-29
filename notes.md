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


----

## Login:
Initiated when we connect to a space
### Response JSON:
State of the world, typically set by the first player:
```json
{
  "user": {"id":"1000"},
  "users": [{"id":"1000","name":"User1"}, {"id":"1001","name":"User2"}],
  "objects":{
    "ChatHistory":{"type": "List", "value": [
      {"actor":"User1", "message":"Hello User2, how are you"},
      {"actor":"User2", "message":"I'm OK"}
    ]},
    "ball":{"type":"json", "value": {"x":123,"y":456,"radius":5}}, 
    "player1":{"type":"json", "value": {"x":123,"y":456,"radius":5}}
  }
}
```

## Actions



### Create new item
```json
{"type":"action", "create":{"ball1235":{"x":"123","y":"456"}}}
->
{"type":"action","create":{"ball1235":{"x":"123","y":"456"}} }
```

### Change an item (ignore if it doesn't exist, it was probably deleted)
```json
{"type":"action", "update":{"ball":{"x":"123","y":"456"}}}
->
{"type":"action","update":{"ball":{"x":"123","y":"456"}} }
```

### Delete an object
```json
{"type":"action", "delete":{"ball1235":null}}
->
{"type":"action","delete":{"ball1235":null}}
```

### Insert into chat history
```json
{"type":"action", "action":"list_insert", "id":"ChatHistory", "value":{"actor":"User2", "message":"I'm OK"}}
->
{"type":"action","list_insert":{"ChatHistory":{"actor":"User2", "message":"I'm OK"}}
```
