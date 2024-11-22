/* eslint-disable @typescript-eslint/no-unused-expressions */
import process from 'node:process'
import readline from "readline";
import {fork} from "child_process";
import path from 'path';
import {helpText} from './data/help.js'
const defaultColor ='\x1b[0m';
const msgColor ='\x1b[90m';
var serverForkProcess;
var serverStatus = 'none';
var rl = readline.createInterface({
  input: process.stdin, 
  output: process.stdout,
  prompt: 'command> ',
  terminal: false
})
var readlineCallback = commandHandler

process.stdin.setRawMode(false); 
function helpDisplay () {
  helpText.forEach( el=> console.log('\x1b[34m',el.command.padEnd(6),'\x1b[37m ||','\x1b[32m', el.description));
  console.log('\x1b[0m');
}
helpDisplay ();
process.on('SIGINT', async ()=>{
  console.log('  Ctrl - C has been triggered',);
  rl.setPrompt('Confirm closing server by typing \x1b[31mC\x1b[0m... or press \x1b[33mEnter\x1b[0m to continue\n')
  readlineCallback = confirmAction
  commandWait()
});
function commandWait(msg='') {
  rl.question(msg, (command) => readlineCallback(command))
}

function commandHandler (command) {
  switch (command? command.split(' ')[0]:'') {
    case 'help': 
      helpDisplay ();
    break;
    case 'cls':
      console.log('\u001B[2J\u001B[0;0f')
    break;
    case 'kill': 
      process.exit(0)
    break;
    case 'rs':
      console.log('\x1b[90mRestarting server ...','\x1b[0m')
      serverStatus = 'restart'
      serverForkProcess.send('rs');
      break;
      case 'exit':
      console.log('\x1b[90mStopping server and process ...','\x1b[0m')
      serverStatus = 'closing'
      serverForkProcess.send('rs');
    break;
    case 'start':
      serverForkProcess.send(command);
    break;
    case 'stop':
      serverForkProcess.send('stop');
    break;
    default:
      console.log(`Unknown command -  ${command}`);
    break;
  }
  commandWait('command> ')
  rl.question()
}
 function confirmAction (command) {
  if(command&& command.toString().toLocaleLowerCase()==='c') {
    console.log('\x1b[90mStopping server and process ...','\x1b[0m')
    serverStatus = 'closing'
    serverForkProcess.send('rs');
  } else {
    readlineCallback = commandHandler;
    commandWait('command> ')
  }
 }

function startWsServer() {
  serverForkProcess = fork(path.resolve(process.cwd(),'ws-server.js'),[],{ silent: true })
  serverForkProcess.on('message', (msg) => {
    readline.cursorTo(process.stdout, 0);
    readline.clearScreenDown();
    Symbol.iterator in msg? console.log(... msg.map (part=>typeof(part)==='string'? msgColor + part + defaultColor : part)):console.log(msg);
    rl.prompt()
  })
  serverForkProcess.on('data', (data) => {
    console.log('data is : '+data.toString());
  });
  serverForkProcess.on('exit', (code) => {
    readline.cursorTo(process.stdout, 0);
    readline.clearScreenDown(process.stdout)
    console.log('\x1b[90mServer process exited with code', code,'\x1b[0m')
    serverStatus==='restart'? startWsServer() : process.exit(0);
  })
  commandWait('command> ');
}
startWsServer();