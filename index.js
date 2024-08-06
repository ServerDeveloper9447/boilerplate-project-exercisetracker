const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const {MongoClient, ObjectId} = require('mongodb')
const client = new MongoClient(process.env.db_url)
const usrdb = client.db('Test').collection('Test')

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users',(req,res) => {
  usrdb.find({}).project({_id:1,username:1}).toArray()
  .then(users => res.send(users))
})

app.post('/api/users',(req,res) => {
  usrdb.insertOne({username:req.body.username})
  .then(resp => res.send({_id:resp.insertedId,username:req.body.username}))
})

app.post('/api/users/:_id/exercises',(req,res) => {
  let body = req.body
  if(!body.date) {
    body.date = new Date().setHours(0,0,0,0)
  } else {
    body.date = new Date(body.date).setHours(0,0,0,0)
  }
  body.duration = Number(body.duration)
  delete body[":_id"]

  usrdb.findOneAndUpdate({_id:new ObjectId(req.params._id)},{$push:{log:body}})
  .then(resp => res.send({_id:req.params._id,username:resp.username,date:new Date(body.date).toDateString(),duration:body.duration,description:body.description}))
})

app.get('/api/users/:_id/logs',(req,res) => {
  let limit = req.query.limit
  let from = new Date(req.query.from || 0).setHours(0,0,0,0)
  let to = new Date(req.query.to || Date.now()).setHours(0,0,0,0)
  usrdb.findOne({_id:new ObjectId(req.params._id)})
  .then(resp => res.send({_id:resp._id,username:resp.username,log:resp.log.filter(x => new Date(x.date).setHours(0,0,0,0) >= from && new Date(x.date).setHours(0,0,0,0) <= to).map(x => ({description:x.description,duration:Number(x.duration),date:new Date(x.date).toDateString()})).slice(0,limit),count:resp.log.filter(x => new Date(x.date).setHours(0,0,0,0) >= from && new Date(x.date).setHours(0,0,0,0) <= to).slice(0,limit).length}))
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
