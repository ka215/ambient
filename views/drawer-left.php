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
