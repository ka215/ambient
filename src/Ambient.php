<?php

namespace Magicmethods;

use stdClass;
use Error;
use ErrorException;

class Ambient {
    /** @var ?array<string> */
    protected $package_info;

    /** @var ?array<string> */
    public $translation_data;

    /** @var ?string */
    public $current_lang;

    /** @var ?array<string> */
    protected $playlists;

    /** @var ?object */
    public $amp_error;

    use utils;

    use api;

    use render;

    /**
     * Initialize this application.
     */
    public function setup(): void {
        $this->clear_log();

        register_shutdown_function( [ $this, 'shutdown' ] );

        $this->load_translation_data();
        //$this->logger( $this->translation_data, $this->current_lang );

        set_error_handler( [ $this, 'error_handler' ] );

        $this->package_info = json_decode( file_get_contents( APP_ROOT . 'package.json' ), true );

        $this->find_playlist();

        if ( empty( $this->playlists ) ) {
            $this->set_warn( $this->__( 'Playlist not found. Please create a new playlist.' ) );
        } else {
            // Pass all playlist data to JavaScript of view.
            $relative_playlists = [];
            foreach ( $this->playlists as $_k => $_v ) {
                $relative_playlists[$_k] = str_replace( APP_ROOT, '.', $_v );
            }
            $localize_data = [
                'playlists' => $relative_playlists,
            ];
            if ( count( $this->playlists ) > 1 ) {
                // If there are multiple playlists, prompt you to select a playlist.
                $this->set_notice( $this->__( 'Get choose your playlist you want to play from the settings menu.' ) );
            } else {
                // If there is only one playlist, define it as the initial playlist.
                $localize_data['currentPlaylist'] = array_key_first( $relative_playlists );
            }
            $has_images = count( glob( IMAGES_DIR . '{*.jpg,*.jpeg,*.png,*.webp,*.bmp,*.gif}', GLOB_BRACE) ) > 0;
            if ( $has_images ) {
                $localize_data['imageDir'] = str_replace( APP_ROOT, './', IMAGES_DIR );
            }
            if ( defined( 'DEBUG_MODE' ) && DEBUG_MODE ) {
                $localize_data['debug'] = true;
            }
            $this->set_localize_script( 'AmbientData', $localize_data );
        }

        //self::logger( __METHOD__, $this->translation_data, $this->playlists );

        // Routing the requested endpoint.
        $this->route_endpoint();

        // Output the view.
        $this->render_template();
    }

