/**
 * @file
 *
 * Defines the {@link Peaks} class.
 *
 * @module main
 */

import EventEmitter from 'eventemitter3';
import CueEmitter from './cue-emitter';
import WaveformPoints from './waveform-points';
import WaveformSegments from './waveform-segments';
import KeyboardHandler from './keyboard-handler';
import MediaElementPlayer from './mediaelement-player';
import Player from './player';
import { createPointMarker, createSegmentMarker, createSegmentLabel } from './marker-factories';
import ViewController from './view-controller';
import ZoomController from './zoom-controller';
import WaveformBuilder from './waveform-builder';
import {
  isHTMLElement, isFunction, isInAscendingOrder, isObject,
  objectHasProperty,
  extend
} from './utils';

/**
 * Initialises a new Peaks instance with default option settings.
 *
 * @class
 * @alias Peaks
 *
 * @param {Object} opts Configuration options
 */

function Peaks() {
  EventEmitter.call(this);

  // Set default options
  this.options = {
    zoomLevels:          [512, 1024, 2048, 4096],
    waveformCache:       true,

    mediaElement:        null,
    mediaUrl:            null,

    dataUri:             null,
    withCredentials:     false,

    waveformData:        null,
    spectrogramData:     { image: '', crop: {} },
    webAudio:            null,

    nudgeIncrement:      1.0,

    pointMarkerColor:    '#39cccc',

    createSegmentMarker: createSegmentMarker,
    createSegmentLabel:  createSegmentLabel,
    createPointMarker:   createPointMarker,

    // eslint-disable-next-line no-console
    logger:              console.error.bind(console)
  };

  return this;
}

Peaks.prototype = Object.create(EventEmitter.prototype);

const defaultViewOptions = {
  playheadColor:           '#111111',
  playheadTextColor:       '#aaaaaa',
  playheadBackgroundColor: 'transparent',
  playheadPadding:         2,
  playheadWidth:           1,
  axisGridlineColor:       '#cccccc',
  showAxisLabels:          true,
  axisTopMarkerHeight:     10,
  axisBottomMarkerHeight:  10,
  axisLabelColor:          '#aaaaaa',
  fontFamily:              'sans-serif',
  fontSize:                11,
  fontStyle:               'normal',
  timeLabelPrecision:      2,
  enablePoints:            true,
  enableSegments:          true
};

const defaultZoomviewOptions = {
  // showPlayheadTime:    true,
  playheadClickTolerance: 3,
  waveformColor:          'rgba(0, 225, 128, 1)',
  wheelMode:              'none',
  autoScroll:             true,
  autoScrollOffset:       100,
  enableEditing:          true
};

const defaultSpectrogramZoomviewOptions = {
  playheadClickTolerance: 3,
  waveformColor: 'rgba(0, 225, 128, 1)',
  wheelMode: 'none',
  autoScroll: true,
  autoScrollOffset: 100,
  spectrogramOpacity: 1,
  showSpectrogram: true,
  showWaveform: false
};

const defaultOverviewOptions = {
  // showPlayheadTime:    false,
  waveformColor:          'rgba(0, 0, 0, 0.2)',
  highlightColor:         '#aaaaaa',
  highlightStrokeColor:   'transparent',
  highlightOpacity:       0.3,
  highlightOffset:        11,
  highlightCornerRadius:  2,
  enableEditing:          false
};

const defaultSpectrogramOverviewOptions = {
  waveformColor: 'rgba(0, 0, 0, 0.2)',
  highlightColor: '#aaaaaa',
  highlightStrokeColor: 'transparent',
  highlightOpacity: 0.3,
  highlightOffset: 11,
  highlightCornerRadius: 2,
  enableEditing:          false,
  spectrogramOpacity: 1,
  showSpectrogram: true,
  showWaveform: false
};

