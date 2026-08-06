Chart.defaults.font.family = "'Public Sans', sans-serif";

/* ═══════════════════════════════════════════════════════════
   Configuration
═══════════════════════════════════════════════════════════ */
const DEFAULT_START = new Date('2015-01-01T00:00:00Z');
const DEFAULT_END = new Date('2024-12-31T00:00:00Z');
let RANGE_START = new Date(DEFAULT_START);
let RANGE_END = new Date(DEFAULT_END);
let TOTAL_DAYS = Math.round((RANGE_END - RANGE_START) / 86400000);
let currentDate = new Date('2024-08-21T00:00:00Z');

// Layer definitions – order = visual stack order (index 0 = topmost)
const LAYER_DEFS = [
    {
        id: 'co500',
        gibs: 'AIRS_L2_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Day',
        label: 'CO 500 hPa',
        sublabel: 'AIRS L2 Carbon Monoxide · Daily',
        color: '#ff7043',
        opacity: 0.85,
        visible: false,
    },
    {
        id: 'aerosol',
        gibs: 'OMI_Aerosol_Index',
        label: 'Aerosol Index',
        sublabel: 'OMI Aerosol Index · Daily',
        color: '#0170B9',
        opacity: 0.85,
        visible: false,
    },
    {
        id: 'modis',
        gibs: 'MODIS_Terra_CorrectedReflectance_TrueColor',
        label: 'MODIS True Color',
        sublabel: 'MODIS Terra · 250 m',
        format: 'image/jpeg',
        opacity: 1.0,
        visible: false,
    },
];


