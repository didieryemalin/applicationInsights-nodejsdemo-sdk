var express = require('express');
const axios = require('axios');
var Task = require('../models/task');

let appInsights = require("applicationinsights");
let client = appInsights.defaultClient;

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  Task.find()
    .then((tasks) => {      
      const currentTasks = tasks.filter(task => !task.completed);
      const completedTasks = tasks.filter(task => task.completed === true);

      client.trackEvent({name: "homepage loaded"})
      client.trackTrace({message: "loading home page"});

      console.log(`Total tasks: ${tasks.length}   Current tasks: ${currentTasks.length}    Completed tasks:  ${completedTasks.length}`)
      res.render('index', { currentTasks: currentTasks, completedTasks: completedTasks, emailServiceResponse: 'Not sent' });
    })
    .catch((err) => {
      console.log(err);
      res.send('Sorry! Something went wrong.');
    });
});


router.post('/addTask', function(req, res, next) {
  const taskName = req.body.taskName;
  const createDate = Date.now();
  
  var task = new Task({
    taskName: taskName,
    createDate: createDate
  });
  console.log(`Adding a new task ${taskName} - createDate ${createDate}`)

  client.trackTrace({message: `Adding a new task ${taskName} - createDate ${createDate}`});
  client.trackEvent({name: "new task added"});

  task.save()
      .then(() => { 
        console.log(`Added new task ${taskName} - createDate ${createDate}`)        
        res.redirect('/'); })
      .catch((err) => {
          console.log(err);
          res.send('Sorry! Something went wrong.');
      });
});

router.post('/completeTask', function(req, res, next) {
  console.log("I am in the PUT method")
  const taskId = req.body._id;
  const completedDate = Date.now();

  client.trackEvent({name: "new task completed"})
  client.trackTrace({message: `Completing task ${taskId}`});

  Task.findByIdAndUpdate(taskId, { completed: true, completedDate: Date.now()})
    .then(() => {
      console.log(`Completed task ${taskId}`)
      res.redirect('/'); }  )
    .catch((err) => {
      console.log(err);
      res.send('Sorry! Something went wrong.');
    });
});


router.post('/deleteTask', function(req, res, next) {
  const taskId = req.body._id;
  const completedDate = Date.now();

  client.trackEvent({name: "new task deleted"})
  client.trackTrace({message: `Deleting task ${taskId}`});

  Task.findByIdAndDelete(taskId)
    .then(() => { 
      console.log(`Deleted task $(taskId)`)      
      res.redirect('/'); }  )
    .catch((err) => {
      console.log(err);
      res.send('Sorry! Something went wrong.');
    });
});

router.post('/emailTasks', function(req, res, next){
  const emailAddress = req.body.emailAddress;
  console.log("email is " + emailAddress);

  if(emailAddress){

    Task.find()
    .then((tasks) => {      
      const currentTasks = tasks.filter(task => !task.completed);
      const completedTasks = tasks.filter(task => task.completed === true);

      console.log(`Total tasks: ${tasks.length}   Current tasks: ${currentTasks.length}    Completed tasks:  ${completedTasks.length}`)
      
      console.log("About to send tasks to task processor API");
      client.trackEvent({name: "new task processor API request sent"});
      client.trackTrace({message: "About to send tasks to task processor API"});

      axios.post(process.env.TASK_PROCESSOR_URL, { 
        emailAddress: emailAddress, 
        currentTasks: currentTasks, 
        completedTasks: completedTasks 
      })
      .then(function(response){
        console.log("Tasks sent to task processor API")
      })
      .catch(function(error){
        console.log(error);
      });

      res.redirect('/');
    })
    .catch((err) => {
      console.log(err);
      res.send('Sorry! Something went wrong.');
    });
  }
});

module.exports = router;