const defaultSegmentOptions = {
  overlay:                   false,
  markers:                   true,
  startMarkerColor:          '#aaaaaa',
  endMarkerColor:            '#aaaaaa',
  waveformColor:             '#0074d9',
  overlayColor:              '#ff0000',
  overlayOpacity:            0.3,
  overlayBorderColor:        '#ff0000',
  overlayBorderWidth:        2,
  overlayCornerRadius:       5,
  overlayOffset:             25,
  overlayLabelAlign:         'left',
  overlayLabelVerticalAlign: 'top',
  overlayLabelPadding:       8,
  overlayLabelColor:         '#000000',
  overlayFontFamily:         'sans-serif',
  overlayFontSize:           12,
  overlayFontStyle:          'normal'
};

const defaultScrollbarOptions = {
  color: '#888888',
  minWidth: 50
};

function getOverviewOptions(opts) {
  const overviewOptions = {};

  if (opts.overview && opts.overview.showPlayheadTime) {
    overviewOptions.showPlayheadTime = opts.overview.showPlayheadTime;
  }

  const optNames = [
    'container',
    'waveformColor',
    'playedWaveformColor',
    'playheadColor',
    'playheadTextColor',
    'playheadBackgroundColor',
    'playheadPadding',
    'playheadWidth',
    'formatPlayheadTime',
    'timeLabelPrecision',
    'axisGridlineColor',
    'showAxisLabels',
    'axisTopMarkerHeight',
    'axisBottomMarkerHeight',
    'axisLabelColor',
    'formatAxisTime',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'highlightColor',
    'highlightStrokeColor',
    'highlightOpacity',
    'highlightCornerRadius',
    'highlightOffset',
    'enablePoints',
    'enableSegments',
    'enableEditing'
  ];

  optNames.forEach(function(optName) {
    if (opts.overview && objectHasProperty(opts.overview, optName)) {
      overviewOptions[optName] = opts.overview[optName];
    }
    else if (objectHasProperty(opts, optName)) {
      overviewOptions[optName] = opts[optName];
    }
    else if (!objectHasProperty(overviewOptions, optName)) {
      if (objectHasProperty(defaultOverviewOptions, optName)) {
        overviewOptions[optName] = defaultOverviewOptions[optName];
      }
      else if (objectHasProperty(defaultViewOptions, optName)) {
        overviewOptions[optName] = defaultViewOptions[optName];
      }
    }
  });

  return overviewOptions;
}

function getSpectrogramOverviewOptions(opts) {
  const spectrogramOverviewOptions = {};

  if (opts.spectrogramOverview && opts.spectrogramOverview.showPlayheadTime) {
    spectrogramOverviewOptions.showPlayheadTime = opts.spectrogramOverview.showPlayheadTime;
  }
  const optNames = [
    'container',
    'waveformColor',
    'playedWaveformColor',
    'playheadColor',
    'playheadTextColor',
    'playheadBackgroundColor',
    'playheadPadding',
    'playheadWidth',
    'formatPlayheadTime',
    'timeLabelPrecision',
    'axisGridlineColor',
    'showAxisLabels',
    'axisTopMarkerHeight',
    'axisBottomMarkerHeight',
    'axisLabelColor',
    'formatAxisTime',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'highlightColor',
    'highlightStrokeColor',
    'highlightOpacity',
    'highlightCornerRadius',
    'highlightOffset',
    'enablePoints',
    'enableSegments',
    'enableEditing',
    'spectrogramOpacity',
    'showSpectrogram',
    'showWaveform'
  ];

  optNames.forEach(function(optName) {
    if (opts.spectrogramOverview && objectHasProperty(opts.spectrogramOverview, optName)) {
      spectrogramOverviewOptions[optName] = opts.spectrogramOverview[optName];
    }
    else if (objectHasProperty(opts, optName)) {
      spectrogramOverviewOptions[optName] = opts[optName];
    }
    else if (!objectHasProperty(spectrogramOverviewOptions, optName)) {
      if (objectHasProperty(defaultSpectrogramOverviewOptions, optName)) {
        spectrogramOverviewOptions[optName] = defaultSpectrogramOverviewOptions[optName];
      }
      else if (objectHasProperty(defaultViewOptions, optName)) {
        spectrogramOverviewOptions[optName] = defaultViewOptions[optName];
      }
    }
  });
  return spectrogramOverviewOptions;
}

