<div 
  id="drawer-playlist"
  class="fixed top-0 left-0 z-50 h-screen overflow-y-auto transition-transform -translate-x-full bg-white border-r border-gray-200 w-80 dark:bg-gray-800 dark:border-gray-600 dark:text-white shadow"
  tabindex="-1"
  aria-labelledby="drawer-playlist-label"
>
    <div class="p-4 fixed top-0 left-0 z-auto w-80 h-14 flex flex-nowrap justify-between items-center bg-white border-r border-b dark:bg-gray-800">
        <h5 id="drawer-playlist-label" class="inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400 text-rotate-0">
            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500 text-rotate-0" aria-hidden="true" aria-label="play-list" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 16">
                <path d="M14.316.051A1 1 0 0 0 13 1v8.473A4.49 4.49 0 0 0 11 9c-2.206 0-4 1.525-4 3.4s1.794 3.4 4 3.4 4-1.526 4-3.4a2.945 2.945 0 0 0-.067-.566c.041-.107.064-.22.067-.334V2.763A2.974 2.974 0 0 1 16 5a1 1 0 0 0 2 0C18 1.322 14.467.1 14.316.051ZM10 3H1a1 1 0 0 1 0-2h9a1 1 0 1 1 0 2Z"/>
                <path d="M10 7H1a1 1 0 0 1 0-2h9a1 1 0 1 1 0 2Zm-5 4H1a1 1 0 0 1 0-2h4a1 1 0 1 1 0 2Z"/>
            </svg>
            <span class="ml-2 text-rotate-0"><?= __( 'Playlist' ) ?></span>
        </h5>
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
        <div id="no-media" class="flex w-full h-full justify-center items-center text-base text-gray-500"><?= __( 'No media available.' ) ?></div>
    </div>
</div><!-- /#drawer-playlist -->