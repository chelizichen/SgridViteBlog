# 开发最佳实践

## 缓存与数据库 两份数据源如何优化与取舍

在思考为何业务变得越来越复杂以及为啥接口越来越慢时，笔者发现滥用缓存是很大一个原因

在笔者所在的公司中，一般**H5的界面的数据源采用的是缓存**，**目的是为了提高用户访问的速度**。但是在前期的探索使用和后期接手的开发者不规范的使用下，出现了大量操作缓存的代码，滥用操作缓存直接导致了缓存数据与数据库数据不一致， 这样直接导致业务逻辑变得越来越复杂，甚至到了一个**不可维护**的程度。

如果想使业务逻辑变得简单，并且要一个稍微好点的性能，笔者建议可以从这几个角度进行优化
::: tip
笔者最建议 **LRU内存库 + 数据库主备**的模式，一是保证了一致性的问题（数据库塞失败了就直接报错，内存塞不可能会爆的），二是性能远比想象的要好，虽然配置主从是个很麻烦的事情，三是本身就做了灾备，省事

**以下的缓存建议不涉及排行榜、点赞数、浏览数等业务逻辑。**
:::

1. **缓存只负责查询，不应该包含业务逻辑**，只有在缓存的数据源变更的时候才更新缓存，同时引入缓存一致性的解决方案
2. 如果不需要Redis、Dcache这种缓存，可以尝试**使用内存缓存**，或者一些轻量级的内存缓存库。这样的优点是轻量级，并且可以减少网络IO，不过内存缓存大多数是依赖一个无状态的主体服务运行的，并没有集群的能力，需要考虑分布式环境下的缓存一致性，不过各个语言都有类似的解决方案。
3. 如果内存缓存与Redis、Dcache这种缓存服务器都不需要，那么可以考虑**数据库主从**的方案，主库负责写，从库负责读，这样主库的数据变更后，会自动同步到从库，从而避免了缓存不一致的问题。不过这种方案需要考虑从库同步延迟的问题。

## Vue3 组件通信 最佳实践

1. 严禁使用 attr
2. 父子组件通信，如果单层，且子组件较少的情况下，使用props + emit + expose
3. 父子组件通信，如果是多层，且子组件依赖上游状态较多的情况下，需要使用状态管理工具（pinia）
4. 数据源最好只有一种，其他的使用 computed进行计算
5. vue3 目前支持 类似 react hook的写法,也可以通过hook来进行状态共享  **const data = ref(0); function setData(val){}  return [data,setData]**

## Vue3 Hooks 最佳实践

::: tip

1. 解决reset函数导致的大量重复代码的问题
2. 解决统一状态管理的问题
3. 解决逻辑复杂，且不能共用的问题
:::

代码如下，不过切记不要乱用，以免造成维护困难

````ts
const useDataStore = defineStore('useDataStore',()=>{
  const initData = {
    key:'',
    value:''
  }
  const data = ref(_.cloneDeep(initData))
  const resetData = ()=> data.value = _.cloneDeep(initData)
  const setData = (body:any)=> data.value = body;
  return {data,resetData,setData}
})
````

## AES加密与解密

````js
const CryptoJS = require('crypto-js');
const KEY = 'sgrid.app';
const IV = 'chelizichen';

function decryptAES(encrypted) {
  encrypted = decodeURIComponent(decodeURIComponent(encrypted));
  let key = CryptoJS.enc.Utf8.parse(KEY);
  let iv = CryptoJS.enc.Utf8.parse(IV);
  const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

function encryptASE(str) {
  let key = CryptoJS.enc.Utf8.parse(KEY);
  let iv = CryptoJS.enc.Utf8.parse(IV);
  const rs = CryptoJS.AES.encrypt(str, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return rs;
}

function test(){

  let str = '{"name":"test","age":18}';
  let enc = encryptASE(str)
  let dec = decryptASE(enc)
  
}
````