function getZoomviewOptions(opts) {
  const zoomviewOptions = {};

  if (opts.showPlayheadTime) {
    zoomviewOptions.showPlayheadTime = opts.showPlayheadTime;
  }
  else if (opts.zoomview && opts.zoomview.showPlayheadTime) {
    zoomviewOptions.showPlayheadTime = opts.zoomview.showPlayheadTime;
  }

  const optNames = [
    'container',
    'waveformColor',
    'playedWaveformColor',
    'playheadColor',
    'playheadTextColor',
    'playheadBackgroundColor',
    'playheadPadding',
    'playheadWidth',
    'formatPlayheadTime',
    'playheadClickTolerance',
    'timeLabelPrecision',
    'axisGridlineColor',
    'showAxisLabels',
    'axisTopMarkerHeight',
    'axisBottomMarkerHeight',
    'axisLabelColor',
    'formatAxisTime',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'wheelMode',
    'autoScroll',
    'autoScrollOffset',
    'enablePoints',
    'enableSegments',
    'enableEditing'
  ];

  optNames.forEach(function(optName) {
    if (opts.zoomview && objectHasProperty(opts.zoomview, optName)) {
      zoomviewOptions[optName] = opts.zoomview[optName];
    }
    else if (objectHasProperty(opts, optName)) {
      zoomviewOptions[optName] = opts[optName];
    }
    else if (!objectHasProperty(zoomviewOptions, optName)) {
      if (objectHasProperty(defaultZoomviewOptions, optName)) {
        zoomviewOptions[optName] = defaultZoomviewOptions[optName];
      }
      else if (objectHasProperty(defaultViewOptions, optName)) {
        zoomviewOptions[optName] = defaultViewOptions[optName];
      }
    }
  });

  return zoomviewOptions;
}

function getSpectrogramZoomviewOptions(opts) {
  const spectrogramZoomviewOptions = {};

  if (opts.showPlayheadTime) {
    spectrogramZoomviewOptions.showPlayheadTime = opts.showPlayheadTime;
  }
  else if (opts.spectrogramZoomview && opts.spectrogramZoomview.showPlayheadTime) {
    spectrogramZoomviewOptions.showPlayheadTime = opts.spectrogramZoomview.showPlayheadTime;
  }
  const optNames = [
    'container',
    'waveformColor',
    'playedWaveformColor',
    'playheadColor',
    'playheadTextColor',
    'playheadBackgroundColor',
    'playheadPadding',
    'playheadWidth',
    'formatPlayheadTime',
    'playheadClickTolerance',
    'timeLabelPrecision',
    'axisGridlineColor',
    'showAxisLabels',
    'axisTopMarkerHeight',
    'axisBottomMarkerHeight',
    'axisLabelColor',
    'formatAxisTime',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'wheelMode',
    'autoScroll',
    'autoScrollOffset',
    'enablePoints',
    'enableSegments',
    'enableEditing',
    'showSpectrogram',
    'showWaveform',
    'spectrogramOpacity'
  ];

  optNames.forEach(function(optName) {
    if (opts.spectrogramZoomview && objectHasProperty(opts.spectrogramZoomview, optName)) {
      spectrogramZoomviewOptions[optName] = opts.spectrogramZoomview[optName];
    }
    else if (objectHasProperty(opts, optName)) {
      spectrogramZoomviewOptions[optName] = opts[optName];
    }
    else if (!objectHasProperty(spectrogramZoomviewOptions, optName)) {
      if (objectHasProperty(defaultSpectrogramZoomviewOptions, optName)) {
        spectrogramZoomviewOptions[optName] = defaultSpectrogramZoomviewOptions[optName];
      }
      else if (objectHasProperty(defaultViewOptions, optName)) {
        spectrogramZoomviewOptions[optName] = defaultViewOptions[optName];
      }
    }
  });
  return spectrogramZoomviewOptions;
}

function getScrollbarOptions(opts) {
  if (!objectHasProperty(opts, 'scrollbar')) {
    return null;
  }

  const scrollbarOptions = {};

  const optNames = [
    'container',
    'color',
    'minWidth'
  ];

  optNames.forEach(function(optName) {
    if (objectHasProperty(opts.scrollbar, optName)) {
      scrollbarOptions[optName] = opts.scrollbar[optName];
    }
    else {
      scrollbarOptions[optName] = defaultScrollbarOptions[optName];
    }
  });

  return scrollbarOptions;
}