/* ═══════════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════════ */
function toWMTSTime(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}T00:00:00Z`;
}

function toDisplayDate(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function clampDate(date) {
    if (date < RANGE_START) return new Date(RANGE_START);
    if (date > RANGE_END) return new Date(RANGE_END);
    return date;
}

function dateToSlider(date) {
    return Math.round((date - RANGE_START) / 86400000);
}

function sliderToDate(val) {
    return new Date(RANGE_START.getTime() + val * 86400000);
}

function recalcSliderRange() {
    // Collect all layer time bounds; fall back to defaults when a layer has no time metadata
    let minMs = DEFAULT_START.getTime();
    let maxMs = DEFAULT_END.getTime();
    let hasAny = false;

    LAYER_DEFS.forEach(def => {
        if (def.timeStart) {
            const t = new Date(def.timeStart).getTime();
            if (!isNaN(t)) {
                if (!hasAny || t < minMs) minMs = t;
                hasAny = true;
            }
        }
        if (def.timeEnd) {
            const t = new Date(def.timeEnd).getTime();
            if (!isNaN(t)) {
                if (!hasAny || t > maxMs) maxMs = t;
                hasAny = true;
            }
        }
    });

    if (!hasAny) {
        minMs = DEFAULT_START.getTime();
        maxMs = DEFAULT_END.getTime();
    }

    RANGE_START = new Date(minMs);
    RANGE_END = new Date(maxMs);
    TOTAL_DAYS = Math.round((maxMs - minMs) / 86400000);

    const $slider = $('#timeline-slider');
    $slider.attr('min', 0).attr('max', TOTAL_DAYS);
    $slider.val(dateToSlider(clampDate(currentDate)));

    // Update range labels
    const fmt = d => d.toLocaleDateString('en-US', {month: 'short', year: 'numeric', timeZone: 'UTC'});
    $('#tl-range-start').text(fmt(RANGE_START));
    $('#tl-range-end').text(fmt(RANGE_END));

    applyDate(currentDate);
}


/* ═══════════════════════════════════════════════════════════
   Timed WMS Tile Layer (extends L.TileLayer.WMS)
═══════════════════════════════════════════════════════════ */
const TimedWMS = L.TileLayer.WMS.extend({
    initialize(def, time, options) {
        this._def = def;
        const wmsOptions = Object.assign({}, options, {
            layers: def.gibs,
            TIME: time,
            format: def.format || 'image/png',
            transparent: true,
            version: '1.3.0'
        });
        L.TileLayer.WMS.prototype.initialize.call(this, 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi', wmsOptions);
    },

    setTime(time) {
        this.setParams({TIME: time}, false);
    },
});


/* ═══════════════════════════════════════════════════════════
   Map Initialisation
═══════════════════════════════════════════════════════════ */
const map = L.map('map', {
    crs: L.CRS.EPSG3857,
    center: [20, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 16,
    maxBounds: [[-85.0511, -220], [85.0511, 220]],
    zoomControl: false,
});

L.control.zoom({position: 'bottomright'}).addTo(map);

/* ═══════════════════════════════════════════════════════════
   Basemap System
═══════════════════════════════════════════════════════════ */
let currentBasemap = null;
let currentBasemapId = 'bluemarble';

const BASEMAP_DEFS = [
    {
        id: 'bluemarble',
        label: 'Blue Marble',
        sub: 'NASA GIBS · Static global',
        icon: 'fa-earth-americas',
        live: false,
        create() {
            return L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi', {
                layers: 'BlueMarble_ShadedRelief_Bathymetry',
                format: 'image/jpeg',
                styles: 'default',
                version: '1.3.0',
                transparent: false,
                tileSize: 512,
                maxNativeZoom: 9,
                noWrap: true,
                bounds: [[-85.0511, -180], [85.0511, 180]],
                attribution: '&copy; <a href="https://earthdata.nasa.gov" target="_blank">NASA EOSDIS GIBS</a>',
            });
        },
    },
    {
        id: 'osm',
        label: 'OpenStreetMap',
        sub: 'Street map · Zoom to 16',
        icon: 'fa-map',
        live: false,
        create() {
            return L.tileLayer.wms('https://ows.terrestris.de/osm/service', {
                layers: 'OSM-WMS',
                format: 'image/png',
                version: '1.3.0',
                transparent: true,
                crs: L.CRS.EPSG3857,
                uppercase: true,
                maxZoom: 16,
                attribution: '&copy; <a href="https://www.terrestris.de/">terrestris GmbH</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
            });
        },
    },
    {
        id: 'darkmatter',
        label: 'Dark Matter',
        sub: 'CARTO · Dark theme',
        icon: 'fa-moon',
        live: false,
        create() {
            return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            });
        },
    },
];

function selectBasemap(id) {
    if (id === currentBasemapId && currentBasemap) return;

    // Remove old basemap
    if (currentBasemap) {
        map.removeLayer(currentBasemap);
        currentBasemap = null;
    }

    const def = BASEMAP_DEFS.find(b => b.id === id);
    if (!def) return;

    currentBasemap = def.create();
    currentBasemapId = id;
    currentBasemap.addTo(map);
    currentBasemap.bringToBack();

    // Keep data layers on top
    enforceZOrder();
    buildBasemapUI();
}

function buildBasemapUI() {
    const $wrap = $('#basemap-list').empty();
    BASEMAP_DEFS.forEach(def => {
        const isActive = def.id === currentBasemapId;
        const liveBadge = def.live
            ? '<span class="basemap-badge-live">LIVE</span>'
            : '';
        const $btn = $(`
            <button class="basemap-btn ${isActive ? 'active' : ''}" data-id="${def.id}">
                <i class="fas ${def.icon} bm-icon"></i>
                <span class="bm-text">
                    <span class="bm-label">${def.label}${liveBadge}</span>
                    <span class="bm-sub">${def.sub}</span>
                </span>
                <i class="fas fa-check bm-check"></i>
            </button>
        `);
        $wrap.append($btn);
    });

    $wrap.off('click.bm').on('click.bm', '.basemap-btn', function () {
        selectBasemap($(this).data('id'));
    });
}

// selectBasemap() is called in the Boot section below,
// after leafletLayers is initialised.


/* ═══════════════════════════════════════════════════════════
   Data Layers
═══════════════════════════════════════════════════════════ */
const leafletLayers = {};  // id → TimedWMS instance

function initDataLayers() {
    const time = toWMTSTime(currentDate);
    LAYER_DEFS.forEach(def => {
        const lyr = new TimedWMS(def, time, {
            subdomains: ['a', 'b', 'c'],
            tileSize: 512,
            opacity: def.opacity,
            noWrap: true,
            bounds: [[-85.0511, -180], [85.0511, 180]],
            maxNativeZoom: 9,
            attribution: '&copy; <a href="https://earthdata.nasa.gov" target="_blank">NASA EOSDIS GIBS</a>',
        });
        if (def.visible) lyr.addTo(map);
        leafletLayers[def.id] = lyr;
    });
    enforceZOrder();
}

// Bring layers to front in reverse LAYER_DEFS order (index 0 is topmost)
function enforceZOrder() {
    [...LAYER_DEFS].reverse().forEach(def => {
        const lyr = leafletLayers[def.id];
        if (lyr && def.visible) {
            if (lyr.bringToFront) lyr.bringToFront();
        }
    });
}

function refreshAllTimes() {
    const time = toWMTSTime(currentDate);
    LAYER_DEFS.forEach(def => {
        if (leafletLayers[def.id]) {
            if (def.isWMS) {
                // If the WMS supports TIME parameter, update it
                leafletLayers[def.id].setParams({TIME: time}, false);
            } else if (leafletLayers[def.id].setTime) {
                leafletLayers[def.id].setTime(time);
            }
        }
    });
}

/* ═══════════════════════════════════════════════════════════
   Custom WMS Addition
═══════════════════════════════════════════════════════════ */
function loadWMSServices() {
    $('#wms-loader').show();
    $('#wms-list-container').find('.wms-entry').remove();

    $.getJSON(SCRIPT_NAME + '/api/wms/', function (data) {
        $('#wms-loader').hide();
        if (data.length === 0) {
            $('#wms-list-container').append('<div class="text-center py-2 wms-entry" style="font-size: 11px; color: var(--color-text-meta);">No services found.</div>');
            return;
        }
        data.forEach(s => {
            const upActive = s.user_vote === 'up' ? 'active-up' : '';
            const downActive = s.user_vote === 'down' ? 'active-down' : '';
            const $entry = $(`
                <div class="wms-entry" data-id="${s.id}" style="padding: 8px; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background 0.15s;">
                    <div style="font-size: 12px; font-weight: 600; color: var(--color-primary);">${s.label}</div>
                    <div style="font-size: 10px; color: var(--color-text-meta); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.url}</div>
                    <div style="font-size: 9px; color: var(--color-text-meta); opacity: 0.6; display: flex; justify-content: space-between; margin-top: 4px;">
                        <span><i class="fas fa-user me-1"></i>${s.creator}</span>
                        <span><i class="fas fa-calendar-alt me-1"></i>${s.created_at}</span>
                    </div>
                    <div class="wms-vote-bar">
                        <button class="wms-vote-btn ${upActive}" data-id="${s.id}" data-vote="up" title="Helpful">
                            <i class="fas fa-thumbs-up"></i>
                            <span class="vote-up-count">${s.thumbs_up}</span>
                        </button>
                        <button class="wms-vote-btn ${downActive}" data-id="${s.id}" data-vote="down" title="Not helpful">
                            <i class="fas fa-thumbs-down"></i>
                            <span class="vote-down-count">${s.thumbs_down}</span>
                        </button>
                    </div>
                </div>
            `);
            $entry.on('click', function (e) {
                if (!$(e.target).closest('.wms-vote-btn').length) {
                    selectExistingWMS(s);
                }
            });
            $entry.hover(
                function () {
                    $(this).css('background', 'rgba(1, 112, 185, 0.08)');
                },
                function () {
                    $(this).css('background', 'transparent');
                }
            );
            $entry.find('.wms-vote-btn').on('click', function (e) {
                e.stopPropagation();
                voteWMS($(this).data('id'), $(this).data('vote'), $(this).closest('.wms-entry'));
            });
            $('#wms-list-container').append($entry);
        });
    });
}

function selectExistingWMS(service) {
    $('#wms-url').val(service.url);
    $('#wms-layer').val(service.layers);
    $('#wms-label').val(service.label);
    $('#selected-wms-id').val(service.id);
}

function voteWMS(serviceId, vote, $entry) {
    fetch(SCRIPT_NAME + `/api/wms/${serviceId}/vote/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({vote})
    })
        .then(r => r.json())
        .then(data => {
            if (data.error) return;
            $entry.find('.vote-up-count').text(data.thumbs_up);
            $entry.find('.vote-down-count').text(data.thumbs_down);
            $entry.find('[data-vote="up"]').toggleClass('active-up', data.user_vote === 'up');
            $entry.find('[data-vote="down"]').toggleClass('active-down', data.user_vote === 'down');
        })
        .catch(err => console.error('Vote error:', err));
}

