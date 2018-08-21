module.exports = (queueName, retryCount, delayFn) => {
  return `${queueName}-${delayFn(retryCount)}`;
};
