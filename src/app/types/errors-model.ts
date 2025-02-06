import { TButtonName } from "../services/snacks.service"
import {ENV} from '../../environments/environment'
export interface IErrorHandler {
  code:number,
  messageToUI:string,
  retryConnection:boolean,
  errmsgIgnore?:boolean
  persistErr?:boolean,
  authErr?:boolean
};
export const SERVER_ERRORS = new Map <number, IErrorHandler> ([
  [0, {
    code:0,
    messageToUI:'User closed connection',
    retryConnection:false,
    errmsgIgnore:true,
    persistErr:true
  }],
  [1, {
    code:1,
    messageToUI:'Unable to reconnect to the server',
    retryConnection:false
  }],
  [1012, {
    code:1012,
    messageToUI:'Token jwt is expired',
    retryConnection:true,
    authErr:true
  }],
  [1011, {
    code:1011,
    messageToUI:'Server is restarting..',
    retryConnection:true
  }],
  [1006, {
    code:1006,
    messageToUI:'Server is unavailable',
    retryConnection:true
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
