<?php
// Functions for template of YouTube Player

function amp_set_var( string $var_name, mixed $value ): void {
    if ( isset( $GLOBALS['ambient'] ) ) {
        $GLOBALS['ambient']->set_property( $var_name, $value );
    }
}

/**
 * Add custom JavaScript to the footer.
 * @param string $content The JavaScript code to add.
 * @param string $type The type of the script (e.g., 'scripts' or 'inline_scripts'). Default is 'scripts'.
 * @since v2.2.3
 */
function amp_add_footer_script( string $content, string $type = 'scripts' ): void {
    if ( isset( $GLOBALS['ambient'] ) ) {
        $GLOBALS['ambient']->enqueue_asset( 'footer', $type, $content );
    }
}

/**
 * Add custom content to the head.
 * @param string $html The HTML code to add to the head.
 * @param string $type The type of the head asset (e.g., 'meta', 'scripts', 'inline_scripts', or 'styles'). Default is 'meta'.
 * @since v2.2.3
 */
function amp_add_head_content( string $html, string $type = 'meta' ): void {
    if ( isset( $GLOBALS['ambient'] ) ) {
        $GLOBALS['ambient']->enqueue_asset( 'head', $type, $html );
    }
}

function is_local(): bool {
    return isset( $GLOBALS['ambient'] ) ? $GLOBALS['ambient']->is_local() : false;
}

function is_cloud(): bool {
    return isset( $GLOBALS['ambient'] ) ? $GLOBALS['ambient']->is_cloud() : true;
}

function __( string $text ): string {
    return isset( $GLOBALS['ambient'] ) ? $GLOBALS['ambient']->__( $text ) : $text;
}

function amp_head(): string {
    $styles = glob( VIEWS_DIR . '/css/*.css' );
    if ( !empty( $styles ) ) {
        $styles = array_map( function( $value ) {
            return sprintf( '<link href="./%s/css/%s?%s" rel="stylesheet" />', basename( VIEWS_DIR ), basename( $value ), filemtime( $value ) );
        }, $styles );
    }
    $add_styles = implode( "\n", $styles );

    $ambient = $GLOBALS['ambient'] ?? null;
    $output = [];

    $tailwind_min = './dist/tailwindcss.min.css';
    $tailwind_css = './dist/tailwindcss.css';
    if ( file_exists( $tailwind_min ) ) {
        $output[] = '<link href="' . $tailwind_min . '?'. filemtime( $tailwind_min ) . '" rel="stylesheet" />';
    } elseif ( file_exists( $tailwind_css ) ) {
        $output[] = '<link href="' . $tailwind_css . '?'. filemtime( $tailwind_css ) . '" rel="stylesheet" />';
    } else {
        $output[] = '<link href="./dist/tailwindcss.css" rel="stylesheet" />';
    }
    $output[] = '<link href="./dist/flowbite.min.css" rel="stylesheet" />';
    $output[] = '<link rel="preload" href="https://www.youtube.com/player_api" as="script" />';
    // $output[] = '<script src="https://www.youtube.com/iframe_api"></script>';
    // $output[] = '<link href="//mplus-webfonts.sourceforge.jp/mplus_webfonts.css" rel="stylesheet" />';
    $output[] = '<link rel="icon" href="./'. basename( VIEWS_DIR ) .'/images/ambient.ico">';
    $output[] = $add_styles;

    // Include dynamic assets from Ambient instance - @since v2.2.3
    if ( $ambient ) {
        $assets = $ambient->get_assets( 'head' );
        
        // 1. Meta tag (Raw HTML)
        if ( !empty( $assets['meta'] ) ) {
            $output[] = implode( "\n", $assets['meta'] );
        }
        // 2. Script tag
        if ( !empty( $assets['scripts'] ) ) {
            $output[] = implode( "\n", $assets['scripts'] );
        }
        // 3. Inline Scripts (Raw JavaScript)
        if ( !empty( $assets['inline_scripts'] ) ) {
            $output[] = implode( "\n", [ '<script>', implode( "\n", $assets['inline_scripts'] ), '</script>' ] );
        }
        // 4. Inline Styles (Raw CSS)
        if ( !empty( $assets['styles'] ) ) {
            $output[] = "<style>\n" . implode( "\n", $assets['styles'] ) . "\n</style>";
        }
    }

    return implode( "\n", $output );
}

function amp_component( string $component ): void {
    $GLOBALS['ambient']->get_component( $component );
}

function amp_footer(): string {
    $ambient = $GLOBALS['ambient'] ?? null;
    $output = [];
    // $output[] = '<script src="https://cdn.jsdelivr.net/npm/fs-js@1.0.6/index.min.js" type="module"></script>';
    $output[] = '<script src="./dist/flowbite.min.js"></script>';
    $sortable_paths = [
        './dist/vendor/sortable.min.js',
        './node_modules/sortablejs/Sortable.min.js',
    ];
    foreach ( $sortable_paths as $sortable_path ) {
        if ( file_exists( $sortable_path ) ) {
            $sortable_path .= '?'. filemtime( $sortable_path );
            $output[] = '<script src="'. $sortable_path . '"></script>';
            break;
        }
    }

    $script_path = './dist/scripts/ambient.js';
    if ( file_exists( $script_path ) ) {
        $script_path .= '?'. filemtime( $script_path );
        $output[] = '<script src="'. $script_path. '"></script>';
    }

    // Include dynamic footer scripts from Ambient instance - @since v2.2.3
    if ( $ambient ) {
        $assets = $ambient->get_assets( 'footer' );
        // 1. Script tag
        if ( !empty( $assets['scripts'] ) ) {
            $output[] = implode( "\n", $assets['scripts'] );
        }
        // 2. Inline Scripts (Raw JavaScript)
        if ( !empty( $assets['inline_scripts'] ) ) {
            $output[] = implode( "\n", [ '<script>', implode( "\n", $assets['inline_scripts'] ), '</script>' ] );
        }
    }

    return implode( "\n", $output );
}
