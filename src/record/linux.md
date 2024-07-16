# Linux

## 软链

路径/usr/test/portk 为一个脚本文件
通过软链接将这个脚本文件链接到/usr/app/util/portk

1. 创建软链接

````sh
ln -s  /usr/test/portk  /usr/app/util/portk
````

## 权限赋予

````sh
chmod +x ./portk
````

## 网络状态

t为tcp

u为udp

````sh
netstat -ntlp
````

## 内存

top 查看CPU 和 内存使用情况

top -p pid
top -d 更新时间间隔

````sh
top -d 1 -p pid
````

## 查看某个字符串在文件中出现的次数

````sh
grep -o 'str' xxx.log | wc -l
````

## 网络连通性的部分问题

linux运维都需要对端口开放查看  netstat 就是对端口信息的查看

p **查看端口挂的**程序

0.0.0.0 是**对外开放，通过服务域名、ip可以访问的端口**

127.0.0.1 **只能对本机 localhost访问**，也是保护此端口安全性

::: 这三个: 的前两个”::“，是“0:0:0:0:0:0:0:0”的缩写，相当于IPv6的“0.0.0.0”，就是本机的所有
IPv6地址，第三个:是IP和端口的分隔符
