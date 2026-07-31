<div 
  id="drawer-playlist"
  class="fixed top-0 left-0 z-50 h-screen overflow-y-auto transition-transform -translate-x-full bg-white border-r border-gray-200 w-80 dark:bg-gray-800 dark:border-gray-600 dark:text-white shadow dark:shadow-md"
  tabindex="-1"
  aria-labelledby="drawer-playlist-label"
>
    <div class="p-4 fixed top-0 left-0 z-10 w-80 h-14 flex flex-nowrap items-center bg-white border-r border-b dark:bg-gray-800 dark:border-gray-600">
        <h5 id="drawer-playlist-label" class="inline-flex flex-1 min-w-0 items-center text-base font-semibold text-gray-500 dark:text-white text-rotate-0">
            <span class="ui-icon-mask ui-icon-mask--playlist w-5 h-5 text-gray-500 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-500 text-rotate-0" aria-hidden="true" aria-label="play-list"></span>
            <span class="ml-2 text-rotate-0"><?= __( 'Playlist' ) ?></span>
        </h5>
            <div class="relative ml-2 inline-flex items-center gap-2">
            <button
              type="button"
              id="btn-playlist-mode"
              class="inline-flex min-w-[8rem] items-center justify-center gap-1.5 px-2 py-1.5 text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
              aria-haspopup="true"
              aria-expanded="false"
              data-label-normal="<?= __( 'Normal' ) ?>"
              data-label-edit="<?= __( 'Edit' ) ?>"
              data-label-reorder="<?= __( 'Reorder' ) ?>"
              data-label-delete="<?= __( 'Delete' ) ?>"
              data-label-mode="<?= __( 'Mode' ) ?>"
              data-label-mode-change="<?= __( 'Mode Change' ) ?>"
              data-confirm-delete-title="<?= __( 'Delete selected items?' ) ?>"
              data-confirm-delete-body="<?= __( 'Selected items will be removed from your playlist.' ) ?>"
              data-confirm-reorder-title="<?= __( 'Apply reordered sequence?' ) ?>"
              data-confirm-reorder-body="<?= __( 'Apply the current item order to your playlist.' ) ?>"
            >
                <span id="playlist-mode-button-icon" class="inline-flex items-center justify-center" aria-hidden="true">
                    <span class="ui-icon-mask ui-icon-mask--mode-change w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true"></span>
                </span>
                <span id="playlist-mode-button-label" class="text-sm font-medium"><?= __( 'Mode Change' ) ?></span>
            </button>
            <div
              id="playlist-mode-menu"
              class="hidden absolute top-10 right-0 z-50 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              style="min-width: 8rem; box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22);"
              role="menu"
              aria-label="<?= __( 'Mode' ) ?>"
            >
                <button type="button" class="playlist-mode-option inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600" data-mode="normal" role="menuitem">
                    <span class="playlist-mode-option-icon ui-icon-mask ui-icon-mask--mode-normal w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true"></span>
                    <span class="playlist-mode-option-label"><?= __( 'Normal' ) ?></span>
                </button>
                <button type="button" class="playlist-mode-option inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed" data-mode="edit" role="menuitem" disabled aria-disabled="true">
                    <span class="playlist-mode-option-icon ui-icon-mask ui-icon-mask--mode-edit w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true"></span>
                    <span class="playlist-mode-option-label"><?= __( 'Edit' ) ?></span>
                </button>
                <button type="button" class="playlist-mode-option inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600" data-mode="reorder" role="menuitem">
                    <span class="playlist-mode-option-icon ui-icon-mask ui-icon-mask--mode-reorder w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true"></span>
                    <span class="playlist-mode-option-label"><?= __( 'Reorder' ) ?></span>
                </button>
                <button type="button" class="playlist-mode-option inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600" data-mode="delete" role="menuitem">
                    <span class="playlist-mode-option-icon ui-icon-mask ui-icon-mask--mode-delete w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true"></span>
                    <span class="playlist-mode-option-label"><?= __( 'Delete' ) ?></span>
                </button>
            </div>
        </div>
        <button 
          type="button"
          id="btn-close-playlist"
          data-drawer-hide="drawer-playlist"
          aria-controls="drawer-playlist"
          class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white"
        >
            <span class="ui-icon-mask ui-icon-mask--close w-3 h-3" aria-hidden="true"></span>
            <span class="sr-only"><?= __( 'Close Playlist' ) ?></span>
        </button>
    </div>
    <div 
      id="playlist-list-group"
      class="w-full mt-14 mb-16 overflow-y-auto text-sm font-normal text-gray-900 bg-white border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      style="height: calc(100vh - <?php if ( $this->menu_type == 1 ): ?>120<?php else: ?>136<?php endif; ?>px);"
    >
        <div id="no-media" class="flex flex-col w-full h-full justify-center items-center gap-3 text-base text-gray-500">
            <span><?= __( 'No media available.' ) ?></span>
            <button
              type="button"
              id="btn-add-media-from-drawer"
              data-label="<?= __( 'Register media' ) ?>"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
                <span class="playlist-icon-mask playlist-icon-mask--add w-6 h-6" aria-hidden="true"></span>
                <?= __( 'Register media' ) ?>
            </button>
        </div>
    </div>
