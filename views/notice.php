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
?>
<div 
  id="alert-notification"
  class="fixed top-0 inset-x-0 w-5/6 max-w-xl md:max-w-sm flex items-center p-4 my-4 mx-auto z-30 text-sm text-<?= $base_color ?>-800 border border-<?= $base_color ?>-300 rounded-lg bg-<?= $base_color ?>-50 dark:bg-gray-800 dark:text-<?= $base_color ?>-400 dark:border-<?= $base_color ?>-800 shadow-md transition-opacity duration-1000 delay-[2000ms] ease-out"
  role="alert"
>
  <svg class="flex-shrink-0 inline w-4 h-4 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
  </svg>
  <span class="sr-only"><?= __( 'Notify' ) ?></span>
  <div class="ml-3 text-sm font-medium">
    <span class="font-medium"><?= $this->amp_error->getMessage() ?></span>
  </div>
  <button 
    type="button" 
    id="btn-alert-dismiss"
    class="ml-auto -mx-1.5 -my-1.5 bg-<?= $base_color ?>-50 text-<?= $base_color ?>-500 rounded-lg focus:ring-2 focus:ring-<?= $base_color ?>-400 p-1.5 hover:bg-<?= $base_color ?>-200 inline-flex items-center justify-center h-8 w-8 dark:bg-gray-800 dark:text-<?= $base_color ?>-400 dark:hover:bg-gray-700" 
    data-dismiss-target="#alert-notification" 
    aria-label="Close"
  >
    <span class="sr-only"><?= __( 'Dismiss' ) ?></span>
    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
    </svg>
  </button>
</div><!-- /#alert-notification -->
