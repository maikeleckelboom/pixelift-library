export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isWorker(): boolean {
  return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
}

export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions?.node != null &&
    !process.versions?.electron
  );
}
