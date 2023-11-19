const init = function() {

var selfURL = new URL(window.location.href)
const BASE_URL = selfURL.origin + selfURL.pathname

if (!window.hasOwnProperty('APP_KEY')) {
    window.APP_KEY  = 'AmbientUserData'
}
useStge()
const AMP_STATUS = initStatus()

/**
 * Initialize AMP_STATUS object.
 */
function initStatus() {
    removeStge()
    const baseObj = window.$ambient || {}
    return Object.assign(baseObj, {
        prev: null,
        current: null,
        next: null,
        ctg: -1,
        category: null,
        playlist: null,
        media: null,
        order: 'normal',
        playertype: null,
        volume: null,
        options: null,
        // add since v1.1.0
        addtype: null,
        notice: null,
    })
}

// Window sizes container
const currentWindowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
    minFullUIWidth: 1282,// = 320 + 1 + 640 + 1 + 320
}

// Advance preparation for using YouTube players.
var tag = document.createElement('script')
tag.src = 'https://www.youtube.com/player_api'
var firstScriptTag = document.getElementsByTagName('script')[0]
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
var player

// seek container
var seekId

/**
 * Abort seek for playback media.
 */
function abortSeeking() {
    clearInterval(seekId)
    seekId = null
}

/**
 * Watcher for AMP_STATUS object.
 */
function watchState() {
    const callback = function(prop, oldValue, newValue) {
        //logger(`callback(${prop}):`, oldValue, '->', newValue)
        switch (true) {
            case /^(prev|current|next|ctg|order)$/i.test(prop):
                // Synchronize to the saved data of web storage when specific properties of AMP_STATUS object are changed.
                saveStge(prop, newValue)
                if ('current' === prop) {
                    changePlaylistFocus()
                }
                if ('order' === prop) {
                    changeToggleRandomly()
                }
                break
            case /^media$/i.test(prop):
                //logger(`change "${prop}" of AMP_STATUS:`, newValue)
                togglePlayerControllButtons()
                break
            case /^category$/i.test(prop):
                updateCategory()
                break
            case /^shuffle$/i.test(prop):
                changeToggleShuffle()
                break
            case /^volume$/i.test(prop):
                changeRangeVolume()
                break
            case /^notice$/i.test(prop):
                updateNotice(newValue)
                break
            case /^options$/i.test(prop):
                applyOptions()
                break
        }
    }
    Object.keys(AMP_STATUS).forEach((propName) => {
        let value = AMP_STATUS[propName]
        Object.defineProperty(AMP_STATUS, propName, {
            get: () => value,
            set: (newValue) => {
                const oldValue = value
                value = newValue
                //logger(`${propName}:`, oldValue, '->', newValue, oldValue !== newValue)
                if (oldValue !== newValue) {
                    callback(propName, oldValue, value)
                }
            }
        })
    })
}
watchState()

// Process global data passed by the system.
if (AmbientData) {
    if (AmbientData.hasOwnProperty('currentPlaylist')) {
        // If there is only one playlist, load immediately.
        AMP_STATUS.playlist = AmbientData.currentPlaylist
        getPlaylistData(AmbientData.currentPlaylist)
    } else
    if (AmbientData.hasOwnProperty('playlists') && Object.keys(AmbientData.playlists).length > 1) {
        // If there are multiple playlists, do nothing yet.
    }
}

/**
 * Fetch data of specific playlist.
 * 
 * @param {string} playlist 
 */
async function getPlaylistData(playlist) {
    initStatus()
    const endpointURL = `${BASE_URL}playlist/${playlist}`
    const {data} = await fetchData(endpointURL)
    //logger('getPlaylistData:', data)
    if (data && data.hasOwnProperty('options')) {
        AMP_STATUS.options = data.options
    }
    if (data && data.hasOwnProperty('media')) {
        let media = []
        if (data.media && Object.keys(data.media).length > 0) {
            const categories = Object.keys(data.media)
            categories.forEach((category, cid) => {
                // Assign index number of category to media item.
                if (data.media[category] && data.media[category].length > 0) {
                    media = media.concat(data.media[category].map((item) => {
                        item.catId = cid// Index number of category starting at 0
                        return item
                    }))
                }
            })
            AMP_STATUS.category = categories
        }
        if (media.length > 0) {
            // Filters available media only then Assign unique index number to media item.
            let amid = 0
            media = media.filter((item) => (item.hasOwnProperty('title') && item.title !== '')).map((item) => {
                item.amId = amid// Index number of media starting at 0
                amid++
                return item
            })
        }
        AMP_STATUS.media = media
        updatePlaylist()
    }
}

// DOM Elements
const $BODY               = document.body
const $ALERT              = document.getElementById('alert-notification')
const $SELECT_PLAYLIST    = document.getElementById('current-playlist')
const $SELECT_CATEGORY    = document.getElementById('target-category')
const $TOGGLE_RANDOMLY    = document.getElementById('toggle-randomly')
const $TOGGLE_SHUFFLE     = document.getElementById('toggle-shuffle')
const $TOGGLE_SEEKPLAY    = document.getElementById('toggle-seekplay')
const $RANGE_VOLUME       = document.getElementById('default-volume')
const $TOGGLE_DARKMODE    = document.getElementById('toggle-darkmode')
const $DRAWER_PLAYLIST    = document.getElementById('drawer-playlist')
const $DRAWER_SETTINGS    = document.getElementById('drawer-settings')
const $LIST_PLAYLIST      = document.getElementById('playlist-list-group')
//const $PLAYLIST_ITEMS   = Array.from($LIST_PLAYLIST.querySelectorAll('a'))
//const $CAROUSEL         = document.getElementById('carousel-container')
const $CAROUSEL_WRAPPER   = document.getElementById('carousel-wrapper')
const $CAROUSEL_PREV      = document.getElementById('data-carousel-prev')
const $CAROUSEL_NEXT      = document.getElementById('data-carousel-next')
const $MEDIA_CAPTION      = document.getElementById('media-caption')
const $EMBED_WRAPPER      = document.getElementById('embed-wrapper')
const $OPTIONAL_CONTAINER = document.getElementById('optional-container')
const $BUTTON_WATCH_TY    = document.getElementById('btn-watch-origin')
const $MENU               = document.getElementById('menu-container')
const $BUTTON_PLAYLIST    = document.getElementById('btn-playlist')
const $BUTTON_REFRESH     = document.getElementById('btn-refresh')
const $BUTTON_PLAY        = document.getElementById('btn-play')
const $BUTTON_PAUSE       = document.getElementById('btn-pause')
const $BUTTON_SETTINGS    = document.getElementById('btn-settings')
const $MODAL_OPTIONS      = document.getElementById('modal-options')
const $COLLAPSE_MENU      = document.getElementById('collapse-menu')
// Add elements since v1.1.0
const $MEDIA_MANAGE_FORM = document.forms.mediaManagement
const $MEDIA_MANAGE_ELMS = Array.from($MEDIA_MANAGE_FORM.elements)
const $MEDIA_CATEGORY_SELECT = document.getElementById('media-category')
const $PLAYLIST_MANAGE_FORM = document.forms.playlistManagement
const $PLAYLIST_MANAGE_ELMS = Array.from($PLAYLIST_MANAGE_FORM.elements)

/**
 * Method for switching display of alert component.
 * 
 * @param {string | null} state allow "show", "hide" or "hidden" as value.
 * @param {int | null} auto_close transition delay time (ms)
 */
function toggleAlert(state=null, auto_close=null) {
    let shown
    switch (true) {
        case /^show(|n)$/i.test(state):
            shown = true
            break
        case /^hid(e|den)$/i.test(state):
            shown = false
            break
        default:
            shown = $ALERT.classList.contains('opacity-0')
            break
    }
    toggleClass($ALERT, { 'opacity-0': !shown })
    // auto dismiss
    if (shown && auto_close && auto_close > 0) {
        new Promise((resolve) => {
            setTimeout(() => {
                // start fadeout after delay time
                toggleClass($ALERT, { 'opacity-0': true })
                resolve()
            }, auto_close)
        }).then(() => {
            setTimeout(() => {
                // finally hiding after has been fadeout duration
                toggleClass($ALERT, { 'hidden': true })
            }, 1000)
        })
    }
}
if (isElement($ALERT)) {
    toggleAlert('hide')
}

/**
 * Monitors the state of the playlist drawer component and fires 
 * an event when it is displayed.
 */