// Clear selected ID if user types in any input
$(document).on('input', '.wms-input', function () {
    $('#selected-wms-id').val('');
});

// Attach event to load WMS when modal is shown
$('#wmsModal').on('show.bs.modal', function () {
    loadWMSServices();
    $('#selected-wms-id').val(''); // Reset on open
});

function addWMSLayer() {
    const url = $('#wms-url').val().trim();
    const layerName = $('#wms-layer').val().trim();
    const label = $('#wms-label').val().trim() || layerName || 'New WMS Layer';
    const selectedId = $('#selected-wms-id').val();

    if (!url || !layerName) {
        alert('Please provide both URL and Layer Name.');
        return;
    }

    // If we have a selectedId, it means the user picked from the list and didn't change the inputs.
    // In this case, we skip the save call and just add to map.
    if (selectedId) {
        addWMSLayerToMap(url, layerName, label, selectedId);
        return;
    }

    const payload = {
        url: url,
        layers: layerName,
        label: label
    };

    fetch(SCRIPT_NAME + '/api/wms/save/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            addWMSLayerToMap(url, layerName, label, data.id);
        })
        .catch(error => {
            console.error('Error saving WMS:', error);
            alert('Failed to save WMS service, but adding to map anyway.');
            addWMSLayerToMap(url, layerName, label, Date.now(), true);
        });
}

