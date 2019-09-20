var BK = BK || {};
BK.AnimationManager = {
    id: 0,
    animations: [],
    running: false,

    init: function() {
    },

    tick: function(timestamp) {
        if (BK.AnimationManager.running) {
            BK.AnimationManager.requestAnimFrame(BK.AnimationManager.tick);
            BK.AnimationManager.update(timestamp);
        }
    },

    update: function(timestamp) {
        var completeAnimations = [];

        for (var i=0; i<BK.AnimationManager.animations.length; i++) {
            var animation = BK.AnimationManager.animations[i];

            if (timestamp - animation.startTime < animation.startDelay) {
                continue
            }

            if (!animation.started) {
                animation.started = true;
                animation.startTime = performance.now();
                animation.startFn();
            }

            if (animation.complete) {
                completeAnimations.push(animation);
                animation.completeFn(animation.val);
                continue;
            }

            animation.integrate(1.0 / 60.0);
            animation.updateFn(animation.val);
        }

        BK.AnimationManager.animations = BK.AnimationManager.animations.filter(function(el) {
            return !completeAnimations.includes(el);
        });

        if (BK.AnimationManager.animations.length == 0) {
            BK.AnimationManager.running = false;
        }
    },

    requestAnimFrame: (window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame).bind(window),

    add: function(animation){
        if (BK.AnimationManager.animations.indexOf(animation) == -1) {
            BK.AnimationManager.animations.push(animation);
        }

        if (!BK.AnimationManager.running) {
            BK.AnimationManager.running = true;
            BK.AnimationManager.requestAnimFrame(BK.AnimationManager.tick);
        }
    },

    remove: function(animation){
        var idx = BK.AnimationManager.animations.indexOf(animation);
        if (idx != -1) {
            BK.AnimationManager.animations.splice(idx, 1);
        }
    }
}

var Animation = function(duration){
    this.id = ++BK.AnimationManager.id;
    this.val = 0;

    this.duration = duration;
    this.startTime = 0.0;
    this.startDelay = 0.0;

    this.complete = false;
    this.started = false;

    this.startFn = function(){}
    this.updateFn = function(){}
    this.completeFn = function(){}

    var elapsed = 0.0;

    this.start = function(delay) {
        delay = delay || 0.0;
        this.startDelay = delay;
        BK.AnimationManager.add(this);
    }

    this.integrate = function(deltaTime) {
        elapsed += deltaTime
        let v = (elapsed - this.startDelay) / this.duration
        this.val = Math.max(Math.min(v, 1.0), 0.0)

        if (this.val == 1.0) {
            this.complete = true
        }
    }

    this.stop = function() {
        this.complete = true
    }
}
