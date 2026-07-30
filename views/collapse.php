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
          <span class="accordion-caret" aria-hidden="true">
            <span class="caret-down ui-icon-mask ui-icon-mask--caret-down w-4 h-4 shrink-0"></span>
            <span class="caret-up ui-icon-mask ui-icon-mask--caret-up w-4 h-4 shrink-0"></span>
          </span>
        </button>
    </h2>
    <div 
      id="collapse-item-body-media"
      class="hidden"
      aria-labelledby="collapse-item-heading-media"
    >
        <div class="p-5 border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900 overflow-y-auto">
            <p class="mb-4 text-gray-500 dark:text-gray-400">
<?php if ( is_cloud() ): ?>
                <?= __( 'Added media is saved to MyPlaylist, which is stored in your browser\'s local storage and loaded automatically when you access Ambient.' ) ?>
                <?= __( 'Existing playlists in cloud mode are read-only. Editing is not available.' ) ?>
<?php else: ?>
                <?= __( 'In local mode, added media is saved directly to the active playlist JSON file and remains available after you switch playlists or restart Ambient.' ) ?>
<?php endif; ?>
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
                        ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
                    </label>
                    <div class="flex">
                        <span 
                          id="youtube-url-prefix"
                          class="inline-flex items-center px-3 text-sm bg-gray-200 dark:bg-gray-700 border border-r-0 rounded-l-md normal-prefix"
                        >https://</span>
                        <input 
                          id="youtube-url"
                          type="text"
                          name="youtube_url"
                          class="rounded-none rounded-r-lg border block flex-1 min-w-0 w-full text-sm p-2.5 normal-input"
                          placeholder="www.youtube.com/watch?v=......"
                          data-validate="false"
                        />
                    </div>
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400"><?= __( 'Copy and paste full text of the YouTube video URL includes schema.' ) ?></p>
                    <div
                      id="youtube-metadata-assist"
                      class="hidden mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-600 dark:bg-gray-800"
                      data-state="idle"
                    >
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <p id="youtube-metadata-status" class="text-sm text-gray-600 dark:text-gray-300"></p>
                            <div class="flex flex-wrap justify-end gap-2">
                                <button
                                  id="btn-apply-youtube-metadata-all"
                                  type="button"
                                  class="hidden px-2.5 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
                                ><?= __( 'Apply all suggestions' ) ?></button>
                                <button
                                  id="btn-dismiss-youtube-metadata"
                                  type="button"
                                  class="hidden px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500 dark:hover:bg-gray-600"
                                ><?= __( 'Dismiss' ) ?></button>
                            </div>
                        </div>
                        <div id="youtube-metadata-suggestions" class="hidden mt-3 space-y-2">
                            <div class="flex items-start justify-between gap-3">
                                <p class="min-w-0">
                                    <span class="block text-xs font-medium text-gray-500 dark:text-gray-400"><?= __( 'Title' ) ?></span>
                                    <span id="youtube-metadata-title-suggestion" class="block truncate text-gray-900 dark:text-gray-100"></span>
                                </p>
                                <button id="btn-apply-youtube-metadata-title" type="button" class="shrink-0 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-700 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-300 dark:border-blue-400 dark:hover:bg-gray-700"><?= __( 'Apply title' ) ?></button>
                            </div>
                            <div class="flex items-start justify-between gap-3">
                                <p class="min-w-0">
                                    <span class="block text-xs font-medium text-gray-500 dark:text-gray-400"><?= __( 'Artist' ) ?></span>
                                    <span id="youtube-metadata-artist-suggestion" class="block truncate text-gray-900 dark:text-gray-100"></span>
                                </p>
                                <button id="btn-apply-youtube-metadata-artist" type="button" class="shrink-0 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-700 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-300 dark:border-blue-400 dark:hover:bg-gray-700"><?= __( 'Apply artist' ) ?></button>
                            </div>
                            <div class="flex items-start justify-between gap-3">
                                <p class="min-w-0">
                                    <span class="block text-xs font-medium text-gray-500 dark:text-gray-400"><?= __( 'Description' ) ?></span>
                                    <span id="youtube-metadata-desc-suggestion" class="block max-h-16 overflow-hidden text-gray-900 dark:text-gray-100"></span>
                                </p>
                                <button id="btn-apply-youtube-metadata-desc" type="button" class="shrink-0 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-700 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-300 dark:border-blue-400 dark:hover:bg-gray-700"><?= __( 'Apply description' ) ?></button>
                            </div>
                        </div>
                    </div>
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
                        <span class="required"><?= __( 'Choose media file (Drag and drop supported).' ) ?></span>
                        <span
                          id="note-error-local-media-file"
                          class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                          data-default-message="<?= __( 'Invalid file path' ) ?>"
                        ><?= __( 'Invalid file path' ) ?></span>
                        <span 
                          id="note-success-local-media-file"
                          class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                        ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
                    </label>
                    <input
                      id="local-media-file"
                      type="file"
                      name="local_media_file"
                      accept="audio/*,video/*"
                      directory="<?= MEDIA_DIR ?>"
                      class="sr-only"
                      data-label-empty="<?= __( 'No file selected' ) ?>"
                      data-label-drop="<?= __( 'Drop media file here' ) ?>"
                    />
                    <div id="local-media-dropzone" class="file-dropzone local-media-dropzone mt-2 flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-500 px-3 py-2">
                        <button
                          id="btn-local-media-file-picker"
                          type="button"
                          class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600"
                        ><?= __( 'Select file' ) ?></button>
                        <span
                          id="local-media-file-name"
                          class="text-sm text-gray-500 dark:text-gray-400"
                        ><?= __( 'No file selected' ) ?></span>
                    </div>
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
                            ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
                        </label>
                        <select 
                          id="media-category"
                          name="category"
                          class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                          data-placeholder="<?= __( 'Choose a playlist category' ) ?>"
                          data-validate="false"
                        >
                            <option value="" selected><?= __( 'Choose a playlist category' ) ?></option>
                        </select>
                        <input
                          type="text"
                          id="media-category-new"
                          name="category_new_name"
                          class="hidden border text-sm rounded-lg block w-full p-2.5 normal-input"
                          placeholder="<?= __( 'Please enter a category name' ) ?>"
                          value="<?= __( 'New Category' ) ?>"
                          data-default-value="<?= __( 'New Category' ) ?>"
                          data-validate="false"
                        />
                        <p
                          id="note-media-category-create-from-playlist-management"
                          class="hidden relative z-20 mt-1 text-sm text-red-600 dark:text-red-400"
                        ><?= __( "Note: New categories can be added from &ldquo;Add New Category&rdquo; in &ldquo;" ) ?><a
                            id="link-open-playlist-management-category"
                            href="#collapse-item-body-playlist"
                            class="relative z-10 inline-flex font-medium underline underline-offset-2 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:text-red-300"
                          ><?= __( 'Playlist Management' ) ?></a><?= __( "&rdquo;." ) ?></p>
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
                            ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
                        </label>
                        <input
                          id="media-title"
                          type="text"
                          name="title"
                          class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                          placeholder="<?= __( 'Displayed media title' ) ?>"
                          maxlength="100"
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
                          maxlength="100"
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
                          maxlength="1000"
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
                            <span id="default-media-volume" class="ml-2 px-1 text-yellow-500 dark:text-yellow-400">50</span>
                        </label>
                        <input 
                          id="media-volume"
                          type="range"
                          name="volume"
                          value="50"
                          min="0"
                          max="100"
                          step="1"
                          class="volume-range w-full h-2 rounded-lg appearance-none cursor-pointer"
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
                                ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
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
                                ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
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
                    <p class="mt-1 mb-4 text-sm text-red-600 dark:text-red-400"><?= __( 'Note: Seek start/end times are only valid when &ldquo;Seek Play&rdquo; is ON.' ) ?></p>
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
                                ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
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
                                ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
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
          <span class="accordion-caret" aria-hidden="true">
            <span class="caret-down ui-icon-mask ui-icon-mask--caret-down w-4 h-4 shrink-0"></span>
            <span class="caret-up ui-icon-mask ui-icon-mask--caret-up w-4 h-4 shrink-0"></span>
          </span>
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
<?php if ( is_local() ): ?>
                <div 
                  id="playlist-management-field-symbolic-link"
                  class="mb-4"
                >
                    <h3 
                      class="text-base font-semibold mb-2 -mx-5 px-5 <?php if ( is_local() ): ?>lead-text<?php else: ?>lead-text-muted<?php endif; ?>"
                    ><?= __( 'Create Symbolic Link' ) ?></h3>
                    <p class="mb-2 text-gray-500 dark:text-gray-400"><?= __( 'Create a symbolic link of the folder containing the media files on your host computer into media directory in the Ambient.' ) ?></p>
                    <label 
                      id="local-media-directory-label"
                      for="local-media-directory"
                      class="block mb-2 text-sm font-medium <?php if ( is_local() ): ?>normal-text<?php else: ?>muted-text<?php endif; ?>"
                    >
                        <span class="required" <?php if ( is_local() ): ?>data-tooltip-target="tooltip-local-media-directory"<?php endif; ?>><?= __( 'Local Media Folder Path' ) ?></span>
