#!/bin/bash  

readonly ServerName="SgridViteBlog"

rm ./$ServerName.tar.gz

npm run build

cp ./sgrid.yml ./build/
cp package.json ./build/
cp package-lock.json ./build/
cp -r dist ./build/

cd build 
npm i --production

tar -cvf $ServerName.tar.gz ./*

mv $ServerName.tar.gz ../