watcher($DRAWER_PLAYLIST, (mutation) => {
    if (mutation.attributeName === 'aria-modal' && mutation.target.ariaModal) {
        scrollToFocusItem()
    }
}, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-modal'] })

/**
 * Monitors the state of the collapse menu component and fires 
 * an event when it is opened.
 */
watcher($COLLAPSE_MENU, (mutation) => {
    if (mutation.attributeName === 'aria-expanded' && mutation.target.ariaExpanded) {
        const is_collapse_open = mutation.target.ariaExpanded === 'true'
        const collapse_item_id = mutation.target.getAttribute('aria-controls')
        if (is_collapse_open) {
            const $COLLAPSE_ITEM = document.getElementById(collapse_item_id)
            $COLLAPSE_ITEM.firstElementChild.setAttribute('style', 'max-height: calc(100vh - 420px)')
            //logger('Open collapse item:', $COLLAPSE_ITEM.firstElementChild)
        }
    }
}, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-expanded'] })

/**
 * Empty the playlist.
 */
function clearPlaylist() {
    // Clear all items of playlist
    const clone = document.getElementById('no-media').cloneNode(true)
    while($LIST_PLAYLIST.firstChild) {
        $LIST_PLAYLIST.removeChild($LIST_PLAYLIST.firstChild)
    }
    $LIST_PLAYLIST.appendChild(clone)
}

/**
 * Create a playlist from the data of the AMP_STATUS object.
 * 
 * @returns 
 */
function updatePlaylist() {
    clearPlaylist()
    const $LIST_NO_MEDIA = document.getElementById('no-media')
    let is_no_media = (AMP_STATUS.media && AMP_STATUS.media.length == 0)
    //logger('updatePlaylist:', AMP_STATUS.media, !AMP_STATUS.hasOwnProperty('ctg') || AMP_STATUS.ctg == null || Number(AMP_STATUS.ctg) == -1)
    let items = []
    if (!AMP_STATUS.hasOwnProperty('ctg') || AMP_STATUS.ctg == null || Number(AMP_STATUS.ctg) == -1) {
        items = AMP_STATUS.media
    } else {
        items = AMP_STATUS.media.filter((item) => item.catId == AMP_STATUS.ctg)
    }
    is_no_media = items.length == 0
    //logger('updatePlaylist:', is_no_media)
    // Enable playlist download
    const $BUTTON_DOWNLOAD_PLAYLIST = document.getElementById('btn-download-playlist')
    setAtts($BUTTON_DOWNLOAD_PLAYLIST, { disabled: '' }, true)
    if (is_no_media) {
        // no playable media
        $LIST_NO_MEDIA.classList.remove('hidden')
        return
    } else {
        $LIST_NO_MEDIA.classList.add('hidden')
    }
    const isShuffle = getOption('shuffle') || false
    if (isShuffle) {
        // Shuffle (evenly mix) the items array
        AMP_STATUS.shuffle = items.map((value) => ({ value, random: Math.random() }))
            .sort((a, b) => a.random - b.random)
            .map(({ value }) => value)
        logger('updatePlaylist::createShufflePlaylist:', AMP_STATUS.shuffle)
    }
    items.forEach((item) => {
        const itemElm = document.createElement('a')
        itemElm.href = '#'
        if (AMP_STATUS.current && AMP_STATUS.current !== null && AMP_STATUS.current === item.amId) {
            itemElm.setAttribute('aria-current', 'true')
            itemElm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 text-white bg-blue-500 border-b border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600')
        } else {
            itemElm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white')
        }
        //itemElm.setAttribute('data-drawer-hide', 'drawer-playlist')
        //itemElm.setAttribute('aria-controls', 'drawer-playlist')
        itemElm.setAttribute('data-playlist-item', item.amId)
        let imageSrc = './views/images/no-media-thumb.svg'
        if ((item.image && item.image !== '') || (item.thumb && item.thumb !== '')) {
            if (AmbientData && AmbientData.imageDir) {
                imageSrc = AmbientData.imageDir + (item.thumb && item.thumb !== '' ? item.thumb : item.image)
            }
        } else
        if (item.videoid && item.videoid !== '') {
            imageSrc = getYoutubeThumbnailURL(item.videoid)
        }
        // Set thumbnail image.
        const imgElm  = document.createElement('img')
        imgElm.setAttribute('src', imageSrc)
        imgElm.classList.add('block', 'h-8', 'w-8', 'rounded', 'object-cover')
        imgElm.setAttribute('alt', mb_strimwidth(item.title, 0, 50, '...'))
        itemElm.appendChild(imgElm)

        let labelText = item.title
        if (format = getOption('playlist')) {
            labelText = filterText(format, item)
        }
        if (/<.*?[!^<].*?>/gi.test(labelText)) {
            itemElm.insertAdjacentHTML('beforeend', labelText)
        } else {
            itemElm.append(document.createTextNode(labelText))
        }
        $LIST_PLAYLIST.appendChild(itemElm)
    })
    Array.from($LIST_PLAYLIST.querySelectorAll('a')).forEach((elm) => {
        elm.addEventListener('click', (evt) => {
            playItem(evt.target)
            // Toggle player control buttons shown.
            $BUTTON_PLAY.classList.add('hidden')
            $BUTTON_PAUSE.classList.remove('hidden')
        })
    })
    // For debugging code
    if (AmbientData.hasOwnProperty('debug') && AmbientData.debug) {
        execDebug()
    }
}

/**
 * Get the URL of the thumbnail image of YouTube media.
 * 
 * @param {string} videoid 
 * @returns 
 */
function getYoutubeThumbnailURL(videoid) {
    return 'https://img.youtube.com/vi/' + videoid + '/hqdefault.jpg'
}

/**
 * Clears items in the category selection field in the settings menu.
 */
function clearCategory() {
    const clone = document.getElementById('all-category').cloneNode(true)
    while($SELECT_CATEGORY.firstChild) {
        $SELECT_CATEGORY.removeChild($SELECT_CATEGORY.firstChild)
    }
    $SELECT_CATEGORY.appendChild(clone)
    $SELECT_CATEGORY.firstElementChild.setAttribute('disabled', '')
    $SELECT_CATEGORY.setAttribute('disabled', '')

    // add since v1.1.0
    while($MEDIA_CATEGORY_SELECT.firstChild) {
        $MEDIA_CATEGORY_SELECT.removeChild($MEDIA_CATEGORY_SELECT.firstChild)
    }
    const $MEDIA_CATEGORY_SELECT_FIRST_CHILD = document.createElement('option')
    $MEDIA_CATEGORY_SELECT_FIRST_CHILD.setAttribute('value', '')
    //$MEDIA_CATEGORY_SELECT_FIRST_CHILD.setAttribute('disabled', '')
    $MEDIA_CATEGORY_SELECT_FIRST_CHILD.textContent = $MEDIA_CATEGORY_SELECT.getAttribute('data-placeholder')
    $MEDIA_CATEGORY_SELECT.appendChild($MEDIA_CATEGORY_SELECT_FIRST_CHILD)
}

/**
 * Update the items in the category selection field of the settings menu.
 */
function updateCategory() {
    //logger('updateCategory:', AMP_STATUS.category)
    if (AMP_STATUS.category && AMP_STATUS.category.length > 0) {
        AMP_STATUS.category.forEach((catName, catId) => {
            const optElm = document.createElement('option')
            optElm.value = catId
            optElm.textContent = catName
            if (AMP_STATUS.category.length == 1) {
                optElm.setAttribute('selected', 'selected')
            }
            $SELECT_CATEGORY.appendChild(optElm)

            // add since v1.1.0
            const cloneOpt = optElm.cloneNode(true)
            $MEDIA_CATEGORY_SELECT.appendChild(cloneOpt)
        })
    }
    $SELECT_CATEGORY.firstElementChild.removeAttribute('disabled')
    $SELECT_CATEGORY.removeAttribute('disabled')
}

/**
 * Getter for optional data of the AMP_STATUS object.
 * 
 * @param {string} key 
 * @returns Returns null if the specified optional property is not a valid value.
 */
function getOption(key) {
    if (AMP_STATUS.hasOwnProperty('options') && AMP_STATUS.options !== null) {
        if (!AMP_STATUS.options.hasOwnProperty(key) || AMP_STATUS.options[key] === null || AMP_STATUS.options[key] === '') {
            return null
        } else {
            return AMP_STATUS.options[key]
        }
    } else {
        return null
    }
}

/**
 * Causes the application to apply specific option contents of the AMP_STATUS object.
 */
function applyOptions() {
    // Applies if a background image is specified.
    const bgImage = getOption('background')
    if (bgImage && AmbientData && AmbientData.hasOwnProperty('imageDir')) {
        const bgSrc = AmbientData.imageDir + bgImage
        //logger('applyOptions:', bgSrc, AMP_STATUS.options )
        $BODY.setAttribute('style', `background-image: url('${bgSrc}');`)
        $BODY.classList.add('bg-no-repeat', 'bg-bottom', 'bg-cover')
        $MENU.setAttribute('style', 'background: linear-gradient(to bottom, rgba(255,255,255,.3), 50%, rgba(255,255,255,1));')
    } else {
        $BODY.removeAttribute('style')
        $BODY.classList.remove('bg-no-repeat', 'bg-bottom', 'bg-cover')
        $MENU.removeAttribute('style')
    }
    // Applies if a randomly playback is specified.
    const isRandom = getOption('random')
    if (isRandom !== null) {
        AMP_STATUS.order = isRandom ? 'random' : 'normal'
    }
    // Applies if a shuffle playback is specified.
    const isShuffle = getOption('shuffle')
    if (isShuffle !== null && isShuffle) {
        AMP_STATUS.shuffle = []
        changeToggleShuffle()
    }
    // Applies if a seeking playback is specified.
    const isSeekplay = getOption('seek')
    if (isSeekplay !== null) {
        changeToggleSeekplay()
    }
    // Applies if a default volume is specified.
    AMP_STATUS.volume = getOption('volume') || 100
    changeRangeVolume()
    // Applies if a dark mode is specified.
    const isDarkMode = getOption('dark')
    if (isDarkMode !== null) {
        AMP_STATUS.options.dark = isDarkMode
    } 
    changeToggleDarkmode()
    //logger('applyOptions:', AMP_STATUS)
}

/**
 * Clear and initialize the carousel display.
 */
function clearCarousel() {
    const $CAROUSEL_NO_MEDIA = document.createElement('div')
    $CAROUSEL_NO_MEDIA.id = 'carousel-item-1'
    $CAROUSEL_NO_MEDIA.classList.add('hidden', 'duration-700', 'ease-in-out')
    $CAROUSEL_NO_MEDIA.setAttribute('data-carousel-item', '')
    const $NO_MEDIA_IMAGE = document.createElement('img')
    $NO_MEDIA_IMAGE.src = './views/images/no-media-placeholder.svg'
    $NO_MEDIA_IMAGE.setAttribute('class', 'absolute block h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2')
    $NO_MEDIA_IMAGE.setAttribute('alt', 'No media available')
    $CAROUSEL_NO_MEDIA.appendChild($NO_MEDIA_IMAGE)
    const clone = $CAROUSEL_NO_MEDIA.clone(true)
    clone.id = 'carousel-item-2'
    while($CAROUSEL_WRAPPER.firstChild) {
        $CAROUSEL_WRAPPER.removeChild($CAROUSEL_WRAPPER.firstChild)
    }
    $CAROUSEL_WRAPPER.appendChild($CAROUSEL_NO_MEDIA)
    $CAROUSEL_WRAPPER.appendChild(clone)
    $CAROUSEL_PREV.setAttribute('disabled', true)
    $CAROUSEL_NEXT.setAttribute('disabled', true)
}

/**
 * Update the carousel display.
 */
function updateCarousel() {
    let items = []
    if (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null) {
        // do nothing.
    }
    let is_show = false
    if (AMP_STATUS.hasOwnProperty('prev') && AMP_STATUS.prev !== null) {
        items.push(AMP_STATUS.prev)
    }
    if (AMP_STATUS.hasOwnProperty('current') && AMP_STATUS.current !== null) {
        items.push(AMP_STATUS.current)
        is_show = true
    }
    if (AMP_STATUS.hasOwnProperty('next') && AMP_STATUS.next !== null) {
        items.push(AMP_STATUS.next)
    }
    if (!is_show) {
        clearCarousel()
        return
    }
    while($CAROUSEL_WRAPPER.firstChild) {
        $CAROUSEL_WRAPPER.removeChild($CAROUSEL_WRAPPER.firstChild)
    }
    items.forEach((amId, index) => {
        const $COROUSEL_ITEM = document.createElement('div')
        $COROUSEL_ITEM.id = 'carousel-item-' + (index + 1)
        if (amId == AMP_STATUS.current) {
            $COROUSEL_ITEM.classList.add('duration-700', 'ease-in-out')
        } else {
            $COROUSEL_ITEM.classList.add('hidden', 'duration-700', 'ease-in-out')
        }
        $COROUSEL_ITEM.setAttribute('data-carousel-item', amId == AMP_STATUS.current ? 'active' : '')
        const $COROUSEL_ITEM_IMAGE = document.createElement('img')
        let mediaImage = './views/images/no-media-placeholder.svg'
        const mediaData = AMP_STATUS.media.filter((item) => item.amId == amId).shift()
        //logger('updateCarousel:2:', mediaData)
        let base_aspect = 'h-full'
        if (mediaData.hasOwnProperty('image') && mediaData.image !== null && mediaData.image !== '') {
            mediaImage  = AmbientData.imageDir + mediaData.image
            //logger('updateCarousel:3:', mediaImage, mediaData.image, mediaData)
        } else
        if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== null && mediaData.videoid !== '') {
            mediaImage = getYoutubeThumbnailURL(mediaData.videoid)
            base_aspect = 'w-full'
        }
        $COROUSEL_ITEM_IMAGE.src = mediaImage
        $COROUSEL_ITEM_IMAGE.classList.add('absolute', 'block', base_aspect, '-translate-x-1/2', '-translate-y-1/2', 'top-1/2', 'left-1/2')
        $COROUSEL_ITEM_IMAGE.setAttribute('alt', mediaData.title)
        if (basename(mediaImage) === 'no-media-placeholder' && isObject(AMP_STATUS.options) && AMP_STATUS.options.hasOwnProperty('dark') && AMP_STATUS.options.dark) {
            $COROUSEL_ITEM_IMAGE.setAttribute('style', 'opacity: .7')
        }
        $COROUSEL_ITEM.appendChild($COROUSEL_ITEM_IMAGE)
        $CAROUSEL_WRAPPER.appendChild($COROUSEL_ITEM)
    })
    $CAROUSEL_PREV.removeAttribute('disabled')
    $CAROUSEL_NEXT.removeAttribute('disabled')
}

/**
 * Update the media caption display.
 * @param {Object} mediaData 
 */
function updateMediaCaption(mediaData) {
    const format = getOption('caption') || '%artist% - %title%'
    labelText = filterText(format, mediaData)
    while($MEDIA_CAPTION.firstChild) {
        $MEDIA_CAPTION.removeChild($MEDIA_CAPTION.firstChild)
    }
    const $textWrap = document.createElement('div')
    $textWrap.classList.add('marquee-inner')
    if (/<.*?[!^<].*?>/gi.test(labelText)) {
        $textWrap.innerHTML = labelText
    } else {
        $textWrap.appendChild(document.createTextNode(labelText))
    }
    $MEDIA_CAPTION.appendChild($textWrap)
    //logger('updateMediaCaption:', getOption('caption'), labelText, labelText.match(/<.*?[!^<].*?>/gi), $textWrap.clientWidth)
    toggleMarqueeCaption()
}

/**
 * Toggle caption marqueeing depending on window size.
 */
function toggleMarqueeCaption() {
    const $MARQUEE_NODE = $MEDIA_CAPTION.querySelector('.marquee-inner')
    if (!isElement($MARQUEE_NODE)) {
        return
    }
    const $MARQUEE_CLONE = $MARQUEE_NODE.cloneNode(true)
    const marqueeDuration = Math.floor($MARQUEE_NODE.clientWidth / 32)// 16px = 1rem
    if ($MARQUEE_NODE.clientWidth > currentWindowSize.width || $MARQUEE_NODE.clientWidth > 640) {
        // Turn overflow text into a marquee.
        $MARQUEE_CLONE.setAttribute('aria-hidden', true)
        $MEDIA_CAPTION.appendChild($MARQUEE_CLONE)
        $MEDIA_CAPTION.querySelectorAll('.marquee-inner').forEach((elm) => {
            elm.animate({
                // .gap-2 = 0.5rem = 8px
                translate: [0, 'calc(-100% - 8px)']
            }, {
                duration: marqueeDuration * 1000,
                iterations: Infinity
            })
        })
    } else {
        while($MEDIA_CAPTION.firstChild) {
            $MEDIA_CAPTION.removeChild($MEDIA_CAPTION.firstChild)
        }
        $MEDIA_CAPTION.appendChild($MARQUEE_CLONE)
    }
    //logger('toggleMarqueeCaption:', $MARQUEE_CLONE, marqueeDuration, currentWindowSize.width)
}

/**
 * Filters text to the specified format.
 */
function filterText(format, mediaData) {
    const patterns = format.match(/%(.+?)%/gi)
    let text = format
    if (patterns.length > 0) {
        patterns.forEach((pattern) => {
            const property = pattern.replaceAll('%', '')
            const replacer = (mediaData.hasOwnProperty(property) && mediaData[property]) ? mediaData[property] : ''
            text = text.replaceAll(`%${property}%`, replacer)
            //logger('filterText:', property, replacer, text)
        })
        text = text.trim().replace(/^[-_‐–−—ー]?(.*)[-_‐–−—ー]?$/, '$1').trim()
    }
    //logger('filterText:', format, patterns, text)
    return text
}


// Event handlings

/**
 * Event listener when the playlist selection field in the settings menu is changed.
 */
$SELECT_PLAYLIST.addEventListener('change', (evt) => {
    const newPlaylist = evt.target.value
    let oldPlaylist = null
    if (AMP_STATUS.hasOwnProperty('playlist')) {
        oldPlaylist = AMP_STATUS.playlist
    }
    if (oldPlaylist !== newPlaylist) {
        getPlaylistData(newPlaylist)
        //initStatus()
        clearCategory()
    }
    AMP_STATUS.playlist = newPlaylist
})

/**
 * Event listener when the category selection field in the settings menu is changed.
 */
$SELECT_CATEGORY.addEventListener('change', (evt) => {
    let oldCtgId = null
    if (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null) {
        oldCtgId = AMP_STATUS.ctg
    }
    if (oldCtgId !== evt.target.value) {
        AMP_STATUS.ctg = Number(evt.target.value)
        AMP_STATUS.prev    = null
        AMP_STATUS.current = null
        AMP_STATUS.next    = null
    }
    updatePlaylist()
})

/**
 * Event listener when the button of "previous" for carousel has been clicked.
 */
$CAROUSEL_PREV.addEventListener('click', (evt) => {
    playItem(evt.target, AMP_STATUS.prev)
})

/**
 * Event listener when the button of "next" for carousel has been clicked.
 */
$CAROUSEL_NEXT.addEventListener('click', (evt) => {
    playItem(evt.target, AMP_STATUS.next)
})

/**
 * Event listener when the button of "refresh" in bottom menu has been clicked.
 */
$BUTTON_REFRESH.addEventListener('click', (evt) => {
    reloadPage()
})

/**
 * Toggle the display of player controls button after media loaded.
 */
function togglePlayerControllButtons() {
    if (AMP_STATUS.media !== null && AMP_STATUS.media.length > 0) {
        // There are activated when available media are set.
        $BUTTON_PLAY.removeAttribute('disabled')
        $BUTTON_PAUSE.removeAttribute('disabled')
    } else {
        // There are deactivated when no available media.
        $BUTTON_PLAY.setAttribute('disabled', true)
        $BUTTON_PLAY.classList.remove('hidden')
        $BUTTON_PAUSE.setAttribute('disabled', true)
        $BUTTON_PAUSE.classList.add('hidden')
    }
}

/**
 * Event listener when the "play" button in bottom menu has been clicked.
 */
$BUTTON_PLAY.addEventListener('click', (evt) => {
    let playableIds = AMP_STATUS.media.map((item) => item.amId) 
    if (AMP_STATUS.ctg > -1) {
        playableIds = AMP_STATUS.media.filter((item) => item.catId == AMP_STATUS.ctg).map((item) => item.amId)
    }
    const isShuffle = getOption('shuffle') || false
    if (isShuffle && AMP_STATUS.hasOwnProperty('shuffle') && AMP_STATUS.shuffle.length > 0) {
        playableIds = AMP_STATUS.shuffle.map((item) => item.amId)
    }
    let playId
    if (AMP_STATUS.current !== null) {
        playId = AMP_STATUS.current
    } else {
        if (AMP_STATUS.order === 'random') {
            playId = playableIds[Math.floor(Math.random() * playableIds.length)]
        } else {
            playId = playableIds.shift()
        }
    }
    if (AMP_STATUS.playertype === 'youtube' && player) {
        const YTPstate = player.getPlayerState()
        //logger('"Play" the YouTube Player:', YTPstate)
        if (YTPstate != 1) {
            player.playVideo()
        }
    } else
    if (/^(audio|video)$/i.test(AMP_STATUS.playertype)) {
        const _elms = document.getElementsByTagName(AMP_STATUS.playertype)
        const playerElm = _elms[0]
        playerElm.play()
    } else {
        playItem(null, playId)
    }
    // Toggle this button shown.
    $BUTTON_PLAY.classList.add('hidden')
    $BUTTON_PAUSE.classList.remove('hidden')
})

/**
 * Event listener when the "pause" button in bottom menu has been clicked.
 */
$BUTTON_PAUSE.addEventListener('click', (evt) => {
    if (!AMP_STATUS.hasOwnProperty('playertype') || AMP_STATUS.playertype === null || AMP_STATUS.playertype === '') {
        return false
    }
    if (AMP_STATUS.playertype === 'youtube' && player) {
        if (player.getPlayerState() == 1) {
            player.pauseVideo()
        } else {
            player.stopVideo()
        }
    } else 
    if (/^(audio|video)$/i.test(AMP_STATUS.playertype)) {
        const _elms = document.getElementsByTagName(AMP_STATUS.playertype)
        const playerElm = _elms[0]
        playerElm.pause()
    } else {
        // Deactivate their player control buttons.
        $BUTTON_PLAY.setAttribute('disabled', true)
        $BUTTON_PLAY.classList.remove('hidden')
        $BUTTON_PAUSE.setAttribute('disabled', true)
        $BUTTON_PAUSE.classList.add('hidden')
    }
    // Toggle this button shown.
    $BUTTON_PAUSE.classList.add('hidden')
    $BUTTON_PLAY.classList.remove('hidden')
})

/**
 * Toggle style to focus the active item in a playlist.
 */
function changePlaylistFocus() {
    // Change the focus of playlist.
    Array.from($LIST_PLAYLIST.querySelectorAll('a')).forEach((elm) => {
        if (AMP_STATUS.current !== null && elm.dataset.playlistItem == AMP_STATUS.current) {
            elm.setAttribute('aria-current', 'true')
            elm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 text-white bg-blue-500 border-b border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600')
            activeRect = getRect(elm)
        } else {
            elm.removeAttribute('aria-current')
            elm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white')
        }
    })
    scrollToFocusItem()
}

/**
 * Auto-scroll to active item in playlist.
 */
function scrollToFocusItem() {
    const targetElm = $LIST_PLAYLIST.querySelector('a[aria-current="true"]')
    const elmRect = getRect(targetElm)
    if (elmRect) {
        let move = targetElm.offsetTop > $LIST_PLAYLIST.clientHeight ? Math.abs($LIST_PLAYLIST.clientHeight - targetElm.offsetTop) + elmRect.height : 0
        $LIST_PLAYLIST.scrollTo({top: move, behavior: 'smooth'})
        //logger('scrollToFocusItem:', activeRect, targetElm.offsetTop, $LIST_PLAYLIST.clientHeight, $LIST_PLAYLIST.offsetTop, move, $LIST_PLAYLIST.scrollHeight)
    }
}

/**
 * Event listener when changing the randomly of settings menu toggle button.
 */
$TOGGLE_RANDOMLY.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
    AMP_STATUS.order = evt.target.checked ? 'random' : 'normal'
})

