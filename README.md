<h1 align="center">
  <div align="center">
    <img src="./views/images/ambient-logo-color.svg" width="64" align="center" />
  </div>
  Ambient
</h1>

> Japanese README: [README-ja.md](README-ja.md)

Ambient is a media player that runs on a web browser using YouTube IFrame Player API. It also supports playing media files on your local PC.<br>
Ambient lets you create mixed playlists of your favorite YouTube videos and other media you own on your local PC, and play them seamlessly.<br>
**Let's start your ambient media experience!**

<p align="center">
  <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/ka215/ambient">
  <!-- img alt="GitHub last commit (branch)" arc="https://img.shields.io/github/last-commit/ka215/ambient/main" -->
  <!-- img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/ka215/ambient" -->
  <!-- img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/ka215/ambient" -->
  <!-- img alt="CircleCI" src="https://img.shields.io/circleci/build/github/ka215/ambient/main" -->
  <!-- img alt="GitHub all releases" src="https://img.shields.io/github/downloads/ka215/ambient/total" -->
  <!-- img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/ka215/ambient" -->
  <img alt="GitHub" src="https://img.shields.io/github/license/ka215/ambient">
</p>

<p align="center">
  <a href="#introduction">Introduction</a> &middot;
  <a href="#environment">Environment</a> &middot;
  <a href="#installation">Installation</a> &middot;
  <a href="#creating-playlists">Creating Playlists</a> &middot;
  <a href="#media-assets">Media Assets</a> &middot;
  <a href="#compatibility">Compatibility</a> &middot;
  <a href="#localization">Localization</a> &middot;
  <a href="#references">References</a> &middot;
  <a href="#finally">Finally</a>
</p>

## Introduction

I often have music playing in the background when I'm working on my PC. The songs I play during these times vary, ranging from audio files imported from my collection of album CDs to YouTube videos. Consequently, the media and playback environment are quite diverse. So, for local audio sources, I would use the media player installed on my PC, and for YouTube videos, I would access them through my browser. Well, it's a common practice, but managing my PC's audio and my favorite YouTube videos separately has been somewhat challenging and frustrating.

It would be great if I could manage both types of media centrally and play them without having to switch players.

Several solutions already exist that meet this demand, such as "FreeTube" and "CherryPlayer". However, it was difficult to find what I was looking for because the supported platforms were limited, there were too many functions, and the UI was complex and difficult to operate intuitively. I want a simple media player that just plays my favorite media continuously, like ambient sounds. Therefore, I thought it would be faster to make it myself to fulfill this request.

If I were to create a web application that combines YouTube's embedded Iframe player with HTML media tags such as <audio> and <video>, I should be able to play both YouTube videos and my PC's media files simultaneously, shouldn't I?

Without further ado, I went ahead and created a web browser-based player that could handle both YouTube and local media.

I named it "Ambient".

<p align="center">
  <video src="https://github.com/user-attachments/assets/b6c80318-9261-45eb-9514-f60ad82e33f9" controls muted></video><br />
  <sub><strong>CREDITS:</strong> CHARGE - Blender Open Movie (Provided by Blender Studio) &middot; Pexels Video (<a href="https://pexels.com/video">pexels.com/video</a>) &middot; TheFatRat - <a href="https://www.youtube.com/watch?v=n8X9_MgEdCg">Unity</a> &middot; 4K Nature Video by NASA &middot; YouTube Video by Scott Buckley, Trackistador (CC BY 4.0)</sub>
</p>

<br>

Also, I offer a cloud version for demonstration purposes, so please try it out below:

[Ambient DEMO (cloud ver.)](https://amp.ka2.org/)

## Environment

Ambient is a PHP-based web application with a TypeScript frontend. It runs in a regular browser and can be deployed either as a local player or as a cloud/self-hosted demo.

- In local mode (`AMP_ENV=local`), Ambient can play YouTube media and local media files that are reachable from the configured asset directory. Playlist changes, category changes, local media additions, playlist import, and media edits are persisted to JSON files under `assets/`.
- In cloud mode (`AMP_ENV=cloud`), built-in playlists are treated as read-only. User-added media and imported playlists are stored as `MyPlaylist` in browser storage, and local media file selection/symbolic-link creation is disabled.

To run Ambient locally, prepare a PHP runtime and a web server such as Apache, Nginx, XAMPP, MAMP, Docker, or WSL. The application expects browser access through the web server, not direct file opening.

PHP 8.4 or later is recommended. Ambient v2.6.1 is developed with the Vite asset pipeline and verified with the current browser versions used by the Playwright test matrix.

The release package includes built frontend assets, so Node.js is required only when developing or rebuilding the frontend.

## Installation

Installing "Ambient" is as simple as fetching the package resources from [the GitHub repository](https://github.com/ka215/ambient). If you're using the command line, navigate to the path where you want to install it (directly under the document root, for example), and execute the following command:

```
git clone https://github.com/ka215/ambient.git ambient
```

This will create the ambient directory and install the files within it. If you installed it using the above command directly under the document root, you can start it by entering `localhost/ambient` in the URL bar of your browser (if you have specified a virtual host name, it would be `http://<hostname>/ambient` ).

After cloning, copy `.env.example` to `.env` and adjust the environment-specific values if needed. By default, Ambient reads the following settings from `.env`:

- `DEBUG_MODE` - enable or disable debug logging in browser and PHP output
- `ASSETS_DIR` - asset directory path relative to the project root
- `LOGS_DIR` - log directory path relative to the project root
- `AMP_ENV` - `local` for a local PC installation, `cloud` for cloud/self-hosted demo mode
- `ASSET_MODE` - `build` for built assets, `dev` for Vite dev server assets
- `VITE_DEV_SERVER_URL` - Vite dev asset URL used only in development mode
- `VITE_MEDIA_EDIT_DURATION_SYNC_TIMEOUT_MS` - timeout for media-edit duration synchronization

Alternatively, you can download the ZIP files from each release version of [Ambient Release Packages](https://github.com/ka215/ambient/releases) and unzip them to the desired installation location.

### Frontend development and build

Ambient now uses Vite as its asset pipeline.

- Development:
  - `npm run dev`
- Type check:
  - `npm run typecheck`
- Production-style build:
  - `npm run build`
- Playlist schema validation:
  - `npm run validate:playlists`
- Localization coverage check:
  - `npm run check:i18n`
- E2E verification:
  - `npm run test:e2e`

For local development behind Apache reverse proxy, set:

```env
ASSET_MODE=dev
VITE_DEV_SERVER_URL=https://dev-amp.ka2.org/vite
```

For production-style local verification, set:

```env
ASSET_MODE=build
```

Detailed operational instructions:

- `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook.md`
- `docs/operations/20260510-v2-3-0-vite-development-and-build-runbook-ja.md`

## Creating Playlists

Ambient playlists are JSON files placed directly under the configured assets directory, usually `assets/`. Ambient automatically discovers `*.json` files there, excluding localization files such as `lang.json` and `lang-ja.json`.

The bundled template is `assets/PlayList.json`. If no playlist exists in local mode, Ambient creates a minimal `PlayList.json` automatically. Multiple playlist files can be used side by side, and the active playlist can be selected from the Settings drawer.

The playlist contract is maintained in [schemas/playlist.schema.json](schemas/playlist.schema.json), with the schema ID `https://ka2.org/schemas/ambient-playlist-v2.schema.json`.

To make it easier to understand beyond just the schema definition, here's an example of an actual playlist:

```json
{
    "YouTube Favorites": [
        {
            "title": "Thunder",
            "artist": "Imagine Dragons",
            "videoid": "fKopy74weus",
            "start": "21"
        },
        {
            "title": "Numb",
            "artist": "Linkin Park",
            "videoid": "kXYiU_JCYtU"
        },
        {
            "title": "Unity",
            "artist": "TheFatRat",
            "videoid": "n8X9_MgEdCg"
        }
    ],
    "Local PC Music": [
        {
            "disc": 1,
            "track": 1,
            "file": "Grandia_Theme.mp3",
            "title": "Unforgettable Adventure",
            "desc": "The Best of Grandia Disc1",
            "artist": "Noritaka Iwadare",
            "image": "The_Best_of_GRANDIA.jpg"
        },
        {
            "disc": 1,
            "track": 1,
            "file": "Journey_to_the_Fantasy_World.mp3",
            "title": "Prologue - Journey to the Fantasy World",
            "desc": "Title Theme",
            "artist": "Genso Suikoden Original Game Soundtrack DISC1",
            "image": "gensousuikoden.webp"
        }
    ],
    "options": {
        "autoplay":   true,
        "random":     true,
        "shuffle":    false,
        "seek":       true,
        "fader":      true,
        "volume":     70,
        "dark":       false
    }
}
```

Here's a brief explanation of the playlist settings. Firstly, the root object's properties of the playlist JSON data can be freely named as "Category Name." However, if the property name is "options," it will be treated as the initial settings for "Ambient," so be careful (the "options" setting can be omitted if not needed). Then, the value of the category property is specified in an array format for the media to be played. The structure of the media data is as follows:

| Property | Value Type | Description |
|:--------:|:----------:|:------------|
| title | string | Title of the media to be played. If this is not specified or is an empty string, the media will be considered invalid and cannot be played by Ambient. |
| file | string | File path of the media to be played. It should be specified as a relative path from the `assets/media` folder under the Ambient installation directory. If there is no media file at the specified path, it will not be played. |
| videoid | string | VIDEO ID of the media to be played on YouTube (the parameter value represented by "v=" in the YouTube video URL). If both videoid and file are defined for the media, the YouTube video specified by videoid will take priority. |
| desc | string | Description or subtitle of the media to be played. This will be used in the output of the Ambient caption section, for example. |
| artist | string | Artist name of the media to be played. This will be used in the output of the Ambient caption section, for example. |
| image | string | File path of the thumbnail image for the media. It should be specified as a relative path from the `assets/images` folder under the Ambient installation directory. If there is no image file at the specified path, the thumbnail will not be displayed. For media from YouTube videos, the thumbnail will be automatically obtained from YouTube, so this is specifically for specifying thumbnails for local media files. |
| thumb | string | Thumbnail file name generated or resolved by Ambient. You normally do not need to write this manually. |
| volume | number/string/null | Specify the initial volume for this media in the range of 0 to 100. A media-level value takes priority over the playlist-level `options.volume`. |
| start | string/integer | Start time of the media playback (in seconds). If "Seek and play" is enabled as an option, the media with this specified time will seek to the specified seconds before starting playback. It can be specified as an integer value in seconds or in the `H:MM:SS` format. |
| end | string/integer | End time of the media playback (in seconds). If "Seek and play" is enabled as an option, the media with this specified time will stop playing when the specified number of seconds has elapsed. It can be specified as an integer value in seconds or in the `H:MM:SS` format. |
| fadein | string/integer/float | Specifies the fade-in duration in seconds. It is applied when the pseudo fader option is enabled. |
| fadeout | string/integer/float | Specifies the fade-out duration in seconds. It is applied when the pseudo fader option is enabled. |
| fs | integer/boolean | You can switch the display from embedded player display to full screen mode for each playback media. For YouTube videos, a full screen button will be added to the player. In the case of an HTML player, you can switch the display by clicking on the playback area. |
| cc | integer/boolean | If the media supports subtitles, you can toggle subtitle display. This feature is only valid for YouTube videos. |

Additional properties can be added freely other than the ones mentioned above, allowing you to create properties for your own management items.

Next, let's explain the data structure of the "options" property for the initial settings for Ambient:

| Property | Value Type | Default Value | Description |
|:--------:|:----------:|:-------------:|:------------|
| autoplay | boolean/number | true | Enable autoplay when the selected media is loaded. Browser autoplay policies may still require a user gesture. |
| controls | boolean/number | true | Show or hide the embedded player controls where the player type supports it. |
| random | boolean | false | Flag for randomly play. It can be changed on the Ambient settings. |
| shuffle | boolean | false | Flag for shuffle play. It can be changed on the Ambient settings. |
| seek | boolean | false | Flag to enable seeking playback (seek and play). It can be changed on the Ambient settings. |
| volume | integer | 100 | Specifies the initial volume at which media in the playlist is played. Even if you change the volume of each player during playback, it will be initialized to this initial volume when you switch the playback media. Additionally, if there is a volume setting on each media side, that volume will take priority. |
| fader | boolean | false | Flag for whether to perform volume pseudo-fader processing for played media. |
| dark | boolean | false | Flag to enable dark mode for the Ambient UI. It can be changed on the Ambient settings. |
| fullwindow | boolean | false | Expand the player area to fit the browser window. It can be changed from the bottom menu or settings. |
| background | string | - | File path for displaying a background image in the Ambient UI. It should be specified as a relative path from the `assets/images` folder under the Ambient installation directory. |
| caption | string | `%artist% - %title% - %desc%` | Format for displaying media data in the caption section of Ambient. Use `%<Property Name>%` placeholders to refer to the property values defined in the media data. It is also possible to markup with HTML tags. |
| playlist | string | `%artist% - %title%` | Format for displaying media data in the playlist (left drawer) of Ambient. Use `%<Property Name>%` placeholders to refer to the property values defined in the media data. It is also possible to markup with HTML tags. |
| fs | boolean | false | You can switch from embedded player view to full screen view for all media in your playlist. For information on how to switch the display, please refer to the explanation for the same item in Media Data. |
| cc_load_policy | boolean/number | 0 | YouTube caption loading policy. This only affects YouTube videos with captions. |
| rel | boolean/number | 0 | YouTube related-video option passed to the embedded player. |

If there are no changes to the default values for the "options" property, it can be omitted.

## Media Assets

If all the media set in the playlist is from YouTube, you can skip this phase.

If you intend to play local PC media, the media and image files must be reachable from the Ambient asset directory.

- Playback media files: `assets/media`
- Image and thumbnail files: `assets/images`

Playlist `file` values are written relative to `assets/media`, and playlist `image` values are written relative to `assets/images`. For YouTube media, Ambient can use the YouTube thumbnail automatically, so custom image files are mainly for local media or custom thumbnails.

Moving or copying large media collections into the Ambient directory is often inconvenient. In local mode, you can either create symbolic links yourself or use the "Create Symbolic Link" tool in Playlist Management. Windows shortcuts are not treated as media directories.

**For Windows**

1. Navigate to the Ambient media folder in Explorer, then type `cmd` in the address bar and press Enter.
2. Once the command prompt is open, use the following command:
```cmd
mklink /D nzk "C:\Users\<YourUserName>\Music\BEST OF VOCAL WORKS [nZk]"
```
to register the path to the folder where the local PC media is already stored as a symbolic link (if the folder name contains spaces, enclose the entire link path in quotation marks).
3. Update the file path specification of the file property in the playlist JSON media data to use the path via the symbolic link, for example, `nzk/friends.mp4`.

**For Mac (Linux)**

1. Launch a command-line tool like Terminal and navigate to the Ambient media folder, then use the command:
```bash
cd /Applications/MAMP/htdocs/ambient/assets/media
ln -s nzk /Users/YourUserName/Music/BEST\ OF\ VOCAL\ WORKS\ [nZk]
```
to register the path to the folder where the local PC media is stored as a symbolic link (if the folder name contains spaces, escape them with a backslash).
2. Update the file path specification of the file property in the playlist JSON media data to use the path via the symbolic link, for example, `nzk/friends.aac`.

In cloud mode, local media selection, thumbnail upload/removal, and symbolic-link creation are disabled because the remote host cannot access files on your PC.

### Loading the Playlist on the Ambient Side

Ambient automatically searches for playlist JSON files within the assets directory on startup. After editing a playlist file directly, use "Refresh" from the bottom menu or reload the page.

Open the Settings drawer and select the playlist you want to load. Ambient remembers the previous playlist/category/media context in browser storage and tries to resume it on the next visit when the playlist is still available.

Once a playlist is loaded, you can choose a target category. The default "All categories" view plays media across the playlist, while a selected category limits playback to that category.

### Playing Media in Ambient

Once a playlist is loaded, the bottom play button becomes active. Playback can be controlled from the bottom menu, the embedded YouTube player, or the HTML audio/video player, and Ambient keeps the play/pause state synchronized.

The left Playlist drawer is the main navigation surface for media items. In normal mode, selecting an item starts playback. The playlist mode menu also provides delete and reorder workflows where the current environment allows playlist mutation.

The carousel controls show the previous and next playback candidates with thumbnails. They let you move through the current playback order, including random or shuffle order when those options are enabled.

The Settings drawer controls playlist selection, category filtering, loop/random/shuffle/seek/fader/dark-mode options, full-window playback, default volume, and language selection. The Options menu contains management tools for adding media, managing categories, exporting/importing playlists, and local-only symbolic-link creation.

Media Edit is available from supported playlist items. It can update title, artist, description, volume, seek timing, fade timing, category assignment, and local thumbnails. In cloud mode, edits are limited to the browser-stored `MyPlaylist`; built-in cloud playlists remain read-only.

## Compatibility

Ambient depends on modern browser features, JavaScript, the YouTube IFrame Player API, and native HTML5 `<audio>` / `<video>` playback.

### Browsers

The automated E2E matrix currently targets Chromium desktop and responsive iPad/iPhone profiles through Playwright. Manual browser compatibility depends on each browser's current support for YouTube embeds, media codecs, local file playback through the web server, and required JavaScript APIs.

Older browsers, browsers with JavaScript disabled, or browsers that block embedded YouTube playback or required codecs are not supported.

### Media File Formats

YouTube playback is handled by the YouTube IFrame Player API, so availability follows YouTube's own embed restrictions and the video's publication settings.

Local media playback follows the browser's native HTML5 media support and the codecs installed or available on the host environment. Common formats such as MP3, WAV, MP4, AAC, WebM, and OGG may work in modern browsers, but support varies by browser and OS. If a local file does not play, verify the file path, MIME handling by the web server, and browser codec support.

## Localization

Ambient localizes UI text through JSON dictionaries under `assets/langs/`.

- `assets/langs/lang.json` is the origin dictionary. Its keys are the source strings used by PHP and TypeScript UI code.
- `assets/langs/lang-{langCode}.json` provides a translated dictionary, for example `lang-ja.json`, `lang-de.json`, or `lang-fr.json`.
- Each dictionary may include `$language` to control the display name shown in the Settings drawer.
- Missing or empty translations fall back to the original source text.
- The selected language is stored in the `lang` browser cookie and can be changed from the Settings drawer.
- Legacy files directly under `assets/`, such as `assets/lang-ja.json`, are still detected for backward compatibility, but `assets/langs/` takes priority.

When adding or updating translations, keep the key set aligned with `assets/langs/lang.json` and run:

```bash
npm run check:i18n
```

## References

I appreciate the technology employed in the development of Ambient and respect its source.

* [YouTube Player API Reference](https://developers.google.com/youtube/iframe_api_reference)
* [tailwindcss](https://tailwindcss.com/docs/installation)
* [Flowbite](https://flowbite.com/docs/getting-started/introduction/)
* [Vite](https://vite.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [Playwright](https://playwright.dev/)
* [M+FONTS](https://mplusfonts.github.io/)

In my blog article, I introduce specific ways to use Ambient.

* [Introducing the initial release (Japanese)](https://ka2.org/ambient-media-player)
* [About features added in version 1.1.0 (Japanese)](https://ka2.org/released_ambient_demo_version)

## Finally

Ambient uses the YouTube IFrame Player API for YouTube playback. If you deploy or modify Ambient, review the current YouTube API Services terms and embedded player requirements for your own use case.

Ambient is released as an open-source project under the [MIT License](https://github.com/ka215/ambient/blob/main/LICENSE). Additionally, all resources are publicly available on GitHub, so if you are interested, please give it a try.

[https://github.com/ka215/ambient](https://github.com/ka215/ambient)

I would be delighted to hear your thoughts and feedback!
