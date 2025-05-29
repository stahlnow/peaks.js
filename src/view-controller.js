/**
 * @file
 *
 * Defines the {@link ViewController} class.
 *
 * @module view-controller
 */

import WaveformOverview from './waveform-overview';
import SpectrogramOverview from './spectrogram-overview';
import WaveformZoomView from './waveform-zoomview';
import SpectrogramZoomView from './spectrogram-zoomview';

import Scrollbar from './scrollbar';
import { isNullOrUndefined } from './utils';

/**
 * Creates an object that allows users to create and manage waveform views.
 *
 * @class
 * @alias ViewController
 *
 * @param {Peaks} peaks
 */

function ViewController(peaks) {
  this._peaks = peaks;
  this._overview = null;
  this._spectrogramOverview = null;
  this._zoomview = null;
  this._spectrogramZoomview = null;
  this._scrollbar = null;
}

ViewController.prototype.createOverview = function(container) {
  if (this._overview) {
    return this._overview;
  }

  const waveformData = this._peaks.getWaveformData();

  this._overview = new WaveformOverview(
    waveformData,
    container,
    this._peaks
  );

  if (this._zoomview) {
    this._overview.showHighlight(
      this._zoomview.getStartTime(),
      this._zoomview.getEndTime()
    );
  }

  return this._overview;
};

ViewController.prototype.createSpectrogramOverview = function(container) {
  if (this._spectrogramOverview) {
    return this._spectrogramOverview;
  }
  const waveformData = this._peaks.getWaveformData();
  const spectrogramData = this._peaks.getSpectrogramData();

  this._spectrogramOverview = new SpectrogramOverview(
    waveformData,
    spectrogramData,
    container,
    this._peaks
  );
  if (this._zoomview) {
    this._spectrogramOverview.showHighlight(
      this._zoomview.getStartTime(),
      this._zoomview.getEndTime()
    );
  }
  return this._spectrogramOverview;
};

ViewController.prototype.createZoomview = function(container) {
  if (this._zoomview) {
    return this._zoomview;
  }

  const waveformData = this._peaks.getWaveformData();

  this._zoomview = new WaveformZoomView(
    waveformData,
    container,
    this._peaks
  );

  if (this._scrollbar) {
    this._scrollbar.setZoomview(this._zoomview);
  }

  return this._zoomview;
};

ViewController.prototype.createSpectrogramZoomview = function(container) {
  if (this._spectrogramZoomview) {
    return this._spectrogramZoomview;
  }
  const waveformData = this._peaks.getWaveformData();
  const spectrogramData = this._peaks.getSpectrogramData();

  this._spectrogramZoomview = new SpectrogramZoomView(
    waveformData,
    spectrogramData,
    container,
    this._peaks
  );
  if (this._scrollbar) {
    this._scrollbar.setZoomview(this._spectrogramZoomview);
  }
  return this._spectrogramZoomview;
};

ViewController.prototype.createScrollbar = function(container) {
  this._scrollbar = new Scrollbar(
    container,
    this._peaks
  );

  return this._scrollbar;
};

ViewController.prototype.destroyOverview = function() {
  if (!this._overview) {
    return;
  }

  if (!this._zoomview) {
    return;
  }

  this._overview.destroy();
  this._overview = null;
};

ViewController.prototype.destroySpectrogramOverview = function() {
  if (!this._spectrogramOverview) {
    return;
  }
  this._spectrogramOverview.destroy();
  this._spectrogramOverview = null;
};

ViewController.prototype.destroyZoomview = function() {
  if (!this._zoomview) {
    return;
  }

  if (!this._overview) {
    return;
  }

  this._zoomview.destroy();
  this._zoomview = null;

  this._overview.removeHighlightRect();
};

ViewController.prototype.destroySpectrogramZoomview = function() {
  if (!this._spectrogramZoomview) {
    return;
  }
  if (!this._spectrogramOverview) {
    return;
  }
  this._spectrogramZoomview.destroy();
  this._spectrogramZoomview = null;
  this._spectrogramOverview.removeHighlightRect();
};

ViewController.prototype.destroy = function() {
  if (this._overview) {
    this._overview.destroy();
    this._overview = null;
  }

  if (this._spectrogramOverview) {
    this._spectrogramOverview.destroy();
    this._spectrogramOverview = null;
  }

  if (this._zoomview) {
    this._zoomview.destroy();
    this._zoomview = null;
  }

  if (this._spectrogramZoomview) {
    this._spectrogramZoomview.destroy();
    this._spectrogramZoomview = null;
  }

  if (this._scrollbar) {
    this._scrollbar.destroy();
    this._scrollbar = null;
  }
};

ViewController.prototype.getView = function(name) {
  if (isNullOrUndefined(name)) {
    if (this._overview && this._zoomview) {
      return null;
    }
    else if (this._overview) {
      return this._overview;
    }
    else if (this._spectrogramOverview) {
      return this._spectrogramOverview;
    }
    else if (this._zoomview) {
      return this._zoomview;
    }
    else if (this._spectrogramZoomview) {
      return this._spectrogramZoomview;
    }
    else {
      return null;
    }
  }
  else {
    switch (name) {
      case 'overview':
        return this._overview;

      case 'spectrogramOverview':
        return this._spectrogramOverview;

      case 'zoomview':
        return this._zoomview;

      case 'spectrogramZoomview':
        return this._spectrogramZoomview;

      default:
        return null;
    }
  }
};

ViewController.prototype.getScrollbar = function() {
  return this._scrollbar;
};

export default ViewController;