/**
 * Toggle the randomly of settings menu toggle button.
 */
function changeToggleRandomly() {
    const toggleElm = $TOGGLE_RANDOMLY.querySelector('input[type="checkbox"]')
    toggleElm.checked = AMP_STATUS.order === 'random'
}

/**
 * Event listener when changing the shuffle play of settings menu toggle button.
 */
$TOGGLE_SHUFFLE.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
    if (isObject(AMP_STATUS.options) && AMP_STATUS.options.hasOwnProperty('shuffle')) {
        AMP_STATUS.options.shuffle = evt.target.checked
    }
    AMP_STATUS.shuffle = shufflePlaylist()
})

/**
 * Toggle the shuffle play of settings menu toggle button.
 */
function changeToggleShuffle() {
    const toggleElm = $TOGGLE_SHUFFLE.querySelector('input[type="checkbox"]')
    toggleElm.checked = !!AMP_STATUS.options.shuffle
    shufflePlaylist()
}

/**
 * Shuffle playlist.
 * @returns 
 */
function shufflePlaylist() {
    let newList = []
    if (isObject(AMP_STATUS.options) && AMP_STATUS.options.hasOwnProperty('shuffle') && !!AMP_STATUS.options.shuffle) {
        let items = AMP_STATUS.media || []
        if (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) !== -1) {
            items = AMP_STATUS.media.filter((item) => item.catId == AMP_STATUS.ctg)
        }
        if (items.length > 0) {
            // Shuffle (evenly mix) the items array
            newList = items.map((value) => ({ value, random: Math.random() }))
                .sort((a, b) => a.random - b.random)
                .map(({ value }) => value)
            logger('shufflePlaylist:', newList)
        }
    }
    return newList
}

/**
 * Event listener when changing the seekplay of settings menu toggle button.
 */
$TOGGLE_SEEKPLAY.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
    if (isObject(AMP_STATUS.options) && AMP_STATUS.options.hasOwnProperty('seek')) {
        AMP_STATUS.options.seek = evt.target.checked
    }
})

/**
 * Toggle the seekplay of settings menu toggle button.
 */
function changeToggleSeekplay() {
    const toggleElm = $TOGGLE_SEEKPLAY.querySelector('input[type="checkbox"]')
    toggleElm.checked = !!AMP_STATUS.options.seek
}

/**
 * Event listener when inputting the volume of settings menu range slider.
 */
$RANGE_VOLUME.addEventListener('input', (evt) => {
    const currentVolume = Number(evt.target.value)
    const displayVolume = document.getElementById('default-volume-value')
    displayVolume.textContent = currentVolume
})

/**
 * Fires an input event of range slider when was changed default playback volume.
 */
function changeRangeVolume() {
    //logger('changeRangeVolume:', AMP_STATUS.volume)
    $RANGE_VOLUME.value = inRange(Number(AMP_STATUS.volume), 0, 100) ? Number(AMP_STATUS.volume) : 100
    $RANGE_VOLUME.dispatchEvent(new Event('input'))
}

/**
 * Event listener when changing the darkmode of settings menu toggle button.
 */
$TOGGLE_DARKMODE.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
    if (!isObject(AMP_STATUS.options)) {
        AMP_STATUS.options = { dark: evt.target.checked }
    } else {
        if (AMP_STATUS.options.hasOwnProperty('dark')) {
            AMP_STATUS.options.dark = evt.target.checked
        } else {
            AMP_STATUS.options = Object.assign(AMP_STATUS.options, { dark: evt.target.checked })
        }
    }
    changeToggleDarkmode()
})

/**
 * Toggle the darkmode of settings menu toggle button.
 */
function changeToggleDarkmode() {
    const toggleElm  = $TOGGLE_DARKMODE.querySelector('input[type="checkbox"]')
    const isDarkmode = isObject(AMP_STATUS.options) && AMP_STATUS.options.hasOwnProperty('dark') ? !!AMP_STATUS.options.dark : false
    toggleElm.checked = isDarkmode
    if (isDarkmode) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
    const $CAROUSEL_ITEMS = Array.from(document.querySelectorAll('[id^="carousel-item-"]'))
    $CAROUSEL_ITEMS.forEach((item) => {
        const isNoImage = basename(item.firstElementChild.src) === 'ambient-placeholder'
        //logger('changeToggleDarkmode:', basename(item.firstElementChild.src), isNoImage)
        if (isDarkmode) {
            setStyles(item, 'opacity: .7')
        } else {
            setStyles(item)
        }
    })
    const $AUDIO_PLAYER = document.getElementsByTagName('audio')
    if ($AUDIO_PLAYER.length == 1 && isElement($AUDIO_PLAYER[0])) {
        if (isDarkmode) {
            setStyles($AUDIO_PLAYER[0], 'opacity: .7')
        } else {
            setStyles($AUDIO_PLAYER[0])
        }
        //logger('changeToggleDarkmode:', $AUDIO_PLAYER[0])
    }
}

