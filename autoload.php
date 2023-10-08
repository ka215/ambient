<?php
/**
 * Autoloader based on namespace
 */
spl_autoload_register( function( $class ) {
    $class_file = str_replace( '\\', DIRECTORY_SEPARATOR, ltrim( $class, '\\' ) ).'.php';
    $class_dir  = 'src';
    $class_dir_path = __DIR__ . DIRECTORY_SEPARATOR . $class_dir . DIRECTORY_SEPARATOR;

    if ( file_exists( $class_dir_path . $class_file ) ) {
        $target_file = $class_dir_path . $class_file;
    } elseif ( file_exists( $class_dir_path . basename( $class_file ) ) ) {
        $target_file = $class_dir_path . basename( $class_file );
    }
    if ( isset( $target_file ) ) {
        require_once $target_file;
    }
});
