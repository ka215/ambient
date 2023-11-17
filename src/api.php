<?php

namespace Magicmethods;

trait api {
    /** @var ?array */
    private $api_response;

    /**
     * Handler for calling the method corresponding to the API endpoint.
     * 
     * @param  string $method
     * @param  array  $args
     * @return void
     */
    private function api_request_handler( string $method, array $args ): void {
        if ( method_exists( $this, $method ) && is_array( $args ) ) {
            $this->logger( __METHOD__, __TRAIT__, $method, $args );
            // Perform pre-processing when calling API.
            $this->pre_processing_requested_api();

            call_user_func_array( [ $this, $method ], $args );
        }
    }

    /**
     * Perform pre-processing for API requests.
     * For example, you can insert authentication processing, etc.
     */
    private function pre_processing_requested_api(): void {
        $result = true;

        if ( !$result ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 401,
                'data'  => [
                    'message' => $this->__( 'Unauthorized request.' ),
                ]
            ];
            $this->return_response();
        }
    }

    /**
     * This is an API endpoint for obtaining valid playlist data.
     * 
     * @param  ?string $playlist_file
     * @return  void                    At post-processing returns an array for the response.
     */
    private function get_playlist( ?string $playlist_file = null ): void {
        $this->find_playlist();

        if ( empty( $this->playlists ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 404,
                'data'  => [
                    'message' => $this->__( 'Playlist not found. Please create a new playlist.' ),
                ]
            ];
        } else {
            if ( $playlist_file ) {
                if ( array_key_exists( $playlist_file, $this->playlists ) ) {
                    $file_ext = strtolower( pathinfo( $this->playlists[$playlist_file], PATHINFO_EXTENSION ) );
                    $raw_data = file_get_contents( $this->playlists[$playlist_file] );
                    if ( $file_ext === 'json' ) {
                        $playlist_data = json_decode( $raw_data, true );
                    } else {
                        // php requires PECL yaml module extension.
                        //$playlist_data = yaml_parse( $raw_data );
                    }
                    if ( array_key_exists( 'options', $playlist_data ) ) {
                        $playlist_options = $playlist_data['options'];
                        unset( $playlist_data['options'] );
                    }
                    $this->api_response = [
                        'state' => 'ok',
                        'code'  => 200,
                        'data'  => [
                            'filename' => $playlist_file,
                            'src'      => str_replace( APP_ROOT, '.', $this->playlists[$playlist_file] ),
                            'media'    => $this->filter_media( $playlist_data ),
                            'options'  => isset( $playlist_options ) ? $playlist_options : null,
                        ],
                    ];
                } else {
                    $this->api_response = [
                        'state' => 'error',
                        'code'  => 404,
                        'data'  => [
                            'message' => $this->__( 'Specified playlist could not be found.' ),
                        ],
                    ];
                }
            } else {
                $relative_playlist = [];
                foreach ( $this->playlists as $_file => $_path ) {
                    //$filename = pathinfo( $_file, PATHINFO_FILENAME );
                    $relative_playlist[$_file] = str_replace( APP_ROOT, '.', $_path );
                }
                $this->api_response = [
                    'state' => 'ok',
                    'code'  => 200,
                    'data'  => $relative_playlist,
                ];
            }
        }
    }

    /**
     * This is an API endpoint to search for the corresponding file in the media directory and obtain the relative path.
     * 
     * @param  string $filename
     * @return void             At post-processing returns an array for the response.
     */
    private function get_filepath( string $filename ): void {
        if ( preg_match( '/\[(.*)\]/', $filename ) ) {
            $extension = pathinfo( $filename, PATHINFO_EXTENSION );
            $files = $this->recursive_glob( MEDIA_DIR .'*.'. $extension );
            $files = array_values( array_filter( $files, function( $filepath ) use( $filename ) {
                return strpos( $filepath, $filename ) !== false;
            } ) );
        } else {
            $files = $this->recursive_glob( MEDIA_DIR .'*'. $filename );
        }
        if ( !empty( $files ) ) {
            $relative_filepath = str_replace( APP_ROOT, './', $files[0] );
        } else {
            $relative_filepath = '';
        }
        $this->logger( __METHOD__, $filename, $files, $relative_filepath );
        if ( empty( $relative_filepath ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 404,
                'data'  => $this->__( 'File not found in media directory.' ),
            ];
        } else {
            $this->api_response = [
                'state' => 'ok',
                'code'  => 200,
                'data'  => rawurlencode( $relative_filepath ),
            ];
        }
    }

    /**
     * Output JSON data as the response of the API endpoint.
     * 
     * @return void
     */
    private function return_response(): void {
        header( 'Content-type: application/json; charset=UTF-8' );
        echo json_encode( $this->api_response );
        die();
    }

}
