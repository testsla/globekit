var BK = BK || {};
BK.Ease = {
    inSine: function(p) {
        return 1.0 - Math.cos(p * (Math.PI / 2.0));
    },

    outSine: function(p) {
        return Math.sin(p * (Math.PI / 2.0));
    },

    inOutSine: function(p) {
        return -0.5 * (Math.cos(Math.PI * p) - 1.0) + 0.0;
    },

    inExpo: function(p) {
        return (p == 0.0) ? 0 : Math.pow(2.0, 10.0 * (p - 1.0));
    },

    outExpo: function(p) {
        return ((p == 1.0) ? 1.0 : 1.0 - Math.pow(2.0, -10.0 * p));
    },

    inOutExpo: function(p) {
        if (p == 0.0) {
            return 0.0;
        }
        if (p == 1.0) {
            return 1.0;
        }
        if (p < 0.5) {
            return 0.5 * Math.pow(2.0, 10.0 * (p * 2.0 - 1.0)) + 0.0;
        }

        return 0.5 * (-Math.pow(2.0, -10.0 * (p/0.5 - 1.0)) + 2) + 0.0;
    },

    outBack: function(p) {
        var x = p - 1.0;
        return x*x*((s+1.0)*x + 1.70158) + 1;
    },

    inQuad: function(p) {
        return p*p;
    },

    outQuad: function(p) {
        return -p*(p-2);
    },

    inOutQuad: function(p) {
        if (p < 0.5) {
            return p*p*2;
        }

        return 4.0*p - 2.0*p*p - 1.0;
    },

    inQuart: function(p) {
        return p*p*p*p
    },

    outQuart: function(pIn) {
        var p = pIn - 1.0;
        return 1-p*p*p*p;
    },

    inOutQuart: function(p) {
        var x = p * 2;
        if (x < 1.0) {
            return 0.5*x*x*x*x;
        }
        x -= 2.0;
        return 1.0 - 0.5*x*x*x*x;
    },

    outQuint: function(p) {
        var x = p - 1;
        return x*x*x*x*x + 1;
    },

    inQuint: function(p) {
        return p*p*p*p*p;
    },

    inOutQuint: function(p) {
        var x = p * 2
        if (x < 1) {
            return 0.5*x*x*x*x*x;
        }
        x -= 2;
        return 0.5*x*x*x*x*x + 1;
    },

    inElastic: function(p) {
        return Math.sin(13.0 * (Math.PI / 2.0) * p) * Math.pow(2.0, 10.0 * (p - 1.0));
    },

    outElastic: function(p) {
        return Math.sin(-13 * (Math.PI / 2.0) * (p + 1)) * Math.pow(2, -10 * p) + 1.0;
    }
}

BK.Ease.smoothstep = function(min, max, value) {
    var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return x*x*(3 - 2*x);
};
