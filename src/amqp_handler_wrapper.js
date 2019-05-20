const _ = require('underscore');
const Promise = require('bluebird');
const config = require('./config');
const getDelayQueueName = require('./get_delay_queue_name');
const { Log } = require('@edtechfoundry/node-logger');

module.exports = function(
  channel,
  clientQueueName,
  failureQueueName,
  clientHandler,
  delayFunction,
  retryCount,
  initializer,
) {
  const errorHandler = msg => {
    if (!initializer.isInitialized) {
      // Delay in 1 MS to let the queues/exchange/bindings initialize
      return Promise.delay(1).then(() => errorHandler(msg));
    }

    _.defaults(msg, { properties: {} });
    _.defaults(msg.properties, { headers: {} });
    _.defaults(msg.properties.headers, { _retryCount: 0 }); // _retryCount: 0 means this message has never been retried before.

    if (!isNaN(retryCount) && retryCount === msg.properties.headers._retryCount) {
      return channel.sendToQueue(failureQueueName, new Buffer(msg.content), msg.properties);
    }

    msg.properties.headers._retryCount += 1;
    const expiration = delayFunction(msg.properties.headers._retryCount);

    if (expiration < 1) {
      return channel.sendToQueue(failureQueueName, new Buffer(msg.content), msg.properties);
    }

    const properties = {
      persistent: true,
      headers: {
        _originalProperties: msg.properties, // save the original properties.
        _targetQueue: clientQueueName, // save the target queue name we should publish to after the delay is over.
      },
    };

    _.extend(properties, {
      expiration: expiration.toString(),
    });
    return channel.publish(
      '',
      getDelayQueueName(config.delayQueueName, msg.properties.headers._retryCount, delayFunction),
      new Buffer(msg.content),
      properties,
    );
  };

  const handlerWrapper = msg =>
    Promise.try(() => clientHandler(msg))
      .catch(err => {
        const expiration = delayFunction(msg.properties.headers._retryCount);
        Log.debug(
          `AMQP retry handler caught the following error after ${
            msg.properties.headers._retryCount
          } attempts and will retry the message again in ${expiration} ms`,
          err,
        );

        return Promise.try(() => errorHandler(msg)).catch(err => {
          Log.error(
            'AMQP retry handler failed to send the message to the failed queue. Properties:',
            msg.properties,
          );
          channel.nack(msg);
          throw err;
        });
      })
      .then(() =>
        // We ack it for the user. Either way if the message has been processed successfully or
        // not, the message should be out of the original queue, therefore - acked.
        channel.ack(msg),
      );

  return handlerWrapper;
};
