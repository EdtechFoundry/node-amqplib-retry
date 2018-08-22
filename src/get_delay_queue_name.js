const getDefaultDelay = require('./get_default_delay');
const _ = require('underscore');

module.exports = (queueName, retryCount, _delayFn) => {
  const delayFn = _delayFn || getDefaultDelay;
  const delay = delayFn(retryCount);
  if (_.isNaN(delay) || delay < 0) {
    return `${queueName}`;
  }
  return `${queueName}-${delay}`;
};
