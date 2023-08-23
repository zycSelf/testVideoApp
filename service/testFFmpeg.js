// const path = require('path')

// fetch(path.join(__dirname,"../public/ffmpeg/ffmpeg-core.wasm")).then(res => {
//     return res.arrayBuffer()
// }).then(bytes => {
//     return WebAssembly.instantiate(bytes)
// }).then(result => {
//     console.log(result)
// })
const map = new Map()
function fib(a) {
    if(a===0 || a=== 1) {
        return 1
    }
    let last = null
    let last2 = null
    if(map.has(a-1)) {
        last = map.get(a-1)
    }else {
        last = fib(a-1)
        map.set(a-1,last)
    }
    if(map.has(a-2)){
        last2 = map.get(a-2)
    }else {
        last2 = fib(a-2)
        map.set(a-2,last2)
    }
    return last+last2
}