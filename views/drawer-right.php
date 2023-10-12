<div 
  id="drawer-settings"
  class="fixed top-0 right-0 z-50 h-screen overflow-y-auto transition-transform translate-x-full bg-white border-l border-gray-200 w-80 dark:bg-gray-800 dark:border-gray-600 dark:text-white shadow dark:shadow-md"
  tabindex="-1"
  aria-labelledby="drawer-settings-label"
>
    <div class="p-4 fixed top-0 right-0 z-auto w-80 h-14 flex flex-nowrap justify-between items-center bg-white border-r border-b dark:bg-gray-800 dark:border-gray-600">
        <h5 id="drawer-settings-label" class="inline-flex items-center text-base font-semibold text-gray-500 dark:text-white text-rotate-0">
            <svg class="w-5 h-5 mr-2.5 text-gray-500 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-500 text-rotate-0" aria-hidden="true" aria-label="settings" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"/>
            </svg>
            <span class="ml-2 text-rotate-0"><?= __( 'Settings' ) ?></span>
        </h5>
        <button 
          type="button"
          id="btn-close-settings"
          data-drawer-hide="drawer-settings"
          aria-controls="drawer-settings"
          class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 absolute top-2.5 right-2.5 inline-flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white"
        >
            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
            <span class="sr-only"><?= __( 'Close Settings' ) ?></span>
        </button>
    </div>
    <div 
      class="w-full mt-14 mb-16 overflow-y-auto text-sm font-normal text-gray-900 bg-white border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      style="height: calc(100vh - <?php if ( $this->menu_type == 1 ): ?>120<?php else: ?>136<?php endif; ?>px);"
    >
        <div class="p-4">
            <label for="current-playlist" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"><?= __( 'Current Playlist' ) ?></label>
            <select id="current-playlist" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                <option disabled selected><?= __( 'Choose a playlist' ) ?></option>
<?php if ( !empty( $this->playlists ) ): foreach ( $this->playlists as $filename => $filepath ): ?>
                <option value="<?= $filename ?>"<?php if ( count( $this->playlists ) == 1 ): ?> selected<?php endif; ?>><?= $filename ?></option>
<?php endforeach; endif; ?>
            </select>
        </div>
        <div class="p-4">
            <label for="target-category" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"><?= __( 'Target Category' ) ?></label>
            <select id="target-category" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" disabled>
                <option id="all-category" value="-1" disabled selected><?= __( 'All categories' ) ?></option>
            </select>
        </div>
        <div class="p-4">
            <label id="toggle-randomly" class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300" disabled><?= __( 'Randomly play' ) ?></span>
            </label>
        </div>
        <div class="p-4">
            <label id="toggle-seekplay" class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300" disabled><?= __( 'Seek and play' ) ?></span>
            </label>
        </div>
        <div class="p-4">
            <label id="toggle-darkmode" class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300" disabled><?= __( 'Dark mode' ) ?></span>
            </label>
        </div>
    </div>
</div><!-- /#drawer-settings -->