function extendOptions(to, from) {
  for (const key in from) {
    if (objectHasProperty(from, key) &&
        objectHasProperty(to, key)) {
      to[key] = from[key];
    }
  }

  return to;
}

function addSegmentOptions(options, opts) {
  options.segmentOptions = {};

  extend(options.segmentOptions, defaultSegmentOptions);

  if (opts.segmentOptions) {
    extendOptions(options.segmentOptions, opts.segmentOptions);
  }

  options.zoomview.segmentOptions = {};
  extend(options.zoomview.segmentOptions, options.segmentOptions);

  if (opts.zoomview && opts.zoomview.segmentOptions) {
    extendOptions(options.zoomview.segmentOptions, opts.zoomview.segmentOptions);
  }

  options.overview.segmentOptions = {};
  extend(options.overview.segmentOptions, options.segmentOptions);

  if (opts.overview && opts.overview.segmentOptions) {
    extendOptions(options.overview.segmentOptions, opts.overview.segmentOptions);
  }

  options.spectrogramOverview.segmentOptions = {};
  extend(options.spectrogramOverview.segmentOptions, options.segmentOptions);

  if (opts.spectrogramOverview && opts.spectrogramOverview.segmentOptions) {
    extendOptions(
      options.spectrogramOverview.segmentOptions,
      opts.spectrogramOverview.segmentOptions
    );
  }

  options.spectrogramZoomview.segmentOptions = {};
  extend(options.spectrogramZoomview.segmentOptions, options.segmentOptions);

  if (opts.spectrogramZoomview && opts.spectrogramZoomview.segmentOptions) {
    extendOptions(
      options.spectrogramZoomview.segmentOptions,
      opts.spectrogramZoomview.segmentOptions
    );
  }
}

function checkContainerElements(options) {
  const zoomviewContainer = options.zoomview.container;
  const spectrogramZoomviewContainer = options.spectrogramZoomview.container;
  const overviewContainer = options.overview.container;
  const spectrogramOverviewContainer = options.spectrogramOverview.container;

  if ((!isHTMLElement(zoomviewContainer) &&
      !isHTMLElement(overviewContainer)) &&
      (!isHTMLElement(spectrogramZoomviewContainer) &&
      !isHTMLElement(spectrogramOverviewContainer))
  ) {
    // eslint-disable-next-line @stylistic/js/max-len
    return new TypeError('Peaks.init(): The zoomview and/or overview container options must be valid HTML elements');
  }

  if (zoomviewContainer &&
      (zoomviewContainer.clientWidth  <= 0 ||
       zoomviewContainer.clientHeight <= 0)) {
    // eslint-disable-next-line @stylistic/js/max-len
    return new Error('Peaks.init(): The zoomview container must be visible and have non-zero width and height');
  }

  if (overviewContainer &&
      (overviewContainer.clientWidth  <= 0 ||
       overviewContainer.clientHeight <= 0)) {
    // eslint-disable-next-line @stylistic/js/max-len
    return new Error('Peaks.init(): The overview container must be visible and have non-zero width and height');
  }

  if (spectrogramZoomviewContainer &&
      (spectrogramZoomviewContainer.clientWidth  <= 0 ||
       spectrogramZoomviewContainer.clientHeight <= 0)) {
    // eslint-disable-next-line @stylistic/js/max-len
    return new Error('Peaks.init(): The spectrogram zoomview container must be visible and have non-zero width and height');
  }

  if (spectrogramOverviewContainer &&
      (spectrogramOverviewContainer.clientWidth  <= 0 ||
       spectrogramOverviewContainer.clientHeight <= 0)) {
    // eslint-disable-next-line @stylistic/js/max-len
    return new Error('Peaks.init(): The spectrogram overview container must be visible and have non-zero width and height');
  }
}

/**
 * Creates and initialises a new Peaks instance with the given options.
 *
 * @param {Object} opts Configuration options
 * @param {Function} callback
 *
 * @return {Peaks}
 */

