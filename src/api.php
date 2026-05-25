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
     * This is an API endpoint to search for the corresponding file in the media directory 
     * and obtain the relative path.
     * 
     * @param  string $filename
     * @return void             At post-processing returns an array for the response.
     */
    private function get_filepath( string $filename ): void {
        if ( preg_match( '/\[(.*)\]/', $filename ) ) {
            $extension = pathinfo( $filename, PATHINFO_EXTENSION );
            $files = $this->recursive_glob( MEDIA_DIR .'*.'. $extension );
            $files = array_values( array_filter( $files, function( $filepath ) use( $filename ) {
                return str_contains( $filepath, $filename );
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
     * This is an API endpoint that creates a symbolic link for the specified destination 
     * into the media directory.
     * 
     * @param  string $local_media_dir
     * @param  string $symlink_name
     * @return void                    At post-processing returns an array for the response.
     */
    private function create_symlink( string $local_media_dir, string $symlink_name ): void {
        $error_message = '';
        if ( !$this->is_local() ) {
            $error_message = $this->__( 'This feature cannot be performed on remote hosts.' );
        } elseif ( !file_exists( $local_media_dir ) ) {
            $error_message = $this->__( 'The path to link to does not exist.' );
        } elseif ( file_exists( MEDIA_DIR . $symlink_name ) ) {
            $error_message = $this->__( 'A link with the same name already exists.' );
        } else {
            if ( DIRECTORY_SEPARATOR === '\\' ) {
                // Use `mklink` on Windows OS.
                $command = 'mklink';
                $exec_command = sprintf( '%s /D "%s" "%s"', $command, MEDIA_DIR . $symlink_name, $local_media_dir );
                exec( $exec_command, $output, $returnCode );
                $this->logger( __METHOD__, 'for Windows', $exec_command, $output, $returnCode );
                if ( $returnCode !== 0 ) {
                    $error_message = $this->__( 'Failed to create symbolic link.' );
                }
            } else {
                // Use `ln` on Linux OS etc.
                $command = 'ln';
                $check   = shell_exec( 'which ' . escapeshellarg( $command ) );
                if ( $check == null ) {
                    $error_message = $this->__( 'The command to make symbolic link is not available in the current environment.' );
                } else {
                    $exec_command = sprintf( '%s -s "%s" "%s"', $command, $local_media_dir, MEDIA_DIR . $symlink_name );
                    exec( $exec_command, $output, $returnCode );
                    $this->logger( __METHOD__, 'for Linux', $exec_command, $output, $returnCode );
                    if ( $returnCode !== 0 ) {
                        $error_message = $this->__( 'Failed to create symbolic link.' );
                    }
                }
            }
        }
        if ( !empty( $error_message ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => $error_message,
                //'cmd'   => isset( $exec_command ) ? $exec_command : null,
            ];
        } else {
            $this->api_response = [
                'state' => 'ok',
                'code'  => 200,
                'data'  => $this->__( 'Symbolic link created successfully.' ),
                //'cmd'   => $exec_command,
            ];
        }
    }

    /**
     * This is an API endpoint that saves (upserts) playlist JSON data to the specified file.
     * Accepts JSON body in POST request and writes it to the playlist file.
     *
     * @param  string $playlist_file
     * @return void                    At post-processing returns an array for the response.
     */
    private function upsert_playlist( string $playlist_file ): void {
        $this->find_playlist();

        if ( !array_key_exists( $playlist_file, $this->playlists ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 404,
                'data'  => [
                    'message' => $this->__( 'Specified playlist could not be found.' ),
                ],
            ];
            return;
        }

        $raw_input = file_get_contents( 'php://input' );
        if ( strlen( $raw_input ) > 10 * 1024 * 1024 ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Request body too large.' ),
                ],
            ];
            return;
        }

        $data = json_decode( $raw_input, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $data ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid JSON data.' ),
                ],
            ];
            return;
        }

        $json_content = json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
        $result = file_put_contents( $this->playlists[$playlist_file], $json_content );
        if ( $result === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to write playlist file.' ),
                ],
            ];
            return;
        }

        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'message' => $this->__( 'Playlist saved successfully.' ),
            ],
        ];
    }

    /**
     * Import playlist JSON and save it to assets/ in local mode.
     *
     * Request body:
     * {
     *   "filename": "example.json",
     *   "playlist": { ... }
     * }
     */
    private function save_media_thumbnail(): void {
        if ( !$this->is_local() ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 403,
                'data'  => [
                    'message' => $this->__( 'This feature cannot be performed on remote hosts.' ),
                ],
            ];
            return;
        }

        $raw_input = file_get_contents( 'php://input' );
        if ( strlen( $raw_input ) > 10 * 1024 * 1024 ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Request body too large.' ),
                ],
            ];
            return;
        }

        $payload = json_decode( $raw_input, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $payload ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid JSON data.' ),
                ],
            ];
            return;
        }

        $filename = isset( $payload['filename'] ) && is_string( $payload['filename'] ) ? trim( $payload['filename'] ) : '';
        $content = isset( $payload['content'] ) && is_string( $payload['content'] ) ? trim( $payload['content'] ) : '';
        if ( $filename === '' || $content === '' ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid request data.' ),
                ],
            ];
            return;
        }

        $safe_filename = $this->sanitize_thumbnail_filename( $filename );
        if ( $safe_filename === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Only image files are accepted.' ),
                ],
            ];
            return;
        }

        $binary = base64_decode( $content, true );
        if ( $binary === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid image data.' ),
                ],
            ];
            return;
        }

        $target_path = IMAGES_DIR . $safe_filename;
        $written = @file_put_contents( $target_path, $binary );
        if ( $written === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save thumbnail image.' ),
                ],
            ];
            return;
        }

        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'message' => $this->__( 'Thumbnail image saved successfully.' ),
                'filename' => $safe_filename,
            ],
        ];
    }

    private function delete_media_thumbnail(): void {
        if ( !$this->is_local() ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 403,
                'data'  => [
                    'message' => $this->__( 'This feature cannot be performed on remote hosts.' ),
                ],
            ];
            return;
        }

        $raw_input = file_get_contents( 'php://input' );
        $payload = json_decode( $raw_input, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $payload ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid JSON data.' ),
                ],
            ];
            return;
        }

        $filename = isset( $payload['filename'] ) && is_string( $payload['filename'] ) ? trim( $payload['filename'] ) : '';
        if ( $filename === '' ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid request data.' ),
                ],
            ];
            return;
        }

        $safe_filename = $this->sanitize_thumbnail_filename( $filename );
        if ( $safe_filename === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Only image files are accepted.' ),
                ],
            ];
            return;
        }

        $target_path = IMAGES_DIR . $safe_filename;
        if ( file_exists( $target_path ) && !@unlink( $target_path ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to delete thumbnail image.' ),
                ],
            ];
            return;
        }

        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'message' => $this->__( 'Thumbnail image deleted successfully.' ),
                'filename' => $safe_filename,
            ],
        ];
    }

    private function sanitize_thumbnail_filename( string $filename ): ?string {
        $base = basename( $filename );
        $safe = preg_replace( '/[^A-Za-z0-9._-]/', '_', $base );
        if ( !is_string( $safe ) ) {
            return null;
        }
        $safe = trim( $safe );
        if ( $safe === '' ) {
            return null;
        }
        $extension = strtolower( pathinfo( $safe, PATHINFO_EXTENSION ) );
        if ( !in_array( $extension, [ 'png', 'jpeg', 'jpg', 'gif', 'webp' ], true ) ) {
            return null;
        }
        return $safe;
    }

    private function import_playlist(): void {
        if ( !$this->is_local() ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 403,
                'data'  => [
                    'message' => $this->__( 'This feature cannot be performed on remote hosts.' ),
                ],
            ];
            return;
        }

        $raw_input = file_get_contents( 'php://input' );
        if ( strlen( $raw_input ) > 10 * 1024 * 1024 ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Request body too large.' ),
                ],
            ];
            return;
        }

        $payload = json_decode( $raw_input, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $payload ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Invalid JSON data.' ),
                ],
            ];
            return;
        }

        $filename = isset( $payload['filename'] ) && is_string( $payload['filename'] )
            ? trim( $payload['filename'] )
            : '';
        if ( $filename === '' ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Please choose a playlist JSON file.' ),
                ],
            ];
            return;
        }

        $safe_filename = $this->sanitize_import_filename( $filename );
        if ( $safe_filename === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 400,
                'data'  => [
                    'message' => $this->__( 'Only .json files are accepted.' ),
                ],
            ];
            return;
        }

        $playlist = $payload['playlist'] ?? null;
        if ( !is_array( $playlist ) || !$this->validate_playlist_schema_contract( $playlist ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 422,
                'data'  => [
                    'message' => $this->__( 'The selected file does not match the playlist schema.' ),
                ],
            ];
            return;
        }

        $reject_count = 0;
        $total_items = 0;
        $normalized = $this->sanitize_and_normalize_playlist( $playlist, $reject_count, $total_items );
        if ( $normalized === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 422,
                'data'  => [
                    'message' => $this->__( 'Unsafe or invalid media entries exceeded the allowed limit.' ),
                ],
            ];
            return;
        }

        if ( !$this->validate_playlist_schema_contract( $normalized ) ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 422,
                'data'  => [
                    'message' => $this->__( 'The selected file does not match the playlist schema.' ),
                ],
            ];
            return;
        }

        $resolved_filename = $this->resolve_available_import_filename( $safe_filename, ASSETS_DIR );
        if ( $resolved_filename === null ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save imported playlist data.' ),
                ],
            ];
            return;
        }

        $target_path = ASSETS_DIR . $resolved_filename;

        $json_content = json_encode( $normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
        if ( $json_content === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save imported playlist data.' ),
                ],
            ];
            return;
        }

        $tmp_path = $target_path . '.tmp-' . bin2hex( random_bytes( 8 ) );
        $written = @file_put_contents( $tmp_path, $json_content );
        if ( $written === false ) {
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save imported playlist data.' ),
                ],
            ];
            return;
        }

        if ( !@rename( $tmp_path, $target_path ) ) {
            @unlink( $tmp_path );
            $this->api_response = [
                'state' => 'error',
                'code'  => 500,
                'data'  => [
                    'message' => $this->__( 'Failed to save imported playlist data.' ),
                ],
            ];
            return;
        }

        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'message' => $this->__( 'Playlist imported successfully.' ),
                'filename' => $resolved_filename,
                'rejected' => $reject_count,
                'total' => $total_items,
            ],
        ];
    }

    private function sanitize_import_filename( string $filename ): ?string {
        $base = basename( $filename );
        $name = preg_replace( '/[^A-Za-z0-9._-]/', '_', $base );
        if ( !is_string( $name ) ) {
            return null;
        }
        $name = trim( $name );
        if ( $name === '' || !preg_match( '/\.json$/i', $name ) ) {
            return null;
        }
        if ( preg_match( '/^lang(?:-|\.|$)/i', $name ) ) {
            return null;
        }
        return $name;
    }

    private function resolve_available_import_filename( string $safe_filename, string $target_dir ): ?string {
        $extension = pathinfo( $safe_filename, PATHINFO_EXTENSION );
        $base_name = pathinfo( $safe_filename, PATHINFO_FILENAME );
        $candidate = $safe_filename;
        $max_attempts = 1000;

        for ( $i = 0; $i <= $max_attempts; $i++ ) {
            if ( !file_exists( $target_dir . $candidate ) ) {
                return $candidate;
            }
            $candidate = sprintf( '%s-%d.%s', $base_name, $i + 1, $extension );
        }

        return null;
    }

    private function validate_playlist_schema_contract( array $playlist ): bool {
        foreach ( $playlist as $category => $items ) {
            if ( $category === 'options' ) {
                if ( !is_array( $items ) ) {
                    return false;
                }
                continue;
            }
            if ( !is_string( $category ) || trim( $category ) === '' || !is_array( $items ) ) {
                return false;
            }
            foreach ( $items as $item ) {
                if ( !is_array( $item ) ) {
                    return false;
                }
                $title = isset( $item['title'] ) && is_string( $item['title'] ) ? trim( $item['title'] ) : '';
                if ( $title === '' ) {
                    return false;
                }
            }
        }
        return true;
    }

    private function sanitize_and_normalize_playlist( array $playlist, int &$reject_count, int &$total_items ): ?array {
        $normalized = [];
        $reject_count = 0;
        $total_items = 0;

        foreach ( $playlist as $category => $items ) {
            if ( $category === 'options' ) {
                if ( is_array( $items ) ) {
                    $normalized['options'] = $this->sanitize_and_normalize_options( $items );
                }
                continue;
            }

            $safe_category = $this->sanitize_text( $category, 100 );
            if ( $safe_category === '' || !is_array( $items ) ) {
                continue;
            }

            $normalized_items = [];
            foreach ( $items as $item ) {
                if ( !is_array( $item ) ) {
                    $reject_count++;
                    continue;
                }
                $total_items++;
                $safe_item = $this->sanitize_and_normalize_media_item( $item );
                if ( $safe_item === null ) {
                    $reject_count++;
                    continue;
                }
                $normalized_items[] = $safe_item;
            }

            if ( !empty( $normalized_items ) ) {
                $normalized[$safe_category] = $normalized_items;
            }
        }

        if ( $total_items === 0 ) {
            return null;
        }

        if ( $reject_count > 10 || ( $reject_count / max( 1, $total_items ) ) > 0.05 ) {
            return null;
        }

        if ( count( array_filter( array_keys( $normalized ), function( $key ) {
            return $key !== 'options';
        } ) ) === 0 ) {
            return null;
        }

        return $normalized;
    }

    private function sanitize_and_normalize_options( array $options ): array {
        $normalized = [];

        foreach ( $options as $key => $value ) {
            if ( !is_string( $key ) || trim( $key ) === '' ) {
                continue;
            }
            if ( is_bool( $value ) ) {
                $normalized[$key] = $value;
                continue;
            }
            if ( is_int( $value ) || is_float( $value ) ) {
                $normalized[$key] = $value;
                continue;
            }
            if ( is_string( $value ) ) {
                $normalized[$key] = $this->sanitize_text( $value, 500 );
                continue;
            }
            if ( $value === null ) {
                $normalized[$key] = null;
            }
        }

        if ( isset( $normalized['volume'] ) ) {
            $volume = $this->normalize_non_negative_number( $normalized['volume'] );
            if ( $volume === null ) {
                unset( $normalized['volume'] );
            } else {
                $normalized['volume'] = max( 0, min( 100, $volume ) );
            }
        }

        foreach ( [ 'random', 'shuffle', 'seek', 'fader', 'dark', 'autoplay' ] as $key ) {
            if ( array_key_exists( $key, $normalized ) ) {
                $bool_value = $this->normalize_boolish( $normalized[$key] );
                if ( $bool_value === null ) {
                    unset( $normalized[$key] );
                } else {
                    $normalized[$key] = $bool_value;
                }
            }
        }

        return $normalized;
    }

    private function sanitize_and_normalize_media_item( array $item ): ?array {
        $title = $this->sanitize_text( (string)( $item['title'] ?? '' ), 100 );
        if ( $title === '' ) {
            return null;
        }

        $normalized = [
            'title' => $title,
        ];

        $artist = $this->sanitize_text( (string)( $item['artist'] ?? '' ), 100 );
        if ( $artist !== '' ) {
            $normalized['artist'] = $artist;
        }

        $desc = $this->sanitize_text( (string)( $item['desc'] ?? '' ), 500, true );
        if ( $desc !== '' ) {
            $normalized['desc'] = $desc;
        }

        foreach ( [ 'file', 'image', 'thumb' ] as $key ) {
            if ( !array_key_exists( $key, $item ) ) {
                continue;
            }
            $value = is_string( $item[$key] ) ? trim( $item[$key] ) : '';
            if ( $value === '' ) {
                continue;
            }
            if ( $this->has_unsafe_scheme( $value ) ) {
                return null;
            }
            $normalized[$key] = $this->sanitize_text( $value, 300 );
        }

        if ( array_key_exists( 'videoid', $item ) && is_string( $item['videoid'] ) ) {
            $videoid = $this->sanitize_text( $item['videoid'], 100 );
            if ( $videoid !== '' ) {
                $normalized['videoid'] = $videoid;
            }
        }

        foreach ( [ 'start', 'end', 'fadein', 'fadeout' ] as $key ) {
            if ( array_key_exists( $key, $item ) ) {
                $number = $this->normalize_non_negative_number( $item[$key] );
                if ( $number !== null ) {
                    $normalized[$key] = $number;
                }
            }
        }

        if ( array_key_exists( 'volume', $item ) ) {
            $volume = $this->normalize_non_negative_number( $item['volume'] );
            if ( $volume !== null ) {
                $normalized['volume'] = max( 0, min( 100, $volume ) );
            }
        }

        foreach ( [ 'fs', 'cc' ] as $key ) {
            if ( array_key_exists( $key, $item ) ) {
                $bool_value = $this->normalize_boolish( $item[$key] );
                if ( $bool_value !== null ) {
                    $normalized[$key] = $bool_value;
                }
            }
        }

        return $normalized;
    }

    private function sanitize_text( string $value, int $max_length, bool $allow_newline = false ): string {
        $value = strip_tags( $value );
        $value = preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value ) ?? '';
        if ( $allow_newline ) {
            $value = str_replace( [ "\r\n", "\r" ], "\n", $value );
            $value = preg_replace( '/\t/u', ' ', $value ) ?? $value;
            $value = preg_replace( '/ {2,}/u', ' ', $value ) ?? $value;
            $value = preg_replace( '/\n{3,}/u', "\n\n", $value ) ?? $value;
        } else {
            $value = preg_replace( '/\s+/u', ' ', $value ) ?? $value;
        }
        $value = trim( $value );
        if ( mb_strlen( $value ) > $max_length ) {
            $value = mb_substr( $value, 0, $max_length );
        }
        return $value;
    }

    private function normalize_non_negative_number( $value ): ?float {
        if ( is_int( $value ) || is_float( $value ) ) {
            return $value >= 0 ? (float)$value : null;
        }
        if ( is_string( $value ) ) {
            $trimmed = trim( $value );
            if ( $trimmed === '' || !is_numeric( $trimmed ) ) {
                return null;
            }
            $parsed = (float)$trimmed;
            return $parsed >= 0 ? $parsed : null;
        }
        return null;
    }

    private function normalize_boolish( $value ): ?bool {
        if ( is_bool( $value ) ) {
            return $value;
        }
        if ( is_int( $value ) ) {
            if ( $value === 0 ) return false;
            if ( $value === 1 ) return true;
            return null;
        }
        if ( is_string( $value ) ) {
            $trimmed = strtolower( trim( $value ) );
            if ( $trimmed === '0' || $trimmed === 'false' ) return false;
            if ( $trimmed === '1' || $trimmed === 'true' ) return true;
        }
        return null;
    }

    private function has_unsafe_scheme( string $value ): bool {
        $trimmed = trim( $value );
        if ( $trimmed === '' ) {
            return false;
        }
        if ( preg_match( '/^([a-z][a-z0-9+.-]*):/i', $trimmed, $matches ) ) {
            $scheme = strtolower( $matches[1] );
            return !in_array( $scheme, [ 'http', 'https' ], true );
        }
        return false;
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
