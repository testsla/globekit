"use strict";

var GK = GK || {};
GK.Camera = function(vFov, vRatio, zNear, zFar) {
    this.vFov = vFov;
    this.vRatio = vRatio;
    this.zNear = zNear;
    this.zFar = zFar;

    this.perspectiveMatrix = mat4.create();
    mat4.perspective(this.perspectiveMatrix, vFov, vRatio, zNear, zFar);

    this.update = function() {
        mat4.perspective(this.perspectiveMatrix, this.vFov, this.vRatio, this.zNear, this.zFar);
    }
}
