const Initializer = require('./initializer');
const ReadyQueueConsumer = require('./ready_queue_consumer');
const amqpHandlerWrapper = require('./amqp_handler_wrapper');
const _ = require('underscore');
const getDefaultDelay = require('./get_default_delay');

module.exports = options => {
  // validate options
  if (!options.channel) {
    throw new Error("'channel' not specified.  See documentation.");
  }
  if (!options.consumerQueue) {
    throw new Error("'consumerQueue' not specified.  See documentation.");
  }
  if (!options.handler) {
    throw new Error("'handler' not specified.  See documentation.");
  }

  // set defaults
  if (!options.failureQueue) {
    options.failureQueue = options.consumerQueue + '.failure';
  }

  const retryCount = _.isNaN(options.retryCount) ? 1 : options.retryCount;

  // initializing the objects
  const initializer = new Initializer(
    options.channel,
    options.consumerQueue,
    options.failureQueue,
    retryCount,
    options.delay
  );
  const consumer = new ReadyQueueConsumer(options.channel);
  const wrapper = amqpHandlerWrapper(
    options.channel,
    options.consumerQueue,
    options.failureQueue,
    options.handler,
    options.delay || getDefaultDelay,
    retryCount,
    initializer
  );

  // initializing the queues, exchange and binding. Then starting the consumer
  initializer.initialize().then(() => consumer.start());

  // returning wrapper for given amqp handler function.
  return wrapper;
};
