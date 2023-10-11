<?php
// Functions for template of YouTube Player

function amp_set_var( string $var_name, mixed $value ): void {
    if ( isset( $GLOBALS['ambient'] ) ) {
        $GLOBALS['ambient']->set_property( $var_name, $value );
    }
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

    $output = [];
    $output[] = '<link href="./dist/tailwindcss.css?20231005" rel="stylesheet" />';
    $output[] = '<link href="./dist/flowbite.min.css" rel="stylesheet" />';
    $output[] = '<link rel="preload" href="https://www.youtube.com/player_api" as="script" />';
    $output[] = '<script src="https://www.youtube.com/iframe_api"></script>';
    //$output[] = '<link href="//mplus-webfonts.sourceforge.jp/mplus_webfonts.css" rel="stylesheet" />';
    $output[] = $add_styles;

    if ( !empty( $GLOBALS['ambient']::$amp_scripts ) ) {
        $output[] = implode( "\n", [ '<script>', $GLOBALS['ambient']::$amp_scripts, '</script>' ] );
    }

    return implode( "\n", $output );
}

function amp_component( string $component ): void {
    $GLOBALS['ambient']->get_component( $component );
}

function amp_footer(): string {
    $GLOBALS['ambient']->logger( __METHOD__ );
    $output = [];
    //$output[] = '<script src="https://cdn.jsdelivr.net/npm/fs-js@1.0.6/index.min.js" type="module"></script>';
    $output[] = '<script src="./dist/flowbite.min.js"></script>';

    $script_path = './src/scripts/ambient.js';
    if ( file_exists( $script_path ) ) {
        $script_path .= '?'. filemtime( $script_path );
        $output[] = '<script src="'. $script_path. '"></script>';
    }

    return implode( "\n", $output );
}
