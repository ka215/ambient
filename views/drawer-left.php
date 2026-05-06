<div 
  id="drawer-playlist"
  class="fixed top-0 left-0 z-50 h-screen overflow-y-auto transition-transform -translate-x-full bg-white border-r border-gray-200 w-80 dark:bg-gray-800 dark:border-gray-600 dark:text-white shadow dark:shadow-md"
  tabindex="-1"
  aria-labelledby="drawer-playlist-label"
>
    <div class="p-4 fixed top-0 left-0 z-auto w-80 h-14 flex flex-nowrap justify-between items-center bg-white border-r border-b dark:bg-gray-800 dark:border-gray-600">
        <h5 id="drawer-playlist-label" class="inline-flex items-center text-base font-semibold text-gray-500 dark:text-white text-rotate-0">
            <svg class="w-5 h-5 text-gray-500 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-500 text-rotate-0" aria-hidden="true" aria-label="play-list" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 16">
                <path d="M14.316.051A1 1 0 0 0 13 1v8.473A4.49 4.49 0 0 0 11 9c-2.206 0-4 1.525-4 3.4s1.794 3.4 4 3.4 4-1.526 4-3.4a2.945 2.945 0 0 0-.067-.566c.041-.107.064-.22.067-.334V2.763A2.974 2.974 0 0 1 16 5a1 1 0 0 0 2 0C18 1.322 14.467.1 14.316.051ZM10 3H1a1 1 0 0 1 0-2h9a1 1 0 1 1 0 2Z"/>
                <path d="M10 7H1a1 1 0 0 1 0-2h9a1 1 0 1 1 0 2Zm-5 4H1a1 1 0 0 1 0-2h4a1 1 0 1 1 0 2Z"/>
            </svg>
            <span class="ml-2 text-rotate-0"><?= __( 'Playlist' ) ?></span>
        </h5>
        <div class="absolute top-2.5 right-12">
            <button
              type="button"
              id="btn-playlist-mode"
              class="inline-flex items-center justify-center w-8 h-8 text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
              aria-haspopup="true"
              aria-expanded="false"
              data-label-normal="<?= __( 'Normal' ) ?>"
              data-label-edit="<?= __( 'Edit' ) ?>"
              data-label-reorder="<?= __( 'Reorder' ) ?>"
              data-label-delete="<?= __( 'Delete' ) ?>"
              data-label-mode="<?= __( 'Mode' ) ?>"
              data-confirm-delete-title="<?= __( 'Delete selected items?' ) ?>"
              data-confirm-delete-body="<?= __( 'Selected items will be removed from your playlist.' ) ?>"
            >
                <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.75 4.75a1.25 1.25 0 1 1 2.5 0v.72a6.2 6.2 0 0 1 1.9.79l.5-.5a1.25 1.25 0 0 1 1.77 1.77l-.5.5c.34.6.6 1.24.78 1.9h.72a1.25 1.25 0 1 1 0 2.5h-.72a6.2 6.2 0 0 1-.79 1.9l.5.5a1.25 1.25 0 0 1-1.77 1.77l-.5-.5a6.2 6.2 0 0 1-1.9.78v.72a1.25 1.25 0 1 1-2.5 0v-.72a6.2 6.2 0 0 1-1.9-.79l-.5.5a1.25 1.25 0 1 1-1.77-1.77l.5-.5a6.2 6.2 0 0 1-.78-1.9h-.72a1.25 1.25 0 1 1 0-2.5h.72a6.2 6.2 0 0 1 .79-1.9l-.5-.5a1.25 1.25 0 0 1 1.77-1.77l.5.5c.6-.34 1.24-.6 1.9-.78v-.72Z"/>
                    <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span class="sr-only"><?= __( 'Mode' ) ?></span>
            </button>
            <span
              id="playlist-mode-badge"
              class="hidden absolute -top-2 left-full ml-1 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white bg-blue-600 rounded"
            ></span>
            <div
              id="playlist-mode-menu"
              class="hidden absolute top-10 right-0 z-20 min-w-[128px] bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-700 dark:border-gray-600"
              role="menu"
              aria-label="<?= __( 'Mode' ) ?>"
            >
                <button type="button" class="playlist-mode-option block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600" data-mode="normal" role="menuitem"><?= __( 'Normal' ) ?></button>
                <button type="button" class="playlist-mode-option block w-full px-3 py-2 text-left text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed" data-mode="edit" role="menuitem" disabled aria-disabled="true"><?= __( 'Edit' ) ?></button>
                <button type="button" class="playlist-mode-option block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600" data-mode="reorder" role="menuitem"><?= __( 'Reorder' ) ?></button>
                <button type="button" class="playlist-mode-option block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600" data-mode="delete" role="menuitem"><?= __( 'Delete' ) ?></button>
            </div>
        </div>
        <button 
          type="button"
          id="btn-close-playlist"
          data-drawer-hide="drawer-playlist"
          aria-controls="drawer-playlist"
          class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 absolute top-2.5 right-2.5 inline-flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white"
        >
            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
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
                <svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                </svg>
                <?= __( 'Register media' ) ?>
            </button>
        </div>
    </div>
</div><!-- /#drawer-playlist -->

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