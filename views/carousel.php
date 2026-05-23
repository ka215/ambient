<div
  id="carousel-container"
  class="relative w-full mt-0 md:mt-4 xl:mt-2 flex items-center justify-center gap-2"
  data-carousel="static"
>
  <button 
    id="data-carousel-prev"
    type="button"
    class="z-30 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center cursor-pointer group focus:outline-none"
    data-carousel-prev
    disabled
  >
    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full carousel-button-bg group-focus:outline-none">
      <span class="ui-icon-mask ui-icon-mask--chevron-left w-4 h-4 text-gray-100 dark:text-gray-900" aria-hidden="true"></span>
      <span class="sr-only"><?= __( 'Previous Item' ) ?></span>
    </span>
  </button>
  <div
    id="carousel-wrapper" 
    class="relative h-56 max-w-sm w-96 overflow-hidden rounded-lg md:h-64"
  >
    <div id="carousel-item-1" class="hidden h-full items-center justify-center duration-700 ease-in-out" data-carousel-item>
      <img src="views/images/ambient-placeholder.svg" class="block h-full max-w-full object-contain" alt="NO IMAGE">
    </div>
    <div id="carousel-item-2" class="hidden h-full items-center justify-center duration-700 ease-in-out" data-carousel-item>
      <img src="views/images/ambient-placeholder.svg" class="block h-full max-w-full object-contain" alt="NO IMAGE">
    </div>
  </div>
  <button 
    id="data-carousel-next"
    type="button"
    class="z-30 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center cursor-pointer group focus:outline-none"
    data-carousel-next
    disabled
  >
    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full carousel-button-bg group-focus:outline-none">
      <span class="ui-icon-mask ui-icon-mask--chevron-right w-4 h-4 text-gray-100 dark:text-gray-900" aria-hidden="true"></span>
      <span class="sr-only"><?= __( 'Next Item' ) ?></span>
    </span>
  </button>
</div><!-- /#carousel-container -->
