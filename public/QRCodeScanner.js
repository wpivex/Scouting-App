/** 
 QRCode Scanner library
 https://gist.github.com/akirattii/35b033000cd4479c337ae5abb09d7429
 
 @author: akirattii <tanaka.akira.2006@gmail.com> (http://mint.pepper.jp)
 
 @dependencies:
 + jquery
 + jsQR (https://github.com/cozmo/jsQR/)
 
 ## Usage example:
 
 [html]
  ```
  <script src="https://code.jquery.com/jquery-3.3.1.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jsqr@1.1.1/dist/jsQR.min.js"></script>
  <script type="text/javascript" src="./QRCodeScanner.js"></script>
  ...
  <!-- NOTE: `qrcodeScanner` the instance name may be changed. It's up to you. -->
  <div id="qrcode-scanner" style="display: none; border: 1px solid gray;">
    <div style="background-color: #ccc; padding: 6px 12px;">
      <strong name="title">QRCode Scanner</strong>
      <span name="close" title="Close" style="cursor: pointer; font-weight: bold; float: right;">&times;</span>
    </div>
    <div style="text-align: right; padding: 8px;">
      <span style="cursor: pointer; color: blue;" name="btn-file" onclick="qrcodeScanner.startFile(this)">Switch to File Scan</span>
      <span style="cursor: pointer; color: blue;" name="btn-webcam" onclick="qrcodeScanner.startWebcam(this)">Switch to Camera Scan</span>
    </div>
    <div name="pane-file" style="padding: 8px 12px 24px 12px;">
      <label>Select a QRCode image:</label>
      <input type="file" name="file" accept="image/png,image/jpg,image/jpeg,image/gif" style="padding: 8px 0px;" onchange="qrcodeScanner.scanFile(this)">
    </div>
    <div name="pane-webcam" style="display: none;">
      <video name="video" autoplay></video>
      <canvas name="canvas" style="display: none;"></canvas>
    </div>
    <div>
      <span name="lbl-processing" style="background: navy; color: white; padding: 4px; min-width:100%; font-weight: bold; display: none;">Processing ...</span>
    </div>
    <div>
      <button name="close" style="width: 100%;">&times; Close</button>
    </div>
  </div>
  ```

 [css]
  ```
  #qrcode-scanner {
    z-index: 9999;
    position: fixed;
    top: 0;
    margin: 0 auto;
    width: 100%;
    max-width: 360px;
    background-color: #fff;
    box-shadow: 6px 8px 8px rgba(0, 0, 0, 0.3);
  }

  #qrcode-scanner video {
    width: 100%;
  }
  ```

 [js]
  ```  
  // create QRCodeScanner instance and put it on global.
  // NOTE: `qrcodeScanner` the instance name may be changed. In that case, you must change them on html too.
  window.qrcodeScanner = new QRCodeScanner({ rootSelector: "#qrcode-scanner" });

  $(document).on("click", "#btn-open-qrcode-scanner", function(e) {
    // open QRCodeScanner webcam scanner
    qrcodeScanner.open((err, result) => {
      console.log("QRCodeScanner result:", err, result);
      // console.log("QRCodeScanner dataURL:", result.data);
    });
  });
  ```
*/
class QRCodeScanner {
  /**
   * @param rootSelector {String} - a selector of the root element of QRCodeScanner
   * @param debug {Boolean} - OPTION: debug log output. defaults to false.
   */
  constructor({
    rootSelector = "#qrcode-scanner",
    debug = false,
  }) {
    this._init({ rootSelector, debug });
  }

  _init({
    rootSelector,
    debug = false
  }) {
    const self = this;
    // if (!QrCode) throw Error("QrCode instance (https://github.com/edi9999/jsqrcode) required");
    if (!jsQR) throw Error("jsQR instance (https://github.com/cozmo/jsQR/) required");
    if (!$) throw Error("jquery instance `$` not found");
    // this.qr = new QrCode(); // need to call `global.QrCode = require('qrcode-reader');` on somewhere to bundle it
    this.debug = debug;
    this.rootSelector = rootSelector;
    const $root = $(rootSelector);
    if (!$root || $root.length <= 0) throw Error(`${rootSelector}: QRCodeScanner's root element not found`);
    this.$root = $root;
    //
    // -- for webcam scanner:
    //
    this.$paneWebcam = $root.find("[name=pane-webcam]");
    this.canvas = $root.find("[name=canvas]")[0];
    if (!this.canvas) throw Error(`canvas[name=canvas] in ${rootSelector} element not found`);
    this.video = $root.find(`[name=video]`)[0];
    if (!this.video) throw Error(`video[name=video] in ${rootSelector} element not found`);
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) throw Error("Canvas 2d context not found");
    //
    // common:
    //
    this.$root.on("click", "[name=close]", function() {
      self._finish(null);
    });
  }

  open(callback) {
    const self = this;
    self.callback = callback;
    self.$paneWebcam.show();
	self.startWebcam();
    self.$root.show();
	var qrWindow = document.getElementById("qrcode-scanner");
	qrWindow.style.left = "calc(50% - " + (qrWindow.clientWidth / 2) + "px)";
	qrWindow.style.top = "calc(50% - " + (qrWindow.clientHeight / 2) + "px)";
  }

  /** open the webcam pane and start to scan */
  startWebcam(e) {
    const self = this;
    self.webcamStopped = false;
    // open webcam device
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
		  facingMode: "environment"
	  }
    }).then(function(stream) {
      self.stream = stream;
      self.video.srcObject = stream;
      self.video.onloadedmetadata = function(e) {
		self.$root.hide();
	    qrWindow.style.top = "calc(50% - " + (qrWindow.clientHeight / 2) + "px)";
		self.$root.show();
        // Do something with the video here.
        self.video.play();
        self._snapshot(self.callback);
      };
    }).catch(function(e) {
      if (self.debug === true) console.error(`[${self.constructor.name}] exception occurred on \`startWebcam()\`:`, e);
      self._finish(null, self.callback, e);
    }); // always check for errors at the end.
  }

  _snapshot(cb) {
    const self = this;
    if (self.webcamStopped) return; // NOTE: Don't call the callback!
    // Draws current image from the video element into the canvas
    self.ctx.drawImage(self.video, 0, 0, self.canvas.width, self.canvas.height);
    const imageData = self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height);
    const data = jsQR(imageData.data, imageData.width, imageData.height);
    if (!data) {
      setTimeout(() => {
        return self._snapshot(cb); // retry ...
      }, 1000);
    } else {
      return self._finish(data, cb);
    }
  }

  _stopWebcam() {
    const self = this;
    if (self.video) {
      self.video.pause();
      self.video.src = "";
    }
    if (self.stream) {
      // self.stream.getVideoTracks()[0].stop();
      self.stream.getTracks().forEach(track => track.stop());
    }
    self.webcamStopped = true;
  }

  /** `stop` function is always called on end of process. */
  _finish(data, cb, err) {
    const self = this;
    self._stopWebcam();
    self.$root.hide();
    return cb && cb(err, data);
  }

};