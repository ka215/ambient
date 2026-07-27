export interface CreateManagementMediaSupportOptions {
  defaultVolume: number;
  getVolumeOption(): number | null;
  normalizeVolume(value: unknown, fallback?: number): number;
  sanitizeMediaTextInput(value: string, maxLength: number): string;
  sanitizeMediaDescInput(value: string, maxLength?: number): string;
  sanitizeMediaDescInputLive(value: string, maxLength?: number): string;
  syncRangeProgress(range: HTMLInputElement | null, defaultVolume: number): void;
}

export interface ManagementMediaSupport {
  getDefaultVolume(): number;
  normalizeVolume(value: unknown, fallback?: number): number;
  sanitizeMediaTextInput(value: string, maxLength: number): string;
  sanitizeMediaDescInput(value: string, maxLength?: number): string;
  sanitizeMediaDescInputLive(value: string, maxLength?: number): string;
  syncRangeProgress(range: HTMLInputElement | null): void;
}

export function createManagementMediaSupport(
  options: CreateManagementMediaSupportOptions
): ManagementMediaSupport {
  return {
    getDefaultVolume: () => options.normalizeVolume(options.getVolumeOption(), options.defaultVolume),
    normalizeVolume: (value, fallback = options.defaultVolume) => options.normalizeVolume(value, fallback),
    sanitizeMediaTextInput: options.sanitizeMediaTextInput,
    sanitizeMediaDescInput: options.sanitizeMediaDescInput,
    sanitizeMediaDescInputLive: options.sanitizeMediaDescInputLive,
    syncRangeProgress: (range) => options.syncRangeProgress(range, options.defaultVolume),
  };
}
