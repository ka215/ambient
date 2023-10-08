const init = function() {

var selfURL = new URL(window.location.href)
const BASE_URL = selfURL.origin + selfURL.pathname
useStge()
const AMP_STATUS = initStatus()

/**
 * Initialize AMP_STATUS object.
 */
function initStatus() {
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
        loop: false,
        options: null,
    })
}

// Advance preparation for using YouTube players.
var tag = document.createElement('script')
tag.src = 'https://www.youtube.com/player_api'
var firstScriptTag = document.getElementsByTagName('script')[0]
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
var player

/**
 * Watcher for AMP_STATUS object.
 */
function watchState() {
    const callback = function(prop, oldValue, newValue) {
        logger(`callback(${prop}):`, oldValue, '->', newValue)
        switch (true) {
            case /^(prev|current|next|ctg|order|loop)$/i.test(prop):
                // Synchronize to the saved data of web storage when specific properties of AMP_STATUS object are changed.
                saveStge(prop, newValue)
                if ('current' === prop) {
                    changePlaylistFocus()
                }
                if ('order' === prop) {
                    changeToggleRandomly()
                }
                break
            case /^category$/i.test(prop):
                updateCategory()
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
//logger('!:', AmbientData, AMP_STATUS, loadStge())

/**
 * Fetch data of specific playlist.
 * 
 * @param {string} playlist 
 */
async function getPlaylistData(playlist) {
    const endpointURL = `${BASE_URL}playlist/${playlist}`
    const data = await fetchData(endpointURL)
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
    if (data && data.hasOwnProperty('options')) {
        AMP_STATUS.options = data.options
    }
}

// DOM Elements
const $BODY               = document.body
const $ALERT              = document.getElementById('alert-notification')
const $SELECT_PLAYLIST    = document.getElementById('current-playlist')
const $SELECT_CATEGORY    = document.getElementById('target-category')
const $TOGGLE_RANDOMLY    = document.getElementById('toggle-randomly')
const $DRAWER_PLAYLIST    = document.getElementById('drawer-playlist')
const $LIST_PLAYLIST      = document.getElementById('playlist-list-group')
//const $PLAYLIST_ITEMS   = Array.from($LIST_PLAYLIST.querySelectorAll('a'))
const $CAROUSEL           = document.getElementById('carousel-container')
const $CAROUSEL_WRAPPER   = document.getElementById('carousel-wrapper')
const $CAROUSEL_PREV      = document.getElementById('data-carousel-prev')
const $CAROUSEL_NEXT      = document.getElementById('data-carousel-next')
const $MEDIA_CAPTION      = document.getElementById('media-caption')
const $EMBED_WRAPPER      = document.getElementById('embed-wrapper')
const $OPTIONAL_CONTAINER = document.getElementById('optional-container')
const $BUTTON_WATCH_TY    = document.getElementById('btn-watch-origin')
const $MENU               = document.getElementById('menu-container')


function toggleAlert(state=null) {
    let shown
    switch (true) {
        case /^show$/i.test(state):
            $ALERT.classList.remove('opacity-0')
            shown = true
            break
        case /^hid(e|den)$/i.test(state):
            $ALERT.classList.add('opacity-0')
            shown = false
            break
        default:
            if ($ALERT.classList.contains('opacity-0')) {
                $ALERT.classList.remove('opacity-0')
                shown = true
            } else {
                $ALERT.classList.add('opacity-0')
                shown = false
            }
            break
    }
    setTimeout(() => {
        if (shown) {
            $ALERT.setAttribute('role', 'alert')
        } else {
            $ALERT.removeAttribute('role')
        }
    }, 1000)
}
toggleAlert('hide')

watcher($DRAWER_PLAYLIST, (mutation) => {
    if (mutation.attributeName === 'aria-modal' && mutation.target.ariaModal) {
        logger('watch drawer-playlist: open!')
        scrollToFocusItem()
    }
})

function clearPlaylist() {
    // Clear all items of playlist
    const clone = document.getElementById('no-media').cloneNode(true)
    while($LIST_PLAYLIST.firstChild) {
        $LIST_PLAYLIST.removeChild($LIST_PLAYLIST.firstChild)
    }
    $LIST_PLAYLIST.appendChild(clone)
    //clearCarousel()
}

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
    logger('updatePlaylist:', is_no_media)
    if (is_no_media) {
        // no playable media
        $LIST_NO_MEDIA.classList.remove('hidden')
        return
    } else {
        $LIST_NO_MEDIA.classList.add('hidden')
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
        if ((item.image && item.image !== '') || (item.thumb && item.thumb !== '')) {
            if (AmbientData && AmbientData.imageDir) {
                const imageSrc = AmbientData.imageDir + (item.thumb && item.thumb !== '' ? item.thumb : item.image)
                const imgElm = document.createElement('img')
                imgElm.setAttribute('src', imageSrc)
                imgElm.classList.add('w-8', 'h-8', 'rounded')
                imgElm.setAttribute('alt', mb_strimwidth(item.desc, 0, 50, '...'))
                itemElm.appendChild(imgElm)
            }
        } else
        if (item.videoid && item.videoid !== '') {
            const imageSrc = getYoutubeThumbnailURL(item.videoid)
            const imgElm = document.createElement('img')
            imgElm.setAttribute('src', imageSrc)
            imgElm.classList.add('w-8', 'h-8', 'rounded')
            imgElm.setAttribute('alt', mb_strimwidth(item.desc, 0, 50, '...'))
            itemElm.appendChild(imgElm)
        }
        itemElm.append(document.createTextNode(item.title))
        $LIST_PLAYLIST.appendChild(itemElm)
    })
    Array.from($LIST_PLAYLIST.querySelectorAll('a')).forEach((elm) => {
        elm.addEventListener('click', playItem)
    })
    //updateCarousel()
}

function getYoutubeThumbnailURL(videoid) {
    return 'https://img.youtube.com/vi/' + videoid + '/hqdefault.jpg'
}

function clearCategory() {
    const clone = document.getElementById('all-category').cloneNode(true)
    while($SELECT_CATEGORY.firstChild) {
        $SELECT_CATEGORY.removeChild($SELECT_CATEGORY.firstChild)
    }
    $SELECT_CATEGORY.appendChild(clone)
    $SELECT_CATEGORY.firstElementChild.setAttribute('disabled', '')
    $SELECT_CATEGORY.setAttribute('disabled', '')
}

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
        })
    }
    $SELECT_CATEGORY.firstElementChild.removeAttribute('disabled')
    $SELECT_CATEGORY.removeAttribute('disabled')
}

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

