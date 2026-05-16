<div
  id="player-container" 
  class="flex flex-col items-center max-w-full w-full h-full mt-0 mx-auto mb-16 z-10 overflow-y-auto overflow-x-hidden"
>
    <?php amp_component( 'carousel' ); ?>
    <figure 
      class="w-full flex flex-col items-center gap-1 mt-4 mb-16 select-none"
    >
        <figcaption 
          id="media-caption"
          class="text-gray-900 text-lg font-normal dark:text-white max-w-full flex justify-center items-center gap-2 mb-2 whitespace-nowrap overflow-hidden"
        >
        </figcaption>
        <div 
          id="embed-wrapper"
          class="flex justify-center w-full h-0 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded-lg overflow-hidden transition-all duration-150 ease-out opacity-0"
        >
        </div>
        <div 
          id="optional-container"
          class="hidden my-4 transition-all duration-150 ease-out opacity-0"
        >
            <a 
              id="btn-watch-origin"
              href="#"
              target="_blank"
              class="inline-flex items-center gap-2 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full text-sm leading-5 px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-opacity duration-500 ease-in-out"
              aria-label="<?= __( 'Watch on YouTube' ) ?>"
              disabled
            >
                <span class="ui-icon-mask ui-icon-mask--youtube w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true"></span>
                <span class="watch-origin-label"><?= __( 'Watch on YouTube' ) ?></span>
            </a>
        </div>
    </figure>
</div><!-- /#player-container -->