function addWMSLayerToMap(url, layerName, label, id, isUnsaved = false) {
    const layerId = 'wms-' + id;
    const newDef = {
        id: layerId,
        url: url,
        layers: layerName,
        label: label,
        sublabel: isUnsaved ? 'Custom WMS Layer (Unsaved)' : 'Custom WMS Layer',
        color: isUnsaved ? '#ffc107' : '#0170B9',
        opacity: 0.85,
        visible: true,
        isWMS: true
    };

    // Insert at beginning of LAYER_DEFS so it appears at top
    LAYER_DEFS.unshift(newDef);

    const lyr = L.tileLayer.wms(url, {
        layers: layerName,
        format: 'image/png',
        transparent: true,
        opacity: newDef.opacity,
        attribution: 'Custom WMS',
        version: '1.1.1'
    });

    lyr.addTo(map);
    leafletLayers[layerId] = lyr;

    buildLayerUI();
    enforceZOrder();

    // Fetch TIME dimension from GetCapabilities and update the sublabel
    fetchWMSTimeDimension(url, layerName, newDef);

    $('#wmsModal').modal('hide');
    // Clear inputs
    $('#wms-url').val('');
    $('#wms-layer').val('');
    $('#wms-label').val('');
    $('#selected-wms-id').val('');
}

function fetchWMSTimeDimension(url, layerName, def) {
    const params = new URLSearchParams({url, layer: layerName});
    fetch(SCRIPT_NAME + '/api/wms/time/?' + params)
        .then(r => r.json())
        .then(data => {
            if (data.start || data.end || data.time_extent) {
                let rangeText = 'Custom WMS Layer';
                if (data.start && data.end) {
                    rangeText = `${data.start} – ${data.end}`;
                } else if (data.time_extent) {
                    rangeText = data.time_extent.length > 40
                        ? data.time_extent.slice(0, 40) + '…'
                        : data.time_extent;
                }
                def.sublabel = rangeText;
                def.timeExtent = data.time_extent || null;
                def.timeStart = data.start || null;
                def.timeEnd = data.end || null;
                buildLayerUI();
                recalcSliderRange();
            }
        })
        .catch(() => { /* silently ignore — sublabel stays as default */
        });
}

// Helper for CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Add a custom control for "Add WMS" on the map
const AddWMSControl = L.Control.extend({
    options: {
        position: 'topleft'
    },
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.backgroundColor = 'var(--color-surface)';
        container.style.width = '34px';
        container.style.height = '34px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.cursor = 'pointer';
        container.style.border = '1px solid var(--color-border)';
        container.title = 'Add WMS Layer';

        container.setAttribute('role', 'button');
        container.setAttribute('aria-label', 'Add WMS Layer');

        const icon = L.DomUtil.create('i', 'fas fa-plus-circle', container);
        icon.style.color = '#0170B9';           /* explicit hex — no CSS var */
        icon.style.backgroundColor = 'transparent';
        icon.style.fontSize = '16px';
        icon.setAttribute('aria-hidden', 'true');

        container.onclick = function (e) {
            L.DomEvent.stopPropagation(e);
            $('#wmsModal').modal('show');
        };
        L.DomEvent.disableClickPropagation(container);

        return container;
    }
});
map.addControl(new AddWMSControl());


/* ═══════════════════════════════════════════════════════════
   Layer Manager UI
═══════════════════════════════════════════════════════════ */
function buildLayerUI() {
    const $list = $('#layer-list').empty();

    LAYER_DEFS.forEach(def => {
        const pct = Math.round(def.opacity * 100);
        const eyeIcon = def.visible ? 'fa-eye' : 'fa-eye-slash';
        const hiddenCls = def.visible ? '' : 'layer-hidden';

        const timeRangeBadge = (def.timeStart || def.timeEnd)
            ? `<span class="layer-time-range"><i class="fas fa-clock" style="font-size:8px;margin-right:3px;"></i>${def.timeStart || '?'} – ${def.timeEnd || '?'}</span>`
            : '';

        const $li = $(`
            <li class="layer-item" data-id="${def.id}">
                <div class="layer-row1">
                    <span class="drag-handle" title="Drag to reorder" aria-hidden="true">
                        <i class="fas fa-grip-vertical" aria-hidden="true"></i>
                    </span>
                    <span class="layer-swatch" style="background:${def.color}; color: transparent;" role="presentation" aria-hidden="true"></span>
                    <span class="layer-label" id="layer-label-${def.id}">
                        ${def.label}
                        <small>${def.sublabel}</small>
                        ${timeRangeBadge}
                    </span>
                    <button class="vis-btn ${hiddenCls}" title="Toggle ${def.label} visibility"
                            aria-label="Toggle ${def.label} layer visibility"
                            aria-pressed="${def.visible}"
                            data-id="${def.id}">
                        <i class="fas ${eyeIcon}" aria-hidden="true"></i>
                    </button>
                    <button class="remove-btn" title="Remove ${def.label} layer"
                            aria-label="Remove ${def.label} layer"
                            data-id="${def.id}">
                        <i class="fas fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="layer-row2">
                    <i class="fas fa-circle-half-stroke opacity-icon" aria-hidden="true"></i>
                    <label for="opacity-${def.id}" class="sr-only">${def.label} layer opacity</label>
                    <input type="range" class="opacity-slider"
                           id="opacity-${def.id}"
                           min="0" max="100" value="${pct}"
                           data-id="${def.id}"
                           aria-label="${def.label} layer opacity"
                           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
                    <span class="opacity-pct" id="pct-${def.id}" aria-live="polite">${pct}%</span>
                </div>
            </li>
        `);
        $list.append($li);
    });

    // Delegated event – visibility toggle
    $list.off('click.vis').on('click.vis', '.vis-btn', function (e) {
        e.stopPropagation();
        toggleVisibility($(this).data('id'));
    });

    // Delegated event – remove layer
    $list.off('click.remove').on('click.remove', '.remove-btn', function (e) {
        e.stopPropagation();
        removeLayer($(this).data('id'));
    });

    // Delegated event – opacity slider
    $list.off('input.opacity').on('input.opacity', '.opacity-slider', function () {
        setOpacity($(this).data('id'), +this.value);
    });

    // jQuery UI Sortable
    if ($list.hasClass('ui-sortable')) $list.sortable('destroy');
    $list.sortable({
        handle: '.drag-handle',
        axis: 'y',
        placeholder: 'layer-item ui-sortable-placeholder',
        update() {
            syncLayerOrder();
        },
    });
}

