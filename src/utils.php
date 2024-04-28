<?php

namespace Magicmethods;

use DateTimeImmutable;
use DateTimeZone;

trait utils {
    /** @var ?string */
    protected $buffers;

    /**
     * Filter requested parameters.
     * 
     * @return array<string>
     */
    protected function filter_params() {
        $type = $_SERVER['REQUEST_METHOD'] === 'POST' ? INPUT_POST : INPUT_GET;
        $params = filter_input_array( $type, [
            'action'            => FILTER_SANITIZE_ENCODED,
            'playlist'          => FILTER_SANITIZE_ENCODED,
            'category'          => FILTER_SANITIZE_ENCODED,
            'is_randomly'       => FILTER_VALIDATE_INT,
            'is_seekable'       => FILTER_VALIDATE_INT,
            'video_id'          => FILTER_SANITIZE_ENCODED,
            'image_src'         => FILTER_SANITIZE_ENCODED,
        ] );
        $this->logger( __METHOD__, $type, $params );
        return $params;
    }

    /**
     * If there is a JSON file that is defined the translational text, load it.
     */
    protected function load_translation_data() {
        $files = glob( ASSETS_DIR . '*.[Jj][Ss][Oo][Nn]' );
        if ( $files ) {
            array_walk( $files, function( $file ) {
                if ( preg_match( '/^lang(.*)?\.json$/i', basename( $file ), $matches ) ) {
                    if ( isset( $matches[1] ) ) {
                        $_key = empty( $matches[1] ) ? 'origin' : trim( $matches[1], '_-' );
                    }
                    if ( file_exists( ASSETS_DIR . $matches[0] ) ) {
                        $_preload = json_decode( file_get_contents( ASSETS_DIR . $matches[0] ), true );
                        if ( array_key_exists( '$language', $_preload ) ) {
                            $lang_name = $_preload['$language'];
                            unset( $_preload['$language'] );
                        } else {
                            $lang_name = $_key;
                        }
                        $this->languages[$_key] = [
                            'file' => $matches[0],
                            'name' => $lang_name,
                            'data' => $_preload,
                        ];
                    }
                }
            } );
            if ( count( $this->languages ) > 1 ) {
                uksort( $this->languages, function( $a, $b ) {
                    if ( $a === 'origin' ) {
                        return -1;
                    } elseif ( $b === 'origin' ) {
                        return 1;
                    } else {
                        return strcmp( $a, $b );
                    }
                } );
            }
        }

        /* if ( isset( $_SESSION['lang'] ) ) {
            $this->logger( __METHOD__, $_SESSION['lang'] );
            $this->current_lang = $_SESSION['lang'];
        } else */
        if ( isset( $_COOKIE['lang'] ) && !empty( $_COOKIE['lang'] ) ) {
            $this->current_lang = $_COOKIE['lang'];
            //$_SESSION['lang'] = $_COOKIE['lang'];
        } else {
            $this->current_lang = 'origin';
        }

        $target_file = ASSETS_DIR . $this->languages[$this->current_lang]['file'];
        //$this->logger( __METHOD__, $this->languages, $this->current_lang, $target_file, $_COOKIE );

        if ( !empty( $this->languages ) && file_exists( $target_file ) ) {
            $this->translation_data = $this->languages[$this->current_lang]['data'];
        }
        /*
        if ( empty( $this->translation_data ) && file_exists( ASSETS_DIR . 'lang.json' ) ) {
            $this->translation_data = json_decode( file_get_contents( ASSETS_DIR . 'lang.json' ), true );
            if ( array_key_exists( '$language', $this->translation_data ) ) {
                $this->current_lang = $this->translation_data['$language'];
                unset( $this->translation_data['$language'] );
            }
        }
        */
    }

    /**
     * Modify the specified member variable of this class.
     * 
     * @param string $var_name
     * @param mixed  $value     "mixed" type since php8
     * @return void
     */
    public function set_property( string $var_name, $value ): void {
        if ( property_exists( $this, $var_name ) ) {
            $this->$var_name = $value;
        }
    }

    /**
     * Search playlist json or yaml file from assets dir.
     */
    protected function find_playlist(): void {
        // php requires PECL yaml module extension to support yaml files.
        // $results = glob( ASSETS_DIR . '*.{[Jj][Ss][Oo][Nn],[Yy][Aa][Mm][Ll]}', GLOB_BRACE );
        $results = glob( ASSETS_DIR . '*.[Jj][Ss][Oo][Nn]' );
        if ( $results ) {
            array_walk( $results, function( $value ) {
                if ( !preg_match( '/^lang(|-?.+?)\.json$/i', basename( $value ) ) ) {
                    $this->playlists[basename( $value )] = $value;
                }
            } );
        }
    }

    /**
     * Recursively searches the specified directory and its subdirectories 
     * to obtain a list of matching files.
     */
    public function recursive_glob( string $pattern, int $flags = 0 ): array {
        $files = glob( $pattern, $flags );
        foreach ( glob( dirname( $pattern ) . '/*', GLOB_ONLYDIR|GLOB_NOSORT ) as $dir ) {
            $files = array_merge( $files, $this->recursive_glob( $dir .'/'. basename( $pattern ), $flags ) );
        }
        return $files;
    }

