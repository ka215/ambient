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
                        $playlist_data = $this->normalize_playlist_data( json_decode( $raw_data, true ) );
                    } else {
                        // php requires PECL yaml module extension.
                        //$playlist_data = yaml_parse( $raw_data );
                        $playlist_data = [];
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
                        'src'      => str_replace(
                            str_replace( '\\', '/', APP_ROOT ),
                            '.',
                            str_replace( '\\', '/', $this->playlists[$playlist_file] )
                        ),
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
     * This is an API endpoint for obtaining YouTube video metadata without exposing the API key.
     *
     * @param string $video_id
     * @return void
     */
    private function get_youtube_metadata( string $video_id ): void {
        $video_id = trim( $video_id );
        if ( preg_match( '/^[A-Za-z0-9_-]{6,32}$/', $video_id ) !== 1 ) {
            $this->set_youtube_metadata_error( 400, 'invalid-video-id', $this->__( 'Invalid YouTube video ID.' ) );
            return;
        }

        $api_key = trim( (string)amp_env( 'YOUTUBE_DATA_API_KEY', '' ) );
        if ( $api_key === '' ) {
            $this->set_youtube_metadata_error( 403, 'not-configured', $this->__( 'YouTube metadata assistance is not configured.' ) );
            return;
        }

        $usage = $this->read_youtube_metadata_usage();
        if ( $usage === null ) {
            $this->set_youtube_metadata_error( 500, 'counter-error', $this->__( 'YouTube metadata usage counter could not be read.' ) );
            return;
        }

        $limit = $this->get_youtube_metadata_monthly_limit();
        $allow_over_limit = amp_env_bool( 'YOUTUBE_METADATA_ALLOW_OVER_LIMIT', false );
        $limited = $limit !== null && $usage['count'] >= $limit;
        if ( $limited && !$allow_over_limit ) {
            $usage['limited'] = true;
            $this->set_youtube_metadata_error(
                429,
                'quota-exceeded',
                $this->__( 'YouTube metadata monthly limit has been reached.' ),
                $usage
            );
            return;
        }

        $metadata = $this->request_youtube_metadata_from_api( $video_id, $api_key );
        if ( $metadata['ok'] !== true ) {
            $reason = isset( $metadata['reason'] ) && is_string( $metadata['reason'] )
                ? $metadata['reason']
                : 'upstream-error';
            $code = $reason === 'not-found' ? 404 : 502;
            $this->set_youtube_metadata_error(
                $code,
                $reason,
                $reason === 'not-found'
                    ? $this->__( 'YouTube metadata was not found.' )
                    : $this->__( 'YouTube metadata could not be fetched.' )
            );
            return;
        }

        $next_usage = $this->increment_youtube_metadata_usage();
        if ( $next_usage === null ) {
            $this->set_youtube_metadata_error( 500, 'counter-error', $this->__( 'YouTube metadata usage counter could not be updated.' ) );
            return;
        }

        $next_usage['limited'] = $limit !== null && $next_usage['count'] >= $limit;
        $this->api_response = [
            'state' => 'ok',
            'code'  => 200,
            'data'  => [
                'videoId' => $video_id,
                'title' => $this->sanitize_text( (string)$metadata['title'], 100 ),
                'artist' => $this->sanitize_text( (string)$metadata['artist'], 100 ),
                'desc' => $this->sanitize_text( (string)$metadata['desc'], 1000, true ),
                'source' => 'youtube-data-api',
                'usage' => $next_usage,
            ],
        ];
    }

    /**
     * @param array<string, mixed>|null $usage
     */
    private function set_youtube_metadata_error( int $code, string $reason, string $message, ?array $usage = null ): void {
        $data = [
            'message' => $message,
            'reason' => $reason,
        ];
        if ( $usage !== null ) {
            $data['usage'] = $usage;
        }
        $this->api_response = [
            'state' => 'error',
            'code'  => $code,
            'data'  => $data,
        ];
    }

    private function get_youtube_metadata_monthly_limit(): ?int {
        $raw_limit = amp_env( 'YOUTUBE_METADATA_MONTHLY_LIMIT', '10000' );
        if ( $raw_limit !== null && strtolower( trim( $raw_limit ) ) === 'unlimited' ) {
            return null;
        }
        $limit = is_numeric( $raw_limit ) ? (int)$raw_limit : 10000;
        return $limit > 0 ? $limit : 10000;
    }

    private function get_youtube_metadata_timeout_seconds(): int {
        $timeout_ms = amp_env( 'YOUTUBE_METADATA_TIMEOUT_MS', '5000' );
        $timeout = is_numeric( $timeout_ms ) ? (int)$timeout_ms : 5000;
        $timeout = max( 1000, min( 15000, $timeout ) );
        return (int)ceil( $timeout / 1000 );
    }

    private function get_youtube_metadata_counter_path(): string {
        return amp_resolve_path(
            (string)amp_env( 'YOUTUBE_METADATA_COUNTER_PATH', 'logs/youtube-metadata-usage.json' ),
            APP_ROOT
        );
    }

    private function get_youtube_metadata_month_key(): string {
        return ( new \DateTimeImmutable( 'now' ) )->format( 'Y-m' );
    }

    /**
     * @return array{month:string,count:int,limit:int|null,limited:bool}|null
     */
    private function read_youtube_metadata_usage(): ?array {
        $counter = $this->read_youtube_metadata_counter();
        if ( $counter === null ) {
            return null;
        }
        $month = $this->get_youtube_metadata_month_key();
        $count = 0;
        if (
            isset( $counter['months'][$month] ) &&
            is_array( $counter['months'][$month] ) &&
            isset( $counter['months'][$month]['youtubeMetadataRequests'] ) &&
            is_numeric( $counter['months'][$month]['youtubeMetadataRequests'] )
        ) {
            $count = max( 0, (int)$counter['months'][$month]['youtubeMetadataRequests'] );
        }
        $limit = $this->get_youtube_metadata_monthly_limit();
        return [
            'month' => $month,
            'count' => $count,
            'limit' => $limit,
            'limited' => $limit !== null && $count >= $limit,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function read_youtube_metadata_counter(): ?array {
        $path = $this->get_youtube_metadata_counter_path();
        if ( !file_exists( $path ) ) {
            return [
                'version' => 1,
                'months' => [],
            ];
        }
        if ( !is_readable( $path ) ) {
            return null;
        }
        $raw = file_get_contents( $path );
        if ( $raw === false || trim( $raw ) === '' ) {
            return [
                'version' => 1,
                'months' => [],
            ];
        }
        $decoded = json_decode( $raw, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $decoded ) ) {
            return null;
        }
        if ( !isset( $decoded['months'] ) || !is_array( $decoded['months'] ) ) {
            $decoded['months'] = [];
        }
        $decoded['version'] = 1;
        return $decoded;
    }

    /**
     * @return array{month:string,count:int,limit:int|null,limited:bool}|null
     */
    private function increment_youtube_metadata_usage(): ?array {
        $counter = $this->read_youtube_metadata_counter();
        if ( $counter === null ) {
            return null;
        }

        $month = $this->get_youtube_metadata_month_key();
        if ( !isset( $counter['months'][$month] ) || !is_array( $counter['months'][$month] ) ) {
            $counter['months'][$month] = [
                'youtubeMetadataRequests' => 0,
            ];
        }
        $current_count = isset( $counter['months'][$month]['youtubeMetadataRequests'] ) && is_numeric( $counter['months'][$month]['youtubeMetadataRequests'] )
            ? (int)$counter['months'][$month]['youtubeMetadataRequests']
            : 0;
        $counter['months'][$month]['youtubeMetadataRequests'] = max( 0, $current_count ) + 1;
        $counter['months'][$month]['updatedAt'] = ( new \DateTimeImmutable( 'now' ) )->format( DATE_ATOM );

        $path = $this->get_youtube_metadata_counter_path();
        $dir = dirname( $path );
        if ( !is_dir( $dir ) && !@mkdir( $dir, 0755, true ) ) {
            return null;
        }

        $json = json_encode( $counter, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
        if ( $json === false || @file_put_contents( $path, $json . "\n", LOCK_EX ) === false ) {
            return null;
        }

        return $this->read_youtube_metadata_usage();
    }

    /**
     * @return array{ok:bool,title?:string,artist?:string,desc?:string,reason?:string}
     */
    private function request_youtube_metadata_from_api( string $video_id, string $api_key ): array {
        $query = http_build_query( [
            'part' => 'snippet',
            'id' => $video_id,
            'key' => $api_key,
        ] );
        $url = 'https://www.googleapis.com/youtube/v3/videos?' . $query;
        $timeout = $this->get_youtube_metadata_timeout_seconds();
        $body = false;

        if ( function_exists( 'curl_init' ) ) {
            $ch = curl_init( $url );
            if ( $ch !== false ) {
                curl_setopt_array( $ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CONNECTTIMEOUT => $timeout,
                    CURLOPT_TIMEOUT => $timeout,
                    CURLOPT_FOLLOWLOCATION => false,
                    CURLOPT_USERAGENT => 'Ambient/' . $this->get_version(),
                ] );
                $body = curl_exec( $ch );
                $http_code = (int)curl_getinfo( $ch, CURLINFO_HTTP_CODE );
                curl_close( $ch );
                if ( $body === false || $http_code < 200 || $http_code >= 300 ) {
                    return [ 'ok' => false, 'reason' => 'upstream-error' ];
                }
            }
        } else {
            $context = stream_context_create( [
                'http' => [
                    'method' => 'GET',
                    'timeout' => $timeout,
                    'ignore_errors' => true,
                    'header' => "User-Agent: Ambient/" . $this->get_version() . "\r\n",
                ],
            ] );
            $body = @file_get_contents( $url, false, $context );
            if ( $body === false ) {
                return [ 'ok' => false, 'reason' => 'upstream-error' ];
            }
        }

        $decoded = json_decode( (string)$body, true );
        if ( json_last_error() !== JSON_ERROR_NONE || !is_array( $decoded ) ) {
            return [ 'ok' => false, 'reason' => 'upstream-error' ];
        }
        if ( isset( $decoded['error'] ) ) {
            return [ 'ok' => false, 'reason' => 'upstream-error' ];
        }
        if ( empty( $decoded['items'] ) || !is_array( $decoded['items'] ) ) {
            return [ 'ok' => false, 'reason' => 'not-found' ];
        }
        $snippet = $decoded['items'][0]['snippet'] ?? null;
        if ( !is_array( $snippet ) ) {
            return [ 'ok' => false, 'reason' => 'upstream-error' ];
        }

        return [
            'ok' => true,
            'title' => is_string( $snippet['title'] ?? null ) ? $snippet['title'] : '',
            'artist' => is_string( $snippet['channelTitle'] ?? null ) ? $snippet['channelTitle'] : '',
            'desc' => is_string( $snippet['description'] ?? null ) ? $snippet['description'] : '',
        ];
    }

    /**
     * Normalize empty, malformed, or legacy playlist payloads into a safe category map.
     *
     * @param mixed $playlist_data
     * @return array
     */
    private function normalize_playlist_data( $playlist_data ): array {
        if ( !is_array( $playlist_data ) ) {
            return [];
        }

        if (
            array_key_exists( 'media', $playlist_data ) &&
            is_array( $playlist_data['media'] )
        ) {
            $normalized = $playlist_data['media'];
            if ( array_key_exists( 'options', $playlist_data ) ) {
                $normalized['options'] = is_array( $playlist_data['options'] )
                    ? $playlist_data['options']
                    : null;
            }
            return $normalized;
        }

        foreach ( $playlist_data as $category => $items ) {
            if ( $category === 'options' ) {
                continue;
            }
            if ( !is_array( $items ) ) {
                unset( $playlist_data[$category] );
            }
        }

        return $playlist_data;
    }

    /**
     * This is an API endpoint to search for the corresponding file in the media directory 
     * and obtain the relative path.
     * 
     * @param  string $filename
     * @return void             At post-processing returns an array for the response.
     */
    private function get_filepath( string $filename ): void {
        $normalized_filename = str_replace( '\\', '/', trim( $filename ) );
        $basename_filename = basename( $normalized_filename );
        $candidate_needles = array_values( array_unique( array_filter( [
            $normalized_filename,
            $basename_filename,
        ], function( $item ) {
            return $item !== '';
        } ) ) );
        $is_bracket_filename = preg_match( '/\[(.*)\]/', $filename ) === 1;
        $extension = strtolower( pathinfo( $basename_filename, PATHINFO_EXTENSION ) );
        $files = [];

        $scan_media = function( string $real_dir, string $logical_dir, array $ancestor_realpaths = [] ) use ( &$scan_media, &$files, $candidate_needles, $is_bracket_filename, $extension ): void {
            if ( !is_dir( $real_dir ) ) {
                return;
            }

            $entries = @scandir( $real_dir );
            if ( !is_array( $entries ) ) {
                return;
            }

            foreach ( $entries as $entry ) {
                if ( $entry === '.' || $entry === '..' ) {
                    continue;
                }

                $absolute_path = $real_dir . DIRECTORY_SEPARATOR . $entry;
                $logical_path = $logical_dir . '/' . $entry;

                if ( is_dir( $absolute_path ) ) {
                    $resolved_dir = realpath( $absolute_path );
                    if ( $resolved_dir === false ) {
                        continue;
                    }
                    if ( in_array( $resolved_dir, $ancestor_realpaths, true ) ) {
                        continue;
                    }
                    $next_ancestors = $ancestor_realpaths;
                    $next_ancestors[] = $resolved_dir;
                    $scan_media( $resolved_dir, $logical_path, $next_ancestors );
                    continue;
                }

                if ( !is_file( $absolute_path ) ) {
                    continue;
                }

                if ( $is_bracket_filename ) {
                    if ( $extension !== '' && strtolower( pathinfo( $absolute_path, PATHINFO_EXTENSION ) ) !== $extension ) {
                        continue;
                    }
                    $matched = false;
                    foreach ( $candidate_needles as $needle ) {
                        if ( str_contains( str_replace( '\\', '/', $absolute_path ), $needle ) || str_contains( $logical_path, $needle ) ) {
                            $matched = true;
                            break;
                        }
                    }
                    if ( !$matched ) {
                        continue;
                    }
                } else {
                    $matched = false;
                    foreach ( $candidate_needles as $needle ) {
                        if ( $needle === '' ) {
                            continue;
                        }
                        $lower_needle = strtolower( $needle );
                        $absolute_normalized = strtolower( str_replace( '\\', '/', $absolute_path ) );
                        $logical_normalized = strtolower( $logical_path );
                        if ( str_ends_with( $absolute_normalized, $lower_needle ) || str_ends_with( $logical_normalized, $lower_needle ) || strtolower( basename( $absolute_path ) ) === $lower_needle ) {
                            $matched = true;
                            break;
                        }
                    }
                    if ( !$matched ) {
                        continue;
                    }
                }

                $files[] = [
                    'absolute' => str_replace( '\\', '/', $absolute_path ),
                    'logical'  => $logical_path,
                ];
            }
        };

        $media_root_real = realpath( MEDIA_DIR );
        if ( $media_root_real !== false ) {
            $scan_media( $media_root_real, 'assets/media', [ $media_root_real ] );
        }

        $relative_filepath = '';
        if ( !empty( $files ) && !empty( $files[0]['logical'] ) ) {
            $relative_filepath = './' . ltrim( str_replace( '\\', '/', (string)$files[0]['logical'] ), './' );
        } elseif ( $normalized_filename !== '' && file_exists( $normalized_filename ) ) {
            $relative_filepath = str_replace( '\\', '/', $normalized_filename );
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
                // Prefer PowerShell New-Item for symbolic links and fallback to mklink.
                $link_path = MEDIA_DIR . $symlink_name;
                $ps_target = str_replace( "'", "''", $local_media_dir );
                $ps_link   = str_replace( "'", "''", $link_path );

                $ps_script = "try { New-Item -ItemType SymbolicLink -Path '$ps_link' -Target '$ps_target' -ErrorAction Stop | Out-Null; exit 0 } catch { Write-Output \$_.Exception.Message; exit 1 }";
                $exec_command = sprintf( 'powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "%s"', $ps_script );
                $output = [];
                $returnCode = 0;
                exec( $exec_command, $output, $returnCode );
                $this->logger( __METHOD__, 'for Windows PowerShell New-Item', $exec_command, $output, $returnCode );

                if ( $returnCode !== 0 ) {
                    $fallback_command = sprintf( 'cmd /c mklink /D "%s" "%s"', $link_path, $local_media_dir );
                    $fallback_output = [];
                    $fallback_return_code = 0;
                    exec( $fallback_command, $fallback_output, $fallback_return_code );
                    $this->logger( __METHOD__, 'for Windows mklink fallback', $fallback_command, $fallback_output, $fallback_return_code );

                    if ( $fallback_return_code !== 0 ) {
                        $error_message = $this->__( 'Failed to create symbolic link.' );
                    }
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
            $can_create_local_playlist =
                $this->is_local() &&
                preg_match( '/^[A-Za-z0-9._-]+\.json$/i', $playlist_file ) === 1;

            if ( !$can_create_local_playlist ) {
                $this->api_response = [
                    'state' => 'error',
                    'code'  => 404,
                    'data'  => [
                        'message' => $this->__( 'Specified playlist could not be found.' ),
                    ],
                ];
                return;
            }

            if ( !is_dir( ASSETS_DIR ) ) {
                @mkdir( ASSETS_DIR, 0755, true );
            }

            $playlist_path = ASSETS_DIR . basename( $playlist_file );
            $seed_data = json_encode( [ 'options' => new \stdClass() ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
            if ( $seed_data === false ) {
                $seed_data = "{\n    \"options\": {}\n}";
            }
            if ( !file_exists( $playlist_path ) ) {
                @file_put_contents( $playlist_path, $seed_data . "\n", LOCK_EX );
            }
            if ( !file_exists( $playlist_path ) ) {
                $this->api_response = [
                    'state' => 'error',
                    'code'  => 500,
                    'data'  => [
                        'message' => $this->__( 'Failed to write playlist file.' ),
                    ],
                ];
                return;
            }

            $this->playlists[$playlist_file] = $playlist_path;
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

        $desc = $this->sanitize_text( (string)( $item['desc'] ?? '' ), 1000, true );
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