/**
 * Updates the user's media playback state.
 * By giving this function the ID you want to play, it will generate a media 
 * configuration that includes the previous and next playback IDs according 
 * to the playback order.
 * 
 * @param {number} currentAmId 
 */
function updatePlayStatus(currentAmId) {
    // Set looking ahead to the next index.
    const targetData = AMP_STATUS.ctg != null && AMP_STATUS.ctg != -1 ? AMP_STATUS.media.filter((item) => item.catId == AMP_STATUS.ctg) : AMP_STATUS.media
    const isShuffle  = getOption('shuffle') || false
    let idCandidates = []
    if (isShuffle && AMP_STATUS.hasOwnProperty('shuffle') && AMP_STATUS.shuffle.length > 0) {
        //logger('updatePlayStatus::shuffle:', AMP_STATUS.shuffle)
        idCandidates = AMP_STATUS.shuffle.map((item) => item.amId)
    } else {
        idCandidates = targetData.map((item) => item.amId)
    }
    //logger('updatePlayStatus:', AMP_STATUS.ctg, idCandidates)
    AMP_STATUS.current = currentAmId
    let prevId = null
    let nextId = null
    if (AMP_STATUS.order === 'random') {
        if (idCandidates.length > 1) {
            idCandidates = idCandidates.filter((v) => v != currentAmId)
        }
        prevId = idCandidates[Math.floor(Math.random() * idCandidates.length)]
        nextId = idCandidates[Math.floor(Math.random() * idCandidates.length)]
    } else {
        idCandidates.forEach((_v, _i) => {
            if (_v == currentAmId) {
                prevId = _i == 0 ? idCandidates[idCandidates.length - 1] : idCandidates[_i - 1]
                nextId = idCandidates.length == _i + 1 ? idCandidates[0] : idCandidates[_i + 1]
                return false
            }
        })
    }
    AMP_STATUS.prev = prevId
    AMP_STATUS.next = nextId
    //logger('updatePlayStatus:', prevId, currentAmId, nextId, AMP_STATUS)
    updateCarousel()
}

/**
 * Commit a media item to play.
 * This function is intended to be called from a playlist item click event, 
 * but it can also be called independently by specifying the media ID directly 
 * or from an event listener on an element with the data-playlist-item attribute.
 * 
 * @param {Object | null} object 
 * @param {number | null} id 
 */
function playItem(object=null, id=null) {
    const thisElm = isElement(object) ? object : (object !== null ? object.target : null)
    const amId = id !== null ? id : (thisElm.dataset.playlistItem ? Number(thisElm.dataset.playlistItem) : 0) 
    const mediaData = AMP_STATUS.media.filter((item) => item.amId == amId).shift()
    let mediaSrc   = null
    let playerType = null
    if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
        mediaSrc = mediaData.file
        playerType = 'html'
    }
    if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
        mediaSrc = mediaData.videoid
        playerType = 'youtube'
    }
    logger('playItem:', amId, mediaSrc, playerType)
    updatePlayStatus(amId)
    if (currentWindowSize.width < currentWindowSize.minFullUIWidth) {
        // Hide drawers
        document.getElementById('btn-close-playlist').click()
        document.getElementById('btn-close-settings').click()
    }
    setupPlayer(playerType, mediaSrc, mediaData)
}

/**
 * Handle the player to prepare depending on the type of media to play.
 * 
 * @param {string} type "youtube" or "html" only 
 * @param {string} src 
 * @param {Object} mediaData 
 */
function setupPlayer(type, src, mediaData) {
    // update media caption.
    updateMediaCaption(mediaData)
    switch(true) {
        case /^YouTube$/i.test(type):
            AMP_STATUS.playertype = type
            createYTPlayer(mediaData)
            break
        case /^HTML$/i.test(type):
            const extension = getExt(src)
            //logger('setupPlayer:', extension)
            if (/^(aac|midi?|mp3|m4a|ogg|opus|wav|weba|wma)$/i.test(extension)) {
                AMP_STATUS.playertype = 'audio'
                createPlayerTag('audio', mediaData)
            } else
            if (/^(avi|mpe?g|mp4|ogv|ts|webm|3g(p|2))$/i.test(extension)) {
                AMP_STATUS.playertype = 'video'
                createPlayerTag('video', mediaData)
            } else {
                AMP_STATUS.playertype = null
                throw new Error('Unsupported file format')
            }
            break
        default:
            AMP_STATUS.playertype = null
            playItem(null, AMP_STATUS.next)
            throw new Error('Unsupported player specified.')
    }
}

/**
 * Event handler that is called when the YouTube player is ready to play.
 * 
 * @param {Object} event 
 */
function onPlayerReady(event) {
    // from: flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-full h-0 opacity-0
    // to:   flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-max h-max
    $EMBED_WRAPPER.classList.add('w-max', 'h-max')
    $EMBED_WRAPPER.classList.remove('w-full', 'h-0', 'opacity-0')

    if (youtubeURL = player.getVideoUrl()) {
        $BUTTON_WATCH_TY.href = youtubeURL
    } else {
        $BUTTON_WATCH_TY.href = 'https://www.youtube.com/watch?v=' + mediaData.videoid
    }

    setTimeout(() => {
        $BUTTON_WATCH_TY.removeAttribute('disabled')
        $OPTIONAL_CONTAINER.classList.remove('hidden', 'opacity-0')
    }, 500)
    
    if (getOption('autoplay')) {
        // Force play if playback does not start after (wait * 100) milliseconds.
        const wait = 15
        let elapsed = 0
        let intervalID = setInterval(() => {
            elapsed++
            if (event.target.getPlayerState() == YT.PlayerState.PLAYING) {
                clearInterval(intervalID)
                intervalID = null
                logger(`onPlayerReady::elapsed ${elapsed * 100}ms:`, 'Playback has started!')
            } else
            if (elapsed > wait) {
                //document.getElementById('btn-play').click()
                document.getElementById('btn-play').dispatchEvent(new Event('click'))
            }
            
        }, 100)
    }

    event.target.setVolume(AMP_STATUS.volume)
    event.target.playVideo()
}

/**
 * Event handler called when the state of the YouTube player changes.
 * 
 * @param {Object} event 
 */
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        // from: flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-max h-max
        // to:   flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-full h-0 opacity-0
        $EMBED_WRAPPER.classList.add('w-full', 'h-0', 'opacity-0')
        $EMBED_WRAPPER.classList.remove('w-max', 'h-max')

        $BUTTON_WATCH_TY.href = '#'
        $BUTTON_WATCH_TY.setAttribute('disabled', '')
        $OPTIONAL_CONTAINER.classList.add('hidden', 'opacity-0')
    
        const nextId = AMP_STATUS.next || 0
        const mediaData = AMP_STATUS.media.filter((item) => item.amId == nextId).shift()
        let mediaSrc   = null
        let playerType = null
        if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
            mediaSrc = mediaData.file
            playerType = 'html'
            player.destroy()
        }
        if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
            mediaSrc = mediaData.videoid
            playerType = 'youtube'
        }
        updatePlayStatus(nextId)
        setupPlayer(playerType, mediaSrc, mediaData)
    }
    if (event.data == YT.PlayerState.PAUSED) {
        // Toggle this button shown (Pause -> Play).
        $BUTTON_PAUSE.classList.add('hidden')
        $BUTTON_PLAY.classList.remove('hidden')
    }
    if (event.data == YT.PlayerState.PLAYING) {
        // Toggle this button shown (Play -> Pause).
        $BUTTON_PLAY.classList.add('hidden')
        $BUTTON_PAUSE.classList.remove('hidden')
    }
    if (event.data == -1 && getOption('autoplay')) {
        // When playback unstarted.
        logger('onPlayerStateChange::unstarted.')
    }
}

/**
 * Event handler called when the YouTube player encounters an error.
 * 
 * @param {Object} event 
 */
function onPlayerError(event) {
    // Skip if media playback fails.
    logger('error', 'onYTPlayerError:', event.data, mediaData, 'force')
    // from: flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-max h-max
    // to:   flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-full h-0 opacity-0
    $EMBED_WRAPPER.classList.add('w-full', 'h-0', 'opacity-0')
    $EMBED_WRAPPER.classList.remove('w-max', 'h-max')

    $BUTTON_WATCH_TY.href = '#'
    $BUTTON_WATCH_TY.setAttribute('disabled', '')
    $OPTIONAL_CONTAINER.classList.add('hidden', 'opacity-0')

    const nextId = AMP_STATUS.next
    const mediaData = AMP_STATUS.media.filter((item) => item.amId == nextId).shift()
    let mediaSrc   = null
    let playerType = null
    if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
        mediaSrc = mediaData.file
        playerType = 'html'
        player.destroy()
    }
    if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
        mediaSrc = mediaData.videoid
        playerType = 'youtube'
    }
    updatePlayStatus(nextId)
    setupPlayer(playerType, mediaSrc, mediaData)
}

/**
 * Create a YouTube player.
 * 
 * @param {Object} mediaData 
 */
function createYTPlayer(mediaData) {
    const playerElm = document.createElement('div')
    playerElm.id = 'ytplayer'
    while($EMBED_WRAPPER.firstChild) {
        $EMBED_WRAPPER.removeChild($EMBED_WRAPPER.firstChild)
    }
    $EMBED_WRAPPER.appendChild(playerElm)

    const playerOptions = {
        autoplay: 1,
        controls: 1,
        fs: 0,
        cc_load_policy: 0,
        rel: 0,
    }
    if (optAutoplay = getOption('autoplay')) {
        playerOptions.autoplay = Number(optAutoplay)
    }
    if (optControls = getOption('controls')) {
        playerOptions.controls = Number(optControls)
    }
    if (optFs = getOption('fs')) {
        playerOptions.fs = Number(optFs)
    }
    if (optCLP = getOption('cc_load_policy')) {
        playerOptions.cc_load_policy = Number(optCLP)
    }
    if (optRel = getOption('rel')) {
        playerOptions.rel = Number(optRel)
    }
    if (getOption('seek') && mediaData.hasOwnProperty('start') && mediaData.start !== '') {
        playerOptions.start = mediaData.start
    }
    if (getOption('seek') && mediaData.hasOwnProperty('end') && mediaData.end !== '') {
        playerOptions.end = mediaData.end
    }
    if (mediaData.hasOwnProperty('volume') && mediaData.volume !== '' && inRange(Number(mediaData.volume), 0, 100)) {
        AMP_STATUS.volume = Number(mediaData.volume)
    } else {
        AMP_STATUS.volume = getOption('volume') || 100
    }
    // aspect: 16:9 = w:h -> h = 9w/16
    const adjustSize = {
        width: currentWindowSize.width >= 640 ? 640 : (currentWindowSize.width - 2),
        height: Math.floor((9 * (currentWindowSize.width >= 640 ? 640 : (currentWindowSize.width - 2))) / 16)
    }
    //logger('createYTPlayer:', mediaData, playerOptions, currentWindowSize, adjustSize)
    player = new YT.Player('ytplayer', {
        height: adjustSize.height,
        width: adjustSize.width,
        videoId: mediaData.videoid,
        playerVars: playerOptions,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError,
        },
    })
}

/**
 * Create a media playback player using HTML.
 * 
 * @param {string} tagname "audio" or "video"
 * @param {Object} mediaData 
 */
