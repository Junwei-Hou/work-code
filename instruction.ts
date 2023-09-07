# All the following instruction is runned in mac system

# Solve the issue of not having permission to edit : 
  sudo chmod -R 777 /Users/junweihou/Desktop/

# Start mongodb service :
mongod --fork --dbpath data --logpath log/mongo.log --logappend

# Start ali ECS service :
sudo ssh -i ~/.ssh/kill_liuhuming.pem root@47.109.87.58

# Upload file to ali ECS service :
sudo scp -r -i ~/.ssh/kill_liuhuming.pem /Users/junweihou/Desktop/your-file-name root@47.109.87.58:/home

# Start bandwagon service :
sudo ssh -i ~/.ssh/id_rsa root@67.230.163.195 -p 27287

# Upload file to bandwagon service :
sudo scp -r -i ~/.ssh/id_rsa -P 27287 /Users/junweihou/Desktop/your-file-name root@67.230.163.195:/data