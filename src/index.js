const Initializer = require('./initializer');
const ReadyQueueConsumer = require('./ready_queue_consumer');
const amqpHandlerWrapper = require('./amqp_handler_wrapper');

// attempts must be a number in milliseconds
const getDefaultDelay = attempts => {
  const delay = Math.pow(2, attempts);
  if (delay > 60 * 60 * 24) {
    // the delay for the message is longer than 24 hours.  Fail the message and never retry again.
    return -1;
  }
  return delay * 1000;
};

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

  const delayFn = options.delay || getDefaultDelay;

  // initializing the objects
  const initializer = new Initializer(
    options.channel,
    options.consumerQueue,
    options.failureQueue,
    options.retryCount,
    delayFn
  );
  const consumer = new ReadyQueueConsumer(options.channel);
  const wrapper = amqpHandlerWrapper(
    options.channel,
    options.consumerQueue,
    options.failureQueue,
    options.handler,
    delayFn,
    options.retryCount,
    initializer
  );

  // initializing the queues, exchange and binding. Then starting the consumer
  initializer.initialize().then(() => consumer.start());

  // returning wrapper for given amqp handler function.
  return wrapper;
};
