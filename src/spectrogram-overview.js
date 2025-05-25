/**
 * @file
 *
 * Defines the {@link SpectrogramOverview} class.
 *
 * @module waveform-overview
 */

import HighlightLayer from './highlight-layer';
import SpectrogramView from './spectrogram-view';
import SeekMouseDragHandler from './seek-mouse-drag-handler';

/**
 * Creates the overview waveform view.
 *
 * @class
 * @alias SpectrogramOverview
 *
 * @param {WaveformData} waveformData
 * @param {HTMLElement} container
 * @param {Peaks} peaks
 */

function SpectrogramOverview(waveformData, spectrogramData, container, peaks) {
  const self = this;

  SpectrogramView.call(
    self, waveformData, spectrogramData, container, peaks, peaks.options.spectrogramOverview
  );

  // Bind event handlers
  self._onTimeUpdate = self._onTimeUpdate.bind(self);
  self._onPlaying = self._onPlaying.bind(self);
  self._onPause = self._onPause.bind(self);
  self._onZoomviewUpdate = self._onZoomviewUpdate.bind(self);

  // Register event handlers
  peaks.on('player.timeupdate', self._onTimeUpdate);
  peaks.on('player.playing', self._onPlaying);
  peaks.on('player.pause', self._onPause);
  peaks.on('zoomview.update', self._onZoomviewUpdate);

  const time = self._peaks.player.getCurrentTime();

  self._playheadLayer.updatePlayheadTime(time);

  self._mouseDragHandler = new SeekMouseDragHandler(peaks, self);

  const zoomview = peaks.views.getView('spectrogramZoomview');

  if (zoomview) {
    self._highlightLayer.showHighlight(zoomview.getStartTime(), zoomview.getEndTime());
  }
}

SpectrogramOverview.prototype = Object.create(SpectrogramView.prototype);

SpectrogramOverview.prototype.initWaveformData = function() {
  if (this._width !== 0) {
    this._resampleAndSetWaveformData(this._originalWaveformData, this._width);
  }
};

SpectrogramOverview.prototype.initHighlightLayer = function() {
  this._highlightLayer = new HighlightLayer(
    this,
    this._viewOptions
  );

  this._highlightLayer.addToStage(this._stage);
};

SpectrogramOverview.prototype.isSegmentDraggingEnabled = function() {
  return false;
};

SpectrogramOverview.prototype.getName = function() {
  return 'overview';
};

SpectrogramOverview.prototype._onTimeUpdate = function(time) {
  this._playheadLayer.updatePlayheadTime(time);
};

SpectrogramOverview.prototype._onPlaying = function(time) {
  this._playheadLayer.updatePlayheadTime(time);
};

SpectrogramOverview.prototype._onPause = function(time) {
  this._playheadLayer.stop(time);
};

SpectrogramOverview.prototype._onZoomviewUpdate = function(event) {
  this.showHighlight(event.startTime, event.endTime);
};

SpectrogramOverview.prototype.showHighlight = function(startTime, endTime) {
  this._highlightLayer.showHighlight(startTime, endTime);
};

SpectrogramOverview.prototype.setWaveformData = function(waveformData) {
  this._originalWaveformData = waveformData;

  if (this._width !== 0) {
    this._resampleAndSetWaveformData(waveformData, this._width);
  }
  else {
    this._data = waveformData;
  }

  this.updateWaveform();
};

SpectrogramOverview.prototype._resampleAndSetWaveformData = function(waveformData, width) {
  try {
    this._data = waveformData.resample({ width: width });
    return true;
  }
  catch (error) { // eslint-disable-line no-unused-vars
    // This error usually indicates that the waveform length
    // is less than the container width. Ignore, and use the
    // given waveform data
    this._data = waveformData;
    return false;
  }
};

SpectrogramOverview.prototype.removeHighlightRect = function() {
  this._highlightLayer.removeHighlight();
};

SpectrogramOverview.prototype.updateWaveform = function(/* frameOffset, forceUpdate */) {
  this._waveformLayer.draw();
  this._axisLayer.draw();

  const playheadTime = this._peaks.player.getCurrentTime();

  this._playheadLayer.updatePlayheadTime(playheadTime);

  this._highlightLayer.updateHighlight();

  const frameStartTime = 0;
  const frameEndTime   = this.pixelsToTime(this._width);

  if (this._pointsLayer) {
    this._pointsLayer.updatePoints(frameStartTime, frameEndTime);
  }

  if (this._segmentsLayer) {
    this._segmentsLayer.updateSegments(frameStartTime, frameEndTime);
  }
};

SpectrogramOverview.prototype.containerWidthChange = function() {
  const result = this._resampleAndSetWaveformData(this._originalWaveformData, this._width);

  this._spectrogramImage.update();
  return result;
};

SpectrogramOverview.prototype.containerHeightChange = function() {
  this._spectrogramImage.update();
  this._highlightLayer.fitToView();
};

SpectrogramOverview.prototype.destroy = function() {
  // Unregister event handlers
  this._peaks.off('player.playing', this._onPlaying);
  this._peaks.off('player.pause', this._onPause);
  this._peaks.off('player.timeupdate', this._onTimeUpdate);
  this._peaks.off('zoomview.update', this._onZoomviewUpdate);

  this._mouseDragHandler.destroy();

  SpectrogramView.prototype.destroy.call(this);
};

export default SpectrogramOverview;
