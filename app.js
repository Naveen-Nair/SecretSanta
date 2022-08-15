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
  password: String,
})

const User = mongoose.model('User',userSchema)

//******************************************************************************************
//to check if the person is authenticated
let currentUserId ='';
let currentUserName = '';

//******************************************************************************************
//app get requests for the intial pages
app.get("/",(req,res)=>{
  currentUserId=''
  currentUserName = '';
  res.render('log_main')
})

app.get("/register",(req,res)=>{
  currentUserId=''
  currentUserName = '';
  res.render('log_register')
})

app.get("/login",(req,res)=>{
  currentUserId=''
  currentUserName = '';
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
              res.render('error',{errorName:'User name already exists!', locRoute:'/register'})

            }else{
                const user = new User ({
                  username:username,
                  email:email,
                  password:password
                })
                user.save()
                currentUserName = user.username;
                currentUserId = user._id;
                res.render('ss_main',{name:user.username}) //go to the start of the page

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
      res.render('error',{errorName:'Error!', locRoute:'/register'})
    } else{
      if(user){//if user exists
        if(user.password === password){//if the hashed password match

          console.log("user authenticated")
          currentUserName = user.username;
          currentUserId = user._id;
        res.render('ss_main',{name:user.username}) //go to the start of the page
        }else{//if password fails
          res.render('error',{errorName:'Incorrect Password!', locRoute:'/login'})
        }

      }else{//if the user with the same email does not exist
    res.render('error',{errorName:'User does not exist', locRoute:'/register'})
      }
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
  users:[{
    userid:String
  }]

})

const Group = mongoose.model('Group',groupSchema)



//******************************************************************************************
//get and post request to start.html
app.get('/start',(req,res)=>{
  console.log(currentUserId)

  User.findOne({_id:currentUserId},(err,user)=>{
    if(err){
      console.log(err);
      res.render('error',{errorName:'Error!', locRoute:'/login'})

    }else{
      if(user){    //if the user is authenticated
        res.render('ss_main',{name:user.username})

      }else{//if user with the userid does not exist
        res.render('error',{errorName:'Log in to access this site!', locRoute:'/login'})
      }
    }

  })


})


//******************************************************************************************
//get and post request to createGroup
app.get('/createGroup',(req,res)=>{
  User.findOne({_id:currentUserId},(err,user)=>{
    if(err){
      console.log(err);
      res.render('error',{errorName:'Error!', locRoute:'/login'})

    }else{
        //if the user is authenticated, and the button is pressed from the html
      if(user){
        res.render('ss_createGroup')

      }else{//if user with the userid does not exist
        res.render('error',{errorName:'Log in to access this site!', locRoute:'/login'})
      }
    }

  })

})

app.post('/createGroup',(req,res)=>{
  //all details given in the form
  const name= req.body.name
  const date= req.body.date
  const regisDate= req.body.regisDate
  const budget= req.body.budget
  const location= req.body.location


  //creation of the unique id (to request)
  const groupid = md5(name)
  const len = groupid.length
  //take the last 8 digits of the hashed name of the group
  const uniqueid = groupid.substring(len-8,len)


  Group.findOne({name:name},(err,group)=>{
    if(err){
      res.render('error',{errorName:'Error!', locRoute:'/createGroup'})
      console.log(err)
    }else{
      if(group){//if group exists
        res.render('error',{errorName:'Group name already Exists!', locRoute:'/createGroup'})
      }else{//if group doesnt exist
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
              res.redirect('/start')


          }
        }

    })
})



//******************************************************************************************
//get and post request to joinGroup
app.get('/joinGroup',(req,res)=>{
  User.findOne({_id:currentUserId},(err,user)=>{
    if(err){
      console.log(err);
      res.render('error',{errorName:'Error!', locRoute:'/login'})

    }else{
      if(user){    //if the user is authenticated
        res.render('ss_joinGroup')

      }else{//if user with the userid does not exist
        res.render('error',{errorName:'Log in to access this site!', locRoute:'/login'})
      }
    }

  })

})

app.post('/joinGroup',(req,res)=>{
    const uniqueid = req.body.uniqueid;

    Group.findOne({requestid:uniqueid},(err,group)=>{
      if(err){
        res.render('error',{errorName:'Error!', locRoute:'/login'})
        console.log(err)
      }else{
        if(group){

          console.log(currentUserId)
          group.users.push(currentUserId)
          group.save()

          res.redirect('/start')
        }else{
          res.render('error',{errorName:'No such group exists!', locRoute:'/start'})
        }
      }
    })

})




//******************************************************************************************
//get and post request to yourGroup
app.get('/yourGroup',(req,res)=>{
  User.findOne({_id:currentUserId},(err,user)=>{
    if(err){
      console.log('heeelllooo')
      res.render('error',{errorName:'Error!', locRoute:'/login'})

    }else{
      if(user){    //if the user is authenticated

        Group.find((err,groups)=>{
          if(err){
            console.log(err)
          }else{
            let yourGroups = []
            if(groups){
              for(let i=0; i<groups.length; i++){

                let group = groups[i]
                for(let j=0; j<group.users.length; j++){
                  let username = group.users[j]


                  if(String(username._id)==String(currentUserId)){
                    //this user is a part of the group

                   yourGroups.push(group.name)

                  }
                }

              }
              console.log(yourGroups)
              res.render('ss_yourGroup',{groups:yourGroups})

            }else{
              console.log('error')
            }
          }
        });

      }else{//if user with the userid does not exist
        res.render('error',{errorName:'Log in to access this site!', locRoute:'/login'})
      }
    }

  })
})

// function userNameArrGen (group){
//   let users=[]
//   for(i=0; i<group.users.length; i++){
//     User.findOne({_id:group.users[i]},(err,user)=>{
//       if(err){
//         console.log(err)
//         res.render('error',{errorName:'Error!', locRoute:'/yourGroup'})
//       }else{
//         if(user){
//           users.push(user.username)
//           console.log(users)
//         }
//       }
//     })
//   }
//   return users
// }

app.post('/yourGroups',(req,res)=>{
  let groupName = req.body.list;
  console.log(groupName)
  Group.findOne({name:groupName},(err,group)=>{

    if(err){
      res.render('error',{errorName:'Error!', locRoute:'/yourGroup'})
    }else{

      if(group){

        let groupInfo = {
          name: group.name,
          date: group.date,
          regisDate: group.regisDate,
          budget: group.budget,
          location: group.location,

          requestid:group.requestid,
          users : group.users

        }


        res.render("ss_yourGroupInfo",{groupInfo:groupInfo});


      }else{
        res.render('error',{errorName:'Error!', locRoute:'/login'})

      }
    }
  })
})








//******************************************************************************************

app.listen(3000,()=>{
  console.log("Server started at node 3000")
})
