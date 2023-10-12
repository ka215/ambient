<div 
  id="modal-options"
  data-modal-backdrop="static"
  tabindex="-1"
  aria-hidden="true"
  class="fixed top-0 left-0 right-0 z-[60] hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full transition-all"
>
    <div class="relative w-full max-w-2xl max-h-full shadow">
        <!-- Modal content -->
        <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <!-- Modal header -->
            <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                    <?= __( 'Options' ) ?>
                </h3>
                <button
                  id="btn-close-options"
                  type="button"
                  class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  data-modal-hide="modal-options"
                >
                    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span class="sr-only"><?= __( 'Close options' ) ?></span>
                </button>
            </div>
            <!-- Modal body -->
            <div class="p-0 space-y-0">
                <?= amp_component( 'collapse' ); ?>
            </div>
            <!-- Modal footer -->
            <div class="flex justify-center items-center p-5 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                <span class="block text-sm text-gray-500 sm:text-center dark:text-gray-400">&copy; 2023 Ambient. Produced by <a href="https://ka2.org/" target="_blank" class="hover:underline">MAGIC METHODS</a>.</span>
            </div>
        </div>
    </div>
</div>
