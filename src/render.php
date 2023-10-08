<?php

namespace Magicmethods;

trait render {
    /** @var string */
    public static $amp_scripts;

    /** @var int */
    public $menu_type = 1;

    /**
     * Render this application's views.
     */
    protected function render_template(): void {
        if ( file_exists( APP_ROOT . '/custom.php' ) ) {
            // Include the file for your customizations.
            require_once( APP_ROOT . '/custom.php' );
        }
        include VIEWS_DIR . 'layout.php';
    }

    /**
     * Includes the specified component template.
     */
    public function get_component( string $component ): void {
        if ( file_exists( VIEWS_DIR . $component . '.php' ) ) {
            include VIEWS_DIR . $component . '.php';
        }
    }

    /**
     * Set any value to be passed to JavaScript in this application's view.
     */
    public function set_localize_script( string $var_name, array $var_pair ): void {
        $script = "var $var_name = ". stripslashes( json_encode( $var_pair ) ) .";";
        self::$amp_scripts = $script;
    }

    /**
     * Get localized JavaScript for this application's view.
     */
    public static function amp_localize_script(): string {
        if ( !empty( self::$amp_scripts ) ) {
            return implode( "\n", [ '<script>', self::$amp_scripts, '</script>' ] );
        } else {
            return '';
        }
    }

}
