/**
 * Retries an async function with exponential backoff and jitter.
 * Gives special treatment to HTTP 429 (rate limit) and 503 (service unavailable)
 * by applying a longer base delay.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      // Determine if this is a rate-limit or service-unavailable error
      const isRateLimitOrUnavailable = isRetryableStatusError(error);

      // Exponential backoff: baseDelay * 2^attempt
      let delay = baseDelay * Math.pow(2, attempt);

      // Apply a longer multiplier for 429/503 errors
      if (isRateLimitOrUnavailable) {
        delay = delay * 3;
      }

      // Add random jitter (0–50% of the computed delay) to prevent thundering herd
      const jitter = Math.random() * delay * 0.5;
      const totalDelay = Math.round(delay + jitter);

      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed. ` +
          `${isRateLimitOrUnavailable ? '(Rate limited / 503) ' : ''}` +
          `Waiting ${totalDelay}ms before next attempt. ` +
          `Error: ${lastError.message}`
      );

      await sleep(totalDelay);
    }
  }

  throw lastError ?? new Error('retryWithBackoff exhausted all retries');
}

/**
 * Checks whether the error includes a 429 or 503 HTTP status code.
 * Works with errors that expose a `status`, `statusCode`, or embed the code in the message.
 */
function isRetryableStatusError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as Record<string, unknown>;

  // Check common status properties
  const status = err.status ?? err.statusCode ?? err.code;
  if (status === 429 || status === 503 || status === '429' || status === '503') {
    return true;
  }

  // Check for status code in the error message
  if (typeof err.message === 'string') {
    return err.message.includes('429') || err.message.includes('503');
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
