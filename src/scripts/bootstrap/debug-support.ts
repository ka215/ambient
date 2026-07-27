export interface DebugSupport {
  execDebug(): void;
}

export function createDebugSupport(): DebugSupport {
  return {
    execDebug(): void {
      // Intentionally left blank. Legacy debug autofill logic has been retired.
    },
  };
}
