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
amp_set_var( 'menu_type', 2 );

// For example, loads the translated text JSON file prepared by the user and overwrites 
// the current translated text.
// However, please note that amp_set_var() fires just before the application is rendered, 
// so translations will not be effective for text committed before then.
// amp_set_var( 'translation_data', json_decode( file_get_contents( ASSETS_DIR . 'lang-ja.json' ), true ) );

// Example of adding a custom meta tag to the head:  
//amp_add_head_content( '<meta name="custom-meta" content="This is a custom meta tag added to the head." />' );

amp_add_head_content( <<<'EOT'
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PDSBP5PB');
EOT, 'inline_scripts' );

// Debugging: Adding custom CSS to the head of the document
amp_add_head_content( <<<'EOT'
.icon--playlist-desc {
    font-size: 0.75rem;
    line-height: 1rem;
    color: #6b7280;
    pointer-events: auto;
    transform: rotate(0.03deg);
}
.icon--playlist-desc[data-desc=""] {
    display: none;
}
EOT, 'styles' );

// Example of adding a custom inline JavaScript to the footer:  
//amp_add_footer_script( <<<'EOT'
//    // Example of adding a custom inline JavaScript to the footer
//    const message = 'Welcome to the Ambient application!';
//    console.log(message);
//EOT, 'inline_scripts' );

amp_add_footer_script( <<<'EOT'
callbackDesc = (desc) => {
    console.log(desc);
    alert(desc);
}
EOT, 'inline_scripts' );