function applyOptions() {
    const bgImage = getOption('background')
    if (bgImage && AmbientData && AmbientData.hasOwnProperty('imageDir')) {
        // Set background image
        const bgSrc = AmbientData.imageDir + bgImage
        logger('applyOptions:', bgSrc, AMP_STATUS.options )
        $BODY.setAttribute('style', `background-image: url('${bgSrc}');`)
        $BODY.classList.add('bg-no-repeat', 'bg-bottom', 'bg-cover')
        $MENU.setAttribute('style', 'background: linear-gradient(to bottom, rgba(255,255,255,.3), 50%, rgba(255,255,255,1));')
    } else {
        $BODY.removeAttribute('style')
        $BODY.classList.remove('bg-no-repeat', 'bg-bottom', 'bg-cover')
        $MENU.removeAttribute('style')
    }

    const isRandom = getOption('random')
    if (isRandom !== null) {
        AMP_STATUS.order = isRandom ? 'random' : 'normal'
    }
}

function clearCarousel() {
    logger('clearCarousel')
}

function updateCarousel() {
    logger('updateCarousel')
}


// Event handlers
$SELECT_PLAYLIST.addEventListener('change', (evt) => {
    let oldPlaylist = null
    if (AMP_STATUS.hasOwnProperty('playlist')) {
        oldPlaylist = AMP_STATUS.playlist
    }
    if (oldPlaylist !== evt.target.value) {
        AMP_STATUS.playlist = evt.target.value
        getPlaylistData(evt.target.value)
        initStatus()
        clearCategory()
    }
    logger('changed playlist:', AMP_STATUS)
})

$SELECT_CATEGORY.addEventListener('change', (evt) => {
    let oldCtgId = null
    if (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null) {
        oldCtgId = AMP_STATUS.ctg
    }
    if (oldCtgId !== evt.target.value) {
        AMP_STATUS.ctg = Number(evt.target.value)
    }
    logger('changed category:', AMP_STATUS)
    updatePlaylist()
})

