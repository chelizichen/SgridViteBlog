import { Component } from "sgridnode/build/main";

@Component()
class loggerComponent{
    constructor(){
        process.on("uncaughtException", (err) => {
            this.error(err)
        })
        
        process.on("unhandledRejection", (reason, p) => {
            this.error(reason, p)
        })
    }
    info(...args){
        console.log('loggerComponent :: info :: ',...args)
    }

    data(...args){
        console.log('loggerComponent :: data :: ',...args)
    }

    error(...args){
        console.log('loggerComponent :: error ::',...args)
    }
}

export default loggerComponent