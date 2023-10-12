<div 
  id="collapse-menu"
  data-accordion="collapse"
>
    <!-- Media Management -->
    <h2 id="collapse-item-heading-media">
        <button 
          type="button" 
          class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 dark:border-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          data-accordion-target="#collapse-item-body-media"
          aria-expanded="false"
          aria-controls="collapse-item-body-media"
        >
            <span><?= __( 'Media Management' ); ?></span>
            <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
            </svg>
        </button>
    </h2>
    <div 
      id="collapse-item-body-media"
      class="hidden"
      aria-labelledby="collapse-item-heading-media"
    >
        <div class="p-5 border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900 overflow-y-auto">
            <p class="mb-2 text-gray-500 dark:text-gray-400">
                <?= __( 'Add media to the currently active playlist.' ) ?>
                <?= __( 'Media you add is lost when you switch playlists or end your application session.' ) ?>
                <?= __( 'If you want the additional media to be permanent, you will need to download the playlist after adding the media.' ) ?>
            </p>
            <div class="mb-2 text-gray-500 dark:text-gray-400">               
                <br>
            </div>
            <div class="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
                <span class="font-medium">Sorry, this is currently under development.</span>
            </div>
            <div class="mt-2 mb-0 pt-4 text-gray-500 dark:text-gray-400 _border-dotted _border-t _border-gray-200 _dark:border-gray-300 text-right">
                <button 
                  id="btn-add-media"
                  type="button"
                  class="px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                  disabled
                ><?= __( 'Add New Media' ) ?></button>
            </div>
        </div>
    </div>
    <!-- Playlist Creator -->
    <h2 id="collapse-item-heading-playlist">
        <button 
          type="button" 
          class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 dark:border-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          data-accordion-target="#collapse-item-body-playlist"
          aria-expanded="false"
          aria-controls="collapse-item-body-playlist"
        >
            <span><?= __( 'Playlist Creator' ); ?></span>
            <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
            </svg>
        </button>
    </h2>
    <div 
      id="collapse-item-body-playlist"
      class="hidden"
      aria-labelledby="collapse-item-heading-playlist"
    >
        <div class="p-5 border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900 overflow-y-auto">
            <p class="mb-2 text-gray-500 dark:text-gray-400">
                <?= __( 'It is expected to be implemented in the near future.' ) ?><br>
                <?= __( 'Please look forward to it.' ) ?>
            </p>
        </div>
    </div>
    <!-- Report an issue -->
    <h2 id="collapse-item-heading-issue">
        <button 
          type="button" 
          class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 dark:border-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          data-accordion-target="#collapse-item-body-issue"
          aria-expanded="false"
          aria-controls="collapse-item-body-issue"
        >
            <span><?= __( 'Report an issue' ); ?></span>
            <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
            </svg>
        </button>
    </h2>
    <div 
      id="collapse-item-body-issue"
      class="hidden"
      aria-labelledby="collapse-item-heading-issue"
    >
        <div class="p-5 border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900 overflow-y-auto">
            <p class="mb-2 text-gray-500 dark:text-gray-400">
                <?= __( 'Ambient development code is managed in a github repository.' ) ?>
                <?= __( 'To report bugs or problems, please raise an issue on github.' ) ?><br>
                <?= __( 'Before reporting a problem, please check to see if a similar issue has already been submitted.' ) ?>
            </p>
            <p class="text-gray-500 dark:text-gray-400"><a href="https://github.com/ka215/ambient/issues" target="_blank" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'Check out and submit issues.' ) ?></a></p>
        </div>
    </div>
    <!-- About Ambient -->
    <h2 id="collapse-item-heading-about">
        <button 
          type="button" 
          class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 dark:border-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" 
          data-accordion-target="#collapse-item-body-about"
          aria-expanded="false"
          aria-controls="collapse-item-body-about"
        >
            <span><?= __( 'About Ambient' ); ?></span>
            <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
            </svg>
        </button>
    </h2>
    <div 
      id="collapse-item-body-about"
      class="hidden"
      aria-labelledby="collapse-item-heading-about"
    >
        <div class="p-5 border border-t-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900 overflow-y-auto">
            <p class="mb-2 text-gray-500 dark:text-gray-400">
                <?= __( 'Ambient is an open source media player that allows you to seamlessly mix and play media published on YouTube and media stored on your local PC.' ) ?><br>
                <?= __( "Additionally, since Ambient is designed as a web application, anyone can use it by accessing the application's pages with a common web browser." ) ?><br>
                <?= __( 'However, if you want to use Ambient on your local PC, you will need to prepare a PHP execution environment and launch your application onto that environment.' ) ?>
            </p>
            <p class="mb-2 text-gray-500 dark:text-gray-400"><?= __( 'Learn more about the technology Ambient uses below:' ) ?></p>
            <ul class="mb-2 pl-5 text-gray-500 list-disc dark:text-gray-400">
                <li><a href="https://developers.google.com/youtube/iframe_api_reference" target="_blank" rel="nofollow" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'YouTube IFrame Player API' ) ?></a></li>
                <li><a href="https://tailwindcss.com/" target="_blank" rel="nofollow" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'tailwindcss' ) ?></a></li>
                <li><a href="https://flowbite.com/" target="_blank" rel="nofollow" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'Flowbite' ) ?></a></li>
            </ul>
            <p class="mb-2 text-right text-gray-500 dark:text-gray-400"><?= __( 'Version:' ) ?> <?= $this->get_version() ?> <?= __( '(user setup)' ) ?></p>
            <p class="mt-4 mb-2 pt-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-300 dark:border-gray-400">
MIT License<br>
<br>
Copyright &copy; 2023 ka2&lt;MAGIC METHODS&gt;<br>
<br>
Permission is hereby granted, free of charge, to any person obtaining a copy <wbr/>
of this software and associated documentation files (the "Software"), to deal <wbr/>
in the Software without restriction, including without limitation the rights <wbr/>
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell <wbr/>
copies of the Software, and to permit persons to whom the Software is <wbr/>
furnished to do so, subject to the following conditions:<br>
<br>
The above copyright notice and this permission notice shall be included in<wbr/>
all copies or substantial portions of the Software.<br>
<br>
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR <wbr/>
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, <wbr/>
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE <wbr/>
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER <wbr/>
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, <wbr/>
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN <wbr/>
THE SOFTWARE.<br>
            </p>
        </div>
    </div>
</div>