function createPlayerTag(tagname, mediaData) {
    const playerElm = document.createElement(tagname)
    const sourceElm = document.createElement('source')
    playerElm.id = 'html-player'
    playerElm.setAttribute('controls', true)
    playerElm.setAttribute('controlslist', 'nodownload')
    playerElm.setAttribute('autoplay', true)
    if (mediaData.hasOwnProperty('volume') && mediaData.volume !== '' && inRange(Number(mediaData.volume), 0, 100)) {
        AMP_STATUS.volume = Number(mediaData.volume)
    } else {
        AMP_STATUS.volume = getOption('volume') || 100
    }
    playerElm.volume = AMP_STATUS.volume / 100
    if (tagname === 'audio' && isObject(AMP_STATUS.options) && AMP_STATUS.options.hasOwnProperty('dark') && AMP_STATUS.options.dark) {
        setStyles(playerElm, 'opacity: .7')
    }
    if (getOption('seek') && mediaData.hasOwnProperty('start') && mediaData.start !== '') {
        playerElm.currentTime = mediaData.start
    }
    sourceElm.src = mediaData.file
    sourceElm.setAttribute('type', `audio/${getExt(mediaData.file)}`)
    playerElm.appendChild(sourceElm)
    while($EMBED_WRAPPER.firstChild) {
        $EMBED_WRAPPER.removeChild($EMBED_WRAPPER.firstChild)
    }
    $EMBED_WRAPPER.appendChild(playerElm)
    // from: flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-full h-0 opacity-0
    // to:   flex justify-center        border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-max h-max border-0
    $EMBED_WRAPPER.classList.add('max-w-2xl', 'w-max', 'h-max', 'border-0')
    $EMBED_WRAPPER.classList.remove('border', 'w-full', 'h-0', 'opacity-0')

    $BUTTON_WATCH_TY.href = '#'
    $BUTTON_WATCH_TY.setAttribute('disabled', '')
    $OPTIONAL_CONTAINER.classList.add('hidden', 'opacity-0')

    playerElm.addEventListener('play', (evt) => {
        if (getOption('seek') && mediaData.hasOwnProperty('end') && mediaData.end !== '') {
            // When the seek end time is reached, forcibly seeks to the end of the media and ends playback.
            if (!seekId) {
                seekId = setInterval(() => {
                    if (evt.target.currentTime >= mediaData.end) {
                        evt.target.currentTime = evt.target.duration
                        abortSeeking()
                    }
                    //logger('Now seeking:', seekId, evt.target.currentTime)
                }, 500)
            }
        }
    })

    playerElm.addEventListener('playing', (evt) => {
        // Toggle this button shown (Play -> Pause).
        $BUTTON_PLAY.classList.add('hidden')
        $BUTTON_PAUSE.classList.remove('hidden')
    })

    playerElm.addEventListener('pause', (evt) => {
        // Toggle this button shown (Pause -> Play).
        $BUTTON_PAUSE.classList.add('hidden')
        $BUTTON_PLAY.classList.remove('hidden')
    })

    playerElm.addEventListener('volumechange', (evt) => {
        logger('playerVolumeChange:', evt.target.volume, AMP_STATUS.volume)
    })

    playerElm.addEventListener('ended', (evt) => {
        // from: flex justify-center        border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-max h-max border-0
        // to:   flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-full h-0 opacity-0
        $EMBED_WRAPPER.classList.add('border', 'w-full', 'h-0', 'opacity-0')
        $EMBED_WRAPPER.classList.remove('max-w-2xl', 'w-max', 'h-max', 'border-0')

        abortSeeking()

        const nextId = AMP_STATUS.next
        const mediaData = AMP_STATUS.media.filter((item) => item.amId == nextId).shift()
        let mediaSrc   = null
        let playerType = null
        if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
            mediaSrc = mediaData.file
            playerType = 'html'
        }
        if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
            mediaSrc = mediaData.videoid
            playerType = 'youtube'
            evt.target.remove()
        }
        updatePlayStatus(nextId)
        setupPlayer(playerType, mediaSrc, mediaData)
    })

    playerElm.addEventListener('error', (evt) => {
        logger('error', 'Player Error:', mediaData, evt, 'force')
    })

    playerElm.addEventListener('loadstart', (evt) => {
        // If the readyState does not change 1 second after the start of loading, 
        // it is skipped as an unsupported medium.
        setTimeout(() => {
            if (evt.target.readyState == 0) {
                logger('warn', `The player will treat this media (${mediaData.file}) as unsupported and will skip it.`, 'force')
                evt.target.dispatchEvent(new Event('ended'))
            }
        }, 1500)
    })

    playerElm.addEventListener('loadedmetadata', (evt) => {
        const self = evt.target
        if (self.tagName === 'VIDEO') {
            //logger('loadedmetadata:', `videoSize(${self.videoWidth} x ${self.videoHeight})`)
            if (!self.videoHeight || !self.videoWidth) {
                self.setAttribute('poster', './views/images/no-media-placeholder.svg')
            }
            if (currentWindowSize.width >= 640) {
                self.width  = 640
                self.height = Math.floor((640 * self.videoHeight) / self.videoWidth)
            } else {
                self.width  = currentWindowSize.width - 2
                self.height = Math.floor(((currentWindowSize.width - 2) * self.videoHeight) / self.videoWidth)
            }
        }
    })
}

// Modal Options since v1.1.0

/**
 * Event handlers for Media Management form ($MEDIA_MANAGE_FORM).
 */
$MEDIA_MANAGE_ELMS.forEach((elm) => {
    const $MEDIA_URL_FIELD   = document.getElementById('media-management-field-media-url')
    const $MEDIA_FILES_FIELD = document.getElementById('media-management-field-media-files')
    const $INPUT_VIDEOID     = document.getElementById('youtube-videoid')
    const $INPUT_FILEPATH    = document.getElementById('local-media-filepath')
    const $INPUT_MEDIA_TITLE = document.getElementById('media-title')

    switch(elm.name) {
        case 'media_type':
            elm.addEventListener('click', (evt) => {
                const prevType = AMP_STATUS.hasOwnProperty('addtype') ? AMP_STATUS.addtype : null
                if (evt.target.value === 'youtube') {
                    toggleClass($MEDIA_URL_FIELD,   { hidden: false })
                    toggleClass($MEDIA_FILES_FIELD, { hidden: true  })
                    toggleClass($MEDIA_DIR_FIELD,   { hidden: true  })
                } else {
                    toggleClass($MEDIA_URL_FIELD,   { hidden: true  })
                    toggleClass($MEDIA_FILES_FIELD, { hidden: false })
                    toggleClass($MEDIA_DIR_FIELD,   { hidden: false })
                }
                AMP_STATUS.addtype = evt.target.value
                if (prevType !== evt.target.value) {
                    //logger(prevType, '->', AMP_STATUS.addtype)
                    resetMediaManageForm()
                }
            })
            break
        case 'youtube_url':
            elm.addEventListener('input', (evt) => {
                const baseURL = 'https://www.youtube.com'
                const value = evt.target.value
                if (value.length < `${baseURL}/watch?v=.`.length) {
                    setValidated(evt.target)
                    $INPUT_VIDEOID.value = ''
                    return
                }
                try {
                    if (!/^(https:\/\/|)www\.youtube\.com/.test(value)) {
                        throw new Error('Invalid URL.')
                    }
                    const url = new URL(value, baseURL)
                    const params = url.searchParams
                    const videoid = params.get('v')
                    if (url.origin !== baseURL || videoid === null || videoid === '') {
                        //elm.target.value = url.hostname + url.pathname + url.search
                        throw new Error('Invalid URL.')
                    } else {
                        //logger(url.hostname, url.pathname, videoid)
                        if (/^https:\/\//.test(value)) {
                            evt.target.value = url.hostname + url.pathname + '?v=' + videoid
                        }
                        setValidated(evt.target, true)
                        $INPUT_VIDEOID.value = videoid
                    }
                } catch(err) {
                    logger('error', err, 'force')
                    setValidated(evt.target, false)
                }
            })
            break
        case 'local_media_file':
            elm.addEventListener('change', async (evt) => {
                const filelist = evt.target.files
                logger('local_file:', filelist, [evt.target])
                if (filelist.length > 0 && filelist[0].size > 0) {
                    const filename = filelist[0].name
                    setValidated(evt.target, await getRelativeFilepath(filename))
                    $INPUT_MEDIA_TITLE.value = basename(filename)
                    evt.target.blur()
                    $INPUT_MEDIA_TITLE.dispatchEvent(new Event('change'))
                } else {
                    $INPUT_FILEPATH.value = ''
                    $INPUT_MEDIA_TITLE.value = ''
                    setValidated(evt.target)
                    setValidated($INPUT_MEDIA_TITLE)
                }
            })
            break
        case 'media_filepath':
            elm.addEventListener('change', (evt) => {
                evt.target.focus()
            })
            break
        case 'category':
            //logger('category:', elm.value, elm.selectedIndex)
            elm.addEventListener('change', (evt) => {
                if (evt.target.selectedIndex == 0) {
                    setValidated(evt.target)
                } else {
                    const isEmpty = evt.target.value === ''
                    setValidated(evt.target, !isEmpty)
                }
            })
            break
        case 'title':
            elm.addEventListener('input', (evt) => {
                if (evt.target.value === '') {
                    setValidated(evt.target)
                    return
                }
            })
            elm.addEventListener('change', (evt) => {
                const isEmpty = evt.target.value === ''
                setValidated(evt.target, !isEmpty)
            })
            break
        case 'volume':
            elm.addEventListener('input', (evt) => {
                const $VOLUME_VALUE = document.getElementById('default-media-volume')
                $VOLUME_VALUE.textContent = evt.target.value
            })
            break
        case 'start':
        case 'end':
            elm.addEventListener('input', (evt) => {
                if (evt.target.value === '') {
                    setValidated(evt.target)
                    return
                }
            })
            elm.addEventListener('change', (evt) => {
                const value = evt.target.value
                if (value === '') {
                    setValidated(evt.target)
                    return
                } else {
                    const isValid = (/^\d+$/.test(value) || (value.indexOf(':') > 0 && /^(\d+\:)?([0-5]?[0-9]\:)?[0-5]?[0-9]$/.test(value)))
                    logger(value, isValid)
                    setValidated(evt.target, isValid)
                }
            })
            break
        case 'fadein':
        case 'fadeout':
            break
        case 'add_media':
            elm.addEventListener('click', (evt) => {
                const formData = new FormData($MEDIA_MANAGE_FORM)
                const result = addMediaData(Array.from(formData.entries()))
                logger(result, AMP_STATUS.media)
                updateNotice({
                    type: result ? 'success' : 'error',
                    message: result ? evt.target.dataset.messageSuccess : evt.target.dataset.messageFailure,
                    delay: 2000,
                })
                updatePlaylist()
                resetMediaManageForm()
            })
            break
        default:
            logger('Event undefined element:', elm.name, elm)
            break
    }
})

/**
 * Get the specified file in the media directory if it exists.
 * @param {string} basefile 
 * @returns 
 */
async function getRelativeFilepath(basefile) {
    const endpointURL = `${BASE_URL}filepath/${encodeURIComponent(basefile)}`
    const $LABEL_MEDIA_FILE = document.getElementById('note-error-local-media-file')
    const $HIDDEN_FILEPATH  = document.getElementById('local-media-filepath')
    const response = await fetchData(endpointURL)
    if (response.code == 200) {
        $HIDDEN_FILEPATH.value = decodeURIComponent(response.data)
        $LABEL_MEDIA_FILE.textContent = getAtts($LABEL_MEDIA_FILE, 'data-default-message')
    } else {
        $HIDDEN_FILEPATH.value = ''
        $LABEL_MEDIA_FILE.textContent = response.data
    }
    logger('getRelativeFilepath:', endpointURL, response)
    return Promise.resolve(response.code == 200)
}

/**
 * Reset fill of all fields and validation in the media management form.
 */
function resetMediaManageForm() {
    $MEDIA_MANAGE_FORM.reset()
    $MEDIA_MANAGE_ELMS.forEach((child) => {
        let event = null
        if (/^input$/i.test(child.nodeName)) {
            switch (child.type) {
                case 'text':
                    event = 'input'
                    break
                case 'radio':
                    child.checked = child.value === (AMP_STATUS.addtype || 'youtube')
                    break
                case 'file':
                    event = 'change'
                    break
                default:
                    break
            }
        } else if (/^textarea$/i.test(child.nodeName)) {
            event = 'input'
        } else if (/^select$/i.test(child.nodeName)) {
            child.selectedIndex = 0
            event = 'change'
        }
        if (event) {
            //logger('resetMediaManageForm:', child, event)
            child.dispatchEvent(new Event(event))
        }
    })
}

/**
 * Add media to the currently activated playlist.
 * @param {array} payload - payload of media management form
 * @returns 
 */
