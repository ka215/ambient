export interface CreateVolumeOptionSupportOptions {
  getVolumeOption(): number | null;
}

export interface VolumeOptionSupport {
  getVolumeOption(): number | null;
}

export function createVolumeOptionSupport(
  options: CreateVolumeOptionSupportOptions
): VolumeOptionSupport {
  return {
    getVolumeOption: options.getVolumeOption,
  };
}