    /**
     * Interpret rewritten endpoints and route appropriately.
     */
    private function route_endpoint(): void {
        $this->api_response = null;
        $protocol = isset( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $uri = isset( $_SERVER['REQUEST_URI'] ) ? urldecode( $_SERVER['REQUEST_URI'] ) : '';
        $current_url  = $protocol . "://" . $host . $uri;
        $current_path = parse_url( $current_url, PHP_URL_PATH );// `/ambient/playlist/~.json`, `/playlist/`
        $doc_root = DIRECTORY_SEPARATOR === '/' ? $_SERVER['DOCUMENT_ROOT'] : str_replace( '/', DIRECTORY_SEPARATOR, $_SERVER['DOCUMENT_ROOT'] );
        $relative_app_root = stripslashes( str_replace( $doc_root, '', APP_ROOT ) );// `ambient/`, `/`
        $paths = explode( $relative_app_root, $current_path );
        $_paths = null;
        if ( isset( $paths[1] ) ) {
            $request_name = strpos( $paths[1], '/' ) !== false ? strstr( $paths[1], '/', true ) : $paths[1];
            $_paths = strpos( $paths[1], '/' ) !== false ? explode( '/', substr( $paths[1], strpos( $paths[1], '/' ) + 1 ) ) : null;
        }
        if ( count( $paths ) > 2 ) {
            $_paths = array_slice( $paths, 2 );
        }
        $request_route = strtolower( $_SERVER['REQUEST_METHOD'] ) .':'. $request_name;
        $params = !empty( $_paths ) ? array_values( array_map( function( $_path ) { return htmlspecialchars( $_path ); }, $_paths ) ) : null;
        $args = [];
        switch ( $request_route ) {
            case 'get:playlist':
                $method = 'get_playlist';
                if ( $params ) {
                    $_route = "Get playlist \"{$params[0]}\"";
                    //$this->get_playlist( $params[0] );
                    $args[] = $params[0];
                } else {
                    $_route = 'Get all playlists';
                    //$this->get_playlist();
                }
                break;
            case 'get:filepath':
                $method = 'get_filepath';
                $pathinfo_basename = pathinfo( $current_path, PATHINFO_BASENAME );
                $_route = "Retrieve media filepath \"{$pathinfo_basename}\"";
                $args[] = $pathinfo_basename;
                break;
            case 'post:playlist':
                $method = 'upsert_playlist';
                $_route = "Add item to playlist \"{$params[0]}\"";
                $args[] = $params[0];
                break;
            default:
                $_route = "Normal access";
                break;
        }
        $this->logger( __METHOD__, $request_route, $params, $_route, $paths );
        if ( isset( $method ) && isset( $args ) ) {
            $this->api_request_handler( $method, $args );
        }

        if ( $this->api_response ) {
            $this->return_response();
        }
    }

    /**
     * Error handling for this class.
     * 
     * @param  int    $errno
     * @param  string $errstr
     * @param  string $errfile
     * @param  int    $errline
     * @return null|bool|void
     */
    public function error_handler( int $errno, string $errstr, string $errfile, int $errline ) {
        if ( !( error_reporting() & $errno ) ) {
            return;
        }
        $errstr = htmlspecialchars( $errstr );
        switch ( $errno ) {
            case \E_USER_ERROR:
                $output = [];
                $output[] = "<b>Ambient ERROR</b> [$errno] $errstr";
                $output[] = "  Fatal error on line $errline in file $errfile, PHP ". \PHP_VERSION ." (". \PHP_OS .")";
                $output[] = "Aborting...";
                $this->amp_error = new Error( implode( "<br/>\n", $output ), $errno );
                //echo implode( "<br/>\n", $output );
                //exit(1);
                break;
            case \E_USER_WARNING:
            case \E_USER_NOTICE:
                $this->amp_error = new Error( $errstr, $errno );
                break;
            default:
                throw new ErrorException( $errstr, $errno, 0, $errfile, $errline );
        }
        return true;
    }

    /**
     * Set error object as fatal error.
     *
     * @param  string $message
     * @return void
     */
    protected function set_error( string $message ): void {
        $caller = next( debug_backtrace() );
        $errstr = sprintf( '%s in <strong>%s</strong> called from <strong>%s</strong> on line <strong>%d</strong>', $message, $caller['function'], $caller['file'], (int)$caller['line'] );
        $errstr .= "<br>error handler";
        trigger_error( $errstr, \E_USER_ERROR );
    }

    /**
     * Set error object as warning.
     *
     * @param  string $message
     * @return void
     */
    protected function set_warn( string $message ): void {
        trigger_error( $message, \E_USER_WARNING );
    }

    /**
     * Set error object as notice.
     * 
     * @param  string $message
     * @return void
     */
    protected function set_notice( string $message ): void {
        trigger_error( $message, \E_USER_NOTICE );
    }

    /**
     * Check error.
     * 
     * @return bool
     */
    protected function is_error(): bool {
        //$this->logger( __METHOD__, $this->amp_error, !empty( $this->amp_error ) );
        return !empty( $this->amp_error );
    }

    /**
     * Method for execution on shutdown.
     */
    protected function shutdown(): void {
        if ( defined( 'DEBUG_MODE' ) && DEBUG_MODE ) {
            // Do currently nothing.
        }
    }

    /**
     * Singleton instantiator.
     *
     * @return object $instance     instance of Ambient class.
     */
    public static function get_instance(): object {
        static $instance;

        if ( !isset( $instance ) ) {
            $instance = new Ambient();
        }

        return $instance;
    }

    /**
     * Private class constructor. Use `get_instance()` to get the instance.
     */
    private function __construct() {}

}