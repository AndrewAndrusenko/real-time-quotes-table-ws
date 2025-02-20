import { TButtonName } from "../services/snacks.service"
import {ENV} from '../../environments/environment'
export interface IErrorHandler {
  code:number,
  messageToUI:string,
  retryConnection:boolean,
  errmsgIgnore?:boolean
  authErr?:boolean
};
export const SERVER_ERRORS = new Map <number, IErrorHandler> ([
  [1, {
    code:1,
    messageToUI:'Unable to reconnect to the server',
    retryConnection:false
  }],
  [1005, {
    code:1006,
    messageToUI:'Server is unavailable',
    retryConnection:true
  }],
  [1006, {
    code:1006,
    messageToUI:'Server is unavailable',
    retryConnection:true
  }],
  [1011, {
    code:1011,
    messageToUI:'Internal Error..',
    retryConnection:true
  }],
  [1012, {
    code:1012,
    messageToUI:'Server is restarting..',
    retryConnection:true
  }],
  [1013, {
    code:1013,
    messageToUI:'Server is closing..',
    retryConnection:true
  }],
  [4000, {
    code:4000,
    messageToUI:'Token jwt is expired',
    retryConnection:true,
    authErr:true
  }],
  [4001, {
    code:4001,
    messageToUI:'User closed connection',
    retryConnection:false,
    errmsgIgnore:true,
  }],
])

export interface IErrorUI extends Error {
  msg:string
  ml:string
}
export interface IErrorCode {
    message:string,
    redirect:boolean,
    externalRoute?:boolean,
    route:string,
    buttonName:TButtonName
}
export const errorsCode = new Map<number,IErrorCode> (
[
  [403,{
    message:'Access is forbidden',
    route:'back',
    redirect:false,
    buttonName:'Back'
  }],
  [401,{
    message:'Your session is not authenticated.\n You have to Log In again',
    route:ENV.AUTH_SERVER_UI_ADDRESS,
    externalRoute:true,
    redirect:true,
    buttonName:'Go to login'
  }],
  [0,{
    message:'Service is unavailable',
    route:'',
    redirect:false,
    buttonName:'Okay'
  }]
]
)
export const errorsInfo = new Map<string,string> (
 [
  ['ECONNREFUSED', 'Connection has been refused']
]
)
