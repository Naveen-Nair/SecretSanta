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
  invite: [{
    groupRequestId: String,
  }],
  followReq: [{
    followRequestId:String,
    followRequestName:String
  }],
  followers: [{
    username:String,
    userid:String
  }],
  following: [{
    username:String,
    userid:String
  }]


})

const User = mongoose.model('User',userSchema)


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
    userid:String,
    username:String
  }]

})

const Group = mongoose.model('Group',groupSchema)


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
          res.redirect('/start')
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
//get and post request to start.html
app.get('/start',(req,res)=>{
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

              const group = new Group({
                name:name,
                date:date ,
                regisDate:regisDate,
                budget:budget,
                location:location,
                requestid:uniqueid,
              })
              let a = {
                userid: currentUserId,
                username: currentUserName
              }
              group.users.push(a)


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

          let a = {
            userid: currentUserId,
            username: currentUserName
          }
          group.users.push(a)
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



                  if(group.users[j].userid==currentUserId){
                    //this user is a part of the group

                    let a = {
                      name:group.name,
                      id:group.requestid
                    }

                   yourGroups.push(a)

                  }
                }

              }
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


//******************************************************************************************
//to get yourGroupInfo pages
app.get('/yourGroupInfo',(req,res)=>{
  res.render('error',{errorName:'Error!', locRoute:'/start'})
})

