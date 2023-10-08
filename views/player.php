<div
  id="player-container" 
  class="flex flex-col items-center w-full h-full mt-0 mx-auto mb-16 z-10 overflow-y-auto overflow-x-hidden"
>
    <?= amp_component( 'carousel' ); ?>
    <figure 
      class="flex flex-col items-center gap-1 mt-4 mb-16"
    >
        <figcaption 
          id="media-caption"
          class="text-lg font-normal flex justify-center items-center gap-2"
        >
        </figcaption>
        <div 
          id="embed-wrapper"
          class="flex justify-center w-full h-0 border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out opacity-0"
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
              class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
              disabled
            >
                <?= __( 'Watch on YouTube' ) ?>
                <svg class="inline-block -mt-0.5 w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" aria-label="external-link" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"/>
                </svg>
            </a>
        </div>
    </figure>
<?php /*
    <figure class="flex flex-col items-center gap-1 mt-4 mb-16">
        <div class="flex flex-row justify-around items-center gap-4 w-full">
            <button type="button" id="btn-prev" class="text-white bg-blue-300 hover:bg-blue-500 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                <svg class="w-5 h-5 text-white" aria-hidden="true" aria-label="previous-item" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 14">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 1 1.3 6.326a.91.91 0 0 0 0 1.348L7 13"/>
                </svg>
                <span class="sr-only"><?= __( 'Previous Item' ) ?></span>
            </button>
<?php if ( $image_src ): ?>
            <img src="<?= $image_src ?>" class="image-elm w-56 md:w-64 h-auto rounded-lg select-none pointer-events-none" />
<?php else: ?>
            <div
              style="background-image: url('<?= $thumb_url ?>');"
              class="image-elm w-56 md:w-96 h-28 md:h-52 rounded-lg bg-no-repeat bg-cover bg-center select-none pointer-events-none"
            ></div>
<?php endif; ?>
            <button type="button" id="btn-next" class="text-white bg-blue-300 hover:bg-blue-500 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                <svg class="w-5 h-5 text-white" aria-hidden="true" aria-label="next-item" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 14">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 13 5.7-5.326a.909.909 0 0 0 0-1.348L1 1"/>
                </svg>
                <span class="sr-only"><?= __( 'Next Item' ) ?></span>
            </button>
        </div>
        <figcaption 
          class="text-lg font-normal flex justify-center items-center gap-2"
        >
            <?php if ( !empty( $one_media['artist'] ) ): ?><span class="text--artist"><?= $one_media['artist'] ?></span><?php endif; ?>
            <?php if ( !empty( $one_media['title'] ) ): ?><span class="text--title"><?= $one_media['title'] ?></span><?php endif; ?>
            <?php if ( !empty( $one_media['desc'] ) ): ?><span class="text--desc"><?= $one_media['desc'] ?></span><?php endif; ?>
        </figcaption>
<?php if ( $output_player == 1 ): ?>
        <audio
          controls
          controlslist="nodownload"
          autoplay
        >
            <source src="<?= $media_src ?>" type="audio/mp3" />
        </audio>
<?php elseif ( $output_player == 2 ): ?>
        <div id="embed-wrapper" class="flex justify-center w-full h-0 border border-gray-500 rounded-lg overflow-hidden opacity-0 transition-all">
            <div id="ytplayer"></div>
        </div>
<?php   if ( !empty( $origin_url ) ): ?>
        <div class="my-4">
            <a href="<?= $origin_url ?>" target="_blank"
              class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
            >
                <?= __( 'Watch on YouTube' ) ?>
                <svg class="inline-block -mt-0.5 w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" aria-label="external-link" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"/>
                </svg>
            </a>
        </div>
<?php   endif; ?>
<?php else: ?>
        <div class="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
            <span class="font-medium"><?= __( 'Error!' ) ?></span> <?= __( 'Media data could not be retrieved.' ) ?>
        </div>
<?php endif; ?>
    </figure>
*/ ?>
</div><!-- /#player-container -->
