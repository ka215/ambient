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
            <span class="ui-icon-mask ui-icon-mask--playlist w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="play-list"></span>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Playlist' ) ?></span>
        </button>
        <button 
          id="btn-refresh"
          type="button"
          class="inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
        >
            <span class="ui-icon-mask ui-icon-mask--refresh w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="refresh"></span>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Refresh' ) ?></span>
        </button>
          <button 
            id="btn-window-full"
            type="button"
            class="inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
            aria-pressed="false"
          >
            <span class="icon-window-expand ui-icon-mask ui-icon-mask--window-expand w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="window-expand"></span>
            <span class="icon-window-minimize hidden ui-icon-mask ui-icon-mask--window-minimize w-5 h-5 mb-2 text-blue-600 dark:text-blue-500" aria-hidden="true" aria-label="window-minimize"></span>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Window' ) ?></span>
          </button>
        <button 
          id="btn-play"
          type="button" 
          class="inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
          disabled
        >
            <span class="ui-icon-mask ui-icon-mask--play w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="media-play"></span>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Play' ) ?></span>
        </button>
        <button 
          id="btn-pause"
          type="button" 
          class="hidden inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
          disabled
        >
            <span class="ui-icon-mask ui-icon-mask--pause w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="media-pause"></span>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Pause' ) ?></span>
        </button>
          <button 
            id="btn-menu-collapse"
            type="button"
            class="inline-flex flex-col items-center justify-center px-5 border-r border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group dark:border-gray-600"
            aria-pressed="false"
          >
            <span class="icon-menu-compress ui-icon-mask ui-icon-mask--menu-compress w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="menu-compress"></span>
            <span class="icon-menu-expand hidden ui-icon-mask ui-icon-mask--menu-expand w-5 h-5 mb-2 text-blue-600 dark:text-blue-500" aria-hidden="true" aria-label="menu-expand"></span>
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
            <span class="ui-icon-mask ui-icon-mask--settings w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="settings"></span>
            <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"><?= __( 'Settings' ) ?></span>
        </button>
        <button 
          id="btn-options"
          type="button"
          class="inline-flex flex-col items-center justify-center px-5 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 group border-x dark:border-gray-600"
        >
            <span class="ui-icon-mask ui-icon-mask--options-dots w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="other-options"></span>
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
            <span class="ui-icon-mask ui-icon-mask--playlist w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="play-list"></span>
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
            <span class="ui-icon-mask ui-icon-mask--refresh w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="refresh"></span>
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
            <span class="icon-window-expand ui-icon-mask ui-icon-mask--window-expand w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="window-expand"></span>
            <span class="icon-window-minimize hidden ui-icon-mask ui-icon-mask--window-minimize w-5 h-5 mb-1 text-blue-600 dark:text-blue-500" aria-hidden="true" aria-label="window-minimize"></span>
            <span class="sr-only"><?= __( 'Expand to fill window' ) ?></span>
          </button>
          <div 
            id="tooltip-window-full" 
            role="tooltip" 
            class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
          >
            <?= __( 'Expand to fill window' ) ?>
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
                <span class="ui-icon-mask ui-icon-mask--play w-4 h-4 text-white" aria-label="media-play" aria-hidden="true"></span>
                <span class="sr-only"><?= __( 'Play' ) ?></span>
            </button>
            <button 
              id="btn-pause"
              type="button" 
              class="hidden inline-flex items-center justify-center w-10 h-10 font-medium bg-blue-600 rounded-full hover:bg-blue-700 group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800"
              data-tooltip-target="tooltip-pause" 
              disabled
            >
                <span class="ui-icon-mask ui-icon-mask--pause w-4 h-4 text-white" aria-label="media-pause" aria-hidden="true"></span>
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
            <span class="icon-menu-compress ui-icon-mask ui-icon-mask--menu-compress w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="menu-compress"></span>
            <span class="icon-menu-expand hidden ui-icon-mask ui-icon-mask--menu-expand w-5 h-5 mb-1 text-blue-600 dark:text-blue-500" aria-hidden="true" aria-label="menu-expand"></span>
            <span class="sr-only"><?= __( 'Menu Minimize' ) ?></span>
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
            <span class="ui-icon-mask ui-icon-mask--options-panel w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="other-options"></span>
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
            <span class="ui-icon-mask ui-icon-mask--settings w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" aria-hidden="true" aria-label="settings"></span>
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