app.post('/yourGroupInfo',(req,res)=>{
  let requestId = req.body.requestId;

  Group.findOne({requestid:requestId},(err,group)=>{

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
//to invite to your group

//normally cant go to the page
app.get('/yourGroupInfo/invite',(req,res)=>{
  res.render('error',{errorName:'Error!', locRoute:'/login'})
})

//post reques from the ss_yourGroupInfo
app.post('/yourGroupInfo/invite',(req,res)=>{
  let requestId = req.body.requestId

  Group.findOne({requestid:requestId},(err,group)=>{
    if(err){
      console.log(err)
      res.render('error',{errorName:'Error!', locRoute:'/start'})
    }else{
      if(group){//the group for which the invite is to Exists
        //now we check for input if the person Exists


        res.render('ss_yourGroupInfo_invite',{id:group.requestid})

      }else{
        res.render('error',{errorName:'Error!', locRoute:'/yourGroup'})
      }
    }
  })

})

//******************************************************************************************
//to invite a person to the group

//normally cant go to the page
app.get('/yourGroupInfo/invite/person',(req,res)=>{
  res.render('error',{errorName:'Error!', locRoute:'/login'})
})

//post request from the ss_yourGroupInfo_invite
app.post('/yourGroupinfo/invite/person',(req,res)=>{
  let email = req.body.email
  let username = req.body.username
  let requestId = String(req.body.id) //the value of the button is the request id of the group

  if(email){
    User.findOne({email:email},(err,user)=>{
      if(err){
        console.log(err)
        res.render('error',{errorName:'Error!', locRoute:'/login'})
      }else{
        if(user){
          //the invites is sent to the
          let inviteGr = {groupRequestId: requestId}
          user.invite.push(inviteGr)
          user.save();

          res.render('error',{errorName:'Invited!', locRoute:'/yourGroup'})


        }else{
          res.render('error',{errorName:'User Not Found!', locRoute:'/yourGroup'})
        }
      }
    })

  }else if(username){
    User.findOne({username:username},(err,user)=>{
      if(err){
        console.log(err)
        res.render('error',{errorName:'Error!', locRoute:'/login'})
      }else{
        if(user){
          //the invites is sent to the
          let inviteGr = {groupRequestId: requestId}
          user.invite.push(inviteGr)
          user.save();
          res.render('error',{errorName:'Invited!', locRoute:'/yourGroup'})

        }else{
          res.render('error',{errorName:'User Not Found!', locRoute:'/yourGroup'})
        }
      }
    })


  }else{//both username and email are empty
    res.render('error',{errorName:'Enter Username / Email', locRoute:'/yourGroup'})
  }
})

//******************************************************************************************
//accept or reject group invites
app.post('/profile',(req,res)=>{
  let remove = req.body.remove
  let join = req.body.join

  if(remove){
    Group.findOne({requestid:remove},(err,group)=>{
      if(err){
        console.log(err)
        res.render('error',{errorName:'Error!', locRoute:'/login'})
      }else{
        if(group){
          User.findOne({username:currentUserName},(err,user)=>{
            if(err){
              console.log(err)
            }else{
              if(user){
                for(let i=0; i<user.invite.length; i++){
                  if(user.invite[i].groupRequestId===group.requestid){

                      //switch the invite to the last
                      let temp = user.invite[user.invite.length-1]
                      user.invite[user.invite.length-1] = user.invite[i]
                      user.invite[i] = temp
                      //pop the last
                      user.invite.pop();
                      //save the invites
                      user.save();

                      res.redirect('/start')

                  }
                }
              }
            }
          })


        }else{
          res.render('error',{errorName:'Error!', locRoute:'/login'})
        }
      }
    })

  }else if(join){
    Group.findOne({requestid:join},(err,group)=>{
      if(err){
        console.log(err)
        res.render('error',{errorName:'Error!', locRoute:'/login'})
      }else{
        if(group){
          User.findOne({username:currentUserName},(err,user)=>{
            if(err){
              console.log(err)
            }else{
              if(user){
                for(let i=0; i<user.invite.length; i++){
                  if(user.invite[i].groupRequestId===group.requestid){

                      //switch the invite to the last
                      let temp = user.invite[user.invite.length-1]
                      user.invite[user.invite.length-1] = user.invite[i]
                      user.invite[i] = temp
                      //pop the last
                      user.invite.pop();
                      //save the invites
                      user.save();

                      let a = {
                        userid: currentUserId,
                        username: currentUserName
                      }
                      group.users.push(a)
                      group.save()


                      res.redirect('/start')

                  }
                }
              }
            }
          })
        }
      }
    })


  }else {
    res.render('error',{errorName:'Error!', locRoute:'/login'})
  }
})

//******************************************************************************************
//follow requests
app.get('/profile/request',(req,res)=>{
  User.findOne({_id:currentUserId},(err,user)=>{
    if(err){
      console.log(err)
      res.render('error',{errorName:'Error!', locRoute:'/login'})
    }else{
      if(user){
          res.render('h_profile_request',{id:currentUserId})

      }else{
        res.render('error',{errorName:'Error!', locRoute:'/login'})
      }
    }
  })

})

app.post('/profile/request',(req,res)=>{
  let email = req.body.email
  let username = req.body.username
  let requestId = String(req.body.id) //the value of the button is the request id of the group

  if(email){
    User.findOne({email:email},(err,user)=>{
      if(err){
        console.log(err)
        res.render('error',{errorName:'Error!', locRoute:'/login'})
      }else{
        if(user){
          //the invites is sent to the
          let inviteGr = {followRequestId: requestId, followRequestName:currentUserName}
          user.followReq.push(inviteGr)
          user.save();

          res.render('error',{errorName:'Invited!', locRoute:'/profile'})


        }else{
          res.render('error',{errorName:'User Not Found!', locRoute:'/profile'})
        }
      }
    })

  }else if(username){
    User.findOne({username:username},(err,user)=>{
      if(err){
        console.log(err)
        res.render('error',{errorName:'Error!', locRoute:'/login'})
      }else{
        if(user){
          //the invites is sent to the
          let inviteGr = {followRequestId: requestId, followRequestName:currentUserName}
          user.followReq.push(inviteGr)
          user.save();
          res.render('error',{errorName:'Invited!', locRoute:'/profile'})

        }else{
          res.render('error',{errorName:'User Not Found!', locRoute:'/profile'})
        }
      }
    })


  }else{//both username and email are empty
    res.render('error',{errorName:'Enter Username / Email', locRoute:'/yourGroup'})
  }


})
//******************************************************************************************
//accept or reject follow requests


app.post('/profile/req',(req,res)=>{
  let remove = req.body.remove
  let join = req.body.join

  if(remove){
    User.findOne({username:remove},(err,followerUser)=>{
      if(err){
        console.log(err)
        res.render('error',{errorName:'Error!', locRoute:'/login'})
      }else{
        if(followerUser){
          User.findOne({username:currentUserName},(err,currentUser)=>{
            if(err){
              console.log(err)
            }else{
              if(currentUser){

                for(let i=0; i<currentUser.followReq.length; i++){

                  if(currentUser.followReq[i].followRequestName===followerUser.username){

                      //switch the invite to the last
                      let temp = currentUser.followReq[currentUser.followReq.length-1]
                      currentUser.followReq[currentUser.followReq.length-1] = currentUser.followReq[i]
                      currentUser.followReq[i] = temp
                      //pop the last
                      currentUser.followReq.pop();
                      //save the invites
                      currentUser.save();

                      res.redirect('/start')

                  }
                }
              }
            }
          })


        }else{
          res.render('error',{errorName:'Error!', locRoute:'/login'})
        }
      }
    })

  }else if(join){
    User.findOne({username:join},(err,followerUser)=>{
      if(err){
        console.log(err)
        res.render('error',{errorName:'Error!', locRoute:'/login'})
      }else{
        if(followerUser){
          User.findOne({username:currentUserName},(err,currentUser)=>{
            if(err){
              console.log(err)
            }else{
              if(currentUser){
                for(let i=0; i<currentUser.followReq.length; i++){

                  if(currentUser.followReq[i].followRequestName===followerUser.username){

                      //switch the invite to the last
                      let temp = currentUser.followReq[currentUser.followReq.length-1]
                      currentUser.followReq[currentUser.followReq.length-1] = currentUser.followReq[i]
                      currentUser.followReq[i] = temp
                      //pop the last
                      currentUser.followReq.pop();
                      //save the invites


                      let follow = {
                        userid:String(followerUser._id),
                        username:followerUser.username
                      }

                      console.log(follow)

                      currentUser.followers.push(follow);
                      currentUser.save();

                      let following = {
                        userid:String(currentUser._id),
                        username:currentUser.username
                      }
                      console.log(following)

                      followerUser.following.push(following);
                      followerUser.save()

                      res.redirect('/start')

                  }
                }
              }
            }
          })


        }else{
          res.render('error',{errorName:'Error!', locRoute:'/login'})
        }
      }
    })




  }else {
    res.render('error',{errorName:'Error!', locRoute:'/login'})
  }
})

//******************************************************************************************
//profile
app.get('/profile',(req,res)=>{
  User.findOne({_id:currentUserId},(err,user)=>{
    if(err){
      console.log(err)
      res.render('error',{errorName:'Error!', locRoute:'/login'})
    }else{
      if(user){
        console.log(user.followReq)
        res.render('h_profile', {invites : user.invite, name:user.username, followReq : user.followReq})

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
