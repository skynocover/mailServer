export interface Tresp {
  errorCode: number;
  errorMessage: string;
}

export const Resp = {
  success: {
    errorCode: 0,
    errorMessage: '',
  },

  backendCheckSessionFail: {
    errorCode: 9999,
    errorMessage: 'Session無效或過期',
  },

  // Api Fail
  paramInputEmpty: {
    errorCode: 1000,
    errorMessage: 'param Input Empty',
  },

  paramInputFormateError: {
    errorCode: 1001,
    errorMessage: 'param Input formate error',
  },

  queryNotFound: {
    errorCode: 1002,
    errorMessage: 'param Input not found',
  },

  hashError: {
    errorCode: 1003,
    errorMessage: 'checksum error',
  },

  datetimeExpire: {
    errorCode: 1004,
    errorMessage: 'datetime expire',
  },

  // DB Fail
  sqlExecFail: {
    errorCode: 2000,
    errorMessage: 'sql exec fail',
  },

  // Exec Fail
  commandExecFail: {
    errorCode: 3000,
    errorMessage: 'command exec fail',
  },

  sendMsgFail: {
    errorCode: 3001,
    errorMessage: 'send message fail',
  },
};
