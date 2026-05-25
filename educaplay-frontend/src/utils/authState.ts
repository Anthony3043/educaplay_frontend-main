let _onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

export function handleUnauthorized() {
  _onUnauthorized?.();
}
