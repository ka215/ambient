<div
  id="carousel-container"
  class="relative w-full mt-4 flex items-center justify-center gap-2"
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
      <svg class="w-4 h-4 text-gray-100 dark:text-gray-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4"/>
      </svg>
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
      <svg class="w-4 h-4 text-gray-100 dark:text-gray-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
      </svg>
      <span class="sr-only"><?= __( 'Next Item' ) ?></span>
    </span>
  </button>
</div><!-- /#carousel-container -->
