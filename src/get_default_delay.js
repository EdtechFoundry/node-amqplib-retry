const { Log } = require('@edtechfoundry/node-logger');

const MAX = 24 * 60 * 60 * 1000; // 24 hours

// attempts must be a number in milliseconds
module.exports = function getDefaultDelay(attempts) {
  const delay = Math.pow(2, attempts) * 1000;
  if (delay > MAX) {
    Log.error(
      'the delay for the message is longer than 24 hours.  The message will be discarded and never retried.'
    );
    return -1;
  }
  return delay;
};
