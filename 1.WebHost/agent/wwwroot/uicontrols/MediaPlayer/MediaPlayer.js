/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    syn.uicontrols = syn.uicontrols || new syn.module();
    var $mediaplayer = syn.uicontrols.$mediaplayer || new syn.module();

    function hasOwn(target, name) {
        return target && Object.prototype.hasOwnProperty.call(target, name);
    }

    function clone(value, references, copies) {
        if (value === null || value === undefined || typeof value !== 'object') {
            return value;
        }
        if (value instanceof Date) {
            return new Date(value.getTime());
        }
        references = references || [];
        copies = copies || [];
        var found = references.indexOf(value);
        if (found > -1) {
            return copies[found];
        }
        var result = Array.isArray(value) ? [] : {};
        references.push(value);
        copies.push(result);
        for (var key in value) {
            if (hasOwn(value, key)) {
                result[key] = clone(value[key], references, copies);
            }
        }
        return result;
    }

    function merge(target) {
        target = target || {};
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (!source || typeof source !== 'object') {
                continue;
            }
            for (var key in source) {
                if (!hasOwn(source, key)) {
                    continue;
                }
                var value = source[key];
                if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                    var base = target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? target[key] : {};
                    target[key] = merge(base, value);
                }
                else {
                    target[key] = clone(value);
                }
            }
        }
        return target;
    }

    function asArray(value) {
        if (value === null || value === undefined) {
            return [];
        }
        return Array.isArray(value) ? value : [value];
    }

    function resolveFunction(value) {
        if (typeof value === 'function') {
            return value;
        }
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }
        var current = window;
        var names = value.split('.');
        for (var i = 0; i < names.length && current; i++) {
            current = current[names[i]];
        }
        return typeof current === 'function' ? current : null;
    }

    function log(scope, message, level) {
        if (syn.$l && syn.$l.eventLog) {
            syn.$l.eventLog(scope, message && message.message ? message.message : String(message), level || 'Error');
        }
    }

    function nowISO() {
        return new Date().toISOString();
    }

    function optionBoolean(value) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        if (typeof value === 'string') {
            var normalized = value.toLowerCase();
            return normalized === 'true' || normalized === 'y' || normalized === 'yes' || normalized === '1';
        }
        return value === true || value === 1;
    }

    function round(value, digits) {
        if (!isFinite(value)) {
            return null;
        }
        var unit = Math.pow(10, digits === undefined ? 3 : digits);
        return Math.round(value * unit) / unit;
    }

    function parseEvents(el) {
        var result = [];
        var text = el ? el.getAttribute('syn-events') : null;
        if (!text) {
            return result;
        }
        try {
            result = eval(text);
        }
        catch (error) {
            log('$mediaplayer.parseEvents', error, 'Warning');
        }
        return Array.isArray(result) ? result : [];
    }

    function getPageHandler(elID, eventName) {
        var mod = window[syn.$w.pageScript];
        return mod && mod.event ? mod.event[elID + '_' + eventName] : null;
    }

    function emit(control, eventName, eventData) {
        var handler = getPageHandler(control.id, eventName);
        if (handler) {
            try {
                handler.apply(control.element, [control.id, eventData || {}, getState(control)]);
            }
            catch (error) {
                log('$mediaplayer.emit.' + eventName, error);
            }
        }
    }

    function normalizeRows(value) {
        if (value === null || value === undefined) {
            return { valid: true, rows: [] };
        }
        if (!Array.isArray(value) && (typeof value !== 'object' || value instanceof Date)) {
            return { valid: false, rows: [], error: 'setValue accepts an object or an array of objects.' };
        }
        var rows = asArray(value);
        for (var i = 0; i < rows.length; i++) {
            if (!rows[i] || typeof rows[i] !== 'object' || Array.isArray(rows[i])) {
                return { valid: false, rows: [], error: 'Every playlist item must be an object.' };
            }
        }
        return { valid: true, rows: clone(rows) };
    }

    function mappedValue(row, mapping, name, fallbackNames) {
        var resolver = mapping ? mapping[name] : null;
        if (typeof resolver === 'function') {
            return resolver(row);
        }
        if (typeof resolver === 'string' && hasOwn(row, resolver)) {
            return row[resolver];
        }
        var names = asArray(fallbackNames);
        for (var i = 0; i < names.length; i++) {
            if (hasOwn(row, names[i])) {
                return row[names[i]];
            }
        }
        return undefined;
    }

    function isYouTubeURL(src) {
        return typeof src === 'string' && /(?:youtube\.com|youtu\.be)\//i.test(src);
    }

    function inferType(src, mediaType) {
        if (!src) {
            return '';
        }
        if (isYouTubeURL(src)) {
            return 'video/youtube';
        }
        var path = String(src).split('#')[0].split('?')[0].toLowerCase();
        var extension = path.indexOf('.') > -1 ? path.substring(path.lastIndexOf('.') + 1) : '';
        var types = {
            m3u8: 'application/x-mpegURL',
            mpd: 'application/dash+xml',
            mp4: mediaType === 'audio' ? 'audio/mp4' : 'video/mp4',
            m4v: 'video/mp4',
            webm: mediaType === 'audio' ? 'audio/webm' : 'video/webm',
            ogv: 'video/ogg',
            mp3: 'audio/mpeg',
            m4a: 'audio/mp4',
            aac: 'audio/aac',
            oga: 'audio/ogg',
            ogg: mediaType === 'video' ? 'video/ogg' : 'audio/ogg',
            wav: 'audio/wav',
            flac: 'audio/flac'
        };
        return types[extension] || '';
    }

    function inferMediaType(type, src, explicitType) {
        if (explicitType === 'audio' || explicitType === 'video') {
            return explicitType;
        }
        if (String(type || '').indexOf('audio/') === 0) {
            return 'audio';
        }
        var inferred = inferType(src, '');
        return inferred.indexOf('audio/') === 0 ? 'audio' : 'video';
    }

    function normalizeSource(source, mediaType) {
        if (typeof source === 'string') {
            return { src: source, type: inferType(source, mediaType) };
        }
        source = source || {};
        var src = source.src !== undefined ? source.src : source.Src;
        var type = source.type !== undefined ? source.type : source.Type;
        return { src: src || '', type: type || inferType(src, mediaType) };
    }

    function normalizeTrack(track) {
        track = track || {};
        return {
            src: track.src !== undefined ? track.src : track.Src,
            kind: track.kind !== undefined ? track.kind : (track.Kind || 'subtitles'),
            srclang: track.srclang !== undefined ? track.srclang : (track.SrcLang || track.SRCLang || ''),
            label: track.label !== undefined ? track.label : (track.Label || ''),
            default: optionBoolean(track.default !== undefined ? track.default : track.Default) === true
        };
    }

    function normalizeMedia(row, rowIndex, setting) {
        var mapping = setting.mediaMapping || {};
        var explicitMediaType = mappedValue(row, mapping, 'mediaType', ['MediaType', 'mediaType']);
        var rawSources = mappedValue(row, mapping, 'sources', ['Sources', 'sources']);
        var src = mappedValue(row, mapping, 'src', ['Src', 'src', 'SourceURL', 'URL']);
        var type = mappedValue(row, mapping, 'type', ['Type', 'type', 'MimeType']);
        var sources = [];

        if (rawSources !== undefined && rawSources !== null && rawSources !== '') {
            if (!Array.isArray(rawSources)) {
                throw new Error('Sources must be an array. Playlist index: ' + rowIndex);
            }
            for (var sourceIndex = 0; sourceIndex < rawSources.length; sourceIndex++) {
                sources.push(normalizeSource(rawSources[sourceIndex], explicitMediaType));
            }
        }
        else if (src) {
            sources.push(normalizeSource({ src: src, type: type }, explicitMediaType));
        }

        if (sources.length === 0 || !sources[0].src) {
            throw new Error('Src or Sources is required. Playlist index: ' + rowIndex);
        }

        var provider = String(mappedValue(row, mapping, 'provider', ['Provider', 'provider']) || '').toLowerCase();
        if (provider === 'youtube' || isYouTubeURL(sources[0].src)) {
            provider = 'youtube';
            sources[0].type = 'video/youtube';
        }
        else {
            provider = 'html5';
        }

        for (var i = 0; i < sources.length; i++) {
            if (!sources[i].type) {
                sources[i].type = inferType(sources[i].src, explicitMediaType);
            }
            if (!sources[i].type) {
                throw new Error('Type is required when it cannot be inferred from Src. Playlist index: ' + rowIndex);
            }
        }

        var tracks = [];
        var rawTracks = mappedValue(row, mapping, 'tracks', ['Tracks', 'tracks']);
        if (rawTracks !== undefined && rawTracks !== null && rawTracks !== '') {
            if (!Array.isArray(rawTracks)) {
                throw new Error('Tracks must be an array. Playlist index: ' + rowIndex);
            }
            for (var trackIndex = 0; trackIndex < rawTracks.length; trackIndex++) {
                var track = normalizeTrack(rawTracks[trackIndex]);
                if (track.src) {
                    tracks.push(track);
                }
            }
        }

        var id = mappedValue(row, mapping, 'id', ['MediaID', 'mediaID', 'id']);
        var configuredHistoryKey = setting.historyKey && hasOwn(row, setting.historyKey) ? row[setting.historyKey] : id;
        var baseKey = configuredHistoryKey !== undefined && configuredHistoryKey !== null && configuredHistoryKey !== '' ? String(configuredHistoryKey) : String(sources[0].src).toLowerCase();
        return {
            id: id !== undefined && id !== null ? String(id) : baseKey,
            baseKey: baseKey,
            key: baseKey,
            index: rowIndex,
            title: mappedValue(row, mapping, 'title', ['Title', 'title']) || ('Media ' + (rowIndex + 1)),
            description: mappedValue(row, mapping, 'description', ['Description', 'description']) || '',
            provider: provider,
            mediaType: inferMediaType(sources[0].type, sources[0].src, explicitMediaType),
            poster: mappedValue(row, mapping, 'poster', ['Poster', 'poster']) || '',
            thumbnail: mappedValue(row, mapping, 'thumbnail', ['Thumbnail', 'thumbnail']) || '',
            sources: sources,
            tracks: tracks,
            autoplay: optionBoolean(mappedValue(row, mapping, 'autoplay', ['Autoplay', 'autoplay'])),
            muted: optionBoolean(mappedValue(row, mapping, 'muted', ['Muted', 'muted'])),
            loop: optionBoolean(mappedValue(row, mapping, 'loop', ['Loop', 'loop'])),
            playbackRate: mappedValue(row, mapping, 'playbackRate', ['PlaybackRate', 'playbackRate']),
            startTime: Number(mappedValue(row, mapping, 'startTime', ['StartTime', 'startTime']) || 0),
            row: clone(row)
        };
    }

    function normalizePlaylist(rows, setting) {
        var result = [];
        var keyCounts = {};
        for (var i = 0; i < rows.length; i++) {
            var media = normalizeMedia(rows[i], i, setting);
            var count = keyCounts[media.baseKey] || 0;
            keyCounts[media.baseKey] = count + 1;
            if (count > 0) {
                media.key = media.baseKey + '#' + i;
                log('$mediaplayer.setValue', 'Duplicate media history key was separated by playlist index: ' + media.baseKey, 'Warning');
            }
            result.push(media);
        }
        return result;
    }

    function createHistory(media) {
        return {
            key: media.key,
            playlistIndex: media.index,
            playCount: 0,
            firstStartedAt: null,
            lastStartedAt: null,
            lastPausedAt: null,
            lastEndedAt: null,
            lastPlayedAt: null,
            currentTime: 0,
            duration: null,
            watchedSeconds: 0,
            progressPercent: null,
            completed: false,
            completionEmitted: false,
            ended: false,
            volume: 1,
            muted: false,
            playbackRate: 1,
            lastEvent: null,
            errorCode: null,
            errorMessage: null,
            ranges: []
        };
    }

    function mergeRanges(ranges) {
        var sorted = ranges.slice().filter(function (range) {
            return range && isFinite(range[0]) && isFinite(range[1]) && range[1] > range[0];
        }).sort(function (left, right) { return left[0] - right[0]; });
        var merged = [];
        for (var i = 0; i < sorted.length; i++) {
            var current = sorted[i];
            var last = merged.length ? merged[merged.length - 1] : null;
            if (!last || current[0] > last[1] + 0.25) {
                merged.push([current[0], current[1]]);
            }
            else if (current[1] > last[1]) {
                last[1] = current[1];
            }
        }
        return merged;
    }

    function ensureHistory(control, media) {
        if (!media) {
            return null;
        }
        if (!control.history[media.key]) {
            control.history[media.key] = createHistory(media);
        }
        control.history[media.key].playlistIndex = media.index;
        return control.history[media.key];
    }

    function updateHistoryMetrics(control, entry) {
        if (!entry) {
            return;
        }
        entry.ranges = mergeRanges(entry.ranges);
        var watched = 0;
        for (var i = 0; i < entry.ranges.length; i++) {
            watched += entry.ranges[i][1] - entry.ranges[i][0];
        }
        entry.watchedSeconds = round(watched, 3) || 0;
        if (isFinite(entry.duration) && entry.duration > 0) {
            entry.progressPercent = round(Math.min(100, entry.watchedSeconds / entry.duration * 100), 2);
            if (entry.ended || entry.watchedSeconds / entry.duration >= Number(control.config.completionThreshold || 0.9)) {
                entry.completed = true;
            }
        }
        else {
            entry.progressPercent = null;
            entry.completed = !!entry.ended;
        }
        if (entry.completed && !entry.completionEmitted) {
            entry.completionEmitted = true;
            emit(control, 'completed', buildPlaybackRow(control, control.playlist[entry.playlistIndex], entry));
        }
    }

    function samplePlayback(control) {
        var media = control.playlist[control.currentIndex];
        var entry = ensureHistory(control, media);
        if (!entry || !control.player) {
            return entry;
        }
        var current = Number(control.player.currentTime());
        if (!isFinite(current)) {
            return entry;
        }
        if (control.lastSampleTime !== null && !control.seeking && !control.player.paused() && current > control.lastSampleTime) {
            entry.ranges.push([control.lastSampleTime, current]);
        }
        control.lastSampleTime = current;
        entry.currentTime = round(current, 3) || 0;
        var duration = Number(control.player.duration());
        entry.duration = isFinite(duration) && duration > 0 ? round(duration, 3) : null;
        entry.volume = round(Number(control.player.volume()), 3);
        entry.muted = !!control.player.muted();
        entry.playbackRate = round(Number(control.player.playbackRate()), 3) || 1;
        updateHistoryMetrics(control, entry);
        return entry;
    }

    function markHistory(control, eventName, event) {
        var media = control.playlist[control.currentIndex];
        if (!media) {
            return;
        }
        var entry = ensureHistory(control, media);
        var timestamp = nowISO();
        entry.lastEvent = eventName;
        entry.lastPlayedAt = timestamp;

        if (eventName === 'play') {
            if (!control.activationPlayed) {
                entry.playCount++;
                entry.firstStartedAt = entry.firstStartedAt || timestamp;
                control.activationPlayed = true;
            }
            entry.lastStartedAt = timestamp;
            entry.ended = false;
            control.lastPlayedKey = media.key;
            control.lastSampleTime = Number(control.player.currentTime()) || 0;
        }
        else if (eventName === 'playing') {
            control.lastSampleTime = Number(control.player.currentTime()) || 0;
        }
        else if (eventName === 'timeupdate') {
            samplePlayback(control);
        }
        else if (eventName === 'seeking') {
            control.seeking = true;
            control.lastSampleTime = null;
        }
        else if (eventName === 'seeked') {
            control.seeking = false;
            control.lastSampleTime = Number(control.player.currentTime()) || 0;
        }
        else if (eventName === 'pause') {
            samplePlayback(control);
            entry.lastPausedAt = timestamp;
            control.lastSampleTime = null;
        }
        else if (eventName === 'ended') {
            samplePlayback(control);
            entry.ended = true;
            entry.completed = true;
            entry.lastEndedAt = timestamp;
            control.lastSampleTime = null;
            updateHistoryMetrics(control, entry);
        }
        else if (eventName === 'loadedmetadata' || eventName === 'durationchange') {
            samplePlayback(control);
            if (eventName === 'loadedmetadata' && media.startTime > 0) {
                var duration = Number(control.player.duration());
                control.player.currentTime(isFinite(duration) ? Math.min(media.startTime, duration) : media.startTime);
            }
        }
        else if (eventName === 'ratechange' || eventName === 'volumechange') {
            samplePlayback(control);
        }
        else if (eventName === 'error') {
            var playerError = control.player.error ? control.player.error() : null;
            entry.errorCode = playerError ? playerError.code : null;
            entry.errorMessage = playerError ? playerError.message : (event && event.message ? event.message : 'Media playback error');
        }

        updatePlaylistUI(control);
        var immediate = eventName !== 'timeupdate';
        var now = Date.now();
        if (immediate || now - control.lastHistoryEmit >= Number(control.config.historyUpdateInterval || 1000)) {
            control.lastHistoryEmit = now;
            emit(control, 'historyChange', buildPlaybackRow(control, media, entry));
        }
    }

    function buildPlaybackRow(control, media, entry) {
        if (!media || !entry || entry.playCount < 1) {
            return null;
        }
        updateHistoryMetrics(control, entry);
        var result = clone(media.row);
        var fields = {
            PlaybackPlaylistIndex: media.index,
            PlaybackProvider: media.provider,
            PlaybackMediaType: media.mediaType,
            PlaybackSource: media.sources.length ? media.sources[0].src : '',
            PlaybackPlayCount: entry.playCount,
            PlaybackFirstStartedAt: entry.firstStartedAt,
            PlaybackLastStartedAt: entry.lastStartedAt,
            PlaybackLastPausedAt: entry.lastPausedAt,
            PlaybackLastEndedAt: entry.lastEndedAt,
            PlaybackLastPlayedAt: entry.lastPlayedAt,
            PlaybackCurrentTime: entry.currentTime,
            PlaybackDuration: entry.duration,
            PlaybackWatchedSeconds: entry.watchedSeconds,
            PlaybackProgressPercent: entry.progressPercent,
            PlaybackCompletedYN: entry.completed ? 'Y' : 'N',
            PlaybackEndedYN: entry.ended ? 'Y' : 'N',
            PlaybackVolume: entry.volume,
            PlaybackMutedYN: entry.muted ? 'Y' : 'N',
            PlaybackRate: entry.playbackRate,
            PlaybackLastEvent: entry.lastEvent,
            PlaybackErrorCode: entry.errorCode,
            PlaybackErrorMessage: entry.errorMessage
        };
        for (var name in fields) {
            if (hasOwn(fields, name)) {
                result[name] = fields[name];
            }
        }
        return result;
    }

    function getPlaybackRows(control) {
        if (!control) {
            return [];
        }
        samplePlayback(control);
        var result = [];
        for (var i = 0; i < control.playlist.length; i++) {
            var media = control.playlist[i];
            var row = buildPlaybackRow(control, media, control.history[media.key]);
            if (row) {
                result.push(row);
            }
        }
        return result;
    }

    function getCurrentPlaybackRow(control) {
        if (!control) {
            return null;
        }
        samplePlayback(control);
        var media = control.playlist[control.currentIndex];
        var row = media ? buildPlaybackRow(control, media, control.history[media.key]) : null;
        if (row) {
            return row;
        }
        if (control.lastPlayedKey) {
            for (var i = 0; i < control.playlist.length; i++) {
                if (control.playlist[i].key === control.lastPlayedKey) {
                    return buildPlaybackRow(control, control.playlist[i], control.history[control.lastPlayedKey]);
                }
            }
        }
        return null;
    }

    function serializeRows(rows, requestType, metaColumns) {
        if (requestType === 'Row') {
            rows = rows.length ? [rows[rows.length - 1]] : [];
        }
        else if (requestType !== 'List') {
            return [];
        }
        var result = [];
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var transactionRow = [];
            if (metaColumns) {
                for (var key in metaColumns) {
                    if (!hasOwn(metaColumns, key)) {
                        continue;
                    }
                    var meta = metaColumns[key] || {};
                    var fieldID = meta.fieldID || meta.FieldID || key;
                    var dataType = meta.dataType || meta.DataType;
                    var value = row[key];
                    if (value === undefined && window.$object && $object.defaultValue) {
                        value = String(dataType || '').toLowerCase() === 'number' ? null : $object.defaultValue(dataType);
                    }
                    transactionRow.push({ prop: fieldID, val: value });
                }
            }
            else {
                for (var property in row) {
                    if (hasOwn(row, property)) {
                        transactionRow.push({ prop: property, val: row[property] });
                    }
                }
            }
            result.push(transactionRow);
        }
        return result;
    }

    function publicMedia(media) {
        if (!media) {
            return null;
        }
        return {
            id: media.id,
            index: media.index,
            title: media.title,
            description: media.description,
            provider: media.provider,
            mediaType: media.mediaType,
            poster: media.poster,
            thumbnail: media.thumbnail,
            sources: clone(media.sources),
            tracks: clone(media.tracks),
            row: clone(media.row)
        };
    }

    function getState(control) {
        if (!control) {
            return null;
        }
        var player = control.player;
        var current = control.playlist[control.currentIndex];
        return {
            currentIndex: control.currentIndex,
            currentMedia: publicMedia(current),
            playback: getCurrentPlaybackRow(control),
            playlistLength: control.playlist.length,
            paused: player ? player.paused() : true,
            ended: player ? player.ended() : false,
            currentTime: player ? round(Number(player.currentTime()), 3) : 0,
            duration: player && isFinite(Number(player.duration())) ? round(Number(player.duration()), 3) : null,
            volume: player ? round(Number(player.volume()), 3) : 1,
            muted: player ? !!player.muted() : false,
            playbackRate: player ? round(Number(player.playbackRate()), 3) : 1
        };
    }

    function shouldShowPlaylist(control) {
        var visible = control.config.playlist && control.config.playlist.visible;
        return visible === true || visible === 'always' || (visible === 'auto' && control.playlist.length > 1);
    }

    function updatePlaylistUI(control) {
        if (!control.playlistElement) {
            return;
        }
        control.playlistElement.style.display = shouldShowPlaylist(control) ? '' : 'none';
        var list = control.playlistListElement;
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
        for (var i = 0; i < control.playlist.length; i++) {
            (function (index) {
                var media = control.playlist[index];
                var entry = control.history[media.key];
                var item = document.createElement('li');
                item.className = 'syn-mediaplayer-playlist-item' + (index === control.currentIndex ? ' active' : '');
                var button = document.createElement('button');
                button.type = 'button';
                button.setAttribute('data-index', index);
                button.setAttribute('aria-current', index === control.currentIndex ? 'true' : 'false');
                if (media.thumbnail || media.poster) {
                    var image = document.createElement('img');
                    image.src = media.thumbnail || media.poster;
                    image.alt = '';
                    button.appendChild(image);
                }
                var text = document.createElement('span');
                text.className = 'syn-mediaplayer-playlist-text';
                var title = document.createElement('strong');
                title.textContent = media.title;
                var meta = document.createElement('small');
                var progress = entry && entry.playCount ? (entry.completed ? '완료' : (entry.progressPercent === null ? '재생함' : entry.progressPercent + '%')) : '미재생';
                meta.textContent = media.provider + ' · ' + media.mediaType + ' · ' + progress;
                text.appendChild(title);
                text.appendChild(meta);
                button.appendChild(text);
                button.addEventListener('click', function () {
                    $mediaplayer.selectMedia(control.id, index, true, 'playlist');
                });
                item.appendChild(button);
                list.appendChild(item);
            })(i);
        }
    }

    function removeRemoteTracks(control) {
        if (!control.player || !control.player.remoteTextTracks) {
            return;
        }
        var tracks = control.player.remoteTextTracks();
        for (var i = tracks.length - 1; i >= 0; i--) {
            try {
                control.player.removeRemoteTextTrack(tracks[i]);
            }
            catch (error) {
                log('$mediaplayer.removeRemoteTracks', error, 'Warning');
            }
        }
    }

    function setPlayerTheme(control, themeClass) {
        if (!control.player) {
            return;
        }
        if (control.themeClass) {
            control.player.removeClass(control.themeClass);
            control.element.classList.remove(control.themeClass);
        }
        control.themeClass = themeClass || '';
        if (control.themeClass) {
            control.player.addClass(control.themeClass);
            control.element.classList.add(control.themeClass);
        }
    }

    function applyMedia(control, index, autoplay, reason) {
        if (!control || !control.player || index < 0 || index >= control.playlist.length) {
            return null;
        }
        samplePlayback(control);
        control.player.pause();
        control.currentIndex = index;
        control.activationPlayed = false;
        control.lastSampleTime = null;
        control.seeking = false;
        var media = control.playlist[index];
        removeRemoteTracks(control);
        control.player.poster(media.poster || '');
        if (typeof control.player.audioOnlyMode === 'function') {
            Promise.resolve(control.player.audioOnlyMode(media.mediaType === 'audio')).catch(function () { });
        }
        if (media.muted !== undefined) {
            control.player.muted(!!media.muted);
        }
        if (media.loop !== undefined) {
            control.player.loop(!!media.loop);
        }
        if (media.playbackRate !== undefined && isFinite(Number(media.playbackRate))) {
            control.player.playbackRate(Number(media.playbackRate));
        }
        control.player.src(clone(media.sources));
        for (var i = 0; i < media.tracks.length; i++) {
            control.player.addRemoteTextTrack(clone(media.tracks[i]), false);
        }
        updatePlaylistUI(control);
        emit(control, 'mediaChange', { index: index, reason: reason || 'api', media: publicMedia(media) });
        var shouldPlay = autoplay === true || (autoplay === undefined && media.autoplay === true);
        if (shouldPlay) {
            var promise = control.player.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function (error) {
                    log('$mediaplayer.selectMedia', error, 'Warning');
                });
            }
        }
        return control.player;
    }

    function advanceAfterEnded(control) {
        var playlistSetting = control.config.playlist || {};
        if (playlistSetting.repeat === 'one') {
            control.activationPlayed = false;
            control.player.currentTime(control.playlist[control.currentIndex].startTime || 0);
            Promise.resolve(control.player.play()).catch(function () { });
            return;
        }
        if (!playlistSetting.autoAdvance) {
            emit(control, 'playlistEnded', { index: control.currentIndex, reason: 'mediaEnded' });
            return;
        }
        var nextIndex = control.currentIndex + 1;
        if (nextIndex >= control.playlist.length && playlistSetting.repeat === 'all') {
            nextIndex = 0;
        }
        if (nextIndex < control.playlist.length) {
            applyMedia(control, nextIndex, true, 'autoAdvance');
        }
        else {
            emit(control, 'playlistEnded', { index: control.currentIndex, reason: 'playlistEnded' });
        }
    }

    function bindPlayerEvents(control) {
        var internalEvents = ['loadstart', 'loadedmetadata', 'durationchange', 'play', 'playing', 'pause', 'timeupdate', 'seeking', 'seeked', 'ratechange', 'volumechange', 'waiting', 'stalled', 'ended', 'error', 'fullscreenchange', 'enterpictureinpicture', 'leavepictureinpicture'];
        var bound = {};
        for (var i = 0; i < internalEvents.length; i++) {
            (function (eventName) {
                var listener = function (event) {
                    markHistory(control, eventName, event);
                    if (control.eventNames.indexOf(eventName) > -1) {
                        emit(control, eventName, event);
                    }
                    if (eventName === 'ended') {
                        advanceAfterEnded(control);
                    }
                };
                control.player.on(eventName, listener);
                control.boundEvents.push({ eventName: eventName, listener: listener });
                bound[eventName] = true;
            })(internalEvents[i]);
        }
        for (var eventIndex = 0; eventIndex < control.eventNames.length; eventIndex++) {
            (function (eventName) {
                if (bound[eventName] || $mediaplayer.syntheticEvents.indexOf(eventName) > -1) {
                    return;
                }
                var listener = function (event) { emit(control, eventName, event); };
                control.player.on(eventName, listener);
                control.boundEvents.push({ eventName: eventName, listener: listener });
            })(control.eventNames[eventIndex]);
        }
    }

    function createPlayerOptions(setting) {
        var options = merge({}, setting.playerOptions || {});
        return merge(options, {
            controls: setting.controls,
            preload: setting.preload,
            autoplay: setting.autoplay,
            muted: setting.muted,
            loop: setting.loop,
            playsinline: setting.playsinline,
            fluid: setting.fluid,
            responsive: setting.responsive,
            aspectRatio: setting.aspectRatio,
            language: setting.language,
            playbackRates: setting.playbackRates,
            techOrder: clone(setting.techOrder),
            html5: clone(setting.html5),
            youtube: clone(setting.youtube),
            plugins: clone(setting.plugins)
        });
    }

    function applyPlaylist(control, rows, metaColumns) {
        var playlist = normalizePlaylist(rows, control.config);
        samplePlayback(control);
        control.player.pause();
        var previous = control.history;
        var nextHistory = {};
        if (control.config.preserveHistory) {
            for (var i = 0; i < playlist.length; i++) {
                var media = playlist[i];
                if (previous[media.key]) {
                    nextHistory[media.key] = previous[media.key];
                    nextHistory[media.key].playlistIndex = i;
                }
            }
        }
        control.rawValue = clone(rows);
        control.metaColumns = metaColumns || null;
        control.playlist = playlist;
        control.history = nextHistory;
        control.currentIndex = -1;
        control.lastPlayedKey = null;
        control.activationPlayed = false;
        control.lastSampleTime = null;
        if (playlist.length) {
            var startIndex = Math.max(0, Math.min(Number(control.config.startIndex) || 0, playlist.length - 1));
            applyMedia(control, startIndex, control.config.autoplay, 'setValue');
        }
        else {
            control.player.pause();
            removeRemoteTracks(control);
            control.player.reset();
            updatePlaylistUI(control);
        }
        emit(control, 'dataBound', { rows: clone(rows), playlist: playlist.map(publicMedia) });
        emit(control, 'playlistChange', { playlist: playlist.map(publicMedia) });
        return control.player;
    }

    $mediaplayer.extend({
        name: 'syn.uicontrols.$mediaplayer',
        version: 'v2026.7.27',
        mediaControls: [],
        syntheticEvents: ['initialized', 'dataBound', 'mediaChange', 'playlistChange', 'historyChange', 'completed', 'playlistEnded', 'disposed'],
        defaultSetting: {
            width: '100%',
            height: 'auto',
            controls: true,
            preload: 'metadata',
            autoplay: false,
            muted: false,
            loop: false,
            playsinline: true,
            fluid: true,
            responsive: true,
            aspectRatio: '16:9',
            language: 'ko',
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            techOrder: ['youtube', 'html5'],
            html5: {},
            youtube: { ytControls: 0 },
            plugins: {},
            playerOptions: {},
            themeClass: 'vjs-theme-handstack',
            playlist: { visible: 'auto', position: 'right', autoAdvance: false, repeat: 'none' },
            mediaMapping: {
                id: 'MediaID', title: 'Title', description: 'Description', src: 'Src', type: 'Type',
                provider: 'Provider', mediaType: 'MediaType', poster: 'Poster', thumbnail: 'Thumbnail',
                sources: 'Sources', tracks: 'Tracks', autoplay: 'Autoplay', muted: 'Muted', loop: 'Loop',
                playbackRate: 'PlaybackRate', startTime: 'StartTime'
            },
            dataAdapter: null,
            startIndex: 0,
            completionThreshold: 0.9,
            preserveHistory: false,
            historyKey: 'MediaID',
            historyUpdateInterval: 1000,
            autoResize: true,
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList: function (el, moduleList, setting, controlType) {
            var form = el.closest('form');
            moduleList.push({
                id: el.getAttribute('id'),
                formDataFieldID: form ? form.getAttribute('syn-datafield') : '',
                field: el.getAttribute('syn-datafield'),
                module: this.name,
                type: controlType
            });
        },

        controlLoad: function (elID, setting) {
            var el = syn.$l.get(elID);
            if (!el || !window.videojs) {
                log('$mediaplayer.controlLoad', 'Video.js is not loaded.');
                return;
            }
            setting = merge({}, $mediaplayer.defaultSetting, setting || {});
            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                setting = merge(setting, mod.hook.controlInit(elID, setting) || {});
            }
            setting.width = el.style.width || setting.width;
            setting.height = el.style.height || setting.height;

            var originalDisplay = el.style.display;
            el.setAttribute('id', elID + '_hidden');
            try {
                el.setAttribute('syn-options', JSON.stringify(setting));
            }
            catch (error) {
                log('$mediaplayer.controlLoad', 'syn-options contains a non-serializable value.', 'Warning');
            }
            el.style.display = 'none';

            var wrapper = document.createElement('div');
            wrapper.id = elID + '_wrapper';
            wrapper.className = 'syn-mediaplayer syn-mediaplayer-playlist-' + (setting.playlist.position || 'right');
            wrapper.style.width = setting.width;
            if (setting.height && setting.height !== 'auto') {
                wrapper.style.height = setting.height;
            }
            var playerArea = document.createElement('div');
            playerArea.className = 'syn-mediaplayer-player';
            var video = document.createElement('video');
            video.id = elID;
            video.className = 'video-js vjs-big-play-centered';
            video.setAttribute('playsinline', 'playsinline');
            playerArea.appendChild(video);
            var playlistElement = document.createElement('aside');
            playlistElement.className = 'syn-mediaplayer-playlist';
            playlistElement.setAttribute('aria-label', '재생목록');
            var playlistTitle = document.createElement('div');
            playlistTitle.className = 'syn-mediaplayer-playlist-title';
            playlistTitle.textContent = '재생목록';
            var playlistList = document.createElement('ul');
            playlistElement.appendChild(playlistTitle);
            playlistElement.appendChild(playlistList);
            wrapper.appendChild(playerArea);
            wrapper.appendChild(playlistElement);
            el.parentNode.insertBefore(wrapper, el.nextSibling);

            var control = {
                id: elID,
                originalElement: el,
                originalDisplay: originalDisplay,
                element: wrapper,
                playerArea: playerArea,
                videoElement: video,
                playlistElement: playlistElement,
                playlistListElement: playlistList,
                player: null,
                config: setting,
                rawValue: [],
                metaColumns: null,
                playlist: [],
                history: {},
                currentIndex: -1,
                lastPlayedKey: null,
                activationPlayed: false,
                lastSampleTime: null,
                seeking: false,
                lastHistoryEmit: 0,
                eventNames: parseEvents(el),
                boundEvents: [],
                runtimeEvents: [],
                resizeObserver: null,
                setValueVersion: 0,
                themeClass: ''
            };
            $mediaplayer.mediaControls.push(control);

            try {
                control.player = videojs(video, createPlayerOptions(setting), function () {
                    control.player = this;
                    setPlayerTheme(control, setting.themeClass);
                    bindPlayerEvents(control);
                    updatePlaylistUI(control);
                    emit(control, 'initialized', { player: control.player });
                });
                if (setting.autoResize && window.ResizeObserver) {
                    control.resizeObserver = new ResizeObserver(function () {
                        if (control.player && !control.player.isDisposed()) {
                            control.player.trigger('resize');
                            control.player.trigger('componentresize');
                        }
                    });
                    control.resizeObserver.observe(wrapper);
                }
            }
            catch (error) {
                log('$mediaplayer.controlLoad', error);
                emit(control, 'error', error);
            }
        },

        getControl: function (elID) {
            return $mediaplayer.mediaControls.find(function (control) { return control.id === elID; }) || null;
        },

        getPlayer: function (elID) {
            var control = $mediaplayer.getControl(elID);
            return control ? control.player : null;
        },

        getVideoJS: function () {
            return window.videojs || null;
        },

        setValue: function (elID, value, metaColumns) {
            var control = $mediaplayer.getControl(elID);
            if (!control || !control.player) {
                return Promise.resolve(null);
            }
            var normalized = normalizeRows(value);
            if (!normalized.valid) {
                log('$mediaplayer.setValue', normalized.error, 'Warning');
                emit(control, 'error', { code: 'INVALID_PLAYLIST', message: normalized.error });
                return Promise.resolve(null);
            }
            var token = ++control.setValueVersion;
            var adapter = resolveFunction(control.config.dataAdapter);
            var operation;
            try {
                operation = adapter ? adapter(clone(normalized.rows), metaColumns, control) : normalized.rows;
            }
            catch (error) {
                log('$mediaplayer.setValue', error);
                emit(control, 'error', error);
                return Promise.resolve(null);
            }
            return Promise.resolve(operation).then(function (rows) {
                if (token !== control.setValueVersion) {
                    return control.player;
                }
                var adapted = normalizeRows(rows);
                if (!adapted.valid) {
                    throw new Error(adapted.error);
                }
                return applyPlaylist(control, adapted.rows, metaColumns);
            }).catch(function (error) {
                log('$mediaplayer.setValue', error);
                emit(control, 'error', error);
                return null;
            });
        },

        getValue: function (elID, requestType, metaColumns) {
            var control = $mediaplayer.getControl(elID);
            if (!control) {
                return requestType ? [] : null;
            }
            if (!requestType) {
                return clone(getCurrentPlaybackRow(control));
            }
            var rows = requestType === 'Row' ? asArray(getCurrentPlaybackRow(control)).filter(Boolean) : getPlaybackRows(control);
            return serializeRows(rows, requestType, metaColumns || control.metaColumns);
        },

        getRawValue: function (elID) {
            var control = $mediaplayer.getControl(elID);
            return control ? clone(control.rawValue) : [];
        },

        getPlaylist: function (elID) {
            var control = $mediaplayer.getControl(elID);
            return control ? control.playlist.map(publicMedia) : [];
        },

        getCurrentMedia: function (elID) {
            var control = $mediaplayer.getControl(elID);
            return control ? publicMedia(control.playlist[control.currentIndex]) : null;
        },

        getPlaybackDetails: function (elID, requestType) {
            var control = $mediaplayer.getControl(elID);
            if (!control) {
                return requestType === 'List' ? [] : null;
            }
            return requestType === 'List' ? clone(getPlaybackRows(control)) : clone(getCurrentPlaybackRow(control));
        },

        getState: function (elID) {
            return clone(getState($mediaplayer.getControl(elID)));
        },

        selectMedia: function (elID, indexOrKey, autoplay, reason) {
            var control = $mediaplayer.getControl(elID);
            if (!control) {
                return null;
            }
            var index = typeof indexOrKey === 'number' && isFinite(indexOrKey) ? indexOrKey : -1;
            if (typeof indexOrKey !== 'number') {
                index = -1;
                for (var i = 0; i < control.playlist.length; i++) {
                    if (control.playlist[i].key === indexOrKey || control.playlist[i].id === String(indexOrKey)) {
                        index = i;
                        break;
                    }
                }
                if (index < 0 && String(indexOrKey).trim() !== '' && isFinite(Number(indexOrKey))) {
                    index = Number(indexOrKey);
                }
            }
            return applyMedia(control, index, autoplay, reason || 'api');
        },

        play: function (elID) {
            var player = $mediaplayer.getPlayer(elID);
            return player ? player.play() : Promise.resolve(null);
        },

        pause: function (elID) {
            var player = $mediaplayer.getPlayer(elID);
            if (player) { player.pause(); }
        },

        stop: function (elID) {
            var control = $mediaplayer.getControl(elID);
            if (control && control.player) {
                control.player.pause();
                var media = control.playlist[control.currentIndex];
                control.player.currentTime(media ? media.startTime || 0 : 0);
            }
        },

        load: function (elID) {
            var player = $mediaplayer.getPlayer(elID);
            if (player) { player.load(); }
        },

        next: function (elID, autoplay) {
            var control = $mediaplayer.getControl(elID);
            if (!control || !control.playlist.length) { return null; }
            var index = control.currentIndex + 1;
            if (index >= control.playlist.length && control.config.playlist.repeat === 'all') { index = 0; }
            return index < control.playlist.length ? applyMedia(control, index, autoplay, 'next') : null;
        },

        previous: function (elID, autoplay) {
            var control = $mediaplayer.getControl(elID);
            if (!control || !control.playlist.length) { return null; }
            var index = control.currentIndex - 1;
            if (index < 0 && control.config.playlist.repeat === 'all') { index = control.playlist.length - 1; }
            return index >= 0 ? applyMedia(control, index, autoplay, 'previous') : null;
        },

        currentTime: function (elID, value) {
            var player = $mediaplayer.getPlayer(elID);
            if (!player) { return null; }
            if (value !== undefined) { player.currentTime(Number(value) || 0); }
            return player.currentTime();
        },

        duration: function (elID) {
            var player = $mediaplayer.getPlayer(elID);
            return player ? player.duration() : null;
        },

        volume: function (elID, value) {
            var player = $mediaplayer.getPlayer(elID);
            if (!player) { return null; }
            if (value !== undefined) { player.volume(Math.max(0, Math.min(1, Number(value)))); }
            return player.volume();
        },

        muted: function (elID, value) {
            var player = $mediaplayer.getPlayer(elID);
            if (!player) { return null; }
            if (value !== undefined) { player.muted(!!value); }
            return player.muted();
        },

        playbackRate: function (elID, value) {
            var player = $mediaplayer.getPlayer(elID);
            if (!player) { return null; }
            if (value !== undefined && isFinite(Number(value))) { player.playbackRate(Number(value)); }
            return player.playbackRate();
        },

        setTheme: function (elID, themeClass) {
            var control = $mediaplayer.getControl(elID);
            if (control) { setPlayerTheme(control, themeClass); }
        },

        addTextTrack: function (elID, track) {
            var player = $mediaplayer.getPlayer(elID);
            return player ? player.addRemoteTextTrack(normalizeTrack(track), false) : null;
        },

        removeTextTrack: function (elID, track) {
            var player = $mediaplayer.getPlayer(elID);
            return player ? player.removeRemoteTextTrack(track) : null;
        },

        requestFullscreen: function (elID) {
            var player = $mediaplayer.getPlayer(elID);
            return player && player.requestFullscreen ? player.requestFullscreen() : null;
        },

        exitFullscreen: function (elID) {
            var player = $mediaplayer.getPlayer(elID);
            return player && player.exitFullscreen ? player.exitFullscreen() : null;
        },

        requestPictureInPicture: function (elID) {
            var player = $mediaplayer.getPlayer(elID);
            if (!player || !player.requestPictureInPicture) {
                return Promise.resolve(null);
            }
            try {
                return Promise.resolve(player.requestPictureInPicture());
            }
            catch (error) {
                return Promise.reject(error);
            }
        },

        usePlugin: function (elID, pluginName, options) {
            var player = $mediaplayer.getPlayer(elID);
            return player && typeof player[pluginName] === 'function' ? player[pluginName](options || {}) : null;
        },

        invoke: function (elID, method, args) {
            var player = $mediaplayer.getPlayer(elID);
            return player && typeof player[method] === 'function' ? player[method].apply(player, args || []) : null;
        },

        on: function (elID, eventName, handler) {
            var control = $mediaplayer.getControl(elID);
            var resolved = resolveFunction(handler);
            if (!control || !control.player || !resolved) { return null; }
            var listener = function (event) { resolved(control.id, event, getState(control)); };
            control.player.on(eventName, listener);
            control.runtimeEvents.push({ eventName: eventName, handler: handler, listener: listener });
            return listener;
        },

        off: function (elID, eventName, handler) {
            var control = $mediaplayer.getControl(elID);
            if (!control || !control.player) { return; }
            for (var i = control.runtimeEvents.length - 1; i >= 0; i--) {
                var item = control.runtimeEvents[i];
                if (item.eventName === eventName && (!handler || item.handler === handler || item.listener === handler)) {
                    control.player.off(item.eventName, item.listener);
                    control.runtimeEvents.splice(i, 1);
                }
            }
        },

        resetHistory: function (elID) {
            var control = $mediaplayer.getControl(elID);
            if (!control) { return; }
            control.history = {};
            control.lastPlayedKey = null;
            control.activationPlayed = false;
            control.lastSampleTime = null;
            updatePlaylistUI(control);
            emit(control, 'historyChange', { source: 'resetHistory' });
        },

        resize: function (elID) {
            var player = $mediaplayer.getPlayer(elID);
            if (player) {
                player.trigger('resize');
                player.trigger('componentresize');
            }
        },

        clear: function (elID) {
            var control = $mediaplayer.getControl(elID);
            if (!control || !control.player) { return; }
            control.setValueVersion++;
            control.player.pause();
            removeRemoteTracks(control);
            control.player.reset();
            control.rawValue = [];
            control.metaColumns = null;
            control.playlist = [];
            control.history = {};
            control.currentIndex = -1;
            control.lastPlayedKey = null;
            control.activationPlayed = false;
            control.lastSampleTime = null;
            updatePlaylistUI(control);
            emit(control, 'playlistChange', { playlist: [] });
        },

        dispose: function (elID) {
            var control = $mediaplayer.getControl(elID);
            if (!control) { return; }
            emit(control, 'disposed', {});
            control.setValueVersion++;
            if (control.resizeObserver) { control.resizeObserver.disconnect(); }
            if (control.player && !control.player.isDisposed()) { control.player.dispose(); }
            if (control.element && control.element.parentNode) { control.element.parentNode.removeChild(control.element); }
            if (control.originalElement) {
                control.originalElement.setAttribute('id', elID);
                control.originalElement.style.display = control.originalDisplay;
            }
            var index = $mediaplayer.mediaControls.indexOf(control);
            if (index > -1) { $mediaplayer.mediaControls.splice(index, 1); }
        }
    });

    syn.uicontrols.$mediaplayer = $mediaplayer;
})(window);
