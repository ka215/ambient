export interface MediaManagementActionBridge {
  open(presetCategoryId?: number | null): void;
  setOpenAction(action: (presetCategoryId?: number | null) => void): void;
}

export function createMediaManagementActionBridge(): MediaManagementActionBridge {
  let openAction: (presetCategoryId?: number | null) => void = () => {};

  return {
    open: (presetCategoryId?: number | null) => {
      openAction(presetCategoryId);
    },
    setOpenAction: (action) => {
      openAction = action;
    },
  };
}
