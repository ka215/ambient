<div
  id="carousel-container"
  class="relative w-full mt-10 flex justify-center"
  data-carousel="static"
>
    <button 
      id="data-carousel-prev"
      type="button"
      class="relative top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
      data-carousel-prev
      disabled
    >
        <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray/30 dark:bg-white/30 group-hover:bg-blue-200/50 dark:group-hover:bg-white/60 group-focus:outline-none">
            <svg class="w-4 h-4 text-gray-400 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4"/>
            </svg>
            <span class="sr-only"><?= __( 'Previous Item' ) ?></span>
        </span>
    </button>
    <div
      id="carousel-wrapper" 
      class="relative h-56 max-w-sm w-96 overflow-hidden rounded-lg md:h-64"
    >
        <div id="carousel-item-1" class="hidden duration-700 ease-in-out" data-carousel-item>
            <img src="views/images/no-media-placeholder.svg" class="absolute block h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
        </div>
        <div id="carousel-item-2" class="hidden duration-700 ease-in-out" data-carousel-item>
            <img src="views/images/no-media-placeholder.svg" class="absolute block h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
        </div>
    </div>
    <button 
      id="data-carousel-next"
      type="button"
      class="disabled relative top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
      data-carousel-next
      disabled
    >
        <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray/30 dark:bg-white/30 group-hover:bg-blue-200/50 dark:group-hover:bg-white/60 group-focus:outline-none">
            <svg class="w-4 h-4 text-gray-400 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
            </svg>
            <span class="sr-only"><?= __( 'Next Item' ) ?></span>
        </span>
    </button>
</div><!-- /#carousel-container -->
