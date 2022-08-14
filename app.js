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

  //to check if the email was already used before
  User.find((error,users)=>{
    if(error){//if any errors occur
      console.log(error);
    }else{

      //number of users having the same email
      let usercount=0

      //loops through all the users and check if the email that is given is used before

      users.forEach((user)=>{//loops through all the users
        if(user.email === email){//check if the email is used before
          console.log(user);
          res.send("user already exists");
          usercount+=1;
        }
      })

      if(usercount===0){//ie none fo the users match the email (new email used)
        const user = new User ({
          email:email,
          password:password
        })
        user.save()
        res.send("saved!")
      }
    }
  })
});

app.listen(3000,()=>{
  console.log("Server started at node 3000")
})
