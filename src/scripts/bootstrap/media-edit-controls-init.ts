import {
  bindMediaEditCategoryControls,
  bindMediaEditFieldControls,
  bindMediaEditPreviewControls,
  bindMediaEditPrimaryControls,
  bindMediaEditThumbnailControls,
} from '../ui/media-edit-controls';

type PrimaryBindings = Parameters<typeof bindMediaEditPrimaryControls>[0];
type CategoryBindings = Parameters<typeof bindMediaEditCategoryControls>[0];
type FieldBindings = Parameters<typeof bindMediaEditFieldControls>[0];
type PreviewBindings = Parameters<typeof bindMediaEditPreviewControls>[0];
type ThumbnailBindings = Parameters<typeof bindMediaEditThumbnailControls>[0];

export interface InitializeMediaEditControlsOptions {
  primary: PrimaryBindings;
  category: CategoryBindings;
  field: FieldBindings;
  preview: PreviewBindings;
  thumbnail: ThumbnailBindings;
}

export function initializeMediaEditControls(options: InitializeMediaEditControlsOptions): void {
  bindMediaEditPrimaryControls(options.primary);
  bindMediaEditCategoryControls(options.category);
  bindMediaEditFieldControls(options.field);
  bindMediaEditPreviewControls(options.preview);
  bindMediaEditThumbnailControls(options.thumbnail);
}
