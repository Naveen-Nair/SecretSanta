const express = require("express");
const app = express();

const md5 = require("md5");

const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({extended:true}))

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/usersDB')

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})
const User = mongoose.model('User',userSchema)

app.get("/",(req,res)=>{
  res.sendFile(__dirname + '/htmlFiles/index.html')
})

app.get("/register",(req,res)=>{
  res.sendFile(__dirname + '/htmlFiles/register.html')
})

app.get("/login",(req,res)=>{
  res.sendFile(__dirname + '/htmlFiles/login.html')
})

app.post("/register",(req,res)=>{
  console.log("Registering user");

  const email = req.body.email;
  const password = md5(req.body.password);

  User.findOne({email:email},(err,user)=>{
    if(err){
      console.log(err)
    } else{
      if(user){
        console.log(user)
        res.send("User Exists!")
      }else{
        const user = new User ({
          email:email,
          password:password
        })
        user.save()
        res.sendFile(__dirname+'/htmlFiles/secretsanta/start.html')

              }
    }
  })
});

app.post('/login',(req,res)=>{
  const email = req.body.email
  const password = md5(req.body.password)

  User.findOne({email:email},(err,user)=>{
    if(err){
      console.log(err)
    } else{
      if(user){
        if(user.password === password){
          console.log("user authenticated")
          res.sendFile(__dirname+'/htmlFiles/secretsanta/start.html')
        }else{
          res.send("Incorrect password! Try again!")
        }

      }else{
        res.send("User Doesn't Exist")
      }
    }
  })



})


app.listen(3000,()=>{
  console.log("Server started at node 3000")
})