</div><!-- /#drawer-playlist -->

<!-- Playlist description modal (v2.3.1) -->
<div
  id="modal-playlist-desc"
  class="hidden fixed inset-0 z-[75] flex items-center justify-center p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-playlist-desc-title"
>
    <div id="modal-playlist-desc-backdrop" class="absolute inset-0 bg-black/45 backdrop-blur-xs" aria-hidden="true"></div>
    <div class="playlist-desc-dialog relative z-10 flex w-full max-w-sm flex-col rounded-lg bg-white p-4 shadow-xl dark:bg-gray-700">
        <button
          type="button"
          id="btn-close-playlist-desc"
          class="absolute top-2 right-2 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white"
          aria-label="<?= __( 'Close' ) ?>"
        >
            <span class="ui-icon-mask ui-icon-mask--close w-3 h-3" aria-hidden="true"></span>
        </button>
        <h3 id="modal-playlist-desc-title" class="pr-8 text-base font-normal text-gray-900 dark:text-white"></h3>
        <div id="modal-playlist-desc-artist" class="playlist-desc-artist hidden mt-2"></div>
        <div class="playlist-desc-body">
            <div id="modal-playlist-desc-content" class="playlist-desc-content text-sm text-gray-700 dark:text-gray-200"></div>
        </div>
    </div>
</div>

<!-- Playlist operation confirm modal (v2.2.0) -->
<div
  id="modal-playlist-confirm"
  class="hidden fixed inset-0 z-[70] flex items-center justify-center p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-playlist-confirm-title"
>
    <div class="absolute inset-0 bg-black/50" aria-hidden="true"></div>
    <div class="relative z-10 w-full max-w-sm bg-white rounded-lg shadow-xl dark:bg-gray-700 p-6">
        <h3 id="modal-playlist-confirm-title" class="text-base font-semibold text-gray-900 dark:text-white mb-2"></h3>
        <p id="modal-playlist-confirm-body" class="text-sm text-gray-600 dark:text-gray-300 mb-5"></p>
        <div class="flex justify-end gap-3">
            <button type="button" id="btn-playlist-confirm-cancel" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">
                <?= __( 'Cancel' ) ?>
            </button>
            <button type="button" id="btn-playlist-confirm-apply" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-800">
                <?= __( 'Apply' ) ?>
            </button>
        </div>
    </div>
</div>

<!-- Playlist media edit modal (v2.5.0 Slice A) -->
<div
  id="modal-media-edit"
  class="hidden fixed inset-0 z-[85] flex h-screen w-screen flex-col bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
  role="dialog"
  aria-modal="true"
  aria-hidden="true"
  aria-labelledby="modal-media-edit-title"
  tabindex="-1"
