<h1 align="center">
  <div align="center">
    <img src="./views/images/ambient-logo-color.svg" width="64" align="center" />
  </div>
  Ambient
</h1>

Ambient is a media player that runs on a web browser using YouTube IFrame Player API. It also supports playing media files on your local PC.<br>
Ambient lets you create mixed playlists of your favorite YouTube videos and other media you own on your local PC, and play them seamlessly.<br>
**Let's start your ambient media experience!**

<!-- /* p align="center">
  <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/ka215/sunorhc">
  <img alt="CircleCI" src="https://img.shields.io/circleci/build/github/ka215/sunorhc/main">
  <img alt="npm downloads" src="https://img.shields.io/npm/dt/sunorhc">
  <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/min/sunorhc?label=bundle%20size">
  <img alt="GitHub" src="https://img.shields.io/github/license/ka215/sunorhc">
</p */ -->

<p align="center">
  <a href="#installations">Installations</a> &middot;
  <a href="#usage">Usage</a> &middot;
  <a href="#supported-browsers">Supported browsers</a> &middot;
  <a href="#customization">Customization</a> &middot;
  <a href="#documentation">Documentation</a>
</p>

## Installations

### Get started with Ambient

To use Ambient, you need an environment where PHP can run. If you want to use ambient on your local PC, please prepare an environment where PHP can run using XAMPP, MAMP, docker, etc.

Once the PHP operating environment is ready, install Ambient on an endpoint that can be accessed with a web browser.

For example, if you want to install to a folder called "ambient", the steps are as follows.

```
git clone {repoURL} /path/to/ambient
```

That's it! Easy, right?

All you have to do now is access the path where you installed Ambient in your browser.
If you created and installed an ambient directly under the document root, you can access it by entering "localhost/ambient" in the URL field of your browser.

## Usage

### First, let's create a playlist

Ambient plays media by loading playlists. Therefore, first you need to create a playlist to use with ambient.

## Supported browsers

Operation is currently being verified.
<!-- /*
The working environment and supported browsers of Sunorhc are as follows.

| Chrome (>= 92) | firefox (>= 91) | Safari (>=13) | Edge (>= 92) | Android | iOS |
|:---:|:---:|:---:|:---:|:---:|:---:|
| &check; | &check; | &check; (&ast;) | &check; | &check; | &check; |

**&ast;** Note: "Intl.Locale" object is not supported by native JavaScript in Safari 13, so a separate [Polyfill](https://formatjs.io/docs/polyfills/intl-locale/) is required for formatter language resolution.
*/ -->
In addition, we have not tested the software on legacy browsers such as IE. We do not plan to provide support for these legacy browsers.

## Customization

Sorry, currently writing.

## Documentation

I'm thinking of creating one if you need it.

## References

* [YouTube Player API Reference](https://developers.google.com/youtube/iframe_api_reference)

## License

Code released under the [MIT License](https://github.com/ka215/ambient/blob/main/LICENSE).


