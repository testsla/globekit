"use strict";

var GK = GK || {};
GK.ProjectionUtil = {
    project: function(position, projection, viewport) {
        var p = vec3.clone(position);
        vec3.transformMat4(p, p, projection);

        var x = (p[0] * 0.5 + 0.5) * viewport[2] + viewport[0];
        var y = (p[1] * 0.5 + 0.5) * viewport[3] + viewport[1];
        var z = (1.0 + p[2]) * 0.5;

        return vec3.fromValues(x, y, z);
    },

    unproject: function(position, projection, viewport) {
        mat4.invert(projection, projection);

        var x = ((2.0 * position[0] - viewport[0]) / viewport[2]) - 1.0;
        var y = ((2.0 * position[1] - viewport[1]) / viewport[3]) - 1.0;
        var z = (2.0 * position[2]) - 1.0;

        var result = vec3.fromValues(x, y, z);
        vec3.normalize(result, result);
        vec3.transformMat4(result, result, projection);

        return result;
    },

    create: function(vertexStr, fragmentStr) {
        var key = vertexStr + fragmentStr;
        if (key in GK.ProgramManager.programs) {
            return GK.ProgramManager.programs[key]
        }

        var p = new GK.Program().init(vertexStr, fragmentStr);
        GK.ProgramManager.programs[key] = p
        return p
    }
}