function toggleLayerManager() {
    const $body = $('#lm-body');
    const $icon = $('#lm-collapse-btn i');
    const $btn = $('#lm-collapse-btn');
    if ($body.is(':visible')) {
        $body.slideUp(200);
        $icon.removeClass('fa-minus').addClass('fa-plus');
        $btn.attr('aria-expanded', 'false').attr('aria-label', 'Expand Layer Manager panel');
    } else {
        $body.slideDown(200);
        $icon.removeClass('fa-plus').addClass('fa-minus');
        $btn.attr('aria-expanded', 'true').attr('aria-label', 'Collapse Layer Manager panel');
    }
}

let basemapSectionCollapsed = false;

function toggleBasemapSection() {
    basemapSectionCollapsed = !basemapSectionCollapsed;
    const $chevron = $('#lm-basemap-chevron');
    const $header = $('#lm-basemap-header');
    if (basemapSectionCollapsed) {
        $('#basemap-list').slideUp(180);
        $chevron.addClass('collapsed');
        $header.attr('aria-expanded', 'false');
    } else {
        $('#basemap-list').slideDown(180);
        $chevron.removeClass('collapsed');
        $header.attr('aria-expanded', 'true');
    }
}

function removeLayer(id) {
    const idx = LAYER_DEFS.findIndex(d => d.id === id);
    if (idx === -1) return;
    const lyr = leafletLayers[id];
    if (lyr) {
        lyr.remove();
        delete leafletLayers[id];
    }
    LAYER_DEFS.splice(idx, 1);
    buildLayerUI();
    recalcSliderRange();
}

function toggleVisibility(id) {
    const def = LAYER_DEFS.find(d => d.id === id);
    if (!def) return;
    def.visible = !def.visible;
    const lyr = leafletLayers[id];
    if (def.visible) {
        lyr.addTo(map);
        enforceZOrder();
    } else {
        lyr.remove();
    }
    buildLayerUI();
}

function setOpacity(id, pct) {
    const def = LAYER_DEFS.find(d => d.id === id);
    if (!def) return;
    def.opacity = pct / 100;
    if (leafletLayers[id]) leafletLayers[id].setOpacity(def.opacity);
    $(`#pct-${id}`).text(`${pct}%`);
}

function syncLayerOrder() {
    const ordered = [];
    $('#layer-list .layer-item').each(function () {
        const id = $(this).data('id');
        const def = LAYER_DEFS.find(d => d.id === id);
        if (def) ordered.push(def);
    });
    LAYER_DEFS.length = 0;
    ordered.forEach(d => LAYER_DEFS.push(d));
    enforceZOrder();
}


/* ═══════════════════════════════════════════════════════════
   Timeline & Date Controls
═══════════════════════════════════════════════════════════ */
function applyDate(date) {
    currentDate = clampDate(date);
    const disp = toDisplayDate(currentDate);

    $('#current-date-display').text(disp);
    $('#header-date-badge').text(disp);
    $('#date-picker').val(disp);
    $('#timeline-slider').val(dateToSlider(currentDate));

    refreshAllTimes();
}

function stepDate(days) {
    const d = new Date(currentDate);
    d.setUTCDate(d.getUTCDate() + days);
    applyDate(d);
}