>
    <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-3 dark:border-gray-600">
        <h3 id="modal-media-edit-title" class="text-lg font-semibold"><?= __( 'Media Edit' ) ?></h3>
        <button
          type="button"
          id="btn-close-media-edit"
          class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white"
          aria-label="<?= __( 'Close' ) ?>"
        >
            <span class="ui-icon-mask ui-icon-mask--close w-3 h-3" aria-hidden="true"></span>
        </button>
    </div>
    <div class="flex-1 overflow-y-auto px-4 py-5">
        <div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
            <section class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/40">
                <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"><?= __( 'Selected item' ) ?></p>
                <h4 id="modal-media-edit-item-title" class="mt-1 text-2xl font-semibold leading-tight"></h4>
                <div id="modal-media-edit-item-source" class="mt-3 flex flex-wrap items-center gap-2" aria-live="polite"></div>
            </section>
            <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                <form id="form-media-edit" class="grid gap-4 md:grid-cols-2" autocomplete="off">
                    <div class="md:col-span-2">
                        <label for="modal-media-edit-category" class="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <span class="required" data-tooltip-target="tooltip-modal-media-edit-category-required"><?= __( 'Category' ) ?></span>
                            <div id="tooltip-modal-media-edit-category-required" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                                <?= __( 'Required' ) ?>
                                <div class="tooltip-arrow" data-popper-arrow></div>
                            </div>
                            <span class="text-xs font-normal text-gray-500 dark:text-gray-400"><?= __( '(max 100 chars)' ) ?></span>
                        </label>
                                                <div id="modal-media-edit-category-combobox" class="media-edit-category-combobox relative" role="combobox" aria-haspopup="listbox" aria-owns="modal-media-edit-category-options" aria-expanded="false">
                                                    <div data-media-edit-validation-group class="flex items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:border-gray-500 dark:bg-gray-800 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-900">
                                <input
                                  type="text"
                                  id="modal-media-edit-category"
                                                                    class="block min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                                  maxlength="100"
                                  autocomplete="off"
                                  aria-autocomplete="list"
                                  aria-controls="modal-media-edit-category-options"
                                >
                                                                <button
                                                                    type="button"
                                                                    id="btn-media-edit-category-clear"
                                                                    class="media-edit-category-clear hidden w-9 shrink-0 border-0 text-gray-500 hover:bg-transparent hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:text-gray-300 dark:hover:bg-transparent dark:hover:text-red-400 dark:focus:ring-blue-900"
                                                                    aria-label="<?= __( 'Clear category' ) ?>"
                                                                >
                                                                        <span class="ui-icon-mask ui-icon-mask--close m-auto h-3 w-3" aria-hidden="true"></span>
                                                                </button>
                                <button
                                  type="button"
                                  id="btn-media-edit-category-toggle"
                                  class="media-edit-category-toggle inline-flex w-9 shrink-0 items-center justify-center border-l border-gray-300 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-blue-900"
                                  aria-label="<?= __( 'Toggle category list' ) ?>"
                                  aria-expanded="false"
                                  aria-controls="modal-media-edit-category-options"
                                >
                                    <span class="ui-icon-mask ui-icon-mask--caret-down h-3 w-3" aria-hidden="true"></span>
                                </button>
                            </div>
                            <div id="modal-media-edit-category-dropdown" class="media-edit-category-dropdown hidden absolute z-20 mt-0 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800" role="presentation">
                                <div id="modal-media-edit-category-options" class="py-1" role="listbox" aria-label="<?= __( 'Category options' ) ?>"></div>
                            </div>
                            <p id="modal-media-edit-category-error" class="media-edit-field-error hidden" role="alert" aria-live="polite"></p>
                        </div>
                    </div>
                    <div class="md:col-span-2">
                        <label for="modal-media-edit-title-input" class="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <span class="required" data-tooltip-target="tooltip-modal-media-edit-title-required"><?= __( 'Title' ) ?></span>
                            <div id="tooltip-modal-media-edit-title-required" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                                <?= __( 'Required' ) ?>
                                <div class="tooltip-arrow" data-popper-arrow></div>
                            </div>
                            <span class="text-xs font-normal text-gray-500 dark:text-gray-400"><?= __( '(max 100 chars)' ) ?></span>
                        </label>
                                                <div data-media-edit-validation-group class="rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:border-gray-500 dark:bg-gray-800 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-900">
                                                        <input
                                                            type="text"
                                                            id="modal-media-edit-title-input"
                                                            class="block w-full rounded-lg border-0 bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                                                            maxlength="100"
                                                        >
                                                </div>
                                                <p id="modal-media-edit-title-input-error" class="media-edit-field-error hidden" role="alert" aria-live="polite"></p>
                    </div>
                    <div class="md:col-span-2">
                        <label for="modal-media-edit-artist-input" class="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <span><?= __( 'Artist' ) ?></span>
                            <span class="text-xs font-normal text-gray-500 dark:text-gray-400"><?= __( '(max 100 chars)' ) ?></span>
                        </label>
                        <input
                          type="text"
                          id="modal-media-edit-artist-input"
                          class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-500 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
                          maxlength="100"
                        >
                    </div>
                    <div class="md:col-span-2">
                        <label for="modal-media-edit-description" class="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <span><?= __( 'Description' ) ?></span>
                            <span class="text-xs font-normal text-gray-500 dark:text-gray-400"><?= __( '(max 1000 chars)' ) ?></span>
                        </label>
                        <textarea
                          id="modal-media-edit-description"
                          rows="5"
                          class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-500 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
                          maxlength="1000"
                        ></textarea>
                    </div>
                    <div>
                        <label for="modal-media-edit-volume" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            <?= __( 'Default playback volume' ) ?>
                        </label>
                        <div class="flex items-center gap-3">
                            <input
                              type="range"
                              id="modal-media-edit-volume"
                              min="0"
                              max="100"
                              step="1"
                              value="50"
                              class="volume-range h-2 flex-1 cursor-pointer appearance-none rounded-lg"
                            >
                            <span id="modal-media-edit-volume-value" class="w-8 shrink-0 text-right text-xs font-semibold text-blue-600 dark:text-blue-300">50</span>
                        </div>
                    </div>
                    <div id="modal-media-edit-youtube-advanced" class="hidden md:col-span-2">
                        <button
                          type="button"
                          id="btn-media-edit-youtube-advanced"
                          class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-blue-900"
                          aria-expanded="false"
                          aria-controls="modal-media-edit-youtube-advanced-panel"
                        >
                            <?= __( 'Advanced settings' ) ?>
                        </button>
                        <div id="modal-media-edit-youtube-advanced-panel" class="mt-3 hidden rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/60">
                            <div class="grid gap-3 md:grid-cols-2">
                                <label class="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-200">
                                    <span class="flex items-center gap-2">
                                        <input id="modal-media-edit-youtube-cc-override" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span><?= __( 'Caption display' ) ?></span>
                                    </span>
                                    <input id="modal-media-edit-youtube-cc" type="checkbox" class="h-5 w-9 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500">
                                </label>
                                <label class="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-200">
                                    <span class="flex items-center gap-2">
                                        <input id="modal-media-edit-youtube-fs-override" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span><?= __( 'Fullscreen button' ) ?></span>
                                    </span>
                                    <input id="modal-media-edit-youtube-fs" type="checkbox" class="h-5 w-9 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500">
                                </label>
                                <label class="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-200">
                                    <span class="flex items-center gap-2">
                                        <input id="modal-media-edit-youtube-controls-override" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span><?= __( 'Player controls' ) ?></span>
                                    </span>
                                    <input id="modal-media-edit-youtube-controls" type="checkbox" class="h-5 w-9 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500">
                                </label>
                                <label class="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-200">
                                    <span class="flex items-center gap-2">
                                        <input id="modal-media-edit-youtube-disablekb-override" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span><?= __( 'Disable keyboard controls' ) ?></span>
                                    </span>
                                    <input id="modal-media-edit-youtube-disablekb" type="checkbox" class="h-5 w-9 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500">
                                </label>
                            </div>
                        </div>
                    </div>
                    <div id="media-edit-thumbnail-section" class="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/60">
                        <div class="mb-2 flex items-center justify-between gap-2">
                            <h5 class="text-sm font-semibold text-gray-800 dark:text-gray-100"><?= __( 'Media thumbnail' ) ?></h5>
                            <div class="flex items-center gap-2">
                                <button type="button" id="btn-media-edit-thumbnail-pick" class="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-blue-900">
                                    <?= __( 'Choose image' ) ?>
                                </button>
                                <button type="button" id="btn-media-edit-thumbnail-remove" class="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-blue-900">
                                    <?= __( 'Remove' ) ?>
                                </button>
                            </div>
                        </div>
                        <input type="file" id="modal-media-edit-thumbnail-input" class="hidden" accept="image/png,image/jpeg,image/gif,image/webp">
                        <div class="flex items-center gap-3">
                            <div class="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900">
                                <img id="modal-media-edit-thumbnail-preview" class="h-full w-full object-cover" alt="<?= __( 'Thumbnail preview' ) ?>" src="" />
                                <button type="button" id="btn-media-edit-thumbnail-clear" class="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-black/65 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white" aria-label="<?= __( 'Remove thumbnail' ) ?>">
                                    <span class="ui-icon-mask ui-icon-mask--close w-3 h-3" aria-hidden="true"></span>
                                </button>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p id="modal-media-edit-thumbnail-name" class="text-sm font-medium text-gray-700 dark:text-gray-200"></p>
                                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400"><?= __( 'Drag and drop an image here, or choose an image file.' ) ?></p>
                                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400"><?= __( 'PNG, JPEG, GIF, and WebP are supported.' ) ?></p>
                            </div>
                        </div>
                    </div>
                    <div class="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/60">
                        <div class="mb-2 flex items-center justify-between gap-2">
                            <h5 class="text-sm font-semibold text-gray-800 dark:text-gray-100"><?= __( 'Media preview' ) ?></h5>
                            <button type="button" id="btn-media-edit-preview-retry" class="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-blue-900">
                                <?= __( 'Retry' ) ?>
                            </button>
                        </div>
                        <div id="modal-media-edit-preview" class="media-edit-preview-shell overflow-hidden rounded-lg border border-gray-200 p-2 dark:border-gray-600 min-h-[180px]">
                            <p class="media-edit-preview-empty text-sm"><?= __( 'Preview is not available.' ) ?></p>
                        </div>
                        <div id="modal-media-edit-preview-error" class="mt-2 hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/60 dark:bg-red-900/25 dark:text-red-200" role="alert" aria-live="polite">
                            <p id="modal-media-edit-preview-error-message"></p>
                        </div>
                        <div class="mt-3">
                            <p class="text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300"><?= __( 'Seek event timeline' ) ?></p>
                            <div id="modal-media-edit-seek-timeline" class="media-edit-seek-timeline" aria-live="polite">
                                <div id="modal-media-edit-seek-timeline-loading" class="media-edit-seek-timeline__loading hidden" aria-hidden="true">
                                    <span class="media-edit-seek-timeline__spinner" aria-hidden="true"></span>
                                    <span class="media-edit-seek-timeline__loading-text"><?= __( 'Loading duration...' ) ?></span>
                                </div>
                                <div class="media-edit-seek-timeline__fixed media-edit-seek-timeline__fixed--start" aria-hidden="true">
                                    <span class="media-edit-seek-timeline__fixed-dot"></span>
                                    <span id="modal-media-edit-seek-fixed-start-time" class="media-edit-seek-timeline__fixed-time">0:00</span>
                                </div>
                                <div class="media-edit-seek-timeline__fixed media-edit-seek-timeline__fixed--end" aria-hidden="true">
                                    <span class="media-edit-seek-timeline__fixed-dot"></span>
                                    <span id="modal-media-edit-seek-fixed-end-time" class="media-edit-seek-timeline__fixed-time">0:00</span>
                                </div>
                            <div class="media-edit-seek-timeline__rail" aria-hidden="true"></div>
                            <div id="modal-media-edit-seek-marker-start" class="media-edit-seek-marker media-edit-seek-marker--start hidden" aria-hidden="true">
                                <span id="modal-media-edit-seek-marker-start-time" class="media-edit-seek-marker__time">HH:MM:SS</span>
                            </div>
                            <div id="modal-media-edit-seek-marker-fadein-end" class="media-edit-seek-marker media-edit-seek-marker--fadein-end hidden" aria-hidden="true">
                                <span id="modal-media-edit-seek-marker-fadein-end-time" class="media-edit-seek-marker__time">HH:MM:SS</span>
                            </div>
                            <div id="modal-media-edit-seek-marker-fadeout-start" class="media-edit-seek-marker media-edit-seek-marker--fadeout-start hidden" aria-hidden="true">
                                <span id="modal-media-edit-seek-marker-fadeout-start-time" class="media-edit-seek-marker__time">HH:MM:SS</span>
                            </div>
                            <div id="modal-media-edit-seek-marker-end" class="media-edit-seek-marker media-edit-seek-marker--end hidden" aria-hidden="true">
                                <span id="modal-media-edit-seek-marker-end-time" class="media-edit-seek-marker__time">HH:MM:SS</span>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div class="md:col-span-2 grid gap-3 md:grid-cols-2">
                        <div class="flex flex-col">
                            <div class="md:flex md:flex-nowrap md:items-center md:justify-between">
                                <label for="modal-media-edit-seek-start" class="mb-1 block shrink-0 text-sm font-medium text-gray-700 dark:text-gray-200 md:mb-0 md:w-1/2"><span class="media-edit-seek-label media-edit-seek-label--start"><?= __( 'Seek start (sec)' ) ?></span></label>
                                <div data-media-edit-validation-group class="flex w-full md:w-auto overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:border-gray-500 dark:bg-gray-800 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-900">
                                <input
                                  type="number"
                                  id="modal-media-edit-seek-start"
                                  min="0"
                                  step="1"
                                  inputmode="numeric"
                                  class="media-edit-timing-input block min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                                >
                                <div class="media-edit-timing-stepper" role="group" aria-label="<?= __( 'Seek start adjust' ) ?>">
                                    <button type="button" class="media-edit-timing-stepper-btn" data-target="modal-media-edit-seek-start" data-step-dir="up" aria-label="<?= __( 'Increase seek start' ) ?>">
                                        <span class="ui-icon-mask ui-icon-mask--caret-up h-3 w-3" aria-hidden="true"></span>
                                    </button>
                                    <button type="button" class="media-edit-timing-stepper-btn" data-target="modal-media-edit-seek-start" data-step-dir="down" aria-label="<?= __( 'Decrease seek start' ) ?>">
                                        <span class="ui-icon-mask ui-icon-mask--caret-down h-3 w-3" aria-hidden="true"></span>
                                    </button>
                                </div>
                                <span id="modal-media-edit-seek-start-hms" class="media-edit-timing-display inline-flex min-w-[5.5rem] items-center justify-center px-2 text-xs font-medium text-gray-400 dark:text-gray-500">HH:MM:SS</span>
                                <button type="button" id="btn-media-edit-sync-seek-start" class="media-edit-timing-sync-btn shrink-0 px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:text-gray-200 dark:focus:ring-blue-900">
                                    <?= __( 'Sync' ) ?>
                                </button>
                                </div>
                            </div>
                            <p id="modal-media-edit-seek-start-error" class="media-edit-field-error media-edit-field-error--seek hidden w-full" role="alert" aria-live="polite"></p>
                        </div>
                        <div class="flex flex-col">
                            <div class="md:flex md:flex-nowrap md:items-center md:justify-between">
                                <label for="modal-media-edit-seek-end" class="mb-1 block shrink-0 text-sm font-medium text-gray-700 dark:text-gray-200 md:mb-0 md:w-1/2"><span class="media-edit-seek-label media-edit-seek-label--end"><?= __( 'Seek end (sec)' ) ?></span></label>
                                <div data-media-edit-validation-group class="flex w-full md:w-auto overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:border-gray-500 dark:bg-gray-800 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-900">
                                <input
                                  type="number"
                                  id="modal-media-edit-seek-end"
                                  min="0"
                                  step="1"
                                  inputmode="numeric"
                                  class="media-edit-timing-input block min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                                >
                                <div class="media-edit-timing-stepper" role="group" aria-label="<?= __( 'Seek end adjust' ) ?>">
                                    <button type="button" class="media-edit-timing-stepper-btn" data-target="modal-media-edit-seek-end" data-step-dir="up" aria-label="<?= __( 'Increase seek end' ) ?>">
                                        <span class="ui-icon-mask ui-icon-mask--caret-up h-3 w-3" aria-hidden="true"></span>
                                    </button>
                                    <button type="button" class="media-edit-timing-stepper-btn" data-target="modal-media-edit-seek-end" data-step-dir="down" aria-label="<?= __( 'Decrease seek end' ) ?>">
                                        <span class="ui-icon-mask ui-icon-mask--caret-down h-3 w-3" aria-hidden="true"></span>
                                    </button>
                                </div>
                                <span id="modal-media-edit-seek-end-hms" class="media-edit-timing-display inline-flex min-w-[5.5rem] items-center justify-center px-2 text-xs font-medium text-gray-400 dark:text-gray-500">HH:MM:SS</span>
                                <button type="button" id="btn-media-edit-sync-seek-end" class="media-edit-timing-sync-btn shrink-0 px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:text-gray-200 dark:focus:ring-blue-900">
                                    <?= __( 'Sync' ) ?>
                                </button>
                                </div>
                            </div>
                            <p id="modal-media-edit-seek-end-error" class="media-edit-field-error media-edit-field-error--seek hidden w-full" role="alert" aria-live="polite"></p>
                        </div>
                        <div class="flex flex-col">
                            <div class="md:flex md:flex-nowrap md:items-center md:justify-between">
                                <label for="modal-media-edit-fadein-end" class="mb-1 block shrink-0 text-sm font-medium text-gray-700 dark:text-gray-200 md:mb-0 md:w-1/2"><span class="media-edit-seek-label media-edit-seek-label--fadein-end"><?= __( 'Fade-in end (sec)' ) ?></span></label>
                                <div data-media-edit-validation-group class="flex w-full md:w-auto overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:border-gray-500 dark:bg-gray-800 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-900">
                                    <input
                                      type="number"
                                      id="modal-media-edit-fadein-end"
                                      min="0"
                                      step="1"
                                      inputmode="numeric"
                                      class="media-edit-timing-input block min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                                    >
                                    <div class="media-edit-timing-stepper" role="group" aria-label="<?= __( 'Fade-in end adjust' ) ?>">
                                        <button type="button" class="media-edit-timing-stepper-btn" data-target="modal-media-edit-fadein-end" data-step-dir="up" aria-label="<?= __( 'Increase fade-in end' ) ?>">
                                            <span class="ui-icon-mask ui-icon-mask--caret-up h-3 w-3" aria-hidden="true"></span>
                                        </button>
                                        <button type="button" class="media-edit-timing-stepper-btn" data-target="modal-media-edit-fadein-end" data-step-dir="down" aria-label="<?= __( 'Decrease fade-in end' ) ?>">
                                            <span class="ui-icon-mask ui-icon-mask--caret-down h-3 w-3" aria-hidden="true"></span>
                                        </button>
                                    </div>
                                    <span id="modal-media-edit-fadein-end-hms" class="media-edit-timing-display inline-flex min-w-[5.5rem] items-center justify-center px-2 text-xs font-medium text-gray-400 dark:text-gray-500">HH:MM:SS</span>
                                    <button type="button" id="btn-media-edit-sync-fadein-end" class="media-edit-timing-sync-btn shrink-0 px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:text-gray-200 dark:focus:ring-blue-900">
                                        <?= __( 'Sync' ) ?>
                                    </button>
                                </div>
                            </div>
                            <p id="modal-media-edit-fadein-end-error" class="media-edit-field-error media-edit-field-error--seek hidden w-full" role="alert" aria-live="polite"></p>
                        </div>
                        <div class="flex flex-col">
                            <div class="md:flex md:flex-nowrap md:items-center md:justify-between">
                                <label for="modal-media-edit-fadeout-start" class="mb-1 block shrink-0 text-sm font-medium text-gray-700 dark:text-gray-200 md:mb-0 md:w-1/2"><span class="media-edit-seek-label media-edit-seek-label--fadeout-start"><?= __( 'Fade-out start (sec)' ) ?></span></label>
                                <div data-media-edit-validation-group class="flex w-full md:w-auto overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:border-gray-500 dark:bg-gray-800 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-900">
                                    <input
                                      type="number"
                                      id="modal-media-edit-fadeout-start"
                                      min="0"
                                      step="1"
                                      inputmode="numeric"
                                      class="media-edit-timing-input block min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                                    >
                                    <div class="media-edit-timing-stepper" role="group" aria-label="<?= __( 'Fade-out start adjust' ) ?>">
                                        <button type="button" class="media-edit-timing-stepper-btn" data-target="modal-media-edit-fadeout-start" data-step-dir="up" aria-label="<?= __( 'Increase fade-out start' ) ?>">
                                            <span class="ui-icon-mask ui-icon-mask--caret-up h-3 w-3" aria-hidden="true"></span>
                                        </button>
                                        <button type="button" class="media-edit-timing-stepper-btn" data-target="modal-media-edit-fadeout-start" data-step-dir="down" aria-label="<?= __( 'Decrease fade-out start' ) ?>">
                                            <span class="ui-icon-mask ui-icon-mask--caret-down h-3 w-3" aria-hidden="true"></span>
                                        </button>
                                    </div>
                                    <span id="modal-media-edit-fadeout-start-hms" class="media-edit-timing-display inline-flex min-w-[5.5rem] items-center justify-center px-2 text-xs font-medium text-gray-400 dark:text-gray-500">HH:MM:SS</span>
                                    <button type="button" id="btn-media-edit-sync-fadeout-start" class="media-edit-timing-sync-btn shrink-0 px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:text-gray-200 dark:focus:ring-blue-900">
                                        <?= __( 'Sync' ) ?>
                                    </button>
                                </div>
                            </div>
                            <p id="modal-media-edit-fadeout-start-error" class="media-edit-field-error media-edit-field-error--seek hidden w-full" role="alert" aria-live="polite"></p>
                        </div>
                        <p class="md:col-span-2 text-xs text-gray-500 dark:text-gray-400"><?= __( 'Pressing Sync during media preview playback captures the seek position in seconds.' ) ?></p>
                        <p class="md:col-span-2 text-xs text-gray-500 dark:text-gray-400"><?= __( 'Each seek time setting is applied when &ldquo;Seek and play&rdquo; and &ldquo;Pseudo fader&rdquo; are enabled.' ) ?></p>
                    </div>
                </form>
            </section>
        </div>
    </div>
    <div class="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
        <div class="mx-auto flex w-full max-w-5xl justify-end gap-2">
            <button type="button" id="btn-cancel-media-edit" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">
                <?= __( 'Cancel' ) ?>
            </button>
            <button type="button" id="btn-save-media-edit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                <?= __( 'Save changes' ) ?>
            </button>
        </div>
    </div>
</div>
