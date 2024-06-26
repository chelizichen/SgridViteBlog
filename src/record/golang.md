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
