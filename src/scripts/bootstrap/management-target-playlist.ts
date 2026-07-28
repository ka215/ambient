export interface EnsureManagementTargetPlaylistOptions {
  status: { playlist: string | null };
  selectElement: HTMLSelectElement | null;
  myPlaylistName: string;
  document: Document;
}

export function ensureManagementTargetPlaylist(options: EnsureManagementTargetPlaylistOptions): void {
  if (options.status.playlist) {
    return;
  }

  options.status.playlist = options.myPlaylistName;

  const selectElement = options.selectElement;
  if (!selectElement) {
    return;
  }

  const alreadyExists = Array.from(selectElement.options).some(
    (opt) => opt.value === options.myPlaylistName
  );
  if (!alreadyExists) {
    const opt = options.document.createElement('option');
    opt.value = options.myPlaylistName;
    opt.textContent = options.myPlaylistName.replace(/\.json$/i, '');
    selectElement.appendChild(opt);
  }

  for (let i = 0; i < selectElement.options.length; i++) {
    if (selectElement.options[i]?.value === options.myPlaylistName) {
      selectElement.selectedIndex = i;
      break;
    }
  }
}
