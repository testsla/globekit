"use strict";

var Site = Site || {};
Site = {
    dataManager: null,
    formManager: null,
    scrollManager: null,
    canvasManager: null,
    modelManager: null,

    fontsLoaded: false,
    modelsLoaded: false,
    windowLoaded: false,
    windowResizing: false,
    ready: false,

    ww: 0.0,
    wh: 0.0,
    bh: 0.0,
    ps: 0.0,

    init: function() {
        Site.canvas = document.getElementById("globekit-canvas");
        Site.sizeElements();

        Site.canvasManager = new Site.CanvasManager();
        Site.scrollManager = new Site.ScrollManager();
        Site.modelManager = new Site.ModelManager();
        Site.dataManager = new Site.DataManager();
        Site.formManager = new Site.FormManager();
        Site.formManager.init();

        Site.canvasManager.init(Site.canvas);

        Site.canvasManager.globe.offsetPower = -0.4;
        Site.canvasManager.globe.waveEffectStr = 0.0;
        Site.canvasManager.globe.ringEffectStr = 0.0;
        Site.canvasManager.globe.pointSize = Site.ps;
        Site.canvasManager.quakes.pointSize = Site.ps / 1.1;

        Site.canvasManager.globe.alpha = 0.0;
        Site.canvasManager.ring.alpha = 0.0;
        Site.canvasManager.nebula.alpha = 0.0;
        Site.canvasManager.bokeh.alpha = 0.0;
        Site.canvasManager.quakes.alpha = 0.0;
        Site.canvasManager.bigQuake.alpha = 0.0;

        // Add listeners, load data
        Site.addEventListeners();
        Site.modelManager.load();
        Site.dataManager.load();

        // Background model is preloaded
        var bgModel = Site.modelManager.models.background;
        Site.canvasManager.background.loadModel(bgModel);

        var bodyClass = (Site.isMobile) ? "mobile" : "desktop";
        document.body.classList.add(bodyClass);
    },

    getGlobePointSize: function() {
        if (Site.isMobile) {
            return Math.max(2.0, Site.wh * 0.0052);
        }

        return Math.max(2.0, Site.wh * 0.0042);
    },

    addEventListeners: function() {
        Site.scrollManager.sectionChangeSignal.add(Site, Site.formManager.showForm);
        Site.formManager.formSubmitSignal.add(Site, Site.formDidSubmit);
        Site.modelManager.loadSignal.add(Site, Site.modelsDidLoad);
        Site.dataManager.loadSignal.add(Site, Site.dataDidLoad);

        window.addEventListener("load", function(){
            Site.windowDidLoad();
        });

        if (Site.isMobile) {
            window.addEventListener("orientationchange", function(){
                Site.windowDidResize();
                Site.updateCanvas();
            });
        }

        if (Site.isDesktop) {
            window.addEventListener("resize", function() {
                if (!Site.windowResizing) {
                    document.body.classList.add("resizing");
                    Site.windowResizing = true;
                }
            });

            window.addEventListener("resize", Site.debounce(function() {
                document.body.classList.remove("resizing");
                Site.windowResizing = false;
                Site.windowDidResize();
                Site.updateCanvas();
            }, 200));

            Site.formManager.requestButton.addEventListener("click", function(ev) {
                ev.preventDefault();
                if (Site.formManager.requestButton.classList.contains("submit")) {
                    Site.formManager.requestFormSubmit();
                } else {
                    Site.scrollManager.didSelectSection(Site.scrollManager.sections[5]);
                }
                return false;
            });

            window.addEventListener("scroll", Site.scrollManager.mouseWheelHide);
        }
    },

    windowDidLoad: function() {
        Site.windowLoaded = true;
        Site.launchSite();
    },

    launchSite: function() {
        Site.ready = (Site.windowLoaded && Site.modelsLoaded && Site.fontsLoaded);

        if (Site.ready) {
            Site.playIntroAnimation();
            Site.scrollManager.init();

            Site.scrollManager.windowDidScroll();
            Site.canvasManager.ring.progress = Site.scrollManager.getScrollPercent();

            document.body.classList.add("fonts-active");
            window.addEventListener("scroll", function() {
                Site.canvasManager.ring.progress = Site.scrollManager.getScrollPercent();
                Site.scrollManager.windowDidScroll();
            });

            if (document.body.scrollTop == 0) {
                document.getElementById("mouse-wheel").classList.add("visible");
            }
        }
    },

    sizeElements: function() {
        Site.bh = document.body.offsetHeight;
        Site.ww = window.innerWidth;
        Site.wh = window.innerHeight;
        Site.canvas.width = Site.ww;
        Site.canvas.height = Site.wh;
        Site.ps = Site.getGlobePointSize();
        if (Site.isMobile) {
            Site.canvas.height += 68;
        }
    },

    windowDidResize: function() {
        Site.sizeElements();

        if (Site.ready) {
            Site.scrollManager.updateItemRects();
            Site.scrollManager.windowDidScroll();
        }
    },

    fontsDidActivate: function() {
        Site.fontsLoaded = true;
        Site.launchSite();
    },

    updateCanvas: function(){
        var cm = Site.canvasManager;
        cm.updateViewport();
        cm.ring.progress = Site.scrollManager.getScrollPercent();
        cm.globe.pointSize = Site.ps;
        cm.quakes.pointSize = Site.ps / 1.1;
    },

    playIntroAnimation: function(){
        var cm = Site.canvasManager;

        var offsetStart = cm.globe.offsetPower;
        var offsetEnd = 0.0;
        var offsetDelta = offsetEnd - offsetStart;

        var intro = new Animation(0.9);
        intro.updateFn = function(value) {
            var v = BK.Ease.inOutSine(value);
            cm.globe.offsetPower = offsetStart + (v * offsetDelta);
        };
        intro.completeFn = function() {
            cm.globe.offsetPower = 0.0;
            Site.intro = null;
        };
        intro.start();

        cm.pulse(0.2, 0.08, 0.02, 3.8);
        Site.pulseInterval = setTimeout(function() {
            Site.pulse();
        }, 5250);
    },

    pulse: function() {
        Site.canvasManager.quakePulse();
        Site.pulseInterval = setTimeout(Site.pulse, 5250 + (Math.random() * 1000));
    },

    formDidSubmit: function() {
        var cm = Site.canvasManager;
        cm.globe.waveWidth = 2.0;

        clearInterval(Site.pulseInterval);
        Site.canvasManager.dismissInfo();
        Site.pulseInterval = setInterval(function(){
           cm.pulse(0.1, 0.04, 0.0, 4.0);
        }, 4250);

        var a = new Animation(2.0);
        a.updateFn = function(value) {
            var v = BK.Ease.outExpo(value);
            cm.bigQuake.alpha = 1.0 - v;
            cm.globe.waveEffectStr = v * 0.25;
            cm.globe.offsetPower = -4.0 * v;
        };
        a.start();
    },

    modelsDidLoad: function() {
        var mm = Site.modelManager;
        var cm = Site.canvasManager;

        cm.ring.loadGeometry(mm.models.ring);
        cm.nebula.loadGeometry(mm.models.nebula);
        cm.globe.loadGeometry(mm.models.globe);

        var a = new Animation(0.4);
        a.updateFn = function(value) {
            cm.ring.alpha = value;
            cm.globe.alpha = value;
            cm.nebula.alpha = value;
            cm.bokeh.alpha = value * 0.2;
        };
        a.start();

        Site.modelsLoaded = true;
        Site.launchSite();
    },

    dataDidLoad: function() {
        var a = new Animation(0.4);

        var cm = Site.canvasManager;
        a.updateFn = function(value) {
            cm.quakes.alpha = value;
        };

        a.start();
        var earthquakes = Site.dataManager.earthquakes;
        Site.canvasManager.quakesDidLoad(earthquakes);
    }
};

// Utilities

Site.isMobile = (window.orientation !== undefined) || (navigator.userAgent.indexOf("IEMobile") !== -1);
Site.isDesktop = !Site.isMobile;
Site.debounce = function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };

        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
};
