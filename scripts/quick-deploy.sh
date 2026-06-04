#!/bin/sh

# this is a service script for @pxc1984 to quickly test whether deployment was successfull
# it does the same thing as deploy.yml, but without the need to commit to master

rsync -avz --delete --progress docker-compose.yml backend frontend admin nginx metrics $SSH_USER@$SSH_HOST:$DEPLOY_PATH
ssh $SSH_USER@$SSH_HOST "cd $DEPLOY_PATH && docker compose down || true"
ssh $SSH_USER@$SSH_HOST "cd $DEPLOY_PATH && export VITE_API_URL=https://roadmap.cu3rd.ru && docker compose -f docker-compose.yml up -d --build"
