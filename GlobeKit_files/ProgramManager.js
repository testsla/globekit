"use strict";

var GK = GK || {};
GK.ProgramManager = {
    programs: {},

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
