<h1 align="center">
  <div align="center">
    <img src="./views/images/ambient-logo-color.svg" width="64" align="center" />
  </div>
  Ambient
</h1>

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

![Ambient Media Player](https://ka2.org/assets/2023/10/Ambient_Media_Player_03.jpg)

I am personally very satisfied with the outcome of this media player.

Also, I offer a cloud version for demonstration purposes, so please try it out below:

[Ambient DEMO (cloud ver.)](https://amp.ka2.org/)

## Environment

In essence, "Ambient" is a web application, so it can be accessed and utilized simply through a web browser. The true power of "Ambient" is unleashed when installed in a local PC environment, where it can be used as a hybrid media player capable of playing both YouTube media and PC-based media. Fundamentally, "Ambient" searches for local media files based on relative paths in the deployed environment, which means it cannot play media files that do not exist in the installed environment. On the other hand, for YouTube media, it can reference the media via URL using the "YouTube Iframe Player API," thus not being particularly dependent on the installation environment.

For this reason, the cloud version released for demonstration purposes does not store any media on the host web server, making it a media player that can only play and manage YouTube media.

Now, to run the main feature, "Ambient," you'll need to prepare the PHP execution environment and set up a web server (Apache etc.) environment on your local PC so that you can access it via a web browser. Well, the easiest way to go about it would be to install "XAMPP" for Windows machines or "MAMP" for Mac. If you have the know-how, setting up a virtual environment with Docker or WSL is also an option, and you can use not only Apache but also Nginx for the web server (it will work as long as you configure URL rewriting).

As for the PHP version, as long as it's PHP 7.4 or later, it should work without any issues. I developed "Ambient" in a PHP 8.2.4 environment, but I haven't included any code that only works in versions 8.x and later.

Furthermore, the JavaScript and CSS installation packages have already been deployed, so there shouldn't be any issues with running it on the latest browsers.

## Installation

Installing "Ambient" is as simple as fetching the package resources from [the GitHub repository](https://github.com/ka215/ambient). If you're using the command line, navigate to the path where you want to install it (directly under the document root, for example), and execute the following command:

```
git clone https://github.com/ka215/ambient.git ambient
```

This will create the ambient directory and install the files within it. If you installed it using the above command directly under the document root, you can start it by entering `localhost/ambient` in the URL bar of your browser (if you have specified a virtual host name, it would be `http://<hostname>/ambient` ).

Alternatively, you can download the ZIP files from each release version of [Ambient Release Packages](https://github.com/ka215/ambient/releases) and unzip them to the desired installation location.

## Creating Playlists

Next, you'll need to create playlists for media playback in "Ambient." When initially installed, an empty playlist is bundled as a template for creating your own playlists. The playlists are stored in the assets folder within the "Ambient" installation directory. It's possible to create multiple playlists, so it's advisable to copy the template `assets/PlayList.json` for your use.

The format of the playlist is in JSON, and the JSON Schema can be found at [https://ka2.org/schemas/ambient.json](https://ka2.org/schemas/ambient.json).

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
        "seek":       true,
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
| volume | integer | Added since version 1.1.0. Specify the initial volume when playing media in the range of 0 to 100. The default value when omitted is 100, but it is depend on the optional volume setting. Note that the volume set on the media side has priority over the volume setting in the options. |
| start | string/integer | Start time of the media playback (in seconds). If "Seek and play" is enabled as an option, the media with this specified time will seek to the specified seconds before starting playback. It can be specified as an integer value in seconds or in the `H:MM:SS` format. |
| end | string/integer | End time of the media playback (in seconds). If "Seek and play" is enabled as an option, the media with this specified time will stop playing when the specified number of seconds has elapsed. It can be specified as an integer value in seconds or in the `H:MM:SS` format. |
| fadein | integer/float | Specifies the time in seconds before the volume fades in. If a seek time for the start of playback is set, a fade-in will be performed for the set number of seconds from the start of playback. |
| fadeout | integer/float | Specify the duration in seconds for the volume to fade out. If a seek time for the end of playback has set, the fadeout will start after the set number of seconds from the end of playback. |
| fs | integer/boolean | You can switch the display from embedded player display to full screen mode for each playback media. For YouTube videos, a full screen button will be added to the player. In the case of an HTML player, you can switch the display by clicking on the playback area. |
| cc | integer/boolean | If the media supports subtitles, you can toggle subtitle display. This feature is only valid for YouTube videos. |

Additional properties can be added freely other than the ones mentioned above, allowing you to create properties for your own management items.

Next, let's explain the data structure of the "options" property for the initial settings for Ambient:

| Property | Value Type | Default Value | Description |
|:--------:|:----------:|:-------------:|:------------|
| autoplay | boolean | true | Flag for autoplay. Currently, only `true` is valid. |
| random | boolean | false | Flag for randomly play. It can be changed on the Ambient settings. |
| shuffle | boolean | false | Flag for shuffle play. It can be changed on the Ambient settings. Added since version 1.1.0. |
| seek | boolean | false | Flag to enable seeking playback (seek and play). It can be changed on the Ambient settings. |
| volume | integer | 100 | Specifies the initial volume at which media in the playlist is played. Even if you change the volume of each player during playback, it will be initialized to this initial volume when you switch the playback media. Additionally, if there is a volume setting on each media side, that volume will take priority. |
| fader | boolean | false | Flag for whether to perform volume pseudo-fader processing for played media. This setting was added since version 1.2.0. Please refer to the separate section for details on the fade in/fade out mechanism using pseudo faders. |
| dark | boolean | false | Flag to enable dark mode for the Ambient UI. It can be changed on the Ambient settings. |
| background | string | - | File path for displaying a background image in the Ambient UI. It should be specified as a relative path from the `assets/images` folder under the Ambient installation directory. |
| caption | string | `%artist% - %title% - %desc%` | Format for displaying media data in the caption section of Ambient. Use `%<Property Name>%` placeholders to refer to the property values defined in the media data. It is also possible to markup with HTML tags. |
| playlist | string | `%artist% - %title%` | Format for displaying media data in the playlist (left drawer) of Ambient. Use `%<Property Name>%` placeholders to refer to the property values defined in the media data. It is also possible to markup with HTML tags. |
| fs | boolean | false | You can switch from embedded player view to full screen view for all media in your playlist. For information on how to switch the display, please refer to the explanation for the same item in Media Data. |
| cc | boolean | false | Enable toggle subtitle display for all media in the playlist. However, the only media that supports this feature are YouTube videos with subtitles set. |

If there are no changes to the default values for the "options" property, it can be omitted.

## Media Assets

If all the media set in the playlist is from YouTube, you can skip this phase.

If you intend to play local PC media, you need to place the playback media and image files in the Ambient asset directory. The process for installing asset files is as follows:

- Playback media files: Located in the `assets/media` folder directly under the Ambient installation directory.
- Various image files: Located in the `assets/images` folder directly under the Ambient installation directory.

However, moving local PC media files can be cumbersome, and it can create discrepancies with the reference points of other media players. On the other hand, copying would unnecessarily occupy storage space on your PC. Therefore, it is recommended to create symbolic links to the folder where the media files are originally located within the `assets/media` directory.

It's worth noting that Ambient doesn't support Windows shortcuts, so creating symbolic links is necessary. Here's an example of creating a symbolic link:

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

In version 1.1.0 of Ambient, the ability to mount an existing media directory on the Ambient side via a symbolic link was added to the "Options" menu.
We recommend using this feature when creating symbolic links.

### Loading the Playlist on the Ambient Side

Ambient automatically searches for JSON files within the assets on startup and loads valid playlists. When you update the playlist, you can reload the playlist by restarting Ambient (execute "Refresh" from the bottom menu).

After that, you simply need to open the "Settings" menu (right drawer) and select the playlist you want to load.

Once you select the playlist you want to play, you can choose categories within the playlist. By default, all media belonging to each category is selected for playback, but you can also filter the media for each category.

### Playing Media in Ambient

Once the playlist is loaded, the play button in the bottom menu becomes active, and clicking it starts playback.

![Ambient UI](https://ka2.org/assets/2023/10/Ambient_Media_Player_UI.jpg)

① In general, media playback can be controlled using the play/pause button in the bottom menu. Of course, control is also possible through the embedded YouTube player or HTML media player's playback controls, and this control is synchronized with the play/pause button in the bottom menu.

② By opening the playlist menu (left drawer) and clicking on the media you want to play, you can play any desired media.

③ The left and right arrow buttons displaying the thumbnails of the media allow you to specify the previously played media or the candidate media to be played next.

## Compatibility

As of October 20, 2023, the compatibility status for browsers and media file playback is as follows:

### Browsers

Verified working browsers:

| Chrome(>=^118) | Firefox(>=^118) | Edge(>=^118) | Safari(>=^16) | Opera(>=^103) |
|:--------------:|:---------------:|:------------:|:-------------:|:-------------:|
| Ok | Ok | Ok | Ok | Ok |

It does not work on older browsers that do not support the HTML5 `<audio>` and `<video>` tags or on browsers where JavaScript is not enabled.

### Media File Formats

With "Ambient," all publicly available YouTube videos can be played. On the other hand, for media file formats on the local PC, it adheres to the media playable by the HTML5 `<audio>` and `<video>` tags. The compatibility for common media file formats is summarized below.

| MP3(.mp3) | WAVE(.wav) | MP4(.mp4) | AAC(.aac) | WEBM(.webm) | OGG(.ogg) | M4A(.m4a) | WMA(.wma) |
|:---------:|:----------:|:---------:|:---------:|:-----------:|:---------:|:---------:|:---------:|
| Ok        | Ok         | Ok        | Ok        | Ok          | Ok        | ✕        | ✕        |

Compatibility with other media file formats not listed above has not been checked, so it is unclear, but there are likely other playable media formats as well. There is a considerable number of media file formats in the world, including minor video and audio files, so we have not been able to check them all. Additionally, the ability to play media formats may change depending on the status of the playback codecs installed on the PC.

## Localization

Ambient supports the localization of its user interface (UI). By placing a translation definition file, lang.json, directly under the assets folder, it is possible to switch the UI from the default English to another languages. As a sample, the translation definition file for German localization is presented below.

```json
{
    "$language": "Deutsch",
    "Ambient Media Player": "",
    "Get choose your playlist you want to play from the settings menu.": "Wählen Sie im Einstellungsmenü die Playlist aus, die Sie abspielen möchten.",
    "Notify": "Benachrichtigen",
    "Dismiss": "Schließen",
    "Previous Item": "Frühere Medien",
    "Next Item": "Nächste Medien",
    "Watch on YouTube": "Auf YouTube ansehen",
    "Playlist": "Wiedergabeliste",
    "Refresh": "Neu laden",
    "Play": "Wiedergabe",
    "Pause": "Pause",
    "Settings": "Einstellung",
    "Options": "Optionen",
    "Close Playlist": "Wiedergabeliste schließen",
    "No media available.": "Keine Medien verfügbar.",
    "Close Settings": "Einstellungen schließen",
    "Current Playlist": "Aktuelle Wiedergabeliste",
    "Choose a playlist": "Wählen Sie eine Wiedergabeliste aus",
    "Target Category": "Zielkategorie",
    "All categories": "Alle Kategorien",
    "Randomly play": "Zufällige Wiedergabe",
    "Seek and play": "Suchen und wiedergabe",
    "Dark mode": "Dunkler Modus",
    "Close options": "Optionen schließen",
    "Media Management": "Medienverwaltung",
    "Add media to the currently active playlist.": "",
    "Media you add is lost when you switch playlists or end your application session.": "",
    "If you want the additional media to be permanent, you will need to download the playlist after adding the media.": "",
    "Add New Media": "",
    "Playlist Creator": "Wiedergabelisten-Erstellung",
    "It is expected to be implemented in the near future.": "",
    "Please look forward to it.": "",
    "Report an issue": "Ein Problem melden",
    "Ambient development code is managed in a github repository.": "",
    "To report bugs or problems, please raise an issue on github.": "",
    "Before reporting a problem, please check to see if a similar issue has already been submitted.": "",
    "Check out and submit issues.": "",
    "About Ambient": "Über Ambient",
    "Ambient is an open source media player that allows you to seamlessly mix and play media published on YouTube and media stored on your local PC.": "",
    "Additionally, since Ambient is designed as a web application, anyone can use it by accessing the application's pages with a common web browser.": "",
    "However, if you want to use Ambient on your local PC, you will need to prepare a PHP execution environment and launch your application onto that environment.": "",
    "Learn more about the technology Ambient uses below:": "",
    "YouTube IFrame Player API": "",
    "tailwindcss": "",
    "Flowbite": "",
    "Version:": "",
    "(user setup)": ""
}
```

By overwriting the contents of the bundled `assets/lang.json` in Ambient with the above content, most of the major UI elements will be localized into German. Regarding the translation definition file, it is possible to manage it by separating the files with suffix support, such as having a German translation definition as `lang-de.json`.
Since version 1.2.0, we can now switch the language from the settings menu. The translation file for the language you want to switch to should be placed as `lang-{langCode}.json` under the `assets` directory.

## References

I appreciate the technology employed in the development of Ambient and respect its source.

* [YouTube Player API Reference](https://developers.google.com/youtube/iframe_api_reference)
* [tailwindcss](https://tailwindcss.com/docs/installation)
* [Flowbite](https://flowbite.com/docs/getting-started/introduction/)
* [M+FONTS](https://mplusfonts.github.io/)

In my blog article, I introduce specific ways to use Ambient.

* [Introducing the initial release (Japanese)](https://ka2.org/ambient-media-player)
* [About features added in version 1.1.0 (Japanese)](https://ka2.org/released_ambient_demo_version)

## Finally

Please note that the only API used by "Ambient" is the IFrame Player API, and is excluded from the API clients specified by YouTube. As such, they are exempt from the terms of the Developer Policy.
"Ambient" is released as an open-source project under the [MIT License](https://github.com/ka215/ambient/blob/main/LICENSE). Additionally, all resources are publicly available on GitHub, so if you are interested, please give it a try.

[https://github.com/ka215/ambient](https://github.com/ka215/ambient)

I would be delighted to hear your thoughts and feedback!
