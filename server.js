const express= require('express')
const bodyParser=require('body-parser')
const bcrypt = require('bcrypt-nodejs');
const cors=require('cors')
const knex = require('knex')
const app=express();


app.use(bodyParser.json())
app.use(cors())


const db=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : '',
    password : '',
    database :'lifestyledb'
  }
});

app.post('/signin',(req,res)=>{
  db.select('email','hash').from('login')
    .where('email','=',  req.body.email)
    .then(data=>{
    const isValid = bcrypt.compareSync(req.body.password, data[0].hash)//returns true or false
      if(isValid){
        return db.select('*').from('users')
         .where('email','=',  req.body.email)
         .then(user =>{
          res.json(user[0])
    })
      .catch(err=>res.status(400).json('unable to get user'))
    }else{
      res.status(400).json('wrong credentials')
      }
   })
    .catch(err=>res.status(400).json('unable to get user'))
})

app.post('/register', (req,res)=>{
   const{email, name, password}=req.body;
   const hash= bcrypt.hashSync(password);
db.transaction(trx=>{
    trx.insert({
     hash:hash,
     email:email
  })
   .into('login')
   .returning('email')
   .then(loginEmail=>{
     return trx('users')
      .returning('*')
      .insert({
         email:loginEmail[0],
         name:name,
        })
        .then(user=>{
          res.json(user[0])
        })
       })
     .then(trx.commit)
     .catch(trx.rollback)
  })
   .catch(err=>res.status(400).json('unable to register'))
})


app.post('/home', (req,res)=>{
 const{email, goalname}=req.body;
  db('goals')
  .insert({
    email:email,
    goalname:goalname
   })
   .then(data=>{
   db.select('*').from('goals')
   .where({
   email:email,
  })
  .then(data=>{
  res.json(data)
  })
  .catch(err=>res.status(400).json('you already have this goal'))
})})




app.post('/todos', (req,res)=>{
  const{email, goal, content}=req.body;
    db('todos')
    .insert({
      email:email,
      goal:goal,
      content:content
    })
    .then(data=>{
     db.select('*').from('todos')
    .where({
      email:email,
      goal:goal
    })
    .then(data=>{
    res.json(data)
       })
     .catch(err=>res.status(400).json('error adding todo, please try again'))
  })  })


app.delete('/todos', (req,res)=>{
const{email, goal, content, id}=req.body;
  db('todos')
  .where({
    email:req.body.email,
    goal:req.body.goal,
    id:req.body.id
  })
  .del().then(data=>{
  db.select('*').from('todos')
     .where({
       email:req.body.email,
       goal:req.body.goal
     })
     .then(data=>{
     res.json(data)
        })
      .catch(err=>res.status(400).json('error deleting todo, please try again'))
    })})

  app.delete('/home', (req,res)=>{
   const{email, goalname, id}=req.body;
     db('goals')
     .where({
       email:email,
       goalname:goalname,
       id:id
     }).del().then(data=>{
     db.select('*').from('goals')
        .where({
          email:email
        })
        .then(data=>{
        res.json(data)
           })
         .catch(err=>res.status(400).json('error deleting goal, please try again'))
      })})



  app.get('/home/:id',(req,res)=>{
    const{id}=req.params;
    db.select('*').from('goals')
       .where({
         email:id
       })
       .then(data=>{
       res.json(data)
          })
        .catch(err=>res.status(400).json('couldnt access goals'))
     })

   app.get('/todos/:id',(req,res)=>{
     const{id}=req.params;
     db.select('*').from('todos')
        .where({
          email:id
        })
        .then(data=>{
        res.json(data)
           })
         .catch(err=>res.status(400).json('couldnt access todos'))
      })


app.listen(process.env.PORT||3001, ()=>{
  console.log(`this function checks the app is running on ${process.env.PORT}`)
})
