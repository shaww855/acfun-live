const { getConfig, configQuestion } = require('./util.js')
const inquirer = require('inquirer');
const { runApp } = require('./app.js')

async function check () {
  if (getConfig() === null) {
    await inquirer.prompt([{
      type: 'confirm',
      name: 'create',
      message: "未找到config.json，或文件已损坏！是否重新建立？",
    }]).then(answers => {
      if (answers.create) {
        configQuestion().then(() => {
          runApp()
        })
      } else {
        console.log('程序即将关闭...');
        setTimeout(() => {
          process.exit(0)
        }, 3000)
      }
    })
  } else {
    runApp()
  }
}
check()