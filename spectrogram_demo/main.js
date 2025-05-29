import Peaks from '../src/main.js';

const options = {
  spectrogramZoomview: {
    container: document.getElementById('spectrogram-zoomview-container'),
    showWaveform: true,
    waveformColor: 'rgb(187, 255, 187)',
    playheadColor: '#fff',
    playheadTextColor: '#fff',
    axisGridlineColor: '#fff',
    axisLabelColor: '#fff'
  },
  spectrogramOverview: {
    container: document.getElementById('spectrogram-overview-container'),
    showWaveform: true,
    waveformColor: 'rgb(187, 255, 187)',
    playheadColor: '#fff',
    playheadTextColor: '#fff',
    axisGridlineColor: '#fff',
    axisLabelColor: '#fff'
  },
  spectrogramData: {
    image: "spectrogram.png",
    crop: {
      x: 58,
      y: 30,
      width: 1000,
      height: 513,
    },
  },
  mediaElement: document.getElementById('audio'),
  dataUri: {
    json: '/dial.json'
  },
  keyboard: true,
  pointMarkerColor: '#006eb0',
  showPlayheadTime: true,
  waveformCache: true,
  zoomLevels: [512, 1024, 2048, 4096]
};

Peaks.init(options, function(err, peaksInstance) {
  if (err) {
    console.error(err.message);
    return;
  }

  console.log("Peaks instance ready");

  document.querySelector('[data-action="zoom-in"]').addEventListener('click', function() {
    peaksInstance.zoom.zoomIn();
  });

  document.querySelector('[data-action="zoom-out"]').addEventListener('click', function() {
    peaksInstance.zoom.zoomOut();
  });

  var segmentCounter = 1;

  document.querySelector('button[data-action="add-segment"]').addEventListener('click', function() {
    peaksInstance.segments.add({
      startTime: peaksInstance.player.getCurrentTime(),
      endTime: peaksInstance.player.getCurrentTime() + 2,
      labelText: 'Test segment ' + segmentCounter++,
      editable: true
    });
  });

  document.querySelector('button[data-action="add-point"]').addEventListener('click', function() {
    peaksInstance.points.add({
      time: peaksInstance.player.getCurrentTime(),
      labelText: 'Test point',
      editable: true
    });
  });

  document.querySelector('button[data-action="seek"]').addEventListener('click', function(event) {
    var time = document.getElementById('seek-time').value;
    var seconds = parseFloat(time);

    if (!Number.isNaN(seconds)) {
      peaksInstance.player.seek(seconds);
    }
  });

  document.getElementById('mousewheel-mode').addEventListener('change', function(event) {
    var mode = event.target.value;
    var view = peaksInstance.views.getView('spectrogramZoomview');

    view.setWheelMode(mode);
  });

  document.querySelector('button[data-action="destroy"]').addEventListener('click', function(event) {
    peaksInstance.destroy();
  });

  document.getElementById('auto-scroll').addEventListener('change', function(event) {
    var view = peaksInstance.views.getView('spectrogramZoomview');
    view.enableAutoScroll(event.target.checked);
  });

  document.getElementById('playhead-time').addEventListener('change', function(event) {
    var view = peaksInstance.views.getView('spectrogramZoomview');
    view.showPlayheadTime(event.target.checked);
  });

  document.getElementById('enable-seek').addEventListener('change', function(event) {
    var overview = peaksInstance.views.getView('spectrogramOverview');
    var zoomview = peaksInstance.views.getView('spectrogramZoomview');

    zoomview.enableSeek(event.target.checked);
    overview.enableSeek(event.target.checked);
  });

  document.getElementById('waveform-drag-mode').addEventListener('change', function(event) {
    var view = peaksInstance.views.getView('spectrogramZoomview');

    view.setWaveformDragMode(event.target.value);
  });

  document.getElementById('enable-segment-dragging').addEventListener('change', function(event) {
    var zoomview = peaksInstance.views.getView('spectrogramZoomview');

    zoomview.enableSegmentDragging(event.target.checked);
  });

  document.getElementById('segment-drag-mode').addEventListener('change', function(event) {
    var view = peaksInstance.views.getView('spectrogramZoomview');

    view.setSegmentDragMode(event.target.value);
  });

  document.querySelector('body').addEventListener('click', function(event) {
    var element = event.target;
    var action  = element.getAttribute('data-action');
    var id      = element.getAttribute('data-id');

    if (action === 'play-segment') {
      var segment = peaksInstance.segments.getSegment(id);
      peaksInstance.player.playSegment(segment);
    }
    else if (action === 'loop-segment') {
      var segment = peaksInstance.segments.getSegment(id);
      peaksInstance.player.playSegment(segment, true);
    }
    else if (action === 'remove-point') {
      peaksInstance.points.removeById(id);
    }
    else if (action === 'remove-segment') {
      peaksInstance.segments.removeById(id);
    }
  });

   /* spectrogram controls */
  document.getElementById('opacity').addEventListener('input', function(event) {
    const value = parseFloat(event.target.value);
    peaksInstance.options.spectrogramZoomview.spectrogramOpacity = value;
    peaksInstance.views.getView('spectrogramZoomview').setOpacity(value);
  });

  document.querySelector('input[data-action="toggle-waveform"]').addEventListener('change', function(event) {
    const value = event.target.checked;
    if (value) {
      peaksInstance.views.getView('spectrogramZoomview').setWaveformOpacity(1.0);
    }
    else {
      peaksInstance.views.getView('spectrogramZoomview').setWaveformOpacity(0.0);
    }
  });


  document.querySelector('input[data-action="toggle-spectrogram"]').addEventListener('change', function(event) {
    const value = event.target.checked;
    if (value) {
      peaksInstance.views.getView('spectrogramZoomview').setOpacity(1.0);
    }
    else {
      peaksInstance.views.getView('spectrogramZoomview').setOpacity(0.0);
    }
  });

  /* set source */
  document.querySelector('input[data-action="set-source"]').addEventListener('click', function(event) {
    const options = {
      spectrogramData: {
        image: "test.png",
        crop: {
          x: 58,
          y: 30,
          width: 998,
          height: 513,
        },
      },
      mediaElement: document.getElementById('audio'),
      mediaUrl: 'test.mp3',
      dataUri: {
        json: 'test.json'
      },
    };
    peaksInstance.setSource(options, (error) => {
      if (error) {
        console.error(error);
      }
      else {
        console.log('Set source successfully');
      }
    });
  });


  var amplitudeScales = {
    "0": 0.0,
    "1": 0.1,
    "2": 0.25,
    "3": 0.5,
    "4": 0.75,
    "5": 1.0,
    "6": 1.5,
    "7": 2.0,
    "8": 3.0,
    "9": 4.0,
    "10": 5.0
  };

  document.getElementById('amplitude-scale').addEventListener('input', function(event) {
    var scale = amplitudeScales[event.target.value];

    peaksInstance.views.getView('spectrogramZoomview').setAmplitudeScale(scale);
    peaksInstance.views.getView('spectrogramOverview').setAmplitudeScale(scale);
  });

  document.querySelector('button[data-action="resize-width"]').addEventListener('click', function(event) {
    document.querySelectorAll('.waveform-container').forEach(function(container) {
      container.style.width = container.offsetWidth === 1000 ? "700px" : "1000px";
    });

    const zoomview = peaksInstance.views.getView('spectrogramZoomview');

    if (zoomview) {
      zoomview.fitToContainer();
    }

    const scrollbar = peaksInstance.views.getScrollbar();

    if (scrollbar) {
      scrollbar.fitToContainer();
    }

    const overview = peaksInstance.views.getView('spectrogramOverview');

    if (overview) {
      overview.fitToContainer();
    }
  });

  document.querySelector('button[data-action="resize-height"]').addEventListener('click', function(event) {
    const zoomviewContainer = document.getElementById('spectrogram-zoomview-container');
    const overviewContainer = document.getElementById('spectrogram-overview-container');

    zoomviewContainer.style.height = zoomviewContainer.offsetHeight === 200 ? "300px" : "200px";
    overviewContainer.style.height = overviewContainer.offsetHeight === 200 ? "85px"  : "200px";

    const zoomview = peaksInstance.views.getView('spectrogramZoomview');

    if (zoomview) {
      zoomview.fitToContainer();
    }

    const overview = peaksInstance.views.getView('spectrogramOverview');

    if (overview) {
      overview.fitToContainer();
    }
  });

  document.querySelector('button[data-action="toggle-spectrogram-zoomview"]').addEventListener('click', function(event) {
    var container = document.getElementById('spectrogram-zoomview-container');
    var spectrogramview = peaksInstance.views.getView('spectrogramZoomview');

    if (spectrogramview) {
      peaksInstance.views.destroySpectrogramZoomview();
      container.style.display = 'none';
    }
    else {
      container.style.display = 'block';
      peaksInstance.views.createSpectrogramZoomview(container);
    }
  });

  document.querySelector('button[data-action="toggle-spectrogram-overview"]').addEventListener('click', function(event) {
    var container = document.getElementById('spectrogram-overview-container');
    var overview = peaksInstance.views.getView('spectrogramOverview');

    console.log(container);

    if (overview) {
      peaksInstance.views.destroySpectrogramOverview();
      container.style.display = 'none';
    }
    else {
      container.style.display = 'block';
      peaksInstance.views.createSpectrogramOverview(container);
    }
  });


  // Point events

  peaksInstance.on('points.add', function(event) {
    console.log('points.add:', event);
  });

  peaksInstance.on('points.mouseenter', function(event) {
    console.log('points.mouseenter:', event);
  });

  peaksInstance.on('points.mouseleave', function(event) {
    console.log('points.mouseleave:', event);
  });

  peaksInstance.on('points.click', function(event) {
    console.log('points.click:', event);
  });

  peaksInstance.on('points.dblclick', function(event) {
    console.log('points.dblclick:', event);
  });

  peaksInstance.on('points.contextmenu', function(event) {
    event.evt.preventDefault();

    console.log('points.contextmenu:', event);
  });

  peaksInstance.on('points.dragstart', function(event) {
    console.log('points.dragstart:', event);
  });

  peaksInstance.on('points.dragmove', function(event) {
    console.log('points.dragmove:', event);
  });

  peaksInstance.on('points.dragend', function(event) {
    console.log('points.dragend:', event);
  });

  // Segment events

  peaksInstance.on('segments.add', function(event) {
    console.log('segments.add:', event);
  });

  peaksInstance.on('segments.insert', function(event) {
    console.log('segments.insert:', event);
  });

  peaksInstance.on('segments.update', function(event) {
    console.log('segments.update:', event);
  });

  peaksInstance.on('segments.dragstart', function(event) {
    console.log('segments.dragstart:', event);
  });

  peaksInstance.on('segments.dragend', function(event) {
    console.log('segments.dragend:', event);
  });

  peaksInstance.on('segments.dragged', function(event) {
    console.log('segments.dragged:', event);
  });

  peaksInstance.on('segments.mouseenter', function(event) {
    console.log('segments.mouseenter:', event);
  });

  peaksInstance.on('segments.mouseleave', function(event) {
    console.log('segments.mouseleave:', event);
  });

  peaksInstance.on('segments.mousedown', function(event) {
    console.log('segments.mousedown:', event);
  });

  peaksInstance.on('segments.mouseup', function(event) {
    console.log('segments.mouseup:', event);
  });

  peaksInstance.on('segments.click', function(event) {
    console.log('segments.click:', event);
  });

  peaksInstance.on('segments.dblclick', function(event) {
    console.log('segments.dblclick:', event);
  });

  peaksInstance.on('segments.contextmenu', function(event) {
    event.evt.preventDefault();

    console.log('segments.contextmenu:', event);
  });

  // Zoomview waveform events

  peaksInstance.on('zoomview.click', function(event) {
    console.log('zoomview.click:', event);
  });

  peaksInstance.on('zoomview.dblclick', function(event) {
    console.log('zoomview.dblclick:', event);
  });

  peaksInstance.on('zoomview.contextmenu', function(event) {
    event.evt.preventDefault();

    console.log('zoomview.contextmenu:', event);
  });

  peaksInstance.on('zoomview.update', function(event) {
    console.log('zoomview.update:', event);
  });

  // Overview waveform events

  peaksInstance.on('overview.click', function(event) {
    console.log('overview.click:', event);
  });

  peaksInstance.on('overview.dblclick', function(event) {
    console.log('overview.dblclick:', event);
  });

  peaksInstance.on('overview.contextmenu', function(event) {
    event.evt.preventDefault();

    console.log('overview.contextmenu:', event);
  });

  // Player events

  peaksInstance.on('player.seeked', function(time) {
    console.log('player.seeked:', time);
  });

  peaksInstance.on('player.playing', function(time) {
    console.log('player.playing:', time);
  });

  peaksInstance.on('player.pause', function(time) {
    console.log('player.pause:', time);
  });

  peaksInstance.on('player.ended', function() {
    console.log('player.ended');
  });

  // Zoom events

  peaksInstance.on('zoom.update', function(event) {
    console.log('zoom.update', event);
  });
});
