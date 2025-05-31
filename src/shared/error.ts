export type PixeliftErrorKind = 'Decode' | 'Validation' | 'IO' | 'Internal' | (string & {});

export type ErrorContext<T extends string> = {
  [K in T]?: unknown;
} & {
  cause?: unknown;
};
/**
 * Base Pixelift error class.
 *
 * @template K - error kind string union (e.g. 'Decode', 'Validation', etc)
 */
export class PixeliftError<K extends PixeliftErrorKind = string> extends Error {
  readonly kind: K;
  readonly cause?: unknown;

  constructor(
    kind: K,
    message: string,
    options: {
      cause?: unknown;
      context?: ErrorContext<K>;
    } = {}
  ) {
    super(message, options);
    this.kind = kind;
    this.cause = options.cause;

    if (options.context) {
      Object.assign(this, options.context);
    }

    Object.defineProperty(this, 'name', {
      value: new.target.name,
      configurable: true,
      writable: false
    });
  }
}

/**
 * Factory function to create a module-specific error class and messages map.
 *
 * @template K - keys of the messages object (error codes)
 * @template M - record of error codes to string/Error messages
 *
 * @param moduleName - string prefix for the error class name
 * @param messages - map of error keys to error messages (string or Error)
 * @returns object with `messages` and `ModuleError` class
 */
export function createErrorModule<K extends string, M extends Record<K, string | Error>>(
  moduleName: string,
  messages: M
) {
  type Keys = Extract<keyof M, string>;

  class ModuleError extends PixeliftError<Keys> {
    constructor(
      kind: Keys,
      options?: { cause?: unknown; context?: Record<string, unknown> }
    ) {
      const msg = messages[kind];
      super(kind, typeof msg === 'string' ? msg : msg.message, options);

      Object.defineProperty(this, 'name', {
        value: `${moduleName}Error`,
        configurable: true,
        writable: false
      });
    }
  }

  return { messages, ModuleError };
}
