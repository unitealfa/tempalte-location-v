const DATABASE_UNAVAILABLE_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ESOCKET",
  "PROTOCOL_CONNECTION_LOST",
  "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
  "ER_CON_COUNT_ERROR",
  "ER_ACCESS_DENIED_ERROR"
]);

const DATABASE_UNAVAILABLE_PATTERNS = [
  "database configuration is incomplete",
  "getaddrinfo enotfound",
  "connect econnrefused",
  "too many connections",
  "server has gone away",
  "connection lost",
  "connection is closed",
  "connection refused",
  "timeout",
  "unable to verify the first certificate",
  "self signed certificate"
];

function matchesUnavailablePattern(message) {
  const normalizedMessage = String(message || "").toLowerCase();

  return DATABASE_UNAVAILABLE_PATTERNS.some((pattern) =>
    normalizedMessage.includes(pattern)
  );
}

function isDatabaseUnavailableError(error) {
  const visited = new Set();
  const queue = [error];

  while (queue.length > 0) {
    const currentError = queue.shift();

    if (!currentError || visited.has(currentError)) {
      continue;
    }

    visited.add(currentError);

    if (DATABASE_UNAVAILABLE_CODES.has(currentError.code)) {
      return true;
    }

    if (matchesUnavailablePattern(currentError.message)) {
      return true;
    }

    if (currentError.cause) {
      queue.push(currentError.cause);
    }

    if (currentError.originalError) {
      queue.push(currentError.originalError);
    }

    if (currentError.parent) {
      queue.push(currentError.parent);
    }
  }

  return false;
}

module.exports = {
  isDatabaseUnavailableError
};
