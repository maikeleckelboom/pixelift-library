export type PixeliftErrorKind = 'Decode' | 'Validation' | 'IO' | 'Internal';

export class PixeliftError extends Error {
  override readonly name: string;
  readonly kind: PixeliftErrorKind;
  readonly cause?: unknown;

  constructor(
      kind: PixeliftErrorKind,
      message: string,
      options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = new.target.name;
    this.kind = kind;
    this.cause = options?.cause;
  }
}
