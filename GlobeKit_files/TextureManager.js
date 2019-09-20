"use strict";

var GK = GK || {};
GK.TextureManager = {
    loadTexture: function(path, premultiply, wrapS, wrapT) {
        var t = gl.createTexture();
        t.image = new Image();
        t.image.onload = function () {
            GK.TextureManager.configureTexture(t, premultiply, wrapS, wrapT)
            t.loaded = true;
        }

        t.image.src = path;
        return t;
    },

    configureTexture: function(t, premultiply, wrapS, wrapT) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);

        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t.image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}
