var config = require('./config');
var Promise = require('bluebird');
const getDelayQueueName = require('./get_delay_queue_name');

class Initializer {
  constructor(channel, clientQueueName, failureQueueName, retryCount, delayFn) {
    this.channel = channel;
    this.clientQueueName = clientQueueName;
    this.failureQueueName = failureQueueName;
    this.retryCount = retryCount;
    this.delayFn = delayFn;
  }

  assertDelayQueues() {
    const delayQueuePromises = [];
    for (let i = 1; i <= this.retryCount; i++) {
      delayQueuePromises.push(
        this.channel.assertQueue(getDelayQueueName(config.delayQueueName, i, this.delayFn), {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': config.exchangeName,
            'x-dead-letter-routing-key': config.readyRouteKey,
          },
        })
      );
    }
    return Promise.all(delayQueuePromises);
  }

  initialize() {
    const self = this;
    return Promise.try(() => {
      return Promise.all([
        self.assertDelayQueues(),
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
