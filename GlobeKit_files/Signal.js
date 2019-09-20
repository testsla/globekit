var BK = BK || {};
BK.Signal = function () {
    this.functions = {};

    this.fire = function() {
        for (key in this.functions) {
            if (this.functions.hasOwnProperty(key)) {
                for (i=0; i<this.functions[key].length; i++) {
                    var f = this.functions[key][i];
                    f.apply(this, arguments);
                }
            }
        }
    }

    this.add = function(key, fn) {
        if (!this.functions[key]) this.functions[key] = [];
        this.functions[key].push(fn);
    }

    this.remove = function(key) {
        delete this.functions[key]
    }
}
