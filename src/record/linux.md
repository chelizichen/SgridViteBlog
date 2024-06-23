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

## 内存

top 查看CPU 和 内存使用情况

top -p pid
top -d 更新时间间隔

top -d 1 -p pid