// Slider – update display on every tick, refresh tiles only on release
$('#timeline-slider').on('input', function () {
    const d = sliderToDate(+this.value);
    const disp = toDisplayDate(d);
    currentDate = clampDate(d);
    $('#current-date-display').text(disp);
    $('#header-date-badge').text(disp);
    $('#date-picker').val(disp);
});
$('#timeline-slider').on('change', function () {
    refreshAllTimes();
});

// Date picker
$('#date-picker').on('change', function () {
    if (!this.value) return;
    const [y, mo, d] = this.value.split('-').map(Number);
    applyDate(new Date(Date.UTC(y, mo - 1, d)));
});

// Speed selector restarts play if active
$('#speed-select').on('change', function () {
    if (playing) {
        stopPlay();
        startPlay();
    }
});


/* ═══════════════════════════════════════════════════════════
   Play / Pause Animation
═══════════════════════════════════════════════════════════ */
let playing = false;
let playTimer = null;

function togglePlay() {
    playing = !playing;
    const $btn = $('#play-btn');
    if (playing) {
        $btn.html('<i class="fas fa-pause" aria-hidden="true"></i>')
            .addClass('playing')
            .attr('aria-pressed', 'true')
            .attr('aria-label', 'Pause animation');
        startPlay();
    } else {
        $btn.html('<i class="fas fa-play" aria-hidden="true"></i>')
            .removeClass('playing')
            .attr('aria-pressed', 'false')
            .attr('aria-label', 'Play animation');
        stopPlay();
    }
}

function startPlay() {
    const speed = +$('#speed-select').val();
    playTimer = setInterval(() => {
        const d = new Date(currentDate);
        d.setUTCDate(d.getUTCDate() + 1);
        applyDate(d > RANGE_END ? new Date(RANGE_START) : d);
    }, speed);
}

function stopPlay() {
    clearInterval(playTimer);
    playTimer = null;
}


/* ═══════════════════════════════════════════════════════════
   Tile Loading Indicator
═══════════════════════════════════════════════════════════ */
let loadCount = 0;

map.on('tileloadstart', () => {
    loadCount++;
    if (loadCount === 1) $('#loading-badge').fadeIn(150);
});
map.on('tileload tileerror', () => {
    loadCount = Math.max(0, loadCount - 1);
    if (loadCount === 0) $('#loading-badge').fadeOut(400);
});


/* ═══════════════════════════════════════════════════════════
   Drawing Tools (Leaflet.draw)
═══════════════════════════════════════════════════════════ */
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
    position: 'topleft',
    draw: {
        polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
                color: '#0170B9',
                weight: 2,
                fillColor: '#0170B9',
                fillOpacity: 0.12,
                dashArray: '4 4',
            },
        },
        rectangle: {
            shapeOptions: {
                color: '#0170B9',
                weight: 2,
                fillColor: '#0170B9',
                fillOpacity: 0.12,
                dashArray: '4 4',
            },
        },
        circle: false,
        polyline: false,
        marker: false,
        circlemarker: false,
    },
    edit: {
        featureGroup: drawnItems,
        remove: true,
    },
});
map.addControl(drawControl);

// Track the last geometry for retry
let lastGeometry = null;

// When a shape is completed, clear previous, store geometry, trigger API
map.on(L.Draw.Event.CREATED, function (e) {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);

    const geojson = e.layer.toGeoJSON();
    lastGeometry = geojson.geometry;

    openClimateModal(lastGeometry);
});


/* ═══════════════════════════════════════════════════════════
   ClimateSERV API  –  Submit → Poll → Fetch
═══════════════════════════════════════════════════════════ */
const CS_BASE = 'https://climateserv.servirglobal.net/api';

// Fixed request parameters (swap geometry only)
const CS_PARAMS = {
    datatype: 0,
    ensemble: false,
    ensemble_data_source: '',
    begintime: '01/01/2020',
    endtime: '02/28/2020',
    intervaltype: 0,
    operationtype: 5,
    dateType_Category: 'default',
    isZip_CurrentDataType: false,
    is_from_ui: true,
};

let csModal = null;  // Bootstrap modal instance
let csActiveId = null;  // current job ID
let csAborted = false; // flag to stop polling on modal close

function openClimateModal(geometry) {
    csAborted = false;

    // Reset UI
    $('#cs-progress-section').show();
    $('#cs-error-section').hide();
    $('#cs-chart-section').hide();
    $('#cs-progress-bar').css('width', '0%');
    $('#cs-progress-pct').text('0%');
    $('#cs-status-text').text('Submitting data request\u2026');
    $('#cs-request-id').text('');

    if (!csModal) {
        csModal = new bootstrap.Modal(document.getElementById('climateModal'));
        // Stop polling if the modal is dismissed
        document.getElementById('climateModal').addEventListener('hidden.bs.modal', () => {
            csAborted = true;
        });
    }
    csModal.show();

    csSubmitRequest(geometry);
}

