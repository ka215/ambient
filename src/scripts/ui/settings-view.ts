export function applyPlaylistBackground(options: {
  body: HTMLElement;
  menu: HTMLElement | null;
  imageDir: string | null | undefined;
  backgroundImage: string | null;
}): void {
  if (options.backgroundImage && options.imageDir) {
    const backgroundSrc = options.imageDir + options.backgroundImage;
    options.body.setAttribute('style', `background-image: url('${backgroundSrc}');`);
    options.body.classList.add('bg-no-repeat', 'bg-bottom', 'bg-cover');
    options.menu?.setAttribute(
      'style',
      'background: linear-gradient(to bottom, rgba(255,255,255,.3), 50%, rgba(255,255,255,1));'
    );
    return;
  }

  options.body.removeAttribute('style');
  options.body.classList.remove('bg-no-repeat', 'bg-bottom', 'bg-cover');
  options.menu?.removeAttribute('style');
}

export function applyDarkModeAppearance(options: {
  enabled: boolean;
  toggleInput: HTMLInputElement | null;
  updateNoMediaImagesForTheme: () => void;
  setStyles: (targetElements: HTMLElement | HTMLElement[], styles?: string | Record<string, string>) => void;
}): void {
  if (options.toggleInput) {
    options.toggleInput.checked = options.enabled;
  }

  if (options.enabled) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  options.updateNoMediaImagesForTheme();

  const carouselItems = Array.from(document.querySelectorAll('[id^="carousel-item-"]')) as HTMLElement[];
  carouselItems.forEach((item) => {
    if (options.enabled) {
      options.setStyles(item, 'opacity: .7');
    } else {
      options.setStyles(item);
    }
  });

  const audioPlayers = document.getElementsByTagName('audio');
  if (audioPlayers.length === 1 && audioPlayers[0] instanceof HTMLElement) {
    if (options.enabled) {
      options.setStyles(audioPlayers[0], 'opacity: .7');
    } else {
      options.setStyles(audioPlayers[0]);
    }
  }
}

export function getToggleInput(toggleRoot: ParentNode | null): HTMLInputElement | null {
  if (!toggleRoot || typeof toggleRoot.querySelector !== 'function') {
    return null;
  }
  return toggleRoot.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
}

export function syncToggleInput(toggleInput: HTMLInputElement | null, checked: boolean): void {
  if (!toggleInput) {
    return;
  }
  toggleInput.checked = checked;
}

export function syncToggleRoot(toggleRoot: ParentNode | null, checked: boolean): void {
  syncToggleInput(getToggleInput(toggleRoot), checked);
}

export function syncVolumeSlider(options: {
  input: HTMLInputElement;
  volume: number;
  syncRangeProgress: (range: HTMLInputElement) => void;
  display: HTMLElement | null;
}): void {
  options.input.value = String(options.volume);
  options.syncRangeProgress(options.input);
  if (options.display) {
    options.display.textContent = String(options.volume);
  }
}
