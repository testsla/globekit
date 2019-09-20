"use strict";

var Site = Site || {};
Site.CanvasManager = function() {
    var self = this;

    this.nebula;
    this.globe;
    this.bokeh;
    this.quakes;
    this.bigQuake;
    this.canvas;
    this.camera;
    this.background;
    this.globeForward;
    this.earthquakes;

    // Popup
    this.selectedQuake;
    this.infoAnim;
    this.infoTimeout;
    this.quakeInfoSpan;
    this.quakeInfo;

    var sinTime;
    var slowTime;

    this.init = function() {
        this.quakeInfo = document.getElementById("quake-info");
        this.quakeInfoSpan = this.quakeInfo.getElementsByTagName("span")[0];

        this.canvas = document.getElementById("globekit-canvas");
        this.camera = new GK.Camera(220, this.canvas.width / this.canvas.height, 0.1, 1000.0);

        window.gl = this.canvas.getContext("experimental-webgl", {antialias: false, alpha: false});
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.2, 0, 0.35, 1.0);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        //gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);

        this.globe = new GK.PointGlobeDrawable().init();
        this.nebula = new GK.NebulaDrawable().init();
        this.bokeh = new GK.BokehDrawable().init();
        this.ring = new GK.RingDrawable().init();
        this.background = new GK.BackgroundDrawable().init();
        this.quakes = new GK.EarthquakeDrawable().init();
        this.bigQuake = new GK.BigQuakeDrawable().init();

        this.requestAnimFrame(this.tick);
    }

    this.draw = function(timestamp) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        slowTime = timestamp * 0.0002;
        sinTime = Math.sin(slowTime);

        var m = self.globe.modelMatrix;
        mat4.identity(m);
        mat4.translate(m, m, [8.0, 0.0, -500.0]);
        mat4.scale(m, m, [18.0, 18.0, 18.0]);
        mat4.rotateX(m, m, sinTime);
        mat4.rotateY(m, m, slowTime);

        var origin = vec3.fromValues(0.0, 0.0, 0.0);
        var forward = vec3.fromValues(-0.8, 0.0, 1.0);
        vec3.rotateX(forward, forward, origin, -sinTime);
        vec3.rotateY(forward, forward, origin, -slowTime);
        vec3.normalize(forward, forward);
        self.globeForward = forward;

        m = self.ring.modelMatrix;
        mat4.identity(m);
        mat4.translate(m, m, [8.5, 0.0, -500.0]);
        mat4.scale(m, m, [22.0, 22.0, 22.0]);
        mat4.rotateY(m, m, Math.PI / 9.0);
        mat4.rotateX(m, m, -Math.PI / 9.0);

        m = self.background.modelMatrix;
        mat4.identity(m);
        mat4.translate(m, m, [0.0, 0.0, -22.0]);
        var bgRatio = Math.max(this.camera.vRatio, 1.0);
        mat4.scale(m, m, [bgRatio, bgRatio, 1.0]);

        m = self.nebula.modelMatrix;
        mat4.identity(m);
        mat4.translate(m, m, [1.8, 0.0, -100.0]);
        mat4.scale(m, m, [7.0, 7.0, 7.0]);
        mat4.rotateX(m, m, sinTime);
        mat4.rotateY(m, m, slowTime);

        m = self.bokeh.modelMatrix;
        mat4.identity(m);
        mat4.translate(m, m, [1.5, -0.0, -90.0]);;
        mat4.rotateX(m, m, sinTime);
        mat4.rotateY(m, m, slowTime);

        self.quakes.modelMatrix = mat4.clone(self.globe.modelMatrix);
        self.bigQuake.modelMatrix = mat4.clone(self.globe.modelMatrix);

        gl.depthMask(false);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        self.background.draw(self.camera, timestamp);
        self.nebula.draw(self.camera, timestamp);

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        self.ring.draw(self.camera, timestamp);
        self.globe.draw(self.camera, timestamp);
        self.bokeh.draw(self.camera, timestamp);
        self.quakes.draw(self.camera, timestamp);

        if (Site.ww > 703) {
            self.bigQuake.draw(self.camera, timestamp);
            self.updateSelectedQuake();
        }
    }

    this.updateSelectedQuake = function() {
        if (!this.selectedQuake) {
            return;
        }

        var m = mat4.create();
        mat4.multiply(m, self.camera.perspectiveMatrix, self.globe.modelMatrix);

        var p = vec3.clone(self.selectedQuake.pos);
        var viewport = [0.0, self.canvas.height, self.canvas.width, -self.canvas.height];
        var screenPos = GK.ProjectionUtil.project(p, m, viewport);

        self.quakeInfo.style.transform = "translate3d(" + screenPos[0] + "px," + screenPos[1] + "px, 0)";
    }

    this.updateViewport = function() {
        gl.viewport(0, 0, self.canvas.width, self.canvas.height);
        self.camera.vRatio = self.canvas.width / self.canvas.height;
        self.camera.update();
    }

    this.tick = function(timestamp) {
        self.requestAnimFrame(self.tick);
        self.draw(timestamp);
    }

    this.pulse = function(width, height, variety, duration, waveVector) {
        var w = width || 0.1;
        var h = height || 0.04;
        var v = variety || 0.0;
        var d = duration || 4.0;

        self.globe.ringWidth = w;
        self.globe.ringHeight = h;
        self.globe.ringVariety = v;
        self.globe.ringProgress = 0.0;
        self.globe.ringEffectStr = 0.0;

        // Wave emanates from front to back
        if (!waveVector) {
            waveVector = self.globeForward;
        }

        self.globe.waveVector = waveVector;

        // Create animation
        var a = new Animation(d);
        a.updateFn = function(value) {
            var v = BK.Ease.outSine(value);
            self.globe.ringProgress = 2.0 * v;
            self.globe.ringEffectStr = BK.Ease.smoothstep(0.0, 0.1, value) - BK.Ease.smoothstep(0.8, 1.0, value);
        }
        a.start();
    }

    this.quakesDidLoad = function(earthquakes) {
        this.earthquakes = earthquakes;
        Site.canvasManager.quakes.createGeometry(earthquakes);
        Site.canvasManager.bigQuake.createGeometry(earthquakes[0]);
    }

    this.updateQuakeInfo = function(quake) {
        self.quakeInfoSpan.innerHTML = "<strong>Magnitude " +
            quake.data.properties.mag + "</strong>" +
            quake.data.properties.place;
    }

    this.quakePulse = function() {
        var quake = self.getPertinentQuake();
        var dir = vec3.clone(quake.pos);
        vec3.normalize(dir, dir);

        self.bigQuake.createGeometry(quake);
        self.selectedQuake = quake;
        self.updateQuakeInfo(quake);

        // Create animation
        self.globe.waveEffectStr = 0.0;
        self.globe.waveVector = dir;
        self.globe.waveWidth = 0.1;
        self.globe.waveHeight = 0.005;

        var startPS = Site.ps * 20.0;
        var endPS = Site.ps * 10.0;
        var deltaPS = endPS - startPS;

        self.bigQuake.pointSize = startPS;
        self.bigQuake.progress = 0.0;
        self.bigQuake.alpha = 0.0;

        if(self.infoAnim) {
            self.infoAnim.stop();
        }

        self.infoAnim = new Animation(5.0);
        self.infoAnim.updateFn = function(value) {
            var progress = BK.Ease.outSine(BK.Ease.smoothstep(0.0, 0.2, value));
            self.bigQuake.progress = progress;
            self.bigQuake.pointSize = startPS + (deltaPS * progress);
            self.bigQuake.alpha = BK.Ease.smoothstep(0.0, 0.1, value) - BK.Ease.smoothstep(0.7, 0.8, value);
            self.globe.waveEffectStr = BK.Ease.smoothstep(0.0, 0.5, value) - BK.Ease.smoothstep(0.5, 1.0, value);

            if (value > 0.9 && self.quakeInfoSpan.showing) {
                self.quakeInfoSpan.classList.remove("in");
                self.quakeInfoSpan.showing = false;
            }
        }
        self.infoAnim.start();

        self.infoTimeout = setTimeout(function(){
            self.pulse(0.1, 0.04, 0.0, 3.0, dir);
            self.quakeInfoSpan.classList.add("in");
            self.quakeInfoSpan.showing = true;
        }, 600);
    }

    this.dismissInfo = function() {
        if (self.infoAnim) {
            self.infoAnim.stop();
        }

        clearTimeout(self.infoTimeout);
        self.quakeInfoSpan.classList.remove("in");
    }

    this.getPertinentQuake = function() {
        var distances = [];
        var forward = this.globeForward;

        for (var i=0; i<this.earthquakes.length; i++) {
            var quake = this.earthquakes[i];
            var cosTheta = vec3.dot(this.earthquakes[i].pos, forward);
            distances.push({quake: quake, theta: cosTheta});
        }

        distances.sort(function(a, b) {
            return b.theta - a.theta;
        });

        return distances[0].quake;
    }

    this.earthquake = function() {
        var a = new Animation(4.0);
        a.updateFn = function(value) {
            var v = BK.Ease.inOutSine(value);
            self.globe.ringProgress = 2.0 * BK.Ease.inOutSine(GKEase.smoothstep(0.2, 1.0, value));
            self.globe.ringEffectStr = 1.0 - BK.Ease.smoothstep(0.2, 0.6, value);
            self.globe.waveEffectStr = BK.Ease.smoothstep(0.0, 0.1, value) - BK.Ease.smoothstep(0.5, 1.0, value);
        }
        a.start();
    }

    this.geometryLoaded = function() {
        self.ring.loadGeometry(this.geomLoader.models.ring);
        self.nebula.loadGeometry(this.geomLoader.models.nebula);
        self.globe.loadGeometry(this.geomLoader.models.globe);
    }

    this.requestAnimFrame = (window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame).bind(window);
}
