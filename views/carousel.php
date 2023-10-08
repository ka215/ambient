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
        <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray/30 dark:bg-white/30 group-hover:bg-gray/50 dark:group-hover:bg-white/60 group-focus:ring-4 group-focus:ring-gray-400 dark:group-focus:ring-white/70 group-focus:outline-none">
            <svg class="w-4 h-4 text-gray-400 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4"/>
            </svg>
            <span class="sr-only"><?= __( 'Previous Item' ) ?></span>
        </span>
    </button>
    <div
      id="carousel-wrapper" 
      class="relative h-56 w-96 overflow-hidden rounded-lg md:h-64 shadow-inner"
    >
        <!-- Item 1 -->
        <div id="carousel-item-1" class="hidden duration-700 ease-in-out" data-carousel-item>
            <img src="views/images/no-media-placeholder.svg" class="absolute block h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
        </div>
        <!-- Item 2 -->
        <div id="carousel-item-2" class="hidden duration-700 ease-in-out" data-carousel-item>
            <img src="views/images/no-media-placeholder.svg" class="absolute block h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
        </div>
        <!-- /* Item 3 -- >
        <div id="carousel-item-3" class="hidden duration-700 ease-in-out" data-carousel-item>
            <img src="views/images/no-media-placeholder.svg" class="absolute block h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
        </div>
        < !-- /* Item 4 -- >
        <div id="carousel-item-4" class="hidden duration-700 ease-in-out" data-carousel-item>
            <img src="assets/images/Fia.png" class="absolute block h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="...">
        </div>
        < !-- Item 5 -- >
        <div id="carousel-item-5" class="hidden duration-700 ease-in-out" data-carousel-item>
            <img src="assets/images/Priscilla.png" class="absolute block h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="">
        </div>*/ -->
    </div><!-- /#carousel-wrapper -->
    <!-- div id="slider-indicators" class="absolute z-30 flex space-x-3 -translate-x-1/2 bottom-5 left-1/2">
        <button id="carousel-indicator-1" type="button" class="w-3 h-3 rounded-full" aria-current="true"  aria-label="Slide 1"></button>
        <button id="carousel-indicator-2" type="button" class="w-3 h-3 rounded-full" aria-current="false" aria-label="Slide 2"></button>
        <button id="carousel-indicator-3" type="button" class="w-3 h-3 rounded-full" aria-current="false" aria-label="Slide 3"></button>
        <button id="carousel-indicator-4" type="button" class="w-3 h-3 rounded-full" aria-current="false" aria-label="Slide 4"></button>
        <button id="carousel-indicator-5" type="button" class="w-3 h-3 rounded-full" aria-current="false" aria-label="Slide 5"></button>
    </div>< !-- /#Slider indicators -->
    <button 
      id="data-carousel-next"
      type="button"
      class="disabled relative top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
      data-carousel-next
      disabled
    >
        <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
            <svg class="w-4 h-4 text-gray-400 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
            </svg>
            <span class="sr-only"><?= __( 'Next Item' ) ?></span>
        </span>
    </button>
</div><!-- /#carousel-container -->