Peaks.init = function(opts, callback) {
  if (!callback) {
    throw new Error('Peaks.init(): Missing callback function');
  }

  const instance = new Peaks();

  let err = instance._setOptions(opts);

  if (!err) {
    err = checkContainerElements(instance.options);
  }

  if (err) {
    callback(err);
    return;
  }

  let scrollbarContainer = null;

  if (instance.options.scrollbar) {
    scrollbarContainer = instance.options.scrollbar.container;

    if (!isHTMLElement(scrollbarContainer)) {
    // eslint-disable-next-line @stylistic/js/max-len
      callback(new TypeError('Peaks.init(): The scrollbar container option must be a valid HTML element'));
      return;
    }

    if (scrollbarContainer.clientWidth <= 0) {
    // eslint-disable-next-line @stylistic/js/max-len
      callback(new TypeError('Peaks.init(): The scrollbar container must be visible and have non-zero width'));
      return;
    }
  }

  if (opts.keyboard) {
    instance._keyboardHandler = new KeyboardHandler(instance);
  }

  const player = opts.player ?
    opts.player :
    new MediaElementPlayer(instance.options.mediaElement);

  instance.player = new Player(instance, player);
  instance.segments = new WaveformSegments(instance);
  instance.points = new WaveformPoints(instance);
  instance.zoom = new ZoomController(instance, instance.options.zoomLevels);
  instance.views = new ViewController(instance);

  // Setup the UI components
  instance._waveformBuilder = new WaveformBuilder(instance);

  instance.player.init(instance)
    .then(function() {
      instance._waveformBuilder.init(instance.options, function(err, waveformData) {
        if (err) {
          callback(err);
          return;
        }

        err = checkContainerElements(instance.options);

        if (err) {
          callback(err);
          return;
        }

        instance._waveformBuilder = null;
        instance._waveformData = waveformData;
        instance._spectrogramData = instance.options.spectrogramData;

        const zoomviewContainer = instance.options.zoomview.container;
        const spectrogramZoomviewContainer = instance.options.spectrogramZoomview.container;
        const overviewContainer = instance.options.overview.container;
        const spectrogramOverviewContainer = instance.options.spectrogramOverview.container;

        if (zoomviewContainer) {
          instance.views.createZoomview(zoomviewContainer);
        }

        if (spectrogramZoomviewContainer) {
          instance.views.createSpectrogramZoomview(spectrogramZoomviewContainer);
        }

        if (overviewContainer) {
          instance.views.createOverview(overviewContainer);
        }

        if (spectrogramOverviewContainer) {
          instance.views.createSpectrogramOverview(spectrogramOverviewContainer);
        }

        if (scrollbarContainer) {
          instance.views.createScrollbar(scrollbarContainer);
        }

        if (opts.segments) {
          instance.segments.add(opts.segments);
        }

        if (opts.points) {
          instance.points.add(opts.points);
        }

        if (opts.emitCueEvents) {
          instance._cueEmitter = new CueEmitter(instance);
        }

        callback(null, instance);
      });
    })
    .catch(function(err) {
      callback(err);
    });
};

Peaks.prototype._setOptions = function(opts) {
  if (!isObject(opts)) {
    return new TypeError('Peaks.init(): The options parameter should be an object');
  }

  if (!opts.player) {
    if (!opts.mediaElement) {
      return new Error('Peaks.init(): Missing mediaElement option');
    }

    if (!(opts.mediaElement instanceof HTMLMediaElement)) {
      return new TypeError('Peaks.init(): The mediaElement option should be an HTMLMediaElement');
    }
  }

  if (opts.logger && !isFunction(opts.logger)) {
    return new TypeError('Peaks.init(): The logger option should be a function');
  }

  if (opts.segments && !Array.isArray(opts.segments)) {
    return new TypeError('Peaks.init(): options.segments must be an array of segment objects');
  }

  if (opts.points && !Array.isArray(opts.points)) {
    return new TypeError('Peaks.init(): options.points must be an array of point objects');
  }

  extendOptions(this.options, opts);

  this.options.overview = getOverviewOptions(opts);
  this.options.spectrogramOverview = getSpectrogramOverviewOptions(opts);
  this.options.zoomview = getZoomviewOptions(opts);
  this.options.spectrogramZoomview = getSpectrogramZoomviewOptions(opts);
  this.options.scrollbar = getScrollbarOptions(opts);

  addSegmentOptions(this.options, opts);

  if (!Array.isArray(this.options.zoomLevels)) {
    return new TypeError('Peaks.init(): The zoomLevels option should be an array');
  }
  else if (this.options.zoomLevels.length === 0) {
    return new Error('Peaks.init(): The zoomLevels array must not be empty');
  }
  else {
    if (!isInAscendingOrder(this.options.zoomLevels)) {
      return new Error('Peaks.init(): The zoomLevels array must be sorted in ascending order');
    }
  }

  this._logger = this.options.logger;
};

