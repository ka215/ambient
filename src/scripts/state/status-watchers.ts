export function bindAmbientStatusWatchers(options: {
  status: Record<string, unknown>;
  onPropertyChange(prop: string, oldValue: unknown, newValue: unknown): void;
}): void {
  Object.keys(options.status).forEach((propName: string) => {
    let value: unknown = options.status[propName];
    Object.defineProperty(options.status, propName, {
      get: () => value,
      set: (newValue: unknown) => {
        const oldValue = value;
        value = newValue;
        if (oldValue !== newValue) {
          options.onPropertyChange(propName, oldValue, value);
        }
      },
      enumerable: true,
      configurable: true,
    });
  });
}