function csRetry() {
    if (lastGeometry) openClimateModal(lastGeometry);
}

// ── 1. Submit ──────────────────────────────────────────────
function csSubmitRequest(geometry) {
    $.ajax({
        url: `${CS_BASE}/submitDataRequest/`,
        method: 'GET',
        dataType: 'json',
        data: Object.assign({}, CS_PARAMS, {geometry: JSON.stringify(geometry)}),
    })
        .done(function (response) {
            if (csAborted) return;
            const id = Array.isArray(response) ? response[0] : response;
            csActiveId = id;
            $('#cs-status-text').text('Request queued. Awaiting processing\u2026');
            $('#cs-request-id').text(`ID: ${id}`);
            csPollProgress(id);
        })
        .fail(function (xhr) {
            csShowError('Submit failed: ' + (xhr.responseText || xhr.statusText || 'Network error'));
        });
}

// ── 2. Poll progress ───────────────────────────────────────
function csPollProgress(id) {
    if (csAborted) return;

    $.ajax({
        url: `${CS_BASE}/getDataRequestProgress/`,
        method: 'GET',
        dataType: 'json',
        data: {id},
    })
        .done(function (response) {
            if (csAborted) return;

            const raw = Array.isArray(response) ? response[0] : response;
            const progress = parseFloat(raw);

            if (isNaN(progress) || progress < 0) {
                csShowError('Processing failed on server (progress returned ' + raw + ').');
                return;
            }

            const pct = Math.min(100, Math.round(progress));
            $('#cs-progress-bar').css('width', pct + '%');
            $('#cs-progress-pct').text(pct + '%');
            $('#cs-status-text').text('Processing: ' + pct + '% complete\u2026');

            if (progress >= 100) {
                $('#cs-status-text').text('Fetching data\u2026');
                csFetchData(id);
            } else {
                setTimeout(() => csPollProgress(id), 2000);
            }
        })
        .fail(function (xhr) {
            if (csAborted) return;
            // Retry a few network hiccups silently
            setTimeout(() => csPollProgress(id), 3000);
        });
}

// ── 3. Fetch final data ────────────────────────────────────
function csFetchData(id) {
    $.ajax({
        url: `${CS_BASE}/getDataFromRequest/`,
        method: 'GET',
        dataType: 'json',
        data: {id},
    })
        .done(function (resultData) {
            if (csAborted) return;
            csProcessAndChart(resultData);
        })
        .fail(function (xhr) {
            csShowError('Data fetch failed: ' + (xhr.responseText || xhr.statusText || 'Network error'));
        });
}

// ── Error display ──────────────────────────────────────────
function csShowError(msg) {
    $('#cs-progress-section').hide();
    $('#cs-chart-section').hide();
    $('#cs-error-section').show();
    $('#cs-error-msg').text(msg);
}


/* ═══════════════════════════════════════════════════════════
   Data Processing & Chart.js Rendering
═══════════════════════════════════════════════════════════ */
let csChartInstance = null;

