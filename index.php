<?php
/**
 * Ambient
 *
 * @package           Ambient
 * @version           1.0.0
 * @author            ka2
 * @copyright         2023 MAGIC METHODS
 * @license           MIT License
 */
define( 'APP_ROOT',   realpath( './' ).'/' );
define( 'ASSETS_DIR', APP_ROOT.'/assets/'  );
define( 'MEDIA_DIR',  ASSETS_DIR.'media/'  );
define( 'IMAGES_DIR', ASSETS_DIR.'images/' );
define( 'VIEWS_DIR',  APP_ROOT.'/views/'   );
define( 'LOGS_DIR',   APP_ROOT.'/logs/'    );
define( 'DEBUG_MODE', true );

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
