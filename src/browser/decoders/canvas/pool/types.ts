export interface Pool {
  acquire(signal?: AbortSignal): Promise<OffscreenCanvas>;
  release(canvas: OffscreenCanvas): void;
  dispose(): void;
}

export type Task = {
  resolve: (canvas: OffscreenCanvas) => void;
  reject: (err: Error) => void;
  signal?: AbortSignal | undefined;
};
