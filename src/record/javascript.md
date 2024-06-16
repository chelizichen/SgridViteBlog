# JavaScript 相关

日常JavaScript、TypeScript使用的一些技巧、NodeJs的一些优化,同时包含 Sgrid For Node.

## Sgird For Node

SgridNode 与 Express进行绑定，并且提供了一些装饰器作为简便开发的方式。

首先定义配置文件 sgrid.yml

````yml
server:
  name: SgridViteBlog
  host: 127.0.0.1
  port: 15425
  protoccol: http
  language: node
config:
  db_master:  root:123456@tcp(127.0.0.1:3306)/sgrid?charset=utf8&parseTime=true
  db_slave: root:123456@tcp(127.0.0.1:3306)/sgrid?charset=utf8&parseTime=true
````

然后定义初始化文件 app.ts 然后在内部定义一些逻辑

SpaFile 为处理静态资源的函数（如果项目中不需要托管静态资源，可忽略）需要返回一个长度为2的字符串数组 **[string,string]**，第一项为 请求路径，第二项为资源所在的路径。
FrameworkController 为控制层，与Java相同，使用装饰器进行路由的注册。

**app.ts**
````ts
import { NewSgridServer, NewSgridServerCtx } from "sgridnode/build/main";
import { FrameworkController } from "./src";
import { SpaFile } from "./src/interceptor/static";
function boost() {
  const ctx = NewSgridServerCtx();
  new SpaFile().use(ctx);
  const f = new FrameworkController(ctx);
  ctx.use("/api", f.router);
  NewSgridServer(ctx);
}
boost();
````

**framework.controller.ts**
````ts
import {
  Controller,
  Get,
  Autowired,
  Value,
  WithErrorHandler,
  Resp,
} from "sgridnode/build/main";
import { Request, Response, Express, Router } from "express";
import { FrameworkService } from "./framework.service";
import loggerComponent from "../components/logger";
import { Handler } from "../interceptor/error";

@Controller("/framework")
class FrameworkController {
  public ctx: Express;
  public router: Router | undefined;

  @Autowired(loggerComponent) logger: loggerComponent;
  @Autowired(FrameworkService) frameworkService: FrameworkService;

  @Value("server.name") serverName: string;

  constructor(ctx: Express) {
    this.ctx = ctx;
  }

  @Get("/hello")
  @WithErrorHandler(Handler)
  async hello(req: Request, res: Response) {
    this.logger.data("req.url ", req.url);
    return Resp.Ok(
      this.serverName + " :: hello ::" + this.frameworkService.greet()
    );
  }

  @Get("/error")
  @WithErrorHandler(Handler)
  async errorTest(req: Request, res: Response) {
    this.logger.data("req.url ", req.url);
    return Resp.Ok(
      this.serverName + " :: hello ::" + this.frameworkService.createError()
    );
  }
}

export { FrameworkController };
````

**framework.service.ts**
````ts
import { Autowired, Component } from "sgridnode/build/main";
import loggerComponent from "../components/logger";

@Component()
export class FrameworkService {
  @Autowired(loggerComponent) logger: loggerComponent;

  constructor() {
    console.log("framework service init");
  }

  msg = "greet";

  greet() {
    // this.createError();
    this.logger.data("data :: ", this.msg);
    return this.msg;
  }

  createError() {
    throw new Error("framework service error");
  }
}
````

打包脚本

**build.sh**
````sh
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
````

## TypeScript DTO Pojo Vo 的转换

::: tip
数据传输时尽量严格使用DTO，Pojo，Vo等对象，而不是直接使用数据库对象，因为数据库对象是直接映射到数据库的，
而DTO对象是专门用来传输的，这样就不会出现数据传输时的字段错误，同时前端倾向于小驼峰风格，而数据库对象是下划线风格，
:::

**以下是定义**

````ts
type CamelizeString<T extends PropertyKey> = T extends string
  ? string extends T
    ? string
    : T extends `${infer F}_${infer R}`
      ? `${F}${Capitalize<CamelizeString<R>>}`
      : T
  : T

