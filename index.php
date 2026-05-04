<?php
/**
 * Ambient
 *
 * @package           Ambient
 * @version           2.0.0
 * @author            ka2
 * @copyright         2023 MAGIC METHODS
 * @license           MIT License
 */
define( 'APP_ROOT', realpath( __DIR__ ) . '/' );

require_once APP_ROOT . 'config/bootstrap.php';

define( 'ASSETS_DIR', amp_resolve_dir( amp_env( 'ASSETS_DIR', 'assets' ), APP_ROOT ) );
define( 'MEDIA_DIR',  ASSETS_DIR . 'media/' );
define( 'IMAGES_DIR', ASSETS_DIR . 'images/' );
define( 'VIEWS_DIR',  APP_ROOT . 'views/' );
define( 'LOGS_DIR',   amp_resolve_dir( amp_env( 'LOGS_DIR', 'logs' ), APP_ROOT ) );
define( 'DEBUG_MODE', amp_env_bool( 'DEBUG_MODE', false ) );

require_once APP_ROOT . 'autoload.php';

use Magicmethods\Ambient;

$class = 'Magicmethods\Ambient';

if ( class_exists( $class ) ) {
    // Allow extend functions file
    if ( file_exists( __DIR__ . '/functions.php' ) ) {
        require_once( __DIR__ . '/functions.php' );
    }
    $GLOBALS['ambient'] = Ambient::get_instance();
    $GLOBALS['ambient']->setup();
} else {
    trigger_error( "Unable to load class: $class", E_USER_WARNING );
    exit;
}
