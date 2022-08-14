const express = require("express");
const app = express();

const md5 = require("md5");

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/usersDB')


app.get("/",(req,res)=>{
  res.sendFile(__dirname + '/htmlFiles/index.html')
})

app.get("/register",(req,res)=>{
  res.sendFile(__dirname + '/htmlFiles/register.html')
})

app.get("/login",(req,res)=>{
  res.sendFile(__dirname + '/htmlFiles/login.html')
})

app.listen(3000,()=>{
  console.log("Server started at node 3000")
})