type Camelize<T> = { [K in keyof T as CamelizeString<K>]: T[K] }

type UnderlineCase<Str extends string> =
  Str extends `${infer First}${infer Upper}${infer Rest}`
    ? `${UnderlineChar<First>}${UnderlineChar<Upper>}${UnderlineCase<Rest>}`
    : Str

````

**以下是测试效果**

```` ts
// 定义Pojo为数据库对象

interface CommentPojo {
  create_time: string
  id: number
  event_id: number
  status: number
  createby_user_id: number
  target_user_id: number
  content: string
}

type CommentDto = Camelize<CommentPojo>

// 会被直接转换为如下的TypeScript对象
type CommentDto = {
    createTime: string;
    id: number;
    eventId: number;
    status: number;
    createbyUserId: number;
    targetUserId: number;
    content: string;
}

````

## Node 监听进程内错误

::: tip
开发过程中尽量保证不会出现异常而使进程Down掉，如果出现异常需要一个兜底监听器来捕获
:::

````js
process.on("uncaughtException", (err) => {
  console.error(err)
})

process.on("unhandledRejection", (reason, p) => {
  console.error(reason, p)
})
````

## Express Validate 验证

::: tip
Express DTO 校验，确保参数正确，而不是等到走到控制层或者业务层再进行校验
:::

````js
import { body, check, query } from "express-validator"
export const paginationValidate = [
  query("offset").default(0).isInt(),
  query("size").default(10).isInt(),
  query("keyword").default("").isString().ltrim().rtrim()
]

export const saveEventValidate = [
  body("createTime").default(Now()).isISO8601(),
  body("endTime").default(Now()).isISO8601(),
  body("startTime").default(Now()).isISO8601(),
  body("title").isString().ltrim().rtrim().isLength({ max: 10, min: 3 }),
  body("content").isString().isLength({ max: 512 }),
  body("createbyUserId").default(0).isInt(),
  body("targetUserId").default(0).isInt()
]

// 参考代码
import { validationResult } from "express-validator"
function validateMiddleWare(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(200).json(Resp.Error(-1, "validateError", errors.array()))
  }
  next()
}

router.get("/getList",
  paginationValidate,
  validateMiddleWare,
  controller.getList, // controller 为控制层
)

````

## Webpack - CLI 脚手架 (结合Express)

::: tip
脚手架就一个命令，然后根据配置生成项目，然后就可以直接运行项目了。
最重要的是区分开发阶段和生产阶段的配置文件，和资源打包路径。
:::

命令，只展示部分

````js
#!/usr/bin/env ts-node

const program = require("commander")
const cwd = require('process').cwd()
const path = require('path')
const Config = require('webpack-chain')
const { merge } = require('webpack-merge') // 获取merge函数
const webpack = require('webpack');
const express = require('express')
const {  spawn, exec } = require("child_process")
const { mkdirSync } = require("fs")
const fse = require('fs-extra')

