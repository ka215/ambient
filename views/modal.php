<div 
  id="modal-options"
  tabindex="-1"
  aria-hidden="true"
  class="fixed inset-0 z-[60] hidden w-full items-center justify-center p-4 overflow-hidden opacity-0 pointer-events-none"
  style="z-index: 9999;"
>
    <div class="modal-dialog-shell relative my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col shadow">
        <!-- Modal content -->
        <div class="relative flex max-h-full min-h-0 flex-col rounded-lg bg-white shadow dark:bg-gray-700">
            <!-- Modal header -->
            <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                    <?= __( 'Options' ) ?>
                </h3>
                <button
                  id="btn-close-options"
                  type="button"
                  class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                    <span class="ui-icon-mask ui-icon-mask--close w-3 h-3" aria-hidden="true"></span>
                    <span class="sr-only"><?= __( 'Close options' ) ?></span>
                </button>
            </div>
            <!-- Modal body -->
            <div class="min-h-0 overflow-hidden p-0 space-y-0">
                <?= amp_component( 'collapse' ); ?>
            </div>
            <!-- Modal footer -->
            <div class="flex justify-center items-center p-5 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                <span class="block text-sm text-gray-500 sm:text-center dark:text-gray-400">&copy; 2023 Ambient. Produced by <a href="https://ka2.org/" target="_blank" class="hover:underline">MAGIC METHODS</a>.</span>
            </div>
        </div>
    </div>
</div>
