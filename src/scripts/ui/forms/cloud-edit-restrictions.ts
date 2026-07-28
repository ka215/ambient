export interface CloudEditRestrictionsOptions {
  canMutatePlaylist: boolean;
  mediaForm: HTMLFormElement | null;
  playlistForm: HTMLFormElement | null;
  readonlyTitle: string;
}

export function applyCloudEditRestrictionsView(options: CloudEditRestrictionsOptions): void {
  const mediaControlIds = [
    'media-type-youtube',
    'youtube-url',
    'media-category',
    'media-category-new',
    'media-title',
    'media-artist',
    'media-desc',
    'media-volume',
    'seek-start',
    'seek-end',
    'btn-add-media',
  ];
  const categoryControlIds = [
    'category-name',
    'btn-create-category',
    'category-edit-target',
    'category-edit-name',
    'btn-update-category',
    'btn-delete-category',
  ];
  const setReadonlyState = (ids: string[]): void => {
    ids.forEach((id) => {
      const elm = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null;
      if (!elm) {
        return;
      }
      elm.disabled = !options.canMutatePlaylist;
      elm.setAttribute('aria-disabled', String(!options.canMutatePlaylist));
      if (!options.canMutatePlaylist) {
        elm.setAttribute('title', options.readonlyTitle);
      } else {
        elm.removeAttribute('title');
      }
    });
  };

  setReadonlyState(mediaControlIds);
  setReadonlyState(categoryControlIds);

  if (!options.canMutatePlaylist) {
    options.mediaForm?.classList.add('opacity-50');
    options.playlistForm?.querySelector('#playlist-management-field-category')?.classList.add('opacity-50');
    options.playlistForm?.querySelector('#playlist-management-field-category-edit')?.classList.add('opacity-50');
    return;
  }

  options.mediaForm?.classList.remove('opacity-50');
  options.playlistForm?.querySelector('#playlist-management-field-category')?.classList.remove('opacity-50');
  options.playlistForm?.querySelector('#playlist-management-field-category-edit')?.classList.remove('opacity-50');
}
