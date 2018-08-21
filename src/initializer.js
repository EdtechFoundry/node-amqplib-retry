var config = require('./config');
var Promise = require('bluebird');

class Initializer {
  constructor(channel, clientQueueName, failureQueueName) {
    this.channel = channel;
    this.clientQueueName = clientQueueName;
    this.failureQueueName = failureQueueName;
  }

  assertDelayQueues(retryCount) {
    const assertMap = new Array(retryCount).map(retry =>
      self.channel.assertQueue(`${config.delayQueueName}-${retry}`, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': config.exchangeName,
          'x-dead-letter-routing-key': config.readyRouteKey,
        },
      })
    );
    return Promise.all(assertMap);
  }

  initialize(retryCount) {
    const self = this;
    return Promise.try(() => {
      return Promise.all([
        self.assertDelayQueues(retryCount),
        self.channel.assertQueue(config.readyQueueName, { durable: true }),
        self.channel.checkQueue(self.clientQueueName),
        self.channel.checkQueue(self.failureQueueName),
        self.channel.assertExchange(config.exchangeName, 'direct', { durable: true }),
      ]);
    })
      .then(() =>
        self.channel.bindQueue(config.readyQueueName, config.exchangeName, config.readyRouteKey)
      )
      .then(() => {
        self.isInitialized = true;
      });
  }
}

module.exports = Initializer;
