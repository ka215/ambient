<?php
if ( !defined( 'APP_ROOT' ) ) {
    http_response_code( 404 );
    exit;
}

/**
 * This file allows you to customize the view of your ambient application for each user.
 * The processing described in this file is read before drawing the template, and it is
 * possible to hook the output processing of various templates.
 */

// For example, below is a hook to toggle the display of the application's bottom menu.
//amp_set_var( 'menu_type', 2 );

// For example, loads the translated text JSON file prepared by the user and overwrites
// the current translated text.
// However, please note that amp_set_var() fires just before the application is rendered,
// so translations will not be effective for text committed before then.
//amp_set_var( 'translation_data', json_decode( file_get_contents( ASSETS_DIR . 'lang-ja.json' ), true ) );

// Example of adding a custom meta tag to the head:
//amp_add_head_content( '<meta name="custom-meta" content="This is a custom meta tag added to the head." />' );

// Example of adding a custom inline JavaScript to the footer:
//amp_add_footer_script( <<<'EOT'
//    // Example of adding a custom inline JavaScript to the footer
//    const message = 'Welcome to the Ambient application!';
//    console.log(message);
//EOT, 'inline_scripts' );

// Example of adding custom content to the "About Ambient" section.
// This slot accepts trusted HTML from this site-managed custom.php file.
//amp_add_about_content( <<<'HTML'
//<div class="flex flex-col items-center gap-2 text-center text-sm text-gray-500 dark:text-gray-400">
//  <img src="./assets/demo-qr.png" alt="Ambient demo QR code" class="h-32 w-32 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-600">
//  <p>Open the Ambient cloud demo: <a href="https://amp.ka2.org/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline dark:text-blue-500">https://amp.ka2.org/</a></p>
//</div>
//HTML );
