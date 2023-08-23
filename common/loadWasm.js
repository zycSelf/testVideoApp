import {importScript} from "@ffmpeg/util"
export async function loadWasm(path,baseObj) {
    console.log(path,baseObj)
    const workerURL = baseObj.workerURL
    console.log(workerURL)
    const worker = new Worker(workerURL)
    console.log(worker)
    worker.postMessage({
        type:"load",
        data:baseObj
    })
    // return fetch(path)
    //     .then(res => res.arrayBuffer())
    //     .then(buffer => {
    //         importObj = importObj || {}
    //         importObj.env = importObj.env || {}
    //         importObj.env.tableBase = importObj.env.tableBase || 0
    //         importObj.env.memoryBase = importObj.env.memoryBase ||0
    //         if(!importObj.env.table) {
    //             importObj.env.table = new WebAssembly.Table({initial:0,element:'anyfunc'})
    //         }
    //         if(!importObj.env.memory) {
    //             importObj.env.memory = new WebAssembly.Memory({initial:16384,maximum:16384,shared:true})
    //         }
    //         if(!importObj.wasi_snapshot_preview1) {
    //             importObj.wasi_snapshot_preview1 = {
    //                 proc_exit:() => {},
    //                 fd_write:() => {}
    //             }
    //         }
    //         return WebAssembly.instantiate(buffer,importObj)
    //     })import { importScripts } from '@ffmpeg/util';
    //     .then(module => {
    //         return module
    //     })
}