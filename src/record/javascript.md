# JavaScript 相关

日常JavaScript、TypeScript使用的一些技巧、NodeJs的一些优化。

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
