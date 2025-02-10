export interface IErrorHandler {
  code:number,
  messageToUI:string,
  retryConnection:boolean,
  authErr?:boolean
};
export type Error_Code = 'INTERNAL_ERROR'|'RESTART_SERVER'|'SERVER_OFF_1005'|'CLOSE_SERVER'|'SERVER_OFF_1006'|'JWT_EXPIRED'|'CLOSE_USER_CONNECTION'
export const SERVER_ERRORS = new Map <Error_Code, IErrorHandler> ([
  ['INTERNAL_ERROR', {
    code:1011,
    messageToUI:'Internal Error',
    retryConnection:true
  }],
  ['RESTART_SERVER', {
    code:1012,
    messageToUI:'Server is restarting..',
    retryConnection:true
  }],
  ['CLOSE_SERVER', {
    code:1013,
    messageToUI:'Server is restarting..',
    retryConnection:true
  }],
  ['SERVER_OFF_1005', {
    code:1005,
    messageToUI:'Server is unavailable',
    retryConnection:true
  }],
  ['SERVER_OFF_1006', {
    code:1006,
    messageToUI:'Server is unavailable',
    retryConnection:true
  }],
  ['JWT_EXPIRED', {
    code:4000,
    messageToUI:'Token jwt is expired',
    retryConnection:true,
    authErr:true
  }],
  ['CLOSE_USER_CONNECTION', {
    code:4001,
    messageToUI:'Request to close the connection',
    retryConnection:true,
    authErr:true
  }]
])