function resolve(...args) {
    return path.resolve(cwd, ...args)
}
program.version("1.0.0")
    .command("run <args>")
    .option("-r,--release", "prod is release")
    .description("tarsus run command [dev,build,start,init]")
    .action(async function (args, opt) {
        const commonConfig = require("../config/config")
        // 走生产打包
        if (args == "prod") {
            const tarsusConfig = require(resolve("tarsus.config.js")).web;
            const fse = require('fs-extra');
            fse.removeSync(resolve("dist"))
            fse.removeSync(resolve("public", "assets"))
            fse.removeSync(resolve("release"))

            let publicPath = null;
            const buildServer = function () {
                const tsServerJson = resolve('tsconfig.server.json')
                const serverScripts = ` tsc --project ${tsServerJson} `;
                const buildProcess = exec(serverScripts);
                buildProcess.stdout.on("error", function (err) {
                    console.log(err);
                })
                buildProcess.stdout.on("data", function (data) {
                    console.log(data);
                })
                buildProcess.on("exit", function () {
                    console.log("***********服务端打包结束***********");
                    if (opt.release) {
                        const { appName, serverName } = tarsusConfig;
                        const release_url = resolve('release');
                        const release_src = resolve('release', `${appName}.${serverName}`)
                        const tgz_url = resolve('release', `${appName}.${serverName}.tgz`);
                        const tgz_name = `${appName}.${serverName}`
                        const pkg = resolve('package.json')
                        const release_pkg = resolve('release', `${appName}.${serverName}`, 'package.json')
                        mkdirSync(release_url)
                        mkdirSync(release_src)
                        fse.copyFileSync(pkg, release_pkg) // 


                        const download_production = `cd ${release_src} &&  npm install --production`;

                        const download_cmd = spawn(download_production, {
                            stdio: "pipe",
                            shell: true,
                            env: process.env,
                        })

                        download_cmd.on("exit", function () {
                            const dist_url = resolve("dist")
                            const assets_url = resolve("public", "assets")
                            const target_assets_url = resolve('release', `${appName}.${serverName}`, 'public', 'assets');
                            fse.copySync(dist_url, release_src + "/dist")
                            fse.copySync(assets_url, target_assets_url)
                            console.log("***********打包完成**************")

                            console.log("***********开始压缩**************")
                            const tgz_cmd = `cd release && tar -zcvf ${tgz_name}.tgz  ./${tgz_name}`;
                            const cmd_process = exec(tgz_cmd)

                            cmd_process.stderr.on('data', function (chunk) {
                                console.log('tar', chunk);
                            })
                            cmd_process.on('exit',function(){
                                console.log("***********压缩完成**************")
                            })
                        })
                    }
                })
            }
            const buildClient = function () {
                const { getDevServerOptions } = require("../lib/dev")
                const buildConfig = getDevServerOptions(tarsusConfig)
                delete buildConfig.devServer;
                const clientConfig = new Config();
                const baseConfig = commonConfig("production"); // 基础配置
                try {
                    tarsusConfig.clientChain(clientConfig);// 链式调用
                } catch (error) {
                    throw new Error(`chain call error:${error}`);
                }
                const afterMergeConfig = merge(baseConfig, clientConfig.toConfig(), buildConfig)
                publicPath = afterMergeConfig.output.publicPath;
                webpack(afterMergeConfig, function (err, stats) {
                    if (err) {
                        console.log(err)
                        return
                    }
                    console.log(stats.toString())
                    console.log("***********开始打包服务端***********")
                    buildServer()
                });
            }
            buildClient();

            // prod 后 可以走release

        }
        // 走运行时
        if (args == "start") {
            const tarsusConfig = require(resolve("tarsus.config.js")).web;
            const requireEntryFile = require(resolve('dist', 'app.js'));
            const port = tarsusConfig.port
            const publicPath = tarsusConfig.publicPath
            const app = requireEntryFile.ServerApplication
            app.use(publicPath, express.static(resolve('public', 'assets')))
            app.listen(port, function () {
                console.log(`webpack out put at  localhost:${port}${publicPath}`);
                console.log(`Express server is running on localhost:${port}`);
            })

        }

        // 初始化项目
        if(args == "init"){
            console.log("**** init tarsus project 开始 ****");
            const initTemplate = path.resolve(__dirname,"../__template__")
            const target = resolve()
            fse.copySync(initTemplate,target)
            console.log("**** init tarsus project 结束 ****");
        }

    })


program.parse(process.argv);
````

::: tip
开发阶段直接将合并后的配置，使用 loadWebpackDev 将 express实例传入进去即可
生产阶段注意资源路径的托管，本质上都是一个东西，没啥特别困难的。
:::

