/**
 * Cross-environment utility to check if the provided `AbortSignal` is aborted and throw a `DOMException` with the name `AbortError` if so.
 * This is needed because Node.js does not yet support `signal.throwIfAborted`.
 *
 * @param {AbortSignal} [signal] - An optional `AbortSignal` instance to monitor for an aborted state.
 * @return {void} This function does not return a value.
 */
export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
}

/**
 * Inspects the provided error and rethrows it as a new AbortError with the abort reason
 * if the error is an instance of DOMException with the name 'AbortError' and the given signal is aborted.
 * Otherwise, it rethrows the original error.
 *
 * @param {unknown} error - The error to be inspected and potentially rethrown.
 * @param {AbortSignal} [signal] - An optional AbortSignal used to check if the operation was aborted.
 * @return {void} This function does not return a value; it either throws an error or completes.
 */
export function rethrowIfAbortError(error: unknown, signal?: AbortSignal): void {
  if (error instanceof DOMException && error.name === 'AbortError' && signal?.aborted) {
    throw new DOMException(signal?.reason ?? 'Request aborted', 'AbortError');
  }
  throw error;
}

/**
 * Creates an abortable promise that resolves or rejects based on the provided promise and abort signal.
 * If the signal is aborted, the promise will be rejected with an AbortError.
 *
 * @param {Promise<T>} promise<T> - The original promise to be made abortable.
 * @param {AbortSignal} [signal] - An optional AbortSignal to monitor for abortion.
 * @return {Promise<T>} A new promise that resolves or rejects based on the original promise and the abort signal.
 */
export function createAbortablePromise<T>(
  promise: Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (!signal) return promise;

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException('Operation aborted', 'AbortError'));
    };

    if (signal.aborted) return onAbort();

    signal.addEventListener('abort', onAbort, { once: true });

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal.removeEventListener('abort', onAbort);
      });
  });
}
