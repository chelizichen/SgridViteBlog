# Golang 开发记录

## SgridGo 0.0.6版本 CPU负载过高问题修复

::: tip
Go里面的time.Sleep()会让出CPU，也就是说，当一个协程调用了time.Sleep()方法后，它会被挂起，不再占用CPU资源，而是将CPU让给其他可运行的协程。
Go里面的runtime.Gosched()也会让出CPU，它的作用是主动地将当前协程放到等待队列中，让出CPU给其他协程，但是当前协程仍然处于可运行状态，可能在下一个时间片被调度执行。
Go里面的time.Sleep()和runtime.Gosched()的区别在于，time.Sleep()会让出CPU一定的时间，直到睡眠时间结束后才会重新被调度执行；而runtime.Gosched()只是暂时让出CPU，可能很快就会被调度执行。
Go里面的协程调度是非抢占式的，也就是说，一个协程只有在发生阻塞（如IO操作、系统调用、信号处理、GC等）或者主动让出（如runtime.Gosched()、time.Sleep()等）时才会被切换。这样可以减少上下文切换的开销，提高性能，但也可能导致某些计算密集型的协程长时间占用CPU而不释放。
Go在1.14版本引入了抢占式调度的机制，也就是说，当一个协程运行时间超过一定阈值（约10ms）时，它会被强制切换，从而避免长时间霸占CPU。这样可以提高系统的响应性和公平性，但也可能增加上下文切换的开销。
:::

现象:

重启或发布服务次数过多以后，机器的CPU负载会达到90%以上，导致服务响应变慢。经排查原因是SgridGo下的服务监控功能两个存在问题

1. 当服务 DOWN 掉时 日志监控协程 并没有及时退出销毁，导致未被销毁的协程的数量越来越多，协程内部大量执行 for 空转，占用CPU资源，导致负载过高。
2. 心跳检测组件在初期使用的是 for + time.Sleep 模拟定时任务，但是 time.Sleep 会导致该协程主动让出并切换，当大量的 time.Sleep 存在时会导致频繁的上下文切换，导致 CPU 占用过高。

解决方法:

1. 加上 原子变量 去判断是否需要执行心跳检测。
2. 并且定时任务采用 cron 的形式，避免 time.Sleep 带来的上下文切换。

## Docker记录

### build

````sh
docker build -t sgrid-test:latest .
````

### run

````sh
docker run -d -p 12111:8080 --name sgrid-container sgrid-test:latest
````

这里的关键参数说明如下：

-d：在后台运行容器。
-p 12111:8080：将宿主机的 12111 端口映射到容器内的 8080 端口。
--name sgrid-container：给容器指定一个名称 sgrid-container。
sgrid-test:latest：使用构建的镜像 sgrid-test:latest 运行容器。
这样，你就可以通过宿主机的 12111 端口访问容器内运行的服务了。

### STOP

停止正在运行的 Docker 容器可以通过几种不同的方法来实现。以下是几种常见的方法：

1. 使用容器名称或 ID
查找容器名称或 ID
首先，你需要找到容器的名称或 ID。可以使用以下命令查看所有正在运行的容器：

````sh
docker ps
````

或者，查看所有容器（包括已停止的）：

````sh
docker ps -a
````

停止容器
通过容器名称停止：

````sh
docker stop <容器名称>
````

通过容器 ID 停止：

````sh
docker stop <容器ID>
````

例如，如果你的容器名称为 sgrid-container 或者容器 ID 为 abcdef123456，可以使用以下命令停止容器：

````sh
docker stop sgrid-container
````
或

````sh
docker stop abcdef123456
````

2. 强制停止容器
如果容器没有响应，可以使用 docker kill 命令强制停止容器：

````sh
docker kill <容器名称>
````

或

````sh
docker kill <容器ID>
````

例如：

````sh
docker kill sgrid-container
````

或

````sh
docker kill abcdef123456
````

3. 停止所有容器
如果你想停止所有正在运行的容器，可以使用以下命令：

````sh
docker stop $(docker ps -aq)
````

这条命令会停止所有正在运行的容器。

4. 强制停止所有容器

如果需要强制停止所有容器，可以使用以下命令：

````sh
docker kill $(docker ps -aq)
````

这条命令会强制停止所有正在运行的容器。

示例
假设你的容器名称为 sgrid-container：

查找容器：

````sh
docker ps
````

停止容器：

````sh
docker stop sgrid-container
````

如果容器没有响应，可以尝试强制停止：

````sh
docker kill sgrid-container
````

这样，你可以根据需要选择合适的方法来停止 Docker 容器。

### REMOVE

当你遇到这样的错误时，意味着容器名称已经被另一个容器占用。解决这个问题有几种方法：

删除已有容器。
重命名已有容器。
使用不同的容器名称。
方法一：删除已有容器
查找容器：

sh
docker ps -a
停止并删除容器：

sh
docker stop sgrid-container
docker rm sgrid-container
方法二：重命名已有容器
查找容器：

sh
docker ps -a
重命名容器：

sh
docker rename sgrid-container new-sgrid-container
方法三：使用不同的容器名称
停止已有容器：

sh
docker stop sgrid-container
重新运行容器并使用新的名称：

sh
docker run -d -p 12111:12111 --name new-sgrid-container sgrid-test:latest
综合示例
假设你当前的容器名称为 sgrid-container 并且已经被占用，可以按以下步骤操作：

查找容器：

sh
docker ps -a
停止并删除已有容器：

sh
docker stop sgrid-container
docker rm sgrid-container
重新运行容器：

sh
docker run -d -p 12111:12111 --name sgrid-container sgrid-test:latest
详细步骤
查找容器：

sh
docker ps -a
输出类似如下：

CONTAINER ID   IMAGE               COMMAND                  CREATED          STATUS          PORTS                    NAMES
58190e52d8a9   sgrid-test:latest   "go run main.go"         10 minutes ago   Up 10 minutes   0.0.0.0:12111->12111/tcp   sgrid-container
停止并删除容器：

sh
docker stop sgrid-container
docker rm sgrid-container
重新运行容器：

sh
docker run -d -p 12111:12111 --name sgrid-container sgrid-test:latest
如果不想删除已有容器
如果不想删除已有容器，可以选择重命名它：

重命名已有容器：

sh
docker rename sgrid-container old-sgrid-container
重新运行新容器：

sh
docker run -d -p 12111:12111 --name sgrid-container sgrid-test:latest
这样可以避免名称冲突，并且保留已有容器


#### EXPOSE

在 Dockerfile 中使用 EXPOSE 指令来声明容器中服务监听的端口。虽然这不会自动将端口映射到宿主机，但它有助于文档化和告知 Docker 容器内部服务监听的端口。

如果你的 Go 服务实际监听的是 12111 端口，而不是 8080 端口，你需要在 Dockerfile 中修改 EXPOSE 指令，并在运行容器时正确映射端口。

#### 一个服务起了三个端口

````dockerfile
EXPOSE 12111
EXPOSE 12112
EXPOSE 12113
````