/**
 * Remote waveform data options for [Peaks.setSource]{@link Peaks#setSource}.
 *
 * @typedef {Object} RemoteWaveformDataOptions
 * @global
 * @property {String=} arraybuffer
 * @property {String=} json
 */

/**
 * Local waveform data options for [Peaks.setSource]{@link Peaks#setSource}.
 *
 * @typedef {Object} LocalWaveformDataOptions
 * @global
 * @property {ArrayBuffer=} arraybuffer
 * @property {Object=} json
 */

/**
 * Web Audio options for [Peaks.setSource]{@link Peaks#setSource}.
 *
 * @typedef {Object} WebAudioOptions
 * @global
 * @property {AudioContext=} audioContext
 * @property {AudioBuffer=} audioBuffer
 * @property {Number=} scale
 * @property {Boolean=} multiChannel
 */

/**
 * Options for [Peaks.setSource]{@link Peaks#setSource}.
 *
 * @typedef {Object} PeaksSetSourceOptions
 * @global
 * @property {String=} mediaUrl
 * @property {RemoteWaveformDataOptions=} dataUri
 * @property {LocalWaveformDataOptions=} waveformData
 * @property {WebAudioOptions=} webAudio
 * @property {Boolean=} withCredentials
 * @property {Array<Number>=} zoomLevels
 */

/**
 * Changes the audio or video media source associated with the {@link Peaks}
 * instance.
 *
 * @see SetSourceHandler
 *
 * @param {PeaksSetSourceOptions} options
 * @param {Function} callback
 */

Peaks.prototype.setSource = function(options, callback) {
  const self = this;

  self.player._setSource(options)
    .then(function() {
      if (!options.zoomLevels) {
        options.zoomLevels = self.options.zoomLevels;
      }

      self._waveformBuilder = new WaveformBuilder(self);

      self._waveformBuilder.init(options, function(err, waveformData) {
        if (err) {
          callback(err);
          return;
        }

        self._waveformBuilder = null;
        self._waveformData = waveformData;

        ['overview', 'zoomview'].forEach(function(viewName) {
          const view = self.views.getView(viewName);

          if (view) {
            view.setWaveformData(waveformData);
          }
        });

        ['spectrogramOverview', 'spectrogramZoomview'].forEach(function(viewName) {
          const view = self.views.getView(viewName);

          if (view) {
            view.setSpectrogramData(options.spectrogramData);
          }
        });

        self.zoom.setZoomLevels(options.zoomLevels);

        callback();
      });
    })
    .catch(function(err) {
      callback(err);
    });
};

Peaks.prototype.getWaveformData = function() {
  return this._waveformData;
};

Peaks.prototype.getSpectrogramData = function() {
  return this._spectrogramData;
};

/**
 * Cleans up a Peaks instance after use.
 */

Peaks.prototype.destroy = function() {
  if (this._waveformBuilder) {
    this._waveformBuilder.abort();
  }

  if (this._keyboardHandler) {
    this._keyboardHandler.destroy();
  }

  if (this.views) {
    this.views.destroy();
  }

  if (this.player) {
    this.player.destroy();
  }

  if (this._cueEmitter) {
    this._cueEmitter.destroy();
  }
};

export default Peaks;