<?php if ( is_local() ): ?>
                        <div id="tooltip-local-media-directory" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                            <?= __( 'Required' ) ?>
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
<?php endif; ?>
                        <span 
                          id="note-error-local-media-directory"
                          class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                        ><?= __( 'This path is required' ) ?></span>
                        <span 
                          id="note-success-local-media-directory"
                          class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                        ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
                    </label>
                    <input 
                      id="local-media-directory"
                      type="text"
                      name="local_media_dir"
                      class="block w-full text-sm border rounded-lg cursor-pointer focus:outline-none normal-input"
                      placeholder="C:/Users/Username/Media/FavoriteFolder"
                      required
                      <?php if ( !is_local() ): ?>disabled<?php endif; ?>
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
                          class="block mb-2 text-sm font-medium <?php if ( is_local() ): ?>normal-text<?php else: ?>muted-text<?php endif; ?>"
                        >
                            <span class="required" <?php if ( is_local() ): ?>data-tooltip-target="tooltip-symlink-name"<?php endif; ?>><?= __( 'Symbolic Link Name' ) ?></span>
<?php if ( is_local() ): ?>
                            <div id="tooltip-symlink-name" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                                <?= __( 'Required' ) ?>
                                <div class="tooltip-arrow" data-popper-arrow></div>
                            </div>