function addMediaData(payload) {
    logger('addMediaData::before:', payload, AMP_STATUS.media.length)
    const mediaData = {
        amId:    0,
        catId:   0,
        title:   '',
        artist:  '',
        desc:    '',
        file:    '',
        videoid: '',
        volume:  50,
        start:   '',
        end:     '',
    }
    for (const [key, val] of payload) {
        switch(key){
            case 'youtube_videoid':
                mediaData.videoid = val
                break
            case 'media_filepath':
                mediaData.file = val
                break
            case 'category':
                mediaData.catId = Number(val)
                break
            case 'title':
            case 'artist':
            case 'desc':
                mediaData[key] = val
                break
            case 'volume':
                const numVolume = Number(val)
                if (Number.isInteger(numVolume) && inRange(numVolume, 0, 100)) {
                    mediaData[key] = numVolume
                }
                break
            case 'start':
            case 'end':
                if (val.indexOf(':') != -1) {
                    const times = val.split(':')
                    let hours   = 0,
                        minutes = 0,
                        seconds = 0
                    if (times.length == 3) {
                        hours   = parseInt(times[0], 10)
                        minutes = parseInt(times[1], 10)
                        seconds = parseInt(times[2], 10)
                    } else
                    if (times.length == 2) {
                        minutes = parseInt(times[0], 10)
                        seconds = parseInt(times[1], 10)
                    } else {
                        seconds = parseInt(times[1].slice(-1)[0], 10)
                    }
                    mediaData[key] = (hours * 60 * 60) + (minutes * 60) + seconds 
                } else
                if (!Number.isInteger(val)) {
                    mediaData[key] = ''
                } else {
                    mediaData[key] = val
                }
                break
            default:
                break
        }
    }
    if (!Array.isArray(AMP_STATUS.media)) {
        AMP_STATUS.media = [mediaData]
    } else {
        const lastAmId = Math.max(...AMP_STATUS.media.map(item => item.amId))
        mediaData.amId = lastAmId + 1
        AMP_STATUS.media.push(mediaData)
    }
    logger('addMediaData::after:', AMP_STATUS.media.length)
    return true
}

/**
 * Event handlers for Playlist Management form ($PLAYLIST_MANAGE_FORM).
 */
$PLAYLIST_MANAGE_ELMS.forEach((elm) => {

    switch(elm.name) {
        case 'local_media_dir':
        case 'symlink_name':
        case 'category_name':
            elm.addEventListener('input', (evt) => {
                if (evt.target.value === '') {
                    setValidated(evt.target)
                    return
                }
            })
            elm.addEventListener('change', (evt) => {
                const isEmpty = evt.target.value === ''
                setValidated(evt.target, !isEmpty)
            })
            break
        case 'create_symlink':
        case 'create_category':
        case 'download_playlist':
            const callback = {
                getFormData: function(oneData=null) {
                    const formData = new FormData($PLAYLIST_MANAGE_FORM)
                    if (oneData) {
                        return formData.get(oneData)
                    } else {
                        return Array.from(formData.entries())
                    }
                },
                createSymlink: async function() {
                    const endpointURL = `${BASE_URL}symlink`
                    const payload = {}
                    for (let pair of this.getFormData()) {
                        if (inArray(pair[0], ['local_media_dir', 'symlink_name'])) {
                            payload[pair[0]] = pair[1]
                        }
                    }
                    const response = await fetchData(endpointURL, 'post', payload)
                    logger('createSymlink:', endpointURL, payload, response)
                    updateNotice({
                        type: response.state === 'ok' ? 'success' : 'error',
                        message: response.data,
                        delay: 2000,
                    })
                },
                createCategory: function() {
                    const categoryName = this.getFormData('category_name')
                    if (!inArray(categoryName, AMP_STATUS.category)) {
                        AMP_STATUS.category.push(categoryName)
                    } else {
                        // When adding a category, if there is the same category, add it with a branch number.
                        const uniqueSet = new Set(AMP_STATUS.category)
                        let newValue = categoryName
                        let count = 1
                        while (uniqueSet.has(newValue)) {
                            newValue = categoryName + '_' + count
                            count++
                        }
                        AMP_STATUS.category.push(newValue)
                    }
                    const selfElm = document.getElementById('btn-create-category')
                    logger('createCategory:', categoryName, AMP_STATUS)
                    updateNotice({
                        type: 'success',
                        message: selfElm.dataset.messageSuccess,
                        delay: 2000,
                    })
                    clearCategory()
                    updateCategory()
                },
                downloadPlaylist: async function() {
                    const seek_format = Number(this.getFormData('seek_format')) == 1 || false
                    const jsonContent = generatePlaylistJson(seek_format)
                    const blob = new Blob([jsonContent], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = AMP_STATUS.playlist
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                    const selfElm = document.getElementById('btn-download-playlist')
                    updateNotice({
                        type: 'success',
                        message: selfElm.dataset.messageSuccess,
                        delay: 2000,
                    })
                }
            }
            elm.addEventListener('click', (evt) => {
                //const functionName = snakeToCapital(evt.target.name)
                callback[snakeToCapital(evt.target.name)]()
                logger('onClickButton::', evt.target.name)
                resetPlaylistManageForm()
            })
            break
        default:
            logger('Event undefined element:', elm.name, elm)
            break
    }
})

/**
 * Generates the currently active playlist as a JSON format string.
 * @param {boolean} seekFormat 
 * @returns 
 */
function generatePlaylistJson(seekFormat) {
    //logger('generatePlaylistJson::before:', seekFormat, AMP_STATUS)
    const convertHMS = (value) => {
        if (value === '' || Number(value) == 0) {
            return ''
        }
        const seconds = Number(value)
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainingSeconds = seconds % 60
        let retval = ''
        if (hours > 0) {
            retval += String(hours) + ':' + String(minutes).padStart(2, '0') + ':' + String(remainingSeconds).padStart(2, '0')
        } else
        if (minutes > 0) {
            retval += String(minutes) + ':' + String(remainingSeconds).padStart(2, '0')
        } else
        if (remainingSeconds > 0) {
            retval += String(remainingSeconds)
        }
        //logger('convertHMS::', value, retval)
        return retval
    }
    const newPlaylist = {}
    AMP_STATUS.media.forEach((item) => {
        const belongCategory = AMP_STATUS.category[item.catId]
        const oneData = {
            file:    item.file.replace('./assets/media/', ''),
            title:   item.title,
            desc:    item.desc,
            artist:  item.artist,
            videoid: item.videoid,
            image:   item.image,
            start:   seekFormat ? convertHMS(item.start) : item.start,
            end:     seekFormat ? convertHMS(item.end) : item.end,
        }
        if (!newPlaylist.hasOwnProperty(belongCategory)) {
            newPlaylist[belongCategory] = []
        }
        newPlaylist[belongCategory].push(oneData)
    })
    newPlaylist.options = AMP_STATUS.options
    logger('generatePlaylistJson::after:', newPlaylist)
    return JSON.stringify(newPlaylist, null, 2)
}

/**
 * Reset fill of all fields and validation in the playlist management form.
 */
function resetPlaylistManageForm() {
    $PLAYLIST_MANAGE_FORM.reset()
    $PLAYLIST_MANAGE_ELMS.forEach((child) => {
        let event = null
        if (/^input$/i.test(child.nodeName)) {
            switch (child.type) {
                case 'text':
                    event = 'input'
                    break
                case 'checkbox':
                    child.checked = false
                    break
                default:
                    break
            }
        }
        if (event) {
            logger('resetPlaylistManageForm:', child, event)
            child.dispatchEvent(new Event(event))
        }
    })
}

/**
 * Show alert depend on the given notification object.
 * @param {object} notification
 * @param {string} notification.type - Alert type. Allowed values are info, success, warning, or error.
 * @param {string} notification.message - Message that is as the body of the alert.
 * @param {number} notification.delay - Delay time before alert is automatically dismissed.
 */
function updateNotice(notification) {
    logger('Have notification:', notification)
    const classes = {
        base:    'fixed inset-y-1/4 left-0 right-0 md:inset-y-1/4 h-max max-h-full w-5/6 max-w-xl md:max-w-sm flex items-center p-4 mx-auto z-99 text-sm border rounded-lg shadow-lg transition-opacity ease-out duration-300 ',
        info:    'text-blue-800 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900',
        success: 'text-green-800 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-900',
        warning: 'text-yellow-800 border-yellow-300 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-900',
        error:   'text-red-800 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-900',
        btnbase: 'ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 ',
        btninfo: 'bg-blue-50 text-blue-500 focus:ring-blue-400 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-400 dark:hover:bg-blue-700',
        btnsuccess: 'bg-green-50 text-green-500 focus:ring-green-400 hover:bg-green-200 dark:bg-green-800 dark:text-green-400 dark:hover:bg-green-700',
        btnwarning: 'bg-yellow-50 text-yellow-500 focus:ring-yellow-400 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-700',
        btnerror: 'bg-red-50 text-red-500 focus:ring-red-400 hover:bg-red-200 dark:bg-red-800 dark:text-red-400 dark:hover:bg-red-700',
    }
    const $BUTTON_ALERT_DISMISS = document.getElementById('btn-alert-dismiss')
    setAtts($ALERT, { class: classes.base + classes[notification.type] })
    setAtts($BUTTON_ALERT_DISMISS, { class: classes.btnbase + classes[`btn${notification.type}`] })
    toggleClass($BUTTON_ALERT_DISMISS, { hidden: true })
    $ALERT.querySelector('#alert-message').innerHTML = notification.message
    const delay = notification.hasOwnProperty('delay') ? Number(notification.delay) : 0
    toggleAlert('show', delay)
}

/**
 * Do async validation while watch changing fields in the media management form.
 */
watcher($MEDIA_MANAGE_FORM, (mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-validate') {
        const formData  = new FormData($MEDIA_MANAGE_FORM)
        const mediaType = formData.get('media_type')
        const valid_items = []
        if (getAtts(mutation.target, 'data-validate')) {
            $MEDIA_MANAGE_ELMS.forEach((elm) => {
                let isValid = getAtts(elm, 'data-validate') || false
                //logger(elm.id, getAtts(elm, 'data-validate'), isValid)
                if (isValid) {
                    valid_items.push(elm.id)
                }
            })
        }
        const $BUTTON_ADD_MEDIA = document.getElementById('btn-add-media')
        const contains = [(mediaType === 'youtube' ? 'youtube-url' : 'local-media-file'), 'media-category', 'media-title']
        const isContainAll = inArray(contains, valid_items, false)
        logger(`Check valid items for "${mediaType}":`, valid_items, contains, isContainAll)
        setAtts($BUTTON_ADD_MEDIA, {disabled: ''}, isContainAll)
    }
}, { childList: true, attributes: true, subtree: true })

/**
 * Do async validation while watch changing fields in the playlist management form.
 */
watcher($PLAYLIST_MANAGE_FORM, (mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-validate') {
        const formData  = new FormData($PLAYLIST_MANAGE_FORM)
        //const mediaType = formData.get('media_type')
        const valid_items = []
        if (getAtts(mutation.target, 'data-validate')) {
            $PLAYLIST_MANAGE_ELMS.forEach((elm) => {
                let isValid = getAtts(elm, 'data-validate') || false
                logger(elm.id, getAtts(elm, 'data-validate'), isValid)
                if (isValid) {
                    valid_items.push(elm.id)
                }
            })
        }
        // Check symlink validation
        const $BUTTON_CREATE_SYMLINK = document.getElementById('btn-create-symlink')
        const symlink_contains = ['local-media-directory', 'symlink-name']
        const isSymlinkContainAll = inArray(symlink_contains, valid_items, false)
        logger(`Check valid items for "Create Symlink":`, valid_items, symlink_contains, isSymlinkContainAll)
        setAtts($BUTTON_CREATE_SYMLINK, {disabled: ''}, isSymlinkContainAll)
        // Check category validation
        const $BUTTON_CREATE_CATEGORY = document.getElementById('btn-create-category')
        const category_contains = ['category-name']
        const isCategoryContainAll = inArray(category_contains, valid_items, false)
        logger(`Check valid items for "Create Category":`, valid_items, category_contains, isCategoryContainAll)
        setAtts($BUTTON_CREATE_CATEGORY, {disabled: ''}, isCategoryContainAll)
    }
}, { childList: true, attributes: true, subtree: true })

/**
 * Change the view according to the field validation results.
 * @param {object}  targetElement - An element of field to validate
 * @param {?boolean} result - Success if validation result is true, error if false. Reset if null.
 */
function setValidated(targetElement, result=null) {
    targetElement = isElement(targetElement) ? targetElement : null
    if (targetElement) {
        const baseId        = targetElement.id
        const $FIELD_LABEL  = document.getElementById(baseId + '-label')
        const $FIELD_PREFIX = document.getElementById(baseId + '-prefix')
        const $NOTE_ERROR   = document.getElementById('note-error-' + baseId)
        const $NOTE_SUCCESS = document.getElementById('note-success-' + baseId)
        if (result === null) {
            // Reset validation
            //logger('setValidated::reset:', targetElement.id, result)
            toggleClass(targetElement, { 'normal-input': true, 'error-input': false, 'success-input': false })
            if (isElement($FIELD_LABEL))  toggleClass($FIELD_LABEL,  { 'normal-text':   true, 'error-text':   false, 'success-text':   false });
            if (isElement($FIELD_PREFIX)) toggleClass($FIELD_PREFIX, { 'normal-prefix': true, 'error-prefix': false, 'success-prefix': false });
            if (isElement($NOTE_ERROR))   toggleClass($NOTE_ERROR,   { hidden: true });
            if (isElement($NOTE_SUCCESS)) toggleClass($NOTE_SUCCESS, { hidden: true });
            setAtts(targetElement, { 'data-validate': false })
        } else {
            // Success: result is true | Error: result is false
            toggleClass(targetElement, { 'normal-input':  !result, 'error-input':  !result, 'success-input':  result })
            if (isElement($FIELD_LABEL))  toggleClass($FIELD_LABEL,  { 'normal-text':   !result, 'error-text':   !result, 'success-text':   result });
            if (isElement($FIELD_PREFIX)) toggleClass($FIELD_PREFIX, { 'normal-prefix': !result, 'error-prefix': !result, 'success-prefix': result });
            if (isElement($NOTE_ERROR))   toggleClass($NOTE_ERROR,   { hidden: result  });
            if (isElement($NOTE_SUCCESS)) toggleClass($NOTE_SUCCESS, { hidden: !result });
            setAtts(targetElement, { 'data-validate': result })
        }
    }
}


// for debugging code
function execDebug() {
    /*
    const f1 = document.getElementById('youtube-url'),
          f2 = document.getElementById('media-category'),
          f3 = document.getElementById('media-title'),
          f4 = document.getElementById('media-artist'),
          f5 = document.getElementById('media-desc'),
          f6 = document.getElementById('media-volume'),
          f7 = document.getElementById('seek-start'),
          f8 = document.getElementById('seek-end')
    f1.value  = 'www.youtube.com/watch?v=gu7T0D50wFk'
    //logger('execDebug:', [f2])
    if (f2.length > 1 && f2.value === '') {
        f2.selectedIndex = 3
    }
    f3.value = 'Allure of the Dark'
    f4.value = 'MementMori'
    f5.value = "Illya (God's Curse)"
    f6.value = 85
    f8.value = '4:11'
    // fire!
    f1.dispatchEvent(new Event('input'))
    f2.dispatchEvent(new Event('change'))
    f3.dispatchEvent(new Event('change'))
    */
}

// Globals

/**
 * Restart this application.
 */
function reloadPage() {
    window.location.reload()
}

/**
 * Toggle the display of backdrop for drawer or modal.
 */
watcher([$DRAWER_PLAYLIST, $DRAWER_SETTINGS, $MODAL_OPTIONS], (mutation) => {
    if (mutation.attributeName === 'aria-modal' && mutation.target.ariaModal === 'true') { 
        const $DRAWER_BACKDROP = Array.from(document.querySelectorAll('div[drawer-backdrop]'))
        const $MODAL_BACKDROP  = document.querySelector('div[modal-backdrop]')
        //logger('shown:', mutation.target, currentWindowSize, $DRAWER_BACKDROP, $MODAL_BACKDROP)
        if ($DRAWER_BACKDROP.length > 0) {
            $DRAWER_BACKDROP.forEach((elm) => {
                if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
                    elm.classList.add('hidden')
                } else {
                    elm.classList.remove('hidden')
                }
            })
        }
        if (isElement($MODAL_BACKDROP)) {
            if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
                $MODAL_BACKDROP.classList.remove('z-40')
                $MODAL_BACKDROP.classList.add('z-[59]')
            } else {
                $MODAL_BACKDROP.classList.remove('z-[59]')
                $MODAL_BACKDROP.classList.add('z-40')
            }
        }
    }
})

/**
 * Event handler when the window size is resized.
 */
function updateWindowSize() {
    currentWindowSize.width  = window.innerWidth
    currentWindowSize.height = window.innerHeight
    // aspect: 16:9 = w:h -> h = 9w/16
    const adjustPlayerSize = {
        width: currentWindowSize.width >= 640 ? 640 : (currentWindowSize.width - 2),
        height: Math.floor((9 * (currentWindowSize.width >= 640 ? 640 : (currentWindowSize.width - 2))) / 16)
    }
    if (player && typeof player === 'object' && typeof player.getIframe === 'function') {
        const YTPlayer = player.getIframe()
        YTPlayer.width  = adjustPlayerSize.width
        YTPlayer.height = adjustPlayerSize.height
    }
    if (isElement(document.getElementById('html-player'))) {
        const HTMLPlayer = document.getElementById('html-player')
        HTMLPlayer.clientWidth  = adjustPlayerSize.width
        HTMLPlayer.clientHeight = adjustPlayerSize.height
    }
    const shownLeftDrawer  = getAtts($DRAWER_PLAYLIST, 'aria-modal') || false
    const shownRightDrawer = getAtts($DRAWER_SETTINGS, 'aria-modal') || false
    //logger('updateWindowSize:', currentWindowSize, adjustPlayerSize, shownLeftDrawer, shownRightDrawer)
    if (currentWindowSize.width < currentWindowSize.minFullUIWidth) {
        if (shownLeftDrawer) {
            document.getElementById('btn-close-playlist').click()
            $BUTTON_PLAYLIST.setAttribute('data-drawer-backdrop', 'true')
        }
        if (shownRightDrawer) {
            document.getElementById('btn-close-settings').click()
            $BUTTON_SETTINGS.setAttribute('data-drawer-backdrop', 'true')
        }
    } else {
        if (!shownLeftDrawer) {
            //logger('open playlist', $BUTTON_PLAYLIST)
            $BUTTON_PLAYLIST.setAttribute('data-drawer-backdrop', 'false')
            $BUTTON_PLAYLIST.click()
        }
        if (!shownRightDrawer) {
            //logger('open settings', $BUTTON_SETTINGS)
            $BUTTON_SETTINGS.setAttribute('data-drawer-backdrop', 'false')
            $BUTTON_SETTINGS.click()
        }
    }
    toggleMarqueeCaption()
}

/**
 * Window resize event listener with throttling.
 */
const resize = () => {
    let timeoutID = 0
    let delay = 300
    window.addEventListener('resize', () => {
        clearTimeout(timeoutID)
        timeoutID = setTimeout(() => {
            updateWindowSize()
        }, delay)
    }, false)
}
resize()

window.dispatchEvent(new Event('resize', { bubbles: true, cancelable: false }))

};// end init()

// Below are the utility functions: ---------------------------------------------------------------

/**
 * Finds whether the given variable is an object.
 * 
 * @param {any} value 
 * @returns 
 */
function isObject(value) {
    return value !== null && "object" === typeof value 
}

/**
 * Finds whether the given variable is an element of HTML.
 * 
 * @param {any} node 
 * @returns 
 */
function isElement(node) {
    return !(!node || !(node.nodeName || node.prop && node.attr && node.find))
}

/**
 * Determines if the given variable is a numeric string.
 * 
 * @param {any} numstr 
 * @returns 
 */
function isNumberString(numstr) {
    return "string" == typeof numstr && "" !== numstr && !isNaN(numstr)
}

/**
 * Determines if the given variable is a boolean string.
 * @param {any} boolstr 
 * @returns 
 */
function isBooleanString(boolstr) {
    return "string" == typeof boolstr && "" !== boolstr && /^(true|false)$/i.test(boolstr)
}

/**
 * Given a string containing the path to a file or directory, 
 * this function will return the trailing name component.
 * If the given path ends in a file, only the file name without 
 * the extension is returned.
 * 
 * @param {any} path 
 * @returns 
 */
function basename(path) {
    return path.split(/[\/\\]/).pop().split('.').shift();
}

/**
 * Gets the extension from the given file path.
 * 
 * @param {any} path 
 * @returns 
 */
function getExt(path) {
    return path.split('.').pop()
}

/**
 * Return true if a number is in range, otherwise false.
 * @param {any} num 
 * @param {number} min 
 * @param {number} max 
 * @returns {boolean} 
 */
function inRange(num, min, max) {
    if (isNaN(num)) {
        return false
    } else {
        num = Number(num)
        return ((num - min) * (num - max) <= 0)
    }
}

/**
 * Whether a given array contains multiple values.
 * @param {any}     contains     value to search for. If you want to search for multiple values, specify them as an array.
 * @param {array}   targetArray  array to search.
 * @param {boolean} at_least_one test if at least one value, from given values.
 * @returns 
 */
function inArray(contains, targetArray, at_least_one=false) {
    if (!Array.isArray(targetArray)) {
        return false
    }
    contains = Array.isArray(contains) ? contains : [contains]
    if (at_least_one) {
        return contains.some(item => targetArray.includes(item))
    } else {
        return contains.every(item => targetArray.includes(item))
    }
}

/**
 * Convert a string in snake case (snake_case) to capital case (CapitalCase).
 * @param {string} str 
 * @returns 
 */
function snakeToCapital(str) {
    return str.replace(/_./g, match => match.charAt(1).toUpperCase());
}

/*
function filterValue(val, withDecodeURI=!1, castNumeric=!1, castLogged=!1) {
    console.log(val)
    let objType;
    switch (typeof val) {
    case "string":
        return /%([0-9a-f-A-F]{2})+/.test(val) ? (withDecodeURI && castLogged && logger("filterValue.decodeURI:", {
            origin: val,
            decoded: decodeURI(val)
        }),
        withDecodeURI ? decodeURI(val) : val) : /^[+,-]?([1-9]\d*|0)(\.\d+)?$/.test(val) ? (castNumeric && castLogged && logger("filterValue.castNumeric:", {
            origin: val,
            casted: Number(val)
        }),
        castNumeric ? Number(val) : val) : val;
    case "object":
        if (objType = Object.prototype.toString.call(val).replace(/^\[object\s(.*)\]$/, "$1"),
        "Object" === objType) {
            if (withDecodeURI && !val.hasOwnProperty("origin") && !val.hasOwnProperty("decoded"))
                for (const prop in val)
                    val[prop] = filterValue(val[prop], withDecodeURI, castNumeric, castLogged);
            return val
        }
        return "Array" === objType ? val.map(item=>filterValue(item, withDecodeURI, castNumeric, castLogged)) : val;
    default:
        return val
    }
}
*/

function getOS() {
    let ua;
    return "userAgentData"in window.navigator ? (ua = navigator.userAgentData,
    ua.platform) : (ua = navigator.userAgent,
    /android/i.test(ua) ? "Android" : /iPad|iPhone|iPod/.test(ua) || "MacIntel" === navigator.platform && navigator.maxTouchPoints > 1 ? "iOS" : "Other")
}

/**
 * Retrieves a DOMRect object providing information about the size 
 * of given an element and its position relative to the viewport.
 * This function as a wrapper of  Element.getBoundingClientRect() 
 * method.
 * 
 * @param {Object} targetElement 
 * @param {string | null} property 
 * @returns 
 */
function getRect(targetElement, property="") {
    if (isElement(targetElement)) {
        const _RECT_OBJ = targetElement.getBoundingClientRect();
        if ("" === property)
            return _RECT_OBJ;
        if (Object.getPrototypeOf(_RECT_OBJ).hasOwnProperty(property))
            return _RECT_OBJ[property]
    }
    return !1
}

function toggleClass(targetElement, classes, force) {
    return isElement(targetElement) && (classes = Array.isArray(classes) ? classes : [classes]).length > 0 && classes.forEach(oneClass=>{
        if ("object" == typeof oneClass)
            for (const property in oneClass)
                "boolean" == typeof oneClass[property] && targetElement.classList.toggle(property, oneClass[property]);
        else
            "string" == typeof oneClass && (void 0 === force ? targetElement.classList.toggle(oneClass) : targetElement.classList.toggle(oneClass, force))
    }
    ),
    !1
}

function setStyles(targetElements, styles="") {
    const _ELMS = undefined;
    (targetElements instanceof Array ? targetElements : [targetElements]).map(elm=>{
        if (styles instanceof Object)
            for (const _prop in styles)
                elm.style[_prop] = styles[_prop];
        else
            elm.style.cssText = String(styles)
    }
    )
}