function csProcessAndChart(resultData) {
    const timeSeriesArray = resultData.data;
    const noDataValue = -9999;

    if (!timeSeriesArray || timeSeriesArray.length === 0) {
        csShowError('No data returned for the selected area and date range.');
        return;
    }

    const values = timeSeriesArray.map(item => {
        const val = parseFloat(item.value.avg);
        return val === noDataValue ? null : val;
    });

    const dates = timeSeriesArray.map(item => {
        const [m, d, y] = item.date.split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    });

    // ── Stats ──────────────────────────────────────────────
    const valid = values.filter(v => v !== null);
    const vMin = valid.length ? Math.min(...valid) : null;
    const vMax = valid.length ? Math.max(...valid) : null;
    const vMean = valid.length ? (valid.reduce((s, v) => s + v, 0) / valid.length) : null;
    const fmt = v => v !== null ? v.toFixed(4) : 'N/A';

    // ── Meta pills ─────────────────────────────────────────
    $('#cs-meta-bar').html(`
        <span class="cs-meta-pill">Period: <span>${CS_PARAMS.begintime} – ${CS_PARAMS.endtime}</span></span>
        <span class="cs-meta-pill">Data points: <span>${valid.length}</span></span>
        <span class="cs-meta-pill">Request ID: <span style="font-size:9px">${csActiveId}</span></span>
    `);

    // ── Stat cards ─────────────────────────────────────────
    $('#cs-stats-row').html(`
        <div class="cs-stat-card">
            <div class="cs-stat-label">Minimum</div>
            <div class="cs-stat-value">${fmt(vMin)}</div>
        </div>
        <div class="cs-stat-card">
            <div class="cs-stat-label">Mean</div>
            <div class="cs-stat-value">${fmt(vMean)}</div>
        </div>
        <div class="cs-stat-card">
            <div class="cs-stat-label">Maximum</div>
            <div class="cs-stat-value">${fmt(vMax)}</div>
        </div>
        <div class="cs-stat-card">
            <div class="cs-stat-label">Points</div>
            <div class="cs-stat-value">${valid.length}</div>
        </div>
    `);

    // ── Destroy old chart ──────────────────────────────────
    if (csChartInstance) {
        csChartInstance.destroy();
        csChartInstance = null;
    }

    // ── Draw Chart ─────────────────────────────────────────
    const ctx = document.getElementById('cs-chart-canvas').getContext('2d');

    csChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Avg Value',
                data: values,
                borderColor: '#0170B9',
                backgroundColor: 'rgba(1, 112, 185, 0.10)',
                borderWidth: 2,
                pointBackgroundColor: '#f64137',
                pointBorderColor: '#f64137',
                pointRadius: 4,
                pointHoverRadius: 7,
                tension: 0.35,
                fill: true,
                spanGaps: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {mode: 'index', intersect: false},
            plugins: {
                legend: {
                    labels: {color: '#3a3a3a', font: {size: 12}, boxWidth: 14},
                },
                tooltip: {
                    backgroundColor: '#ffffff',
                    borderColor: '#dddddd',
                    borderWidth: 1,
                    titleColor: '#0170B9',
                    bodyColor: '#3a3a3a',
                    padding: 10,
                    callbacks: {
                        label: ctx => {
                            const v = ctx.parsed.y;
                            return v === null ? ' No data' : ` ${v.toFixed(4)}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: '#58585b',
                        font: {size: 10},
                        maxRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 12,
                    },
                    grid: {color: 'rgba(221, 221, 221, 0.8)'},
                },
                y: {
                    ticks: {
                        color: '#58585b',
                        font: {size: 11},
                        callback: v => v.toFixed(3),
                    },
                    grid: {color: 'rgba(221, 221, 221, 0.8)'},
                    title: {
                        display: true,
                        text: 'Average Value',
                        color: '#58585b',
                        font: {size: 10},
                    },
                },
            },
        },
    });

    // ── Switch view ────────────────────────────────────────
    $('#cs-progress-section').hide();
    $('#cs-error-section').hide();
    $('#cs-chart-section').show();
}


/* ═══════════════════════════════════════════════════════════
   Accessibility helpers – timeline slider valuetext
═══════════════════════════════════════════════════════════ */
$('#timeline-slider').on('input change', function () {
    const d = sliderToDate(+this.value);
    $(this).attr('aria-valuetext', toDisplayDate(d));
});

/* ═══════════════════════════════════════════════════════════
   Accessibility helpers – Leaflet toolbar semantic roles
   (patched post-render because Leaflet owns the DOM)
═══════════════════════════════════════════════════════════ */
function patchLeafletA11y() {
    // Draw toolbars
    document.querySelectorAll('.leaflet-draw-toolbar').forEach(function (toolbar) {
        toolbar.setAttribute('role', 'group');
        toolbar.setAttribute('aria-label',
            toolbar.classList.contains('leaflet-draw-toolbar-top') ? 'Drawing tools' : 'Edit tools');
        toolbar.querySelectorAll('a').forEach(function (link) {
            if (!link.getAttribute('role')) link.setAttribute('role', 'button');
        });
    });
    // Zoom control
    var zoom = document.querySelector('.leaflet-control-zoom');
    if (zoom) {
        zoom.setAttribute('role', 'group');
        zoom.setAttribute('aria-label', 'Zoom controls');
    }
    // Attribution — use role="note" (contentinfo must be top-level)
    var attr = document.querySelector('.leaflet-control-attribution');
    if (attr) {
        attr.setAttribute('role', 'note');
        attr.setAttribute('aria-label', 'Map attribution');
    }
}

/* ═══════════════════════════════════════════════════════════
   Dynamic identifier height
   Keeps --identifier-h in sync with the actual rendered height
   of the usa-identifier footer so the map and timeline are
   always positioned correctly, even if the links wrap.
═══════════════════════════════════════════════════════════ */
function syncIdentifierHeight() {
    const el = document.querySelector('.usa-identifier');
    if (!el) return;
    const h = el.offsetHeight;
    if (h > 0) {
        document.documentElement.style.setProperty('--identifier-h', h + 'px');
        map.invalidateSize();
    }
}

/* ═══════════════════════════════════════════════════════════
   Boot
═══════════════════════════════════════════════════════════ */
initDataLayers();
buildLayerUI();
selectBasemap('bluemarble');   // safe here: leafletLayers is initialised above
applyDate(currentDate);

// Run after Leaflet has rendered its controls
setTimeout(patchLeafletA11y, 200);

// Sync identifier height once layout is stable, and on resize
setTimeout(syncIdentifierHeight, 100);
window.addEventListener('resize', syncIdentifierHeight);