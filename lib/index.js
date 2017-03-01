'use strict';var Initializer=require('./initializer');var ReadyQueueConsumer=require('./ready_queue_consumer');var amqpHandlerWrapper=require('./amqp_handler_wrapper');module.exports=function(options){// validate options
if(!options.channel){throw new Error('\'channel\' not specified.  See documentation.')}if(!options.consumerQueue){throw new Error('\'consumerQueue\' not specified.  See documentation.')}if(!options.handler){throw new Error('\'handler\' not specified.  See documentation.')}// set defaults
if(!options.failureQueue){options.failureQueue=options.consumerQueue+'.failure'}// initializing the objects
var initializer=new Initializer(options.channel,options.consumerQueue,options.failureQueue);var consumer=new ReadyQueueConsumer(options.channel);var wrapper=amqpHandlerWrapper(options.channel,options.consumerQueue,options.failureQueue,options.handler,options.delay,initializer);// initializing the queues, exchange and binding. Then starting the consumer
initializer.initialize().then(function(){return consumer.start()});// returning wrapper for given amqp handler function.
return wrapper};
//# sourceMappingURL=index.js.map