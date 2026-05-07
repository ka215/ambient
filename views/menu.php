<?php
if ( $this->menu_type == 1 ) {
?>
<div 
  id="menu-container"
  class="fixed bottom-0 left-0 right-0 mx-auto z-40 w-96 max-w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200 ease-out"
>
    <div
      class="grid h-full w-full grid-cols-7 mx-auto font-medium"
    >
        <button 
          id="btn-playlist"
          type="button"
          class="inline-flex flex-col items-center justify-center px-4 border-gray-200 border-x hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
          data-drawer-target="drawer-playlist"
          data-drawer-toggle="drawer-playlist"
          data-drawer-placement="left"
          aria-controls="drawer-playlist"
        >
            <svg class="w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="play-list" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 16">
                <path d="M14.316.051A1 1 0 0 0 13 1v8.473A4.49 4.49 0 0 0 11 9c-2.206 0-4 1.525-4 3.4s1.794 3.4 4 3.4 4-1.526 4-3.4a2.945 2.945 0 0 0-.067-.566c.041-.107.064-.22.067-.334V2.763A2.974 2.974 0 0 1 16 5a1 1 0 0 0 2 0C18 1.322 14.467.1 14.316.051ZM10 3H1a1 1 0 0 1 0-2h9a1 1 0 1 1 0 2Z"/>
                <path d="M10 7H1a1 1 0 0 1 0-2h9a1 1 0 1 1 0 2Zm-5 4H1a1 1 0 0 1 0-2h4a1 1 0 1 1 0 2Z"/>
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Playlist' ) ?></span>
        </button>
        <button 
          id="btn-refresh"
          type="button"
          class="inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
        >
            <svg class="w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="refresh" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 1v5h-5M2 19v-5h5m10-4a8 8 0 0 1-14.947 3.97M1 10a8 8 0 0 1 14.947-3.97"/>
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Refresh' ) ?></span>
        </button>
          <button 
            id="btn-window-full"
            type="button"
            class="inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
            aria-pressed="false"
          >
            <svg class="icon-window-expand w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="window-expand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H4m0 0v4m0-4 5 5m7-5h4m0 0v4m0-4-5 5M8 20H4m0 0v-4m0 4 5-5m7 5h4m0 0v-4m0 4-5-5"/>
            </svg>
            <svg class="icon-window-minimize hidden w-5 h-5 mb-2 text-blue-600 dark:text-blue-500" aria-hidden="true" aria-label="window-minimize" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 9h4m0 0V5m0 4L4 4m15 5h-4m0 0V5m0 4 5-5M5 15h4m0 0v4m0-4-5 5m15-5h-4m0 0v4m0-4 5 5"/>
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Window' ) ?></span>
          </button>
        <button 
          id="btn-play"
          type="button" 
          class="inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
          disabled
        >
            <svg class="w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="media-play" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 14 16">
                <path d="M0 .984v14.032a1 1 0 0 0 1.506.845l12.006-7.016a.974.974 0 0 0 0-1.69L1.506.139A1 1 0 0 0 0 .984Z"/>
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Play' ) ?></span>
        </button>
        <button 
          id="btn-pause"
          type="button" 
          class="hidden inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
          disabled
        >
            <svg class="w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="media-pause" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 12 16">
                <path d="M3 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm7 0H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Z"/>
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Pause' ) ?></span>
        </button>
          <button 
            id="btn-menu-collapse"
            type="button"
            class="inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
            aria-pressed="false"
          >
            <svg class="icon-menu-compress w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="menu-compress" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h4V4m12 4h-4V4M4 16h4v4m12-4h-4v4"/>
            </svg>
            <svg class="icon-menu-expand hidden w-5 h-5 mb-2 text-blue-600 dark:text-blue-500" aria-hidden="true" aria-label="menu-expand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 7h6m0 0V1m0 6L1 1m16 10h-6m0 0v6m0-6 6 6"/>
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Menu' ) ?></span>
          </button>
        <button 
          id="btn-settings"
          type="button"
          class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
          data-drawer-target="drawer-settings"
          data-drawer-toggle="drawer-settings"
          data-drawer-placement="right"
          aria-controls="drawer-settings"
        >
            <svg class="w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="settings" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"/>
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Settings' ) ?></span>
        </button>
        <button 
          id="btn-options"
          type="button"
          class="inline-flex flex-col items-center justify-center px-5 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group border-x dark:border-gray-600"
        >
            <svg class="w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="other-options" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 3">
                <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"/>
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Options' ) ?></span>
        </button>
    </div>
</div><!-- /#menu-container -->
<?php 
} else {
?>
<div 
  id="menu-container"
  class="fixed z-40 w-full h-16 max-w-lg left-0 right-0 mx-auto bg-white border border-gray-200 rounded-full bottom-4 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200 ease-out"
>
    <div class="grid h-full max-w-lg grid-cols-7 mx-auto">
        <button 
          id="btn-playlist"
          type="button" 
          class="inline-flex flex-col items-center justify-center px-5 rounded-l-full hover:bg-gray-50 dark:hover:bg-gray-800 group"
          data-tooltip-target="tooltip-playlist" 
          data-drawer-target="drawer-playlist"
          data-drawer-toggle="drawer-playlist"
          data-drawer-placement="left"
          aria-controls="drawer-playlist"
        >
            <svg class="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="play-list" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 16">
                <path d="M14.316.051A1 1 0 0 0 13 1v8.473A4.49 4.49 0 0 0 11 9c-2.206 0-4 1.525-4 3.4s1.794 3.4 4 3.4 4-1.526 4-3.4a2.945 2.945 0 0 0-.067-.566c.041-.107.064-.22.067-.334V2.763A2.974 2.974 0 0 1 16 5a1 1 0 0 0 2 0C18 1.322 14.467.1 14.316.051ZM10 3H1a1 1 0 0 1 0-2h9a1 1 0 1 1 0 2Z"/>
                <path d="M10 7H1a1 1 0 0 1 0-2h9a1 1 0 1 1 0 2Zm-5 4H1a1 1 0 0 1 0-2h4a1 1 0 1 1 0 2Z"/>
            </svg>
            <span class="sr-only"><?= __( 'Playlist' ) ?></span>
        </button>
        <div 
          id="tooltip-playlist" 
          role="tooltip" 
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
            <?= __( 'Playlist' ) ?>
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button 
          id="btn-refresh"
          type="button" 
          class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
          data-tooltip-target="tooltip-refresh" 
        >
            <svg class="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="refresh" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 1v5h-5M2 19v-5h5m10-4a8 8 0 0 1-14.947 3.97M1 10a8 8 0 0 1 14.947-3.97"/>
            </svg>
            <span class="sr-only"><?= __( 'Refresh' ) ?></span>
        </button>
        <div 
          id="tooltip-refresh" 
          role="tooltip" 
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
            <?= __( 'Refresh' ) ?>
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
          <button 
            id="btn-window-full"
            type="button" 
            class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
            data-tooltip-target="tooltip-window-full" 
            aria-pressed="false"
          >
            <svg class="icon-window-expand w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="window-expand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H4m0 0v4m0-4 5 5m7-5h4m0 0v4m0-4-5 5M8 20H4m0 0v-4m0 4 5-5m7 5h4m0 0v-4m0 4-5-5"/>
            </svg>
            <svg class="icon-window-minimize hidden w-5 h-5 mb-1 text-blue-600 dark:text-blue-500" aria-hidden="true" aria-label="window-minimize" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 9h4m0 0V5m0 4L4 4m15 5h-4m0 0V5m0 4 5-5M5 15h4m0 0v4m0-4-5 5m15-5h-4m0 0v4m0-4 5 5"/>
            </svg>
            <span class="sr-only"><?= __( 'Window Fullscreen' ) ?></span>
          </button>
          <div 
            id="tooltip-window-full" 
            role="tooltip" 
            class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
          >
            <?= __( 'Window フル表示' ) ?>
            <div class="tooltip-arrow" data-popper-arrow></div>
          </div>
        <div class="flex items-center justify-center">
            <button 
              id="btn-play"
              type="button" 
              class="inline-flex items-center justify-center w-10 h-10 font-medium bg-blue-600 rounded-full hover:bg-blue-700 group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800"
              data-tooltip-target="tooltip-play" 
              disabled
            >
                <svg class="w-4 h-4 text-white" aria-label="media-play" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 14 16">
                    <path d="M0 .984v14.032a1 1 0 0 0 1.506.845l12.006-7.016a.974.974 0 0 0 0-1.69L1.506.139A1 1 0 0 0 0 .984Z"/>
                </svg>
                <span class="sr-only"><?= __( 'Play' ) ?></span>
            </button>
            <button 
              id="btn-pause"
              type="button" 
              class="hidden inline-flex items-center justify-center w-10 h-10 font-medium bg-blue-600 rounded-full hover:bg-blue-700 group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800"
              data-tooltip-target="tooltip-pause" 
              disabled
            >
                <svg class="w-4 h-4 text-white" aria-label="media-pause" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 12 16">
                    <path d="M3 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm7 0H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Z"/>
                </svg>
                <span class="sr-only"><?= __( 'Pause' ) ?></span>
            </button>
        </div>
        <div 
          id="tooltip-play" 
          role="tooltip" 
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
            <?= __( 'Play' ) ?>
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <div 
          id="tooltip-pause" 
          role="tooltip" 
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
            <?= __( 'Pause' ) ?>
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button 
          id="btn-menu-collapse"
          type="button" 
          class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
          data-tooltip-target="tooltip-menu-collapse" 
          aria-pressed="false"
        >
            <svg class="icon-menu-compress w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="menu-compress" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h4V4m12 4h-4V4M4 16h4v4m12-4h-4v4"/>
            </svg>
            <svg class="icon-menu-expand hidden w-5 h-5 mb-1 text-blue-600 dark:text-blue-500" aria-hidden="true" aria-label="menu-expand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 7h6m0 0V1m0 6L1 1m16 10h-6m0 0v6m0-6 6 6"/>
            </svg>
            <span class="sr-only"><?= __( 'Minimize Menu' ) ?></span>
        </button>
        <div 
          id="tooltip-menu-collapse" 
          role="tooltip" 
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
            <?= __( 'Menu Minimize' ) ?>
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button 
          id="btn-options"
          type="button" 
          class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
          data-tooltip-target="tooltip-options" 
        >
            <svg class="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="other-options" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 11.5h13m-13 0V18a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-6.5m-13 0V9a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v2.5M9 5h11a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1"/>
            </svg>
            <span class="sr-only"><?= __( 'Options' ) ?></span>
        </button>
        <div 
          id="tooltip-options" 
          role="tooltip" 
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
            <?= __( 'Options' ) ?>
            <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
          <button 
            id="btn-settings"
            type="button" 
            class="inline-flex flex-col items-center justify-center px-5 rounded-r-full hover:bg-gray-50 dark:hover:bg-gray-800 group"
            data-tooltip-target="tooltip-settings" 
            data-drawer-target="drawer-settings"
            data-drawer-toggle="drawer-settings"
            data-drawer-placement="right"
            aria-controls="drawer-settings"
          >
            <svg class="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="settings" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"/>
            </svg>
            <span class="sr-only"><?= __( 'Settings' ) ?></span>
          </button>
          <div 
            id="tooltip-settings" 
            role="tooltip" 
            class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
          >
            <?= __( 'Settings' ) ?>
            <div class="tooltip-arrow" data-popper-arrow></div>
          </div>
    </div>
</div><!-- /#menu-container -->
<?php 
}
