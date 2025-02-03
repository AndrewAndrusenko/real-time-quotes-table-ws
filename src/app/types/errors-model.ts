export interface IErrorHandler {
  code:number,
  messageToUI:string,
  retryConnection:boolean,
  errmsgIgnore?:boolean
  persistErr?:boolean
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
    retryConnection:false
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