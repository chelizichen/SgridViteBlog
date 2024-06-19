# Linux

## 软链

路径/usr/test/portk 为一个脚本文件
通过软链接将这个脚本文件链接到/usr/app/util/portk

1. 创建软链接
ln -s  /usr/test/portk  /usr/app/util/portk

## 权限赋予

chmod +x ./portk

## 网络状态

t为tcp

u为udp

netstat -ntlp
