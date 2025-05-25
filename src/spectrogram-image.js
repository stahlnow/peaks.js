import Konva from 'konva/lib/Core';

import 'konva/lib/shapes/Image';

function SpectrogramImage(options) {
  this._view = options.view;
  this._opacity = options.opacity;
  this.setImage();
}
SpectrogramImage.prototype.setImage = function() {
  this._data = this._view.getSpectrogramData();
  if (!this._data) {
    return;
  }
  this._image = new Konva.Image();
  this._view._spectrogramLayer.add(this._image);
  const data = this._data;
  const img = new window.Image();

  img.onload = () => {
    const { width, height } = img;
    const desiredWidth = this._view.getWidth();
    const desiredHeight = this._view.getHeight();
    const scaleX = desiredWidth / width;
    const scaleY = desiredHeight / height;
    const totalDuration = this._view._peaks.player.getDuration();
    let duration = Math.abs(this._view.getEndTime() - this._view.getStartTime());

    duration = Math.min(totalDuration, duration);
    const cropWidth = this._calculateWidthForDuration(duration);
    const cropX = data.crop.x + this._calculateWidthForDuration(this._view.getStartTime());
    const crop = {
      x: cropX,
      y: data.crop.y,
      width: cropWidth,
      height: data.crop.height
    };

    this._image.setAttrs({
      x: 0,
      y: 0,
      image: img,
      width,
      height,
      scaleX,
      scaleY,
      crop,
      opacity: 0,
      draggable: false
    });
    this._image.to({ opacity: this._opacity });
  };
  img.src = data.image;
};

SpectrogramImage.prototype.update = function(/* frameOffset */) {
  if (!this._data) {
    return;
  }
  const totalDuration = this._view._peaks.player.getDuration();
  let duration = Math.abs(this._view.getEndTime() - this._view.getStartTime());

  duration = Math.min(totalDuration, duration);
  const cropWidth = this._calculateWidthForDuration(duration);
  const cropX = this._data.crop.x + this._calculateWidthForDuration(this._view.getStartTime());
  const crop = {
    x: cropX,
    y: this._data.crop.y,
    width: cropWidth,
    height: this._data.crop.height
  };
  const desiredWidth = this._view.getWidth();
  const desiredHeight = this._view.getHeight();
  const scaleX = desiredWidth / this._image.width();
  const scaleY = desiredHeight / this._image.height();

  this._image.scale({ x: scaleX, y: scaleY });
  this._image.crop(crop);
};

SpectrogramImage.prototype._calculateWidthForDuration = function(duration) {
  const totalDuration = this._view._peaks.player.getDuration();
  const totalWidth = this._data.crop.width;

  return Math.floor(totalWidth / totalDuration * duration);
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
