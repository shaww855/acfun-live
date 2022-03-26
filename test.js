const schedule = require('node-schedule');
schedule.scheduleJob({
  rule: '30 * * * * *'
}, function () {
  console.log(new Date().toLocaleDateString());
  console.log(new Date().getMinutes());
})