$CAROUSEL_PREV.addEventListener('click', (evt) => {
    logger(evt)
})

$CAROUSEL_NEXT.addEventListener('click', (evt) => {
    logger(evt)
})

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

function scrollToFocusItem() {
    const targetElm = $LIST_PLAYLIST.querySelector('a[aria-current="true"]')
    const elmRect = getRect(targetElm)
    if (elmRect) {
        let move = targetElm.offsetTop > $LIST_PLAYLIST.clientHeight ? Math.abs($LIST_PLAYLIST.clientHeight - targetElm.offsetTop) + elmRect.height : 0
        //$LIST_PLAYLIST.scrollTop = move
        $LIST_PLAYLIST.scrollTo({top: move, behavior: 'smooth'})
        //logger('scrollToFocusItem:', activeRect, targetElm.offsetTop, $LIST_PLAYLIST.clientHeight, $LIST_PLAYLIST.offsetTop, move, $LIST_PLAYLIST.scrollHeight)
    }
}

$TOGGLE_RANDOMLY.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
    AMP_STATUS.order = evt.target.checked ? 'random' : 'normal'
    //logger('Change Randomly Play: ->', AMP_STATUS.order)
})

function changeToggleRandomly() {
    const toggleElm = $TOGGLE_RANDOMLY.querySelector('input[type="checkbox"]')
    //logger('changeToggleRandomly:', toggleElm.checked)
    toggleElm.checked = AMP_STATUS.order === 'random'
}

function updatePlayStatus(currentAmId) {
    // Set looking ahead to the next index.
    const targetData = AMP_STATUS.ctg != null && AMP_STATUS.ctg != -1 ? AMP_STATUS.media.filter((item) => item.catId == AMP_STATUS.ctg) : AMP_STATUS.media
    let idCandidates = targetData.map((item) => item.amId)
    //logger('playItem:', AMP_STATUS.ctg, idCandidates)
    AMP_STATUS.current = currentAmId
    let prevId, nextId
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
    //logger('playItem:', prevId, nextId, AMP_STATUS, mediaData, mediaSrc, priority)
    if ( prevId && nextId ) {
        AMP_STATUS.prev = prevId
        AMP_STATUS.next = nextId
    }
}

function playItem(event) {
    const thisElm = event.target
    const amId = Number(thisElm.dataset.playlistItem)
    const mediaData = AMP_STATUS.media.filter((item) => item.amId == amId).shift()
    let mediaSrc   = null
    let priority   = 0// 0:auto|1:local|2:youtube
    let playerType = null
    if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
        mediaSrc = mediaData.file
        priority = 1
        playerType = 'html'
    }
    if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
        mediaSrc = mediaData.videoid
        priority = 2
        playerType = 'youtube'
    }
    logger('playItem:', amId, mediaSrc, playerType)
    updatePlayStatus(amId)
    // Hide drawer playlist
    document.getElementById('btn-close-playlist').click()
    setupPlayer(playerType, mediaSrc, mediaData)
}

function setupPlayer(type, src, mediaData) {
    logger('setupPlayer:', type, src, mediaData)
    switch(true) {
        case /^YouTube$/i.test(type):
            createYTPlayer(mediaData)
            break
        case /^HTML$/i.test(type):
            const extension = getExt(src)
            //logger('setupPlayer:', extension)
            if (/^(aac|midi?|mp3|mp4a|ogg|opus|wav|weba)$/i.test(extension)) {
                createPlayerTag('audio', mediaData)
            } else
            if (/^(avi|mpe?g|mp4|ogv|ts|webm|3g(p|2))$/i.test(extension)) {
                createPlayerTag('video', mediaData)
            } else {
                throw new Error('Unsupported file format')
            }
            break
        default:
            throw new Error('Unsupported player specified.')
    }
}

function onPlayerReady(event) {
    // from: flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-full h-0 opacity-0
    // to:   flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-max h-max
    $EMBED_WRAPPER.classList.add('w-max', 'h-max')
    $EMBED_WRAPPER.classList.remove('w-full', 'h-0', 'opacity-0')

    setTimeout(() => {
        $BUTTON_WATCH_TY.removeAttribute('disabled')
        $OPTIONAL_CONTAINER.classList.remove('hidden', 'opacity-0')
    }, 1000)

    event.target.setVolume(100)
    event.target.playVideo()
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
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
        //createYTPlayer(mediaData)
    }
}

