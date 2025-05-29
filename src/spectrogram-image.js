import Konva from 'konva/lib/Core';

import 'konva/lib/shapes/Image';

function SpectrogramImage(opacity, view) {
  const self = this;

  self._view = view;
  self._opacity = opacity;

  self.setImage();
}
SpectrogramImage.prototype.setImage = function() {
  this._data = this._view.getSpectrogramData();
  if (!this._data) {
    return;
  }

  this._image = new Konva.Image();
  this._view._spectrogramLayer.add(this._image);
  const img = new window.Image();

  img.onload = () => {
    const width = this._view.getWidth();
    const height = this._view.getHeight();

    this._image.setAttrs({
      image: img,
      width,
      height,
      crop: this._data.crop,
      opacity: 0,
      draggable: false
    });

    this.update(0);
    this._image.to({ opacity: this._opacity });
  };
  img.src = this._data.image;
};

SpectrogramImage.prototype.update = function(frameOffset) {
  if (this._view.getName() !== 'spectrogramZoomview') {
    return;
  }
  const totalDuration = this._view._peaks.player.getDuration();
  const duration = Math.min(
    totalDuration,
    Math.abs(this._view.getEndTime() - this._view.getStartTime())
  );

  const totalWidth = this._data.crop.width;
  const width = totalWidth / totalDuration * duration;

  const timeOffset = this._view.pixelsToTime(frameOffset);
  const offset = totalWidth / totalDuration * timeOffset;
  const x = this._data.crop.x + offset;

  this._image.crop({
    x: x,
    y: this._data.crop.y,
    width: width,
    height: this._data.crop.height
  });
};

SpectrogramImage.prototype.fitToView = function() {
};

SpectrogramImage.prototype.setOpacity = function(opacity) {
  this._opacity = opacity;
  this._image.to({ opacity });
};

SpectrogramImage.prototype.destroy = function() {
  this._image.destroy();
  this._image = null;
};

SpectrogramImage.prototype.on = function(event, handler) {
  this._image.on(event, handler);
};

SpectrogramImage.prototype.off = function(event, handler) {
  this._image.off(event, handler);
};

export default SpectrogramImage;
