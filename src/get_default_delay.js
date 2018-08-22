// attempts must be a number in milliseconds
module.exports = attempts => {
  const delay = Math.pow(2, attempts);
  if (delay > 60 * 60 * 24) {
    console.error(
      'the delay for the message is longer than 24 hours.  Fail the message and never retry again.'
    );
    return -1;
  }
  return delay * 1000;
};