    /**
     * Filter data by media in playlist.
     * 
     * @param  array $media
     * @return array
     */
    protected function filter_media( array $media ): array {
        foreach ( $media as $category => $items ) {
            $media[$category] = array_map( function( $item ) {
                if ( array_key_exists( 'start', $item ) && ((string)$item['start'] === '0' || !empty( $item['start'] )) ) {
                    $item['start'] = $this->filter_seeking( (string)$item['start'] );
                }
                if ( array_key_exists( 'end', $item ) && ((string)$item['end'] === '0' || !empty( $item['end'] )) ) {
                    $item['end'] = $this->filter_seeking( (string)$item['end'] );
                }
                if ( array_key_exists( 'image', $item ) && !empty( $item['image'] ) ) {
                    $this->logger(__METHOD__, IMAGES_DIR . $item['image'], file_exists( IMAGES_DIR . $item['image'] ));
                    if ( file_exists( IMAGES_DIR . $item['image'] ) ) {
                        $_pi = pathinfo( $item['image'] );
                        $_pattern = sprintf( '%3$s{%1$s_thumb.%2$s,%1$s-thumb.%2$s}', $_pi['filename'], $_pi['extension'], IMAGES_DIR );
                        $thumbs = glob( $_pattern, GLOB_BRACE );
                        if ( !empty( $thumbs ) ) {
                            $item['thumb'] = basename( $thumbs[0] );
                        }
                    } else {
                        $item['image'] = '';
                    }
                }
                if ( array_key_exists( 'file', $item ) && !empty( $item['file'] ) ) {
                    if ( file_exists( MEDIA_DIR . $item['file'] ) ) {
                        //$item['file'] = realpath( MEDIA_DIR . $item['file'] );
                        $item['file'] = str_replace( APP_ROOT, './', MEDIA_DIR . $item['file'] );
                    } else {
                        $item['file'] = '';
                    }
                }
                return $item;
            }, $items );
        }
        return $media;
    }

    /**
     * Filters the time format of seek point that play start or end of media.
     * 
     * @param string $seek_point
     * @return float
     */
    protected function filter_seeking( string $seek_point ): float {
        //$orig_seek_point = $seek_point;// debug
        if ( !is_numeric( $seek_point ) ) {
            $parse_times = explode( ':', $seek_point );
            if ( count( $parse_times ) == 3 ) {
                $hours   = (int)$parse_times[0];
                $minutes = (int)$parse_times[1];
                $seconds = (int)$parse_times[2];
                $seek_point = ($hours * 60 * 60) + ($minutes * 60) + $seconds;
            } elseif ( count( $parse_times ) == 2 ) {
                $minutes = (int)$parse_times[0];
                $seconds = (int)$parse_times[1];
                $seek_point = ($minutes * 60) + $seconds;
            } else {
                $seek_point = (int)$parse_times[0];
            }
        } else {
            $seek_point = (int)$seek_point;
        }
        //$this->logger( __METHOD__, $orig_seek_point, '->', $seek_point );
        return $seek_point;
    }

    /**
     * Minify an internal CSS
     *
     * @param  string $internal_css      An internal CSS that wrapped by `<style></style>`
     * @return string
     */
    public static function minify_css( string $internal_css ): string {
        return preg_replace( [ '@\s*([{}|:;,])\s+|\s*(\!)|/\*.+?\*\/|\R@is', '@;(})@' ], '$1$2', $internal_css );
    }

    /**
     * Filter text based on translation data.
     *
     * @param  string $text
     * @return string
     */
    public function __( string $text ): string {
        //$this->logger( __METHOD__, $text );
        if ( !empty( $this->translation_data ) && array_key_exists( $text, $this->translation_data ) ) {
            return $this->translation_data[$text] ?: $text;
        } else {
            $this->logger( 'Undefined translated text: "'. $text .'"' );
            return $text;
        }
    }

    /**
     * Retrieves a version number from package.json read.
     */
    public function get_version(): string {
        $version = 'undefined';
        //$this->logger(__METHOD__, $this->package_info, property_exists( $this, 'package_info' ));
        if ( property_exists( $this, 'package_info' ) ) {
            $version = $this->package_info['version'];
        }
        return $version;
    }

    /**
     * Whether the application is running locally.
     *
     * @return bool
     */
    public static function is_local(): bool {
        $server_addr = $_SERVER['SERVER_ADDR'];
        $remote_addr = $_SERVER['REMOTE_ADDR'];
        return substr( $server_addr, 0, mb_strrpos( $server_addr, '.' ) ) === substr( $remote_addr, 0, mb_strrpos( $remote_addr, '.' ) );
    }

    /**
     * Logger for debug.
     *
     * @param  mixed[] $args
     * @return void
     */
    public function logger( ...$args ): void {
        if ( !defined( 'DEBUG_MODE' ) || !DEBUG_MODE ) {
            return;
        }
        ob_start();
        var_export( $args );
        $this->buffers = ob_get_contents();
        ob_get_clean();
        if ( $this->buffers ) {
            $date = new DateTimeImmutable( 'now', new DateTimeZone( 'Asia/Tokyo' ) );
            if ( !file_exists( LOGS_DIR ) ) {
                if ( mkdir( LOGS_DIR, 0755 ) ) { 
                    @touch( LOGS_DIR . 'debug.log' );
                    @chmod( LOGS_DIR . 'debug.log', 0755 );
                }
            }
            if ( file_exists( LOGS_DIR . 'debug.log' ) ) {
                error_log( $date->format( '[y:m:d h:i:s] ') . $this->buffers . "\n", 3, LOGS_DIR . 'debug.log' );
            }
            $this->buffers = null;
        }
    }

    /**
     * Clear log file.
     * 
     * @return void
     */
    private function clear_log(): void {
        $logfile_path = LOGS_DIR . 'debug.log';
        if ( DIRECTORY_SEPARATOR === '\\' ) {
            $cmd = "type nul > $logfile_path";
        } else {
            $cmd = ": > $logfile_path";
        }
        system( $cmd );
    }

}
