const express = require("express");
const app = express();

app.set('view engine','ejs');


const md5 = require("md5");

const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({extended:true}))

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/usersDB')

app.use(express.static("public"))

//******************************************************************************************
//mongoose user creation
const userSchema = new mongoose.Schema({
  username:String,
  email: String,
  password: String
})

const User = mongoose.model('User',userSchema)

//******************************************************************************************
//to check if the person is authenticated
let currentUserId ='';

//******************************************************************************************
//app get requests for the intial pages
app.get("/",(req,res)=>{
  currentUserId=''
  res.render('main_log')
})

app.get("/register",(req,res)=>{
  currentUserId=''
  res.render('log_register')
})

app.get("/login",(req,res)=>{
  currentUserId=''
  res.render('log_login')
})

//******************************************************************************************
//post requests from the initial pages

app.post("/register",(req,res)=>{
  console.log("Registering user");

  const username = req.body.username;
  const email = req.body.email;
  const password = md5(req.body.password);

  User.findOne({email:email},(err,user)=>{//check if any user are there who has the same email
    if(err){
      res.render('error',{errorName:'Error!', locRoute:'/login'})
      console.log(err)
    } else{
      if(user){//if user exists
        console.log(user)
        res.render('error',{errorName:'Email is already used!', locRoute:'/login'})

      }else{//if user doesnt exist, check if username is used

        User.findOne({username:username},(err,user)=>{
          if(err){
            res.render('error',{errorName:'Error!', locRoute:'/register'})
            console.log(err)
          }else{
            if(user){
              const user = new User ({
                username:username,
                email:email,
                password:password
              })
              user.save()
              currentUserId = user._id;
              res.render('Secret Santa',{name:user.username}) //go to the start of the page

            }else{
              res.render('error',{errorName:'User name already exists!', locRoute:'/register'})
            }
          }
        })




      }
    }
  })
});

app.post('/login',(req,res)=>{
  const email = req.body.email
  const password = md5(req.body.password)

  User.findOne({email:email},(err,user)=>{//check if users exist with the email
    if(err){
      console.log(err)
    } else{
      if(user){//if user exists
        if(user.password === password){//if the hashed password match

          console.log("user authenticated")
          currentUserId = user._id;
        res.render('Secret Santa',{name:user.username}) //go to the start of the page
        }else{//if password fails
          res.render('error',{errorName:'Incorrect Password!', locRoute:'/login'})
        }

      }else{//if the user with the same email does not exist
    res.render('error',{errorName:'User does not exist', locRoute:'/register'})      }
    }
  })

})



//******************************************************************************************
//groupSchema
const groupSchema = new mongoose.Schema({
  name:String,
  date:Date,
  regisDate:Date,
  budget:Number,
  location:String,

  requestid:String,
  users:[{user:String}]

})

const Group = mongoose.model('Group',groupSchema)


//******************************************************************************************
//get and post request to start.html
app.get('/start',(req,res)=>{
  console.log(currentUserId)

  if(currentUserId===''){//check if the user authenticated before
    console.log('unauthenticated user tried to use')
    //if not redirected to the login page
    res.redirect('/login')

  }else{
    res.sendFile(__dirname + '/htmlFiles/secretsanta/start.html')

  }
})


//******************************************************************************************
//get and post request to createGroup
app.get('/createGroup',(req,res)=>{
  if(currentUserId===''){//check if the user authenticated before
    console.log('unauthenticated user tried to use')
    //if not redirected to the login page
    res.redirect('/login')

  }else{
    //if the user is authenticated, and the button is pressed from the html
    res.sendFile(__dirname+'/htmlFiles/secretsanta/createGroup.html')
  }
})

app.post('/createGroup',(req,res)=>{
  //all details given in the form
  const name= req.body.name
  const date= req.body.date
  const regisDate= req.body.regisDate
  const budget= req.body.budget
  const location= req.body.Location


  //creation of the unique id (to request)
  const groupid = md5(name)
  const len = groupid.length
  //take the last 8 digits of the hashed name of the group
  const uniqueid = groupid.substring(len-8,len)


  Group.findOne({name:name},(err,group)=>{
    if(err){
      console.log(err)
    }else{
      if(group){//if group exists
        res.send('<div>Group name already exists! try again</div>'+'<button><a href="/createGroup">Go back</a></button>')
      }else{
        console.log(currentUserId)

              const group = new Group({
                name:name,
                date:date ,
                regisDate:regisDate,
                budget:budget,
                location:location,
                requestid:uniqueid,
              })
              group.users.push(currentUserId)

              group.save()
              res.redirect('/yourGroup')


          }
        }



    })
})



//******************************************************************************************
//get and post request to joinGroup
app.get('/joinGroup',(req,res)=>{
  console.log(currentUserId)

  if(currentUserId===''){//check if the user authenticated before
    console.log('unauthenticated user tried to use')
    //if not redirected to the login page
    res.redirect('/login')

  }else{
    res.sendFile(__dirname + '/htmlFiles/secretsanta/joinGroup.html')

  }
})

app.post('/joinGroup',(req,res)=>{
    const uniqueid = req.body.uniqueid;

    Group.findOne({requestid:uniqueid},(err,group)=>{
      if(err){
        console.log(err)
      }else{
        if(group){
          console.log(currentUserId)
          group.users.push(currentUserId)
          group.save()

          res.send('done')

        }else{
          res.send('<h1>No such group</h1>'+'<button><a href="/start">Go Back</a></button')
        }
      }
    })

})




//******************************************************************************************
//get and post request to yourGroup
app.get('/yourGroup',(req,res)=>{
  if(currentUserId===''){//check if the user authenticated before
    console.log('unauthenticated user tried to use')
    //if not redirected to the login page
    res.redirect('/login')

  }else{
    res.sendFile(__dirname + '/htmlFiles/secretsanta/yourGroup.html')
  }
})









//******************************************************************************************

app.listen(3000,()=>{
  console.log("Server started at node 3000")
})
