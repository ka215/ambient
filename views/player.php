<div
  id="player-container" 
  class="flex flex-col items-center max-w-full w-full h-full mt-0 mx-auto mb-16 z-10 overflow-y-auto overflow-x-hidden"
>
    <?= amp_component( 'carousel' ); ?>
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
              class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-opacity duration-500 ease-in-out"
              disabled
            >
                <?= __( 'Watch on YouTube' ) ?>
                <svg class="inline-block -mt-0.5 w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" aria-label="external-link" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"/>
                </svg>
            </a>
        </div>
    </figure>
</div><!-- /#player-container -->