````js
const path = require('path')
const webpackDevMiddleware = require('webpack-dev-middleware');
const { merge } = require('webpack-merge') // 获取merge函数
const Config = require('webpack-chain')
const webpack = require('webpack');
const express = require('express')
const { cwd } = require("process")
function resolve(...args) {
    return path.resolve(cwd(), ...args)
}
const commonConfig = require("../../config/config")
const { getDevServerOptions } = require("../../lib/dev")
// 专门处理Web的目录
const tarsusConfig = require(resolve("tarsus.config.js")).web;
function loadWebpackDev(app) {
    let isNext = undefined;
    isNext = checkVersion()
    if (isNext !== true) {
        throw new Error(isNext)
    }
    const clientConfig = new Config();
    const baseConfig = commonConfig("development"); // 基础配置
    const devConfig = getDevServerOptions(tarsusConfig)
    try {
        tarsusConfig.clientChain(clientConfig);// 链式调用
    } catch (error) {
        throw new Error(`chain call error:${error}`);
    }
    const afterMergeConfig = merge(baseConfig, clientConfig.toConfig(), devConfig)
    const compiler = webpack(afterMergeConfig);
    const publicPath = afterMergeConfig.output.publicPath
    app.use(publicPath, express.static(resolve('public', 'assets')))
    app.use(
        webpackDevMiddleware(compiler, {
            publicPath, // 公共路径，与 webpack 配置中的 publicPath 保持一致
        })
    );
}
// 检查vue 与对应插件是否一致 ，俩个版本规定必须一致
function checkVersion() {
    const currentProjectPkg = require(resolve('package.json'))
    const projectVueVersion = currentProjectPkg.dependencies.vue
    const cliSfcVersion = currentProjectPkg.dependencies['@vue/compiler-sfc'] || currentProjectPkg.devDependencies['@vue/compiler-sfc']
    if (projectVueVersion == cliSfcVersion) {
        return true
    }
    // 抛出错误
    return (`VersionError :: vue.version(${projectVueVersion}) != cli.@vue/compiler-sfc.version(${cliSfcVersion})`)
}

module.exports = {
    loadWebpackDev
}
````

## Vue Element-Table 表格合并问题

需求： 将第一列多个重复的行合并成一个

::: danger
文档介绍的并不详细，CSDN上的文章也并没有贴出对应的解决逻辑。
:::

columnIndex 代表列索引，0 为第一列。需求是对第一列进行合并，所以 使用 **if (columnIndex === 0)** 来进行判断。

之后通过行数进行判断，比如前三行要的第一列要进行合并。就使用  **if (rowIndex <= 2)** 进行判断，然后**选择合并的行数和列数**。比如要合并三行，就返回 **rowspan:3**，返回 **rowspan:0,colspan:0** 代表该行已经被合并了，**所以才不显示**。如果不是第一列，则直接返回 **rowspan: 1, colspan: 1** 代表不合并。

````js
  objectSpanMethod({ row, column, rowIndex, columnIndex }) {
    if (columnIndex === 0) {
      if (rowIndex <= 2) {
        if (rowIndex == 0) {
          return {
            rowspan: 3, //合并的行数
            colspan: 1, //合并的列数，设为０则直接不显示
          };
        }
        return {
          rowspan: 0, //合并的行数
          colspan: 0, //合并的列数，设为０则直接不显示
        };
      }
      if (rowIndex > 2 && rowIndex <= 4) {
        if (rowIndex == 3) {
          return {
            rowspan: 2, //合并的行数
            colspan: 1, //合并的列数，设为０则直接不显示
          };
        }
        return {
          rowspan: 0, //合并的行数
          colspan: 0, //合并的列数，设为０则直接不显示
        };
      }
      if (rowIndex > 4) {
        if (rowIndex == 5) {
          return {
            rowspan: 4, //合并的行数
            colspan: 1, //合并的列数，设为０则直接不显示
          };
        }
        return {
          rowspan: 0, //合并的行数
          colspan: 0, //合并的列数，设为０则直接不显示
        };
      }
    } else {
      return { rowspan: 1, colspan: 1 };
    }
  },
````