export interface CloudEditRestrictionsOptions {
  canMutatePlaylist: boolean;
  isCloud: boolean;
  mediaForm: HTMLFormElement | null;
  playlistForm: HTMLFormElement | null;
  readonlyTitle: string;
  cloudUploadTitle?: string;
}

export function applyCloudEditRestrictionsView(options: CloudEditRestrictionsOptions): void {
  const mediaControlIds = [
    'media-type-youtube',
    'youtube-url',
    'media-type-local',
    'local-media-url',
    'media-category',
    'media-category-new',
    'media-title',
    'media-artist',
    'media-desc',
    'media-volume',
    'seek-start',
    'seek-end',
  ];
  const dynamicMediaControlIds = [
    'btn-check-local-media-url',
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
  dynamicMediaControlIds.forEach((id) => {
    const elm = document.getElementById(id) as HTMLButtonElement | null;
    if (!elm) {
      return;
    }
    if (!options.canMutatePlaylist) {
      elm.disabled = true;
      elm.setAttribute('aria-disabled', 'true');
      elm.setAttribute('title', options.readonlyTitle);
    } else {
      elm.setAttribute('aria-disabled', String(elm.disabled));
      elm.removeAttribute('title');
    }
  });

  const uploadControlIds = [
    'local-media-file',
    'btn-local-media-file-picker',
    'local-media-tab-upload',
  ];
  const uploadDisabled = !options.canMutatePlaylist || options.isCloud;
  uploadControlIds.forEach((id) => {
    const elm = document.getElementById(id) as HTMLInputElement | HTMLButtonElement | null;
    if (!elm) {
      return;
    }
    elm.disabled = uploadDisabled;
    elm.setAttribute('aria-disabled', String(uploadDisabled));
    if (!options.canMutatePlaylist) {
      elm.setAttribute('title', options.readonlyTitle);
    } else if (options.isCloud) {
      elm.setAttribute('title', options.cloudUploadTitle || '');
    } else {
      elm.removeAttribute('title');
    }
  });

  const localMediaDropzone = document.getElementById('local-media-dropzone');
  if (localMediaDropzone) {
    localMediaDropzone.setAttribute('aria-disabled', String(uploadDisabled));
    localMediaDropzone.classList.toggle('pointer-events-none', uploadDisabled);
    localMediaDropzone.classList.toggle('opacity-60', uploadDisabled);
    localMediaDropzone.classList.remove('is-dragover', 'is-invalid');
    if (!options.canMutatePlaylist) {
      localMediaDropzone.setAttribute('title', options.readonlyTitle);
    } else if (options.isCloud) {
      localMediaDropzone.setAttribute('title', options.cloudUploadTitle || '');
    } else {
      localMediaDropzone.removeAttribute('title');
    }
  }

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
