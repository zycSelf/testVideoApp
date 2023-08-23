const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname,"../public")))
app.all('/', function(req, res,next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods","POST,GET,PUT,DELETE,OPTIONS")
    res.header("Access-Control-Allow-Headers","*")
    next()
})
app.get("/",(req,res) => {
    res.sendFile(path.join(__dirname,"./test.html"))
})
app.post('/uploadVideo',(req,res) => {
    console.log(req.body)
})

app.listen(8888,async () => {
    console.log('service running on 8888')
})