function getAtts(targetElement, attribute="") {
    const _ATTS = targetElement.getAttributeNames();
    if (0 != _ATTS.length) {
        if ("" === attribute) {
            let _obj = {};
            return _ATTS.forEach(item=>{
                let _val = targetElement.getAttribute(item);
                _obj[item] = isNumberString(_val) ? Number(_val) : isBooleanString(_val) ? /^true$/i.test(_val) : _val
            }
            ),
            _obj
        }
        if (_ATTS.includes(attribute)) {
            let _val = targetElement.getAttribute(attribute);
            return isNumberString(_val) ? Number(_val) : isBooleanString(_val) ? /^true$/i.test(_val) : _val
        }
    }
}

/**
 * Set or remove attributes on the specified element.
 * 
 * @param {Object | Array} targetElements The object given should be a HTMLElement
 * @param {Object} attributes Given an object can be specified multiple attribute name and value pairs
 * @param {bool} remove If this remove flag is enabled, the corresponding attribute will be removed
 */
function setAtts(targetElements, attributes={}, remove=false) {
    //logger('setAtts:', targetElements, attributes, remove);
    (targetElements instanceof Array ? targetElements : [targetElements]).map(elm=>{
        for (const _key in attributes)
            !remove ? elm.setAttribute(_key, attributes[_key]) : elm.removeAttribute(_key)
    })
}

function hide(targetElements) {
    const _ELMS = undefined;
    (targetElements instanceof Array ? targetElements : [targetElements]).map(elm=>{
        replaceAttribute(elm, "style", "data-cached-style"),
        replaceAttribute(elm, "class", "data-cached-class"),
        setStyles(elm, "display: none !important")
    }
    )
}

function show(targetElements) {
    const _ELMS = undefined;
    (targetElements instanceof Array ? targetElements : [targetElements]).map(elm=>{
        replaceAttribute(elm, "data-cached-style", "style"),
        replaceAttribute(elm, "data-cached-class", "class")
    }
    )
}

function isHidden(targetElement, checkProperties) {
    if (!isElement(targetElement))
        return !1;
    const elmStyles = window.getComputedStyle(targetElement)
      , elmStatus = {};
    return checkProperties ? checkProperties instanceof Array || (checkProperties = [checkProperties]) : checkProperties = ["display", "opacity", "visibility"],
    checkProperties.forEach(prop=>{
        elmStatus[prop] = elmStyles.getPropertyValue(prop)
    }
    ),
    elmStatus.hidden = getAtts(targetElement, "hidden"),
    elmStatus.hidden || "none" === elmStatus.display || 0 == Number(elmStatus.opacity) || "hidden" === elmStatus.visibility
}

function replaceTagName(targetElement, tagName) {
    if (!isElement(targetElement))
        return targetElement;
    const replacement = document.createElement(tagName);
    return Array.from(targetElement.attributes).forEach(attribute=>{
        const {nodeName: nodeName, nodeValue: nodeValue} = attribute;
        nodeValue && replacement.setAttribute(nodeName, nodeValue)
    }
    ),
    Array.from(targetElement.childNodes).forEach(node=>{
        replacement.appendChild(node)
    }
    ),
    targetElement.parentNode.replaceChild(replacement, targetElement),
    replacement
}

function replaceAttribute(targetElement, attributeName, replacementName) {
    const attrValue = targetElement.getAttribute(attributeName)
      , prevAttr = {};
    return !(!isElement(targetElement) || !attrValue) && (targetElement.setAttribute(replacementName, attrValue),
    targetElement.removeAttribute(attributeName),
    prevAttr[attributeName] = attrValue,
    prevAttr)
}

function strToNode(str) {
    const parser = undefined
      , node = undefined;
    return (new DOMParser).parseFromString(str, "text/html")
}

/**
 * Returns the width of string string, where halfwidth characters count as 1, 
 * and fullwidth characters count as 2.
 * 
 * @param {string} str 
 * @returns 
 */
function mb_strwidth(str) {
    var i = 0,
        l = str.length,
        c = '',
        length = 0
    for (;i<l;i++) {
        c = str.charCodeAt(i);
        if (0x0000 <= c && c <= 0x0019) {
            length += 0
        } else if (0x0020 <= c && c <= 0x1FFF) {
            length += 1
        } else if (0x2000 <= c && c <= 0xFF60) {
            length += 2
        } else if (0xFF61 <= c && c <= 0xFF9F) {
            length += 1
        } else if (0xFFA0 <= c) {
            length += 2
        }
    }
    return length
}

/**
 * Truncates string string to specified width, where halfwidth characters 
 * count as 1, and fullwidth characters count as 2.
 * 
 * @param {string} str 
 * @param {int} start 
 * @param {int} width 
 * @param {string | null} trimmarker 
 * @returns 
 */
function mb_strimwidth(str, start, width, trimmarker) {
    if (typeof trimmarker === 'undefined') trimmarker = ''
    const trimmakerWidth = mb_strwidth(trimmarker)
    var i = start,
        l = str.length,
        trimmedLength = 0,
        trimmedStr = ''
    for (;i < l; i++) {
        var c = str.charAt(i),
            charWidth = mb_strwidth(c),
            next = str.charAt(i + 1),
            nextWidth = mb_strwidth(next)
        trimmedLength += charWidth
        trimmedStr += c
        if (trimmedLength + trimmakerWidth + nextWidth > width) {
            trimmedStr += trimmarker
            break
        }
    }
    return trimmedStr
}

/*
function getFieldData(idOrName, attrName="") {
    let nodes = document.getElementById(idOrName) ? [document.getElementById(idOrName)] : Array.from(document.querySelectorAll(`[name="${idOrName}"]`));
    if (nodes = nodes.filter(node=>isElement(node) && /^(INPUT|TEXTAREA|SELECT)$/i.test(node.nodeName)),
    0 == nodes.length)
        return null;
    let retval = [];
    return nodes.forEach(node=>{
        let atts = getAtts(node);
        switch (node.nodeName) {
        case "SELECT":
            node.options.length > 0 && (atts.options = Array.from(node.options).map(opt=>({
                value: opt.value,
                label: opt.label,
                selected: opt.selected
            })),
            atts.selectedIndex = node.selectedIndex);
            break;
        case "INPUT":
            "checkbox" !== node.type && "radio" !== node.type || atts.hasOwnProperty("checked") && (atts.checked = "checked" === atts.checked);
            break;
        case "TEXTAREA":
            atts.width = getRect(node, "width"),
            atts.height = getRect(node, "height")
        }
        "" !== attrName ? ("SELECT" === node.nodeName && "seleted" === attrName && (attrName = "selectedIndex"),
        retval.push(atts.hasOwnProperty(attrName) ? atts[attrName] : null)) : retval.push(atts)
    }
    ),
    1 == retval.length ? retval[0] : retval
}
*/

/**
 * Watches the specified element.
 * This function as a wrapper for MutationObserver.
 * 
 * @param {Object} targetElements 
 * @param {function} callback 
 * @param {Object | null} config 
 * @returns 
 */
function watcher(targetElements, callback, config={}) {
    const _ELMS = targetElements instanceof Array ? targetElements : [targetElements];
    if (!callback || "function" != typeof callback)
        return !1;
    const _CONF = Object.assign({
        childList: !0,
        attributes: !0,
        characterData: !0,
        subtree: !0
    }, config);
    _ELMS.map(elm=>{
        if (!isElement(elm))
            return logger("error", "Watching target is not an HTML element.", !0),
            !1;
        const observer = undefined;
        return new MutationObserver(mutations=>{
            mutations.forEach(mutation=>{
                callback(mutation)
            }
            )
        }
        ).observe(elm, _CONF)
    }
    )
}

/**
 * Fetch data using the specified URL and method.
 * This function as a wrapper for Fetch API.
 * 
 * @param {string} url 
 * @param {string | null} method 
 * @param {Object | null} data 
 * @param {string | null} datatype 
 * @param {int | null} timeout 
 * @returns 
 */
async function fetchData(url="", method="get", data={}, datatype="json", timeout=15e3) {
    const controller = new AbortController, 
          timeoutId  = setTimeout(() => {
            controller.abort()
          }, timeout);
    if (!url || !/^(get|post|put|delete|patch)$/i.test(method))
        return Promise.reject({
            type: "bad_request",
            status: 400,
            message: "Invalid argument(s) given."
        });
    let params = new URLSearchParams, 
        sendData = {};
    if (sendData = {
        method: method,
        mode: "cors",
        cache: "no-cache",
        credentials: "omit",
        redirect: "follow",
        referrerPolicy: "no-referrer",
        signal: controller.signal
    }, data)
        for (let key in data)
            Object.prototype.hasOwnProperty.call(data, key) && params.append(key, data[key]);
    if ("get" !== method) {
        sendData.body = params
    } else {
        if (params.size > 0) {
            url += "?" + params
        }
        //logger("fetchData::before:", url, method, data, params, sendData)
    }
    try {
        const response = await fetch(url, sendData);
        logger("fetchData::after:", response)
        if (response.ok) {
            const retval = "json" === datatype ? await response.json() : await response.text();
            logger("fetchData::after:2:", retval)
            return Promise.resolve(retval)
        } else {
            const errObj = await response.json();
            return Promise.reject({
                code: errObj.code,
                status: errObj.data.status,
                message: errObj.message
            })
        }
    } catch (err) {
        logger("error", "fetchData::error:", err, "force")
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Set the storage for saving user data on the client side to be used.
 * 
 * @param {string} stge 
 */
function useStge(stge="localStorage") {
    if (window.$ambient) {
        window.$ambient.useStorage = stge
    } else {
        window.$ambient = { useStorage: stge }
    }
}

/**
 * Store user data in client-side storage.
 * 
 * @param {string} key 
 * @param {any} data 
 * @returns 
 */
function saveStge(key, data) {
    const _data = window[window.$ambient.useStorage].getItem(APP_KEY)
    if (!_data) {
        const newData = {}
        newData[key] = data
        window[window.$ambient.useStorage].setItem(APP_KEY, JSON.stringify(newData))
        return true
    }
    try {
        const userData = JSON.parse(_data)
        if (isObject(userData)) {
            userData[key] = data
            window[window.$ambient.useStorage].setItem(APP_KEY, JSON.stringify(userData))
            return true
        }
    } catch (error) {
        logger(error, _data)
    }
    return false
}

/**
 * Load user data from client-side storage.
 * 
 * @param {string} key 
 * @returns 
 */
function loadStge(key) {
    const _data = window[window.$ambient.useStorage].getItem(APP_KEY)
    try {
        const userData = JSON.parse(_data)
        if (isObject(userData) && userData.hasOwnProperty(key)) 
            return userData[key];
    } catch (error) {
        logger(error, _data)
    }
    return null
}

/**
 * Removes specific properties from user data stored in client-side storage.
 * If no property name is specified, deletes the entire user data.
 * 
 * @param {string | null} key 
 * @returns 
 */
function removeStge(key=null) {
    if (!key) {
        window[window.$ambient.useStorage].removeItem(APP_KEY)
        return true
    }
    const _data = window[window.$ambient.useStorage].getItem(APP_KEY)
    try {
        const userData = JSON.parse(_data)
        if (isObject(userData) && userData.hasOwnProperty(key)) { 
            delete userData[key]
            window[window.$ambient.useStorage].setItem(APP_KEY, JSON.stringify(userData))
            return true
        }
    } catch (error) {
        logger(error, _data)
    }
    return false
}

/**
 * Logger for frontend of Ambient Media Player.
 * 
 * @param  {...any} args 
 * @returns 
 */
function logger(...args) {
    let isForce = AmbientData.hasOwnProperty('debug') ? AmbientData.debug : false
    if (args.length > 0 && "string" == typeof args[args.length - 1] && args[args.length - 1] === 'force') {
        isForce = args.pop() === 'force'
    }
    if (!isForce) {
        return
    }
    const now = new Date,
        dateStr = `[${"" + now.getFullYear()}/${("0" + (now.getMonth() + 1)).slice(-2)}/${("0" + now.getDate()).slice(-2)} ${("0" + now.getHours()).slice(-2)}:${("0" + now.getMinutes()).slice(-2)}:${("0" + now.getSeconds()).slice(-2)}]`,
        type = /^(error|warn|info|debug|log)$/i.test(args[0]) ? args.shift() : "log"
    //args = args.map(item=>filterValue(item, !0, !1, !0)),
    return console[type](dateStr, ...args)
}

// Do dispatcher
"complete" === document.readyState || "loading" !== document.readyState && !document.documentElement.doScroll ? init() : document.addEventListener ? document.addEventListener("DOMContentLoaded", init, !1) : window.onload = init;