<?php endif; ?>
                            <span 
                              id="note-error-symlink-name"
                              class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                            ><?= __( 'This name is required' ) ?></span>
                            <span 
                              id="note-success-symlink-name"
                              class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                            ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
                        </label>
                        <input 
                          id="symlink-name"
                          type="text"
                          name="symlink_name"
                          class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                          placeholder="<?= __( 'Please fill any strings' ) ?>"
                          required
                          <?php if ( !is_local() ): ?>disabled<?php endif; ?>
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
<?php endif; /* is_local() - symlink section */ ?>
                <div 
                  id="playlist-management-field-category"
                  class="mb-8"
                >
                    <h3 class="text-base font-semibold mb-2 -mx-5 px-5 lead-text"><?= __( 'Add New Category' ) ?></h3>
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
                                ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
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
                  id="playlist-management-field-category-edit"
                  class="mb-8 hidden"
                >
                    <h3 class="text-base font-semibold mb-2 -mx-5 px-5 lead-text"><?= __( 'Edit Category' ) ?></h3>
                    <p class="mb-2 text-gray-500 dark:text-gray-400">
                        <?= __( 'Edit or delete categories in the currently active playlist.' ) ?><br>
                        <?= __( 'Only categories without media can be deleted.' ) ?>
                    </p>
                    <div class="mb-4">
                        <label
                          for="category-edit-target"
                          class="block mb-2 text-sm font-medium normal-text"
                        ><?= __( 'Target Category' ) ?></label>
                        <div class="flex flex-col gap-2 md:flex-row md:items-center">
                            <select
                              id="category-edit-target"
                              name="category_edit_target"
                              class="border text-sm rounded-lg block w-full md:max-w-[50%] p-2.5 normal-input"
                              data-placeholder="<?= __( 'Choose a category' ) ?>"
                            >
                                <option value="" selected><?= __( 'Choose a category' ) ?></option>
                            </select>
                            <p id="category-edit-media-count-summary" class="hidden text-sm leading-10 text-gray-500 dark:text-gray-300 md:self-center">
                                <?= __( 'Media count' ) ?>:
                                <span id="category-edit-media-count">0</span>
                            </p>
                        </div>
                    </div>
                    <div
                      id="category-edit-fields"
                      class="hidden"
                    >
                        <div class="grid gap-4 mb-4 md:grid-cols-[minmax(0,50%)_auto]">
                            <div class="min-w-0">
                                <label
                                  for="category-edit-name"
                                  class="block mb-2 text-sm font-medium normal-text"
                                >
                                    <span class="required"><?= __( 'Category Name' ) ?></span>
                                    <span
                                      id="note-error-category-edit-name"
                                      class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                                    ><?= __( 'Category name is required.' ) ?></span>
                                    <span
                                      id="note-success-category-edit-name"
                                      class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                                    ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
                                </label>
                                <input
                                  id="category-edit-name"
                                  type="text"
                                  name="category_edit_name"
                                  class="border text-sm rounded-lg block w-full p-2.5 normal-input"
                                  placeholder="<?= __( 'New category name' ) ?>"
                                  disabled
                                />
                            </div>
                            <div class="flex flex-wrap items-end justify-end gap-2">
                                <button
                                  id="btn-update-category"
                                  type="button"
                                  name="update_category"
                                  class="min-h-10 whitespace-nowrap text-center font-medium rounded-lg text-sm px-5 py-2.5 mr-0 mb-0 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                  data-message-success="<?= __( 'Category updated successfully.' ) ?>"
                                  data-message-failure="<?= __( 'Failed to update category.' ) ?>"
                                  data-message-duplicate="<?= __( 'A category with this name already exists.' ) ?>"
                                  data-message-required="<?= __( 'Category name is required.' ) ?>"
                                  disabled
                                ><?= __( 'Apply Changes' ) ?></button>
                                <button
                                  id="btn-delete-category"
                                  type="button"
                                  name="delete_category"
                                  class="min-h-10 whitespace-nowrap text-center font-medium rounded-lg text-sm px-5 py-2.5 mr-0 mb-0 text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800"
                                  data-message-success="<?= __( 'Category deleted successfully.' ) ?>"
                                  data-message-failure="<?= __( 'Failed to delete category.' ) ?>"
                                  data-message-not-empty="<?= __( 'This category contains media and cannot be deleted.' ) ?>"
                                  disabled
                                ><?= __( 'Delete' ) ?></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                  id="playlist-management-field-download"
                  class="mb-4"
                >
                    <h3 class="text-base font-semibold mb-2 -mx-5 px-5 lead-text"><?= __( 'Export Playlist' ) ?></h3>
                    <p class="mb-2 text-gray-500 dark:text-gray-400"><?= __( 'Export the currently active playlist in JSON format.' ) ?></p>
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
                          data-message-success="<?= __( 'Playlist exported successfully.' ) ?>"
                          data-message-failure="<?= __( 'Failed to export playlist.' ) ?>"
                          disabled
                        ><?= __( 'Export Playlist' ) ?></button>
                    </div>
                    
                </div>
                <div 
                  id="playlist-management-field-import"
                  class="mb-4"
                >
                    <h3 class="text-base font-semibold mb-2 -mx-5 px-5 lead-text"><?= __( 'Import Playlist' ) ?></h3>
                    <p class="mb-2 text-gray-500 dark:text-gray-400"><?= __( 'Import a playlist JSON file.' ) ?></p>
