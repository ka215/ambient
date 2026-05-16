<?php
  $notice_color = [
    'info'    => 'blue',
    'error'   => 'red',
    'success' => 'green',
    'warning' => 'yellow',
    'default' => 'gray',
  ];
  switch( $this->amp_error->getCode() ) {
    case \E_USER_ERROR:
      $notice_type = 'error';
      break;
    case \E_USER_WARNING:
      $notice_type = 'warning';
      break;
    case \E_USER_NOTICE:
      $notice_type = 'info';
      break;
    default:
      $notice_type = 'default';
      break;
  }
  $base_color = $notice_color[$notice_type];
  $has_notice_message = trim( (string) $this->amp_error->getMessage() ) !== '';
?>
<div 
  id="alert-notification"
  class="<?= $has_notice_message ? 'flex opacity-100 translate-y-0 pointer-events-auto' : 'hidden opacity-0 -translate-y-4 pointer-events-none' ?> fixed top-2 right-2 w-full max-w-sm items-start gap-3 p-4 z-[10050] text-sm text-<?= $base_color ?>-800 border border-<?= $base_color ?>-300 rounded-lg bg-<?= $base_color ?>-50 dark:bg-gray-800 dark:text-<?= $base_color ?>-400 dark:border-<?= $base_color ?>-800 shadow-xl transition-all duration-200 ease-out"
  role="alert"
  aria-live="polite"
  data-notice-type="<?= $notice_type ?>"
  data-notice-message="<?= htmlspecialchars( (string) $this->amp_error->getMessage(), ENT_QUOTES, 'UTF-8' ) ?>"
  style="z-index: 10050; width: min(22rem, calc(100vw - 1rem));"
>
  <span class="ui-icon-mask ui-icon-mask--notice-info flex-shrink-0 inline w-5 h-5 mt-0.5" aria-hidden="true"></span>
  <span class="sr-only"><?= __( 'Notify' ) ?></span>
  <div id="alert-message" class="min-w-0 flex-1 text-sm font-medium break-words">
    <span class="font-medium"><?= $this->amp_error->getMessage() ?></span>
  </div>
  <button 
    id="btn-alert-dismiss"
    type="button" 
    class="ml-auto -mr-1 -mt-1 rounded-lg focus:ring-2 focus:ring-<?= $base_color ?>-400 p-1.5 inline-flex items-center justify-center h-8 w-8 bg-<?= $base_color ?>-50 text-<?= $base_color ?>-500 hover:bg-<?= $base_color ?>-200 dark:bg-gray-800 dark:text-<?= $base_color ?>-400 dark:hover:bg-gray-700" 
    aria-label="<?= __( 'Dismiss' ) ?>"
  >
    <span class="sr-only"><?= __( 'Dismiss' ) ?></span>
    <span class="ui-icon-mask ui-icon-mask--close w-3 h-3" aria-hidden="true"></span>
  </button>
</div><!-- /#alert-notification -->