function onPlayerError(event) {
    logger('onYTPlayerError:', event.data)
}
   
function createYTPlayer(mediaData) {
    const playerElm = document.createElement('div')
    playerElm.id = 'ytplayer'
    while($EMBED_WRAPPER.firstChild) {
        $EMBED_WRAPPER.removeChild($EMBED_WRAPPER.firstChild)
    }
    $EMBED_WRAPPER.appendChild(playerElm)

    $BUTTON_WATCH_TY.href = 'https://www.youtube.com/watch?v=' + mediaData.videoid

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
    logger('createYTPlayer:', mediaData, playerOptions)
    player = new YT.Player('ytplayer', {
        height: currentWindowSize.width >= 640 ? 360 : 216,
        width: currentWindowSize.width >= 640 ? 640 : 384,
        videoId: mediaData.videoid,
        playerVars: playerOptions,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError,
        },
    })
}


function createPlayerTag(tagname, mediaData) {
    logger('createPlayerTag:', tagname, mediaData)
    const playerElm = document.createElement(tagname)
    const sourceElm = document.createElement('source')
    playerElm.id = 'audio-player'
    playerElm.setAttribute('controls', true)
    playerElm.setAttribute('controlslist', 'nodownload')
    playerElm.setAttribute('autoplay', true)
    if (mediaData.hasOwnProperty('start') && mediaData.start !== '') {
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
    $EMBED_WRAPPER.classList.add('w-max', 'h-max', 'border-0')
    $EMBED_WRAPPER.classList.remove('border', 'w-full', 'h-0', 'opacity-0')

    $BUTTON_WATCH_TY.href = '#'
    $BUTTON_WATCH_TY.setAttribute('disabled', '')
    $OPTIONAL_CONTAINER.classList.add('hidden', 'opacity-0')

    playerElm.addEventListener('play', (evt) => {
        if (mediaData.hasOwnProperty('end') && mediaData.end !== '') {
            // When the seek end time is reached, forcibly seeks to the end of the media and ends playback.
            let itvid
            if (!itvid) {
                itvid = setInterval(() => {
                    if (evt.target.currentTime >= mediaData.end) {
                        evt.target.currentTime = evt.target.duration
                        clearInterval(itvid)
                        itvid = null
                    }
                }, 500)
            }
        }
    })

    playerElm.addEventListener('ended', (evt) => {
        // from: flex justify-center        border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-max h-max border-0
        // to:   flex justify-center border border-gray-500 rounded-lg overflow-hidden transition-all duration-150 ease-out w-full h-0 opacity-0
        $EMBED_WRAPPER.classList.add('border', 'w-full', 'h-0', 'opacity-0')
        $EMBED_WRAPPER.classList.remove('w-max', 'h-max', 'border-0')

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
    
}

/*
function createVideoTag(src) {
    logger('createVideoTag:', src)
} */

const items = [
    {
        position: 0,
        el: document.getElementById('carousel-item-1')
    },
    {
        position: 1,
        el: document.getElementById('carousel-item-2')
    },
    {
        position: 2,
        el: document.getElementById('carousel-item-3')
    },/*
    {
        position: 3,
        el: document.getElementById('carousel-item-4')
    },
    {
        position: 4,
        el: document.getElementById('carousel-item-5')
    },
    {
        position: 5,
        el: document.getElementById('carousel-item-6')
    },*/
]

const options = {
    defaultPosition: 1,
    interval: 3000,
    /*
    indicators: {
        activeClasses: 'bg-white dark:bg-gray-800',
        inactiveClasses: 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800',
        items: [
            {
                position: 0,
                el: document.getElementById('carousel-indicator-1')
            },
            {
                position: 1,
                el: document.getElementById('carousel-indicator-2')
            },
            {
                position: 2,
                el: document.getElementById('carousel-indicator-3')
            },
            {
                position: 3,
                el: document.getElementById('carousel-indicator-4')
            },
        ]
    },
    */    
    // callback functions
    onNext: () => {
        console.log('next slider item is shown')
    },
    onPrev: ( ) => {
        console.log('previous slider item is shown')
    },
    onChange: ( ) => {
        console.log('new slider item has been shown')
    }
}

//import { Carousel } from './dist/flowbite.min.js'

//const carousel = new Carousel(items, options)

//carousel.cycle()

const $carouselContainer = document.getElementById('carousel-container')
const $carouselWrapper = document.getElementById('carousel-wrapper')
const $prevButton = document.getElementById('data-carousel-prev')
const $nextButton = document.getElementById('data-carousel-next')

/*
$prevButton.addEventListener('click', (evt) => {
    //console.log(evt)
    carousel.prev()
})

$nextButton.addEventListener('click', (evt) => {
    //console.log(evt)
    carousel.next()
})
*/
$carouselContainer.classList.remove('hidden')
//$prevButton.classList.remove('hidden')
//$nextButton.classList.remove('hidden')

// --------------------------

const currentWindowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
}

window.addEventListener('resize', updateWindowSize)

/*
<?php if ( $output_player == 1 ): ?>
const audio = document.querySelector('audio')
audio.addEventListener('ended', () => {
    reloadPage()
})
<?php endif; ?>

<?php if ( $output_player == 2 ): ?>
var tag = document.createElement('script')
tag.src = 'https://www.youtube.com/player_api'
var firstScriptTag = document.getElementsByTagName('script')[0]
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

var player;
function onYouTubePlayerAPIReady() {
    player = new YT.Player('ytplayer', {
        height: currentWindowSize.width >= 640 ? 360 : 216,
        width: currentWindowSize.width >= 640 ? 640 : 384,
        videoId: '<?= $video_id ?>',
        playerVars: {
            'autoplay': 1,
            'controls': 1,
            'fs': 0,
            'cc_load_policy': 0,
            'rel': 0,
            <?php if ( $start_sec && $start_sec > 0 ): ?>'start': <?= $start_sec ?>,<?php endif; ?>
            <?php if ( $end_sec && $end_sec > 0 ): ?>'end': <?= $end_sec ?>,<?php endif; ?>
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError,
        },
    })
}
function onPlayerReady(event) {
    const wrapper = document.getElementById('embed-wrapper')
    wrapper.classList.add('w-max', 'h-max')
    wrapper.classList.remove('h-0', 'opacity-0')
    event.target.setVolume(33)
    event.target.playVideo()
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        const wrapper = document.getElementById('embed-wrapper')
        wrapper.classList.add('h-0', 'opacity-0')
        wrapper.classList.remove('w-max', 'h-max')
        reloadPage()
    }
}

function onPlayerError(event) {
    console.error(event.data)
}
<?php endif; ?>
*/

const btn = document.getElementById('btn-refresh')
btn.addEventListener('click', (e) => {
    reloadPage()
})

function reloadPage() {
    //window.location.replace(window.location.href)
    window.location.reload()
}

function updateWindowSize() {
    currentWindowSize.width  = window.innerWidth
    currentWindowSize.height = window.innerHeight
    //console.log( 'updateWindowSize:', typeof player, player.getIframe() )
    if (player && typeof player === 'object' && typeof player.getIframe === 'function') {
        const elm = player.getIframe()
        if ( currentWindowSize.width >= 640 ) {
            elm.width  = 640
            elm.height = 360
        } else {
            elm.width  = 384
            elm.height = 216
        }
    }
}
};// end init()

// --------------------------------------------------

// Below are the utility functions:
function isObject(value) {
    return value !== null && "object" === typeof value 
}

function isElement(node) {
    return !(!node || !(node.nodeName || node.prop && node.attr && node.find))
}

function isNumberString(numstr) {
    return "string" == typeof numstr && "" !== numstr && !isNaN(numstr)
}

function isBooleanString(boolstr) {
    return "string" == typeof boolstr && "" !== boolstr && /^(true|false)$/i.test(boolstr)
}

function basename(path) {
    return path.split('/').pop().split('.').shift();
}

function getExt(path) {
    return path.split('.').pop()
}

function executeIfFileExist(src, callback) {
    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function() {
        logger(this)
        if (this.readyState === this.DONE) {
            callback()
        }
    }
    xhr.open('HEAD', src)
}

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

function getOS() {
    let ua;
    return "userAgentData"in window.navigator ? (ua = navigator.userAgentData,
    ua.platform) : (ua = navigator.userAgent,
    /android/i.test(ua) ? "Android" : /iPad|iPhone|iPod/.test(ua) || "MacIntel" === navigator.platform && navigator.maxTouchPoints > 1 ? "iOS" : "Other")
}

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

function setAtts(targetElements, attributes={}, force=!0) {
    const _ELMS = undefined;
    (targetElements instanceof Array ? targetElements : [targetElements]).map(elm=>{
        for (const _key in attributes)
            force ? elm.setAttribute(_key, attributes[_key]) : elm.removeAttribute(_key)
    }
    )
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

function mb_strimwidth(str, start, width, trimmarker) {
    if (typeof trimmarker === 'undefined') trimmarker = ''
    const trimmakerWidth = mb_strwidth(trimmarker)
    var i = start,
        l = str.length,
        trimmedLength = 0,
        trimmedStr = ''
    for (;i < l; i++) {
        var charCode = str.charCodeAt(i),
            c = str.charAt(i),
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
        //logger("fetchData::after:", response)
        if (response.ok) {
            const retval = "json" === datatype ? await response.json() : await response.text();
            logger("fetchData::after:2:", retval)
            return Promise.resolve(retval.data)
        } else {
            const errObj = await response.json();
            return Promise.reject({
                code: errObj.code,
                status: errObj.data.status,
                message: errObj.message
            })
        }
    } catch (err) {
        logger("fetchData::error:", err)
    } finally {
        clearTimeout(timeoutId)
    }
}

function useStge(stge="localStorage") {
    if (window.$ambient) {
        window.$ambient.useStorage = stge
    } else {
        window.$ambient = { useStorage: stge }
    }
}

function saveStge(key, data) {
    const _data = window[window.$ambient.useStorage].getItem('AmbientUserData')
    if (!_data) {
        const newData = {}
        newData[key] = data
        window[window.$ambient.useStorage].setItem('AmbientUserData', JSON.stringify(newData))
        return true
    }
    try {
        const userData = JSON.parse(_data)
        if (isObject(userData)) {
            userData[key] = data
            window[window.$ambient.useStorage].setItem('AmbientUserData', JSON.stringify(userData))
            return true
        }
    } catch (error) {
        logger(error, _data)
    }
    return false
}

function loadStge(key) {
    const _data = window[window.$ambient.useStorage].getItem('AmbientUserData')
    try {
        const userData = JSON.parse(_data)
        if (isObject(userData) && userData.hasOwnProperty(key)) 
            return userData[key];
    } catch (error) {
        logger(error, _data)
    }
    return null
}

function removeStge(key=null) {
    if (!key) {
        window[window.$ambient.useStorage].removeItem('AmbientUserData')
        return true
    }
    const _data = window[window.$ambient.useStorage].getItem('AmbientUserData')
    try {
        const userData = JSON.parse(_data)
        if (isObject(userData) && userData.hasOwnProperty(key)) { 
            delete userData[key]
            window[window.$ambient.useStorage].setItem('AmbientUserData', JSON.stringify(userData))
            return true
        }
    } catch (error) {
        logger(error, _data)
    }
    return false
}

const DEBUG_MODE = !0
  , logger = (...args)=>{
    let isForce = !0;
    if (args.length > 0 && "string" == typeof args[args.length - 1] && args[args.length - 1] === 'force' && (isForce = args.pop() === 'force'),
    !isForce)
        return;
    const now = new Date
      , yyyy = undefined
      , MM = undefined
      , dd = undefined
      , HH = undefined
      , mm = undefined
      , ss = undefined
      , dateStr = `[${"" + now.getFullYear()}/${("0" + (now.getMonth() + 1)).slice(-2)}/${("0" + now.getDate()).slice(-2)} ${("0" + now.getHours()).slice(-2)}:${("0" + now.getMinutes()).slice(-2)}:${("0" + now.getSeconds()).slice(-2)}]`
      , type = /^(error|warn|info|debug|log)$/i.test(args[0]) ? args.shift() : "log";
    //args = args.map(item=>filterValue(item, !0, !1, !0)),
    return console[type](dateStr, ...args)
};

function changeMode() {
    const nowTheme = undefined;
    getAtts(document.body, "data-theme") ? document.body.removeAttribute("data-theme") : setAtts(document.body, {
        "data-theme": "dark"
    }, !0)
}

// Do dispatcher
"complete" === document.readyState || "loading" !== document.readyState && !document.documentElement.doScroll ? init() : document.addEventListener ? document.addEventListener("DOMContentLoaded", init, !1) : window.onload = init;