<?php if ( is_cloud() ): ?>
                    <p class="mb-2 text-sm text-gray-500 dark:text-gray-300"><?= __( 'In cloud mode, importing replaces MyPlaylist in browser storage.' ) ?></p>
<?php else: ?>
                    <p class="mb-2 text-sm text-gray-500 dark:text-gray-300"><?= __( 'In local mode, imported playlists are saved under assets/.' ) ?></p>
<?php endif; ?>
                    <label
                      id="playlist-import-file-label"
                      for="playlist-import-file"
                      class="block mb-2 text-sm font-medium normal-text"
                    >
                        <span class="required" data-tooltip-target="tooltip-playlist-import-file"><?= __( 'Choose JSON file (Drag and drop supported).' ) ?></span>
                        <div id="tooltip-playlist-import-file" role="tooltip" class="absolute z-10 invisible inline-block px-2 py-2 text-xs font-normal text-white transition-opacity duration-300 bg-red-600 rounded-lg shadow-sm opacity-0 tooltip dark:bg-red-500">
                            <?= __( 'Required' ) ?>
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                        <span 
                          id="note-error-playlist-import-file"
                          class="hidden bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                        ><?= __( 'Invalid file path' ) ?></span>
                        <span 
                          id="note-success-playlist-import-file"
                          class="hidden bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 inline-flex items-center"
                        ><span class="ui-icon-mask ui-icon-mask--check w-3 h-3 text-green-800 dark:text-green-300" aria-hidden="true"></span></span>
                    </label>
                    <input
                      id="playlist-import-file"
                      type="file"
                      name="import_playlist_file"
                      accept="application/json,.json"
                      class="sr-only"
                      data-validate="false"
                      data-label-empty="<?= __( 'No file selected' ) ?>"
                      data-label-drop="<?= __( 'Drop JSON file here' ) ?>"
                    />
                    <div id="playlist-import-dropzone" class="file-dropzone playlist-import-dropzone mt-2 flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-500 px-3 py-2">
                        <button
                          id="btn-playlist-import-file-picker"
                          type="button"
                          class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600"
                        ><?= __( 'Select file' ) ?></button>
                        <span
                          id="playlist-import-file-name"
                          class="text-sm text-gray-500 dark:text-gray-400"
                        ><?= __( 'No file selected' ) ?></span>
                    </div>
                    <p class="mt-1 mb-4 text-xs font-normal text-gray-500 dark:text-gray-400"><?= __( 'Only .json files are accepted.' ) ?></p>
                    <div class="flex justify-end items-end">
                        <button 
                          id="btn-import-playlist"
                          type="button"
                          name="import_playlist"
                          class="text-center font-medium rounded-lg text-sm px-5 py-2.5 mr-0 mb-0 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                          data-message-success="<?= __( 'Playlist imported successfully.' ) ?>"
                          data-message-failure="<?= __( 'Failed to import playlist.' ) ?>"
                          disabled
                        ><?= __( 'Import JSON' ) ?></button>
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
          <span class="accordion-caret" aria-hidden="true">
            <span class="caret-down ui-icon-mask ui-icon-mask--caret-down w-4 h-4 shrink-0"></span>
            <span class="caret-up ui-icon-mask ui-icon-mask--caret-up w-4 h-4 shrink-0"></span>
          </span>
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
            <p class="text-gray-500 dark:text-gray-400"><a href="https://github.com/ka215/ambient/issues/new?template=bug_report.yml" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'Check out and submit issues.' ) ?></a></p>
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
          <span class="accordion-caret" aria-hidden="true">
            <span class="caret-down ui-icon-mask ui-icon-mask--caret-down w-4 h-4 shrink-0"></span>
            <span class="caret-up ui-icon-mask ui-icon-mask--caret-up w-4 h-4 shrink-0"></span>
          </span>
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
                <?= __( "Additionally, since Ambient is designed as a web application, anyone can use it by accessing the application's pages with a common web browser." ) ?><?php if ( is_local() ) : ?><br>
                <?= __( 'However, if you want to use Ambient on your local PC, you will need to prepare a PHP execution environment and launch your application onto that environment.' ) ?><?php endif; ?>
            </p>
            <p class="mb-2 text-gray-500 dark:text-gray-400"><?= __( 'Learn more about the technology Ambient uses below:' ) ?></p>
            <ul class="mb-2 pl-5 text-gray-500 list-disc dark:text-gray-400">
                <li><a href="https://developers.google.com/youtube/iframe_api_reference" target="_blank" rel="nofollow" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'YouTube IFrame Player API' ) ?></a></li>
                <li><a href="https://tailwindcss.com/" target="_blank" rel="nofollow" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'tailwindcss' ) ?></a></li>
                <li><a href="https://flowbite.com/" target="_blank" rel="nofollow" class="text-blue-600 dark:text-blue-500 hover:underline"><?= __( 'Flowbite' ) ?></a></li>
            </ul>
            <?php if ( amp_get_about_content() !== '' ) : ?>
            <div id="about-custom-content" class="my-4 border-t border-gray-300 pt-4 dark:border-gray-700">
                <?= amp_get_about_content() ?>
            </div>
            <?php endif; ?>
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
