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
            <p class="mb-4 text-gray-500 dark:text-gray-400">
                <?= __( 'Add media to the currently active playlist.' ) ?>
                <?= __( 'Media you add is lost when you switch playlists or end your application session.' ) ?>
                <?= __( 'If you want the additional media to be permanent, you will need to download the playlist after adding the media.' ) ?>
            </p>
            <div class="mb-2 text-gray-500 dark:text-gray-400">
              <form name="mediaManagement">
                <ul 
                  id="media-management-field-media-type"
                  class="mb-4 items-center w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <li class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                        <div class="flex items-center pl-3">
                            <input 
                              id="media-type-youtube"
                              type="radio" 
                              value="youtube" 
                              name="media_type"
                              checked
                              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                            />
                            <label for="media-type-youtube" class="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"><?= __( 'YouTube Media' ) ?></label>
                        </div>
                    </li>
                    <li class="w-full dark:border-gray-600">
                        <div class="flex items-center pl-3">
                            <input 
                              id="media-type-local" 
                              type="radio" 
                              value="local" 
                              name="media_type" 
                              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                              <?php if ( !is_local() ): ?>disabled<?php endif; ?>
                            />
                            <label for="media-type-local" class="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300<?php if ( !is_local() ): ?> opacity-50<?php endif; ?>"><?= __( 'Local Media' ) ?></label>
                        </div>
                    </li>
                </ul>
                <div 
                  id="media-management-field-media-url"
                  class="mb-4"
                >
                    <label 
                      id="youtube-url-label"
                      for="youtube-url"
                      class="block mb-2 px-1 text-sm font-medium normal-text"
                    >
                        <span class="required" data-tooltip-target="tooltip-youtube-url"><?= __( 'YouTube URL' ) ?></span>
                        <div id="tooltip-youtube-url" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                            <?= __( 'Required' ) ?>
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                        <span 
                          id="note-error-youtube-url"
                          class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                        ><?= __( 'Invalid URL' ) ?></span>
                        <span 
                          id="note-success-youtube-url"
                          class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                        ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                        </svg></span>
                    </label>
                    <div class="flex">
                        <span 
                          id="youtube-url-prefix"
                          class="inline-flex items-center px-3 text-sm bg-gray-200 dark:bg-gray-600 border border-r-0 rounded-l-md normal-prefix"
                        >https://</span>
                        <input 
                          id="youtube-url"
                          type="text"
                          name="youtube_url"
                          _class="rounded-none rounded-r-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          class="rounded-none rounded-r-lg border block flex-1 min-w-0 w-full text-sm p-2.5 normal-input"
                          placeholder="www.youtube.com/watch?v=......"
                          data-validate="false"
                        />
                    </div>
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400"><?= __( 'Copy and paste full text of the YouTube video URL includes schema.' ) ?></p>
                    <input id="youtube-videoid" type="hidden" name="youtube_videoid" value="" />
                </div>
                <div 
                  id="media-management-field-media-files"
                  class="hidden mb-4"
                >
                    <label 
                      id="local-media-file-label"
                      for="local-media-file"
                      class="block mb-2 text-sm font-medium normal-text"
                    >
                        <span class="required"><?= __( 'Local Media File' ) ?></span>
                        <span 
                          id="note-error-local-media-file"
                          class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                          data-default-message="<?= __( 'Invalid file path' ) ?>"
                        ><?= __( 'Invalid file path' ) ?></span>
                        <span 
                          id="note-success-local-media-file"
                          class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                        ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                        </svg></span>
                    </label>
                    <input 
                      id="local-media-file"
                      type="file"
                      name="local_media_file"
                      accept="audio/*,video/*"
                      directory="<?= MEDIA_DIR ?>"
                      class="block w-full text-sm border rounded-lg cursor-pointer focus:outline-none normal-input"
                    />
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">
                        <?= __( 'Only media files that are relatively accessible from the Ambient media directory are valid.' ) ?>
                    </p>
                    <input id="local-media-filepath" type="hidden" name="media_filepath" value="" />
                </div>
                <div
                  id="media-management-field-meta"
                  class="mb-4"
                >
                    <div 
                      class="mb-4"
                    >
                        <label
                          id="media-category-label"
                          for="media-category"
                          class="block mb-2 text-sm font-medium normal-text"
                        >
                            <span class="required" data-tooltip-target="tooltip-media-category"><?= __( 'Category' ) ?></span>
                            <div id="tooltip-media-category" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                                <?= __( 'Required' ) ?>
                                <div class="tooltip-arrow" data-popper-arrow></div>
                            </div>
                            <span 
                              id="note-error-media-category"
                              class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                            ><?= __( 'Choose category is required' ) ?></span>
                            <span 
                              id="note-success-media-category"
                              class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                            ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                            </svg></span>
                        </label>
                        <select 
                          id="media-category"
                          name="category"
                          class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                          data-placeholder="<?= __( 'Choose a playlist category' ) ?>"
                          required
                          data-validate="false"
                        >
                            <option value="" selected><?= __( 'Choose a playlist category' ) ?></option>
                        </select>
                    </div>
                    <div
                      class="mb-4"
                    >
                        <label 
                          id="media-title-label"
                          for="media-title"
                          class="block mb-2 text-sm font-medium normal-text"
                        >
                            <span class="required" data-tooltip-target="tooltip-media-title"><?= __( 'Title' ) ?></span>
                            <div id="tooltip-media-title" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                                <?= __( 'Required' ) ?>
                                <div class="tooltip-arrow" data-popper-arrow></div>
                            </div>
                            <span 
                              id="note-error-media-title"
                              class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                            ><?= __( 'Media title is required' ) ?></span>
                            <span 
                              id="note-success-media-title"
                              class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                            ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                            </svg></span>
                        </label>
                        <input 
                          id="media-title"
                          type="text"
                          name="title"
                          class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                          placeholder="<?= __( 'Displayed media title' ) ?>"
                          required
                          data-validate="false"
                        />
                    </div>
                    <div
                      class="mb-4"
                    >
                        <label 
                          id="media-artist-label"
                          for="media-artist"
                          class="block mb-2 text-sm font-medium normal-text"
                        ><?= __( 'Artist' ) ?></label>
                        <input 
                          id="media-artist"
                          type="text"
                          name="artist"
                          class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                          placeholder="<?= __( 'Displayed artist name' ) ?>"
                        />
                    </div>
                    <div
                      class="mb-4"
                    >
                        <label 
                          id="media-desc-label"
                          for="media-desc"
                          class="block mb-2 text-sm font-medium normal-text"
                        ><?= __( 'Description' ) ?></label>
                        <input 
                          id="media-desc"
                          type="text"
                          name="desc"
                          class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                          placeholder="<?= __( 'Subtitle or description of media' ) ?>"
                        />
                    </div>
                    <div
                      class="mb-4"
                    >
                        <label 
                          id="media-volume-label"
                          for="media-volume"
                          class="flex justify-between mb-2 text-sm font-medium normal-text"
                        >
                            <?= __( 'Default playback volume' ) ?>
                            <span id="default-media-volume" class="ml-2 px-1 text-yellow-500 dark:text-yellow-400">100</span>
                        </label>
                        <input 
                          id="media-volume"
                          type="range"
                          name="volume"
                          value="100"
                          min="0"
                          max="100"
                          step="1"
                          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                        />
                    </div>
                    <div
                      class="grid gap-4 mb-4 md:grid-cols-2"
                    >
                        <div>
                            <label
                              id="seek-start-label"
                              for="seek-start"
                              class="block mb-2 text-sm font-medium normal-text"
                            >
                                <?= __( 'Seek start' ) ?>
                                <span 
                                  id="note-error-seek-start"
                                  class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                                ><?= __( 'Invalid format' ) ?></span>
                                <span 
                                  id="note-success-seek-start"
                                  class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                                ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                                </svg></span>
                            </label>
                            <input 
                              id="seek-start"
                              type="text"
                              name="start"
                              class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                              placeholder="<?= __( 'Integer of seconds or H:MM:SS format' ) ?>"
                            />
                        </div>
                        <div>
                            <label 
                              id="seek-end-label"
                              for="seek-end"
                              class="block mb-2 text-sm font-medium normal-text"
                            >
                                <?= __( 'Seek end' ) ?>
                                <span 
                                  id="note-error-seek-end"
                                  class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                                ><?= __( 'Invalid format' ) ?></span>
                                <span 
                                  id="note-success-seek-end"
                                  class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                                ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                                </svg></span>
                            </label>
                            <input 
                              id="seek-end"
                              type="text"
                              name="end"
                              class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                              placeholder="<?= __( 'Integer of seconds or H:MM:SS format' ) ?>"
                            />
                        </div>
                    </div>
                    <div
                      class="hidden grid gap-4 mb-4 md:grid-cols-2"
                    >
                        <div>
                            <label
                              id="fadein-seconds-label"
                              for="fadein-seconds"
                              class="block mb-2 text-sm font-medium normal-text opacity-50"
                              disabled
                            >
                                <?= __( 'Fade-in seconds' ) ?>
                                <span 
                                  id="note-error-fadein-seconds"
                                  class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                                ><?= __( 'Invalid format' ) ?></span>
                                <span 
                                  id="note-success-fadein-seconds"
                                  class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                                ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                                </svg></span>
                            </label>
                            <input 
                              id="fadein-seconds"
                              type="text"
                              name="fadein"
                              class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                              placeholder="<?= __( 'Integer of seconds' ) ?>"
                              pattern="^[0-9]+$"
                              disabled
                            />
                            <p class="mt-1 text-sm text-gray-500 dark:text-gray-300 opacity-50"><?= __( 'Set seconds fade-in from start of playback.' ) ?></p>
                        </div>
                        <div>
                            <label 
                              id="fadeout-seconds-label"
                              for="fadeout-seconds"
                              class="block mb-2 text-sm font-medium normal-text opacity-50"
                            >
                                <?= __( 'Fade-out seconds' ) ?>
                                <span 
                                  id="note-error-fadeout-seconds"
                                  class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                                ><?= __( 'Invalid format' ) ?></span>
                                <span 
                                  id="note-success-fadeout-seconds"
                                  class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                                ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                                </svg></span>
                            </label>
                            <input 
                              id="fadeout-seconds"
                              type="text"
                              name="fadeout"
                              class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                              placeholder="<?= __( 'Integer of seconds' ) ?>"
                              pattern="^[0-9]+$"
                              disabled
                            />
                            <p class="mt-1 text-sm text-gray-500 dark:text-gray-300 opacity-50"><?= __( 'Set seconds fade-out to end of playback.' ) ?></p>
                        </div>
                    </div>
                </div>
                <div class="mt-2 mb-0 pt-4 text-gray-500 dark:text-gray-400 _border-dotted _border-t _border-gray-200 _dark:border-gray-300 text-right">
                    <button 
                      id="btn-add-media"
                      type="button"
                      name="add_media"
                      class="px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                      data-message-success="<?= __( 'Media has been added to your specified playlist.' ) ?>"
                      data-message-failure="<?= __( 'Failed to add media to the specified playlist.' ) ?>"
                      disabled
                    ><?= __( 'Add New Media' ) ?></button>
                </div>
              </form>
            </div>
        </div>
    </div>
    <!-- Playlist Management -->
    <h2 id="collapse-item-heading-playlist">
        <button 
          type="button" 
          class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 dark:border-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          data-accordion-target="#collapse-item-body-playlist"
          aria-expanded="false"
          aria-controls="collapse-item-body-playlist"
        >
            <span><?= __( 'Playlist Management' ); ?></span>
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
          <form name="playlistManagement">
            <p class="hidden mb-2 text-gray-500 dark:text-gray-400">
                <?= __( 'This section provides various tools to manage your playlists.' ) ?><br>
            </p>
            <div class="mb-2 text-gray-500 dark:text-gray-400">
                <div 
                  id="playlist-management-field-symbolic-link"
                  class="mb-4"
                >
                    <h3 class="text-base font-semibold mb-2 -mx-5 px-5 text-teal-900 dark:text-teal-100 bg-teal-100 dark:bg-teal-950"><?= __( 'Create Symbolic Link' ) ?></h3>
                    <p class="mb-2 text-gray-500 dark:text-gray-400"><?= __( 'Create a symbolic link of the folder containing the media files on your host computer into media directory in the Ambient.' ) ?></p>
                    <label 
                      id="local-media-directory-label"
                      for="local-media-directory"
                      class="block mb-2 text-sm font-medium normal-text"
                    >
                        <span class="required" data-tooltip-target="tooltip-local-media-directory"><?= __( 'Local Media Folder Path' ) ?></span>
                        <div id="tooltip-local-media-directory" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                            <?= __( 'Required' ) ?>
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                        <span 
                          id="note-error-local-media-directory"
                          class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                        ><?= __( 'This path is required' ) ?></span>
                        <span 
                          id="note-success-local-media-directory"
                          class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                        ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                        </svg></span>
                    </label>
                    <input 
                      id="local-media-directory"
                      type="text"
                      name="local_media_dir"
                      class="block w-full text-sm border rounded-lg cursor-pointer focus:outline-none normal-input"
                      placeholder="C:/Users/Username/Media/FavoriteFolder"
                      required
                    />
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">
                        <?= __( 'Enter the full path to the media folder on the host computer that you want to link to.' ) ?>
                    </p>
                </div>
                <div
                  class="grid gap-4 mb-8 md:grid-cols-2"
                >
                    <div>
                        <label
                          id="symlink-name-label"
                          for="symlink-name"
                          class="block mb-2 text-sm font-medium normal-text"
                        >
                            <span class="required" data-tooltip-target="tooltip-symlink-name"><?= __( 'Symbolic Link Name' ) ?></span>
                            <div id="tooltip-symlink-name" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                                <?= __( 'Required' ) ?>
                                <div class="tooltip-arrow" data-popper-arrow></div>
                            </div>
                            <span 
                              id="note-error-symlink-name"
                              class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                            ><?= __( 'This name is required' ) ?></span>
                            <span 
                              id="note-success-symlink-name"
                              class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                            ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                            </svg></span>
                        </label>
                        <input 
                          id="symlink-name"
                          type="text"
                          name="symlink_name"
                          class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                          placeholder="<?= __( 'Please fill any strings' ) ?>"
                          required
                        />
                    </div>
                    <div class="flex justify-end items-end">
                        <button 
                          id="btn-create-symlink"
                          type="button"
                          name="create_symlink"
                          class="text-center font-medium rounded-lg text-sm px-5 py-2.5 mr-0 mb-0 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                          data-message-success="<?= __( 'Symbolic link created successfully.' ) ?>"
                          data-message-failure="<?= __( 'Failed to create symbolic link.' ) ?>"
                          disabled
                        ><?= __( 'Create Symbolic Link' ) ?></button>
                    </div>
                </div>
                <div 
                  id="playlist-management-field-category"
                  class="mb-8"
                >
                    <h3 class="text-base font-semibold mb-2 -mx-5 px-5 text-teal-900 dark:text-teal-100 bg-teal-100 dark:bg-teal-950"><?= __( 'Add New Category' ) ?></h3>
                    <p class="mb-2 text-gray-500 dark:text-gray-400"><?= __( 'Adds a new category to the currently active playlist.' ) ?></p>
                    <div
                      class="grid gap-4 mb-4 md:grid-cols-2"
                    >
                        <div>
                            <label
                              id="category-name-label"
                              for="category-name"
                              class="block mb-2 text-sm font-medium normal-text"
                            >
                                <span class="required" data-tooltip-target="tooltip-category-name"><?= __( 'Category Name' ) ?></span>
                                <div id="tooltip-category-name" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                                    <?= __( 'Required' ) ?>
                                    <div class="tooltip-arrow" data-popper-arrow></div>
                                </div>
                                <span 
                                  id="note-error-category-name"
                                  class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                                ><?= __( 'This name is required' ) ?></span>
                                <span 
                                  id="note-success-category-name"
                                  class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                                ><svg class="w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                                </svg></span>
                            </label>
                            <input 
                              id="category-name"
                              type="text"
                              name="category_name"
                              class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                              placeholder="<?= __( 'Please fill any strings' ) ?>"
                              required
                            />
                        </div>
                        <div class="flex justify-end items-end">
                            <button 
                              id="btn-create-category"
                              type="button"
                              name="create_category"
                              class="text-center font-medium rounded-lg text-sm px-5 py-2.5 mr-0 mb-0 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                              data-message-success="<?= __( 'New category added successfully.' ) ?>"
                              data-message-failure="<?= __( 'Failed to add new category.' ) ?>"
                              disabled
                            ><?= __( 'Add Category' ) ?></button>
                        </div>
                    </div>
                </div>
                <div 
                  id="playlist-management-field-download"
                  class="mb-4"
                >
                    <h3 class="text-base font-semibold mb-2 -mx-5 px-5 text-teal-900 dark:text-teal-100 bg-teal-100 dark:bg-teal-950"><?= __( 'Download Playlist' ) ?></h3>
                    <p class="mb-2 text-gray-500 dark:text-gray-400"><?= __( 'Download the currently active playlist in JSON format.' ) ?></p>
                    <div
                      class="flex mb-4"
                    >
                        <div class="flex items-center h-5">
                            <input 
                              id="seek-format"
                              aria-describedby="helper-seek-format"
                              type="checkbox"
                              name="seek_format"
                              value="1"
                              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div class="ms-2 text-sm">
                            <label for="seek-format" class="font-medium text-gray-900 dark:text-gray-300"><?= __( 'Output seek time in media data in HH:MM:SS format.' ) ?></label>
                            <p id="helper-seek-format" class="text-xs font-normal text-gray-500 dark:text-gray-400"><?= __( 'If this option is not enabled, it will be output as an integer number of seconds.' ) ?></p>
                        </div>
                    </div>
                    <div class="flex justify-end items-end">
                        <button 
                          id="btn-download-playlist"
                          type="button"
                          name="download_playlist"
                          class="text-center font-medium rounded-lg text-sm px-5 py-2.5 mr-0 mb-0 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                          data-message-success="<?= __( 'Playlist downloaded successfully.' ) ?>"
                          data-message-failure="<?= __( 'Failed to download playlist.' ) ?>"
                          disabled
                        ><?= __( 'Download Playlist' ) ?></button>
                    </div>
                    
                </div>
            </div>
            <div class="hidden p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
                <span class="font-medium">Sorry, this is currently under development.</span>
            </div>
          </form>
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
                <?= __( 'Ambient is an open-source media player that allows you to seamlessly mix and play media published on YouTube and media stored on a host computer, such as a local PC.' ) ?><br>
                <?= __( "Additionally, since Ambient is designed as a web application, anyone can use it by accessing the application's pages with a common web browser." ) ?><br>
                <?= __( 'However, if you want to use Ambient on your local PC, you will need to prepare a PHP execution environment and launch your application onto that environment.' ) ?>
            </p>
            <p class="mb-2 text-gray-500 dark:text-gray-400"><?= __( 'Learn more about the technology Ambient uses below:' ) ?></p>
            <ul class="mb-2 pl-5 text-gray-500 list-disc dark:text-gray-400">
                <li><a href="https://developers.google.com/youtube/iframe_api_reference" target="_blank" rel="nofollow" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'YouTube IFrame Player API' ) ?></a></li>
                <li><a href="https://tailwindcss.com/" target="_blank" rel="nofollow" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'tailwindcss' ) ?></a></li>
                <li><a href="https://flowbite.com/" target="_blank" rel="nofollow" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'Flowbite' ) ?></a></li>
            </ul>
            <p class="mb-2 text-right text-gray-500 dark:text-gray-400"><?= __( 'Version:' ) ?> <?= $this->get_version() ?> (<?= is_local() ? 'user' : 'cloud' ?> setup)</p>
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
