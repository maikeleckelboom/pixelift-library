let _debugEnabled: boolean = true;

export function setDebugEnabled(enabled: boolean): void {
  _debugEnabled = enabled;
}

export function isDebugEnabled(): boolean {
  return _debugEnabled;
}
