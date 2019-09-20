"use strict";

var GK = GK || {};

GK.LatLng = function(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
}

GK.LatLng.radiansForPosition = function(x, z) {
    if (z > 0) {
        if (x >= 0) {
            return Math.atan(x / z);
        }
        else {
            return 2 * Math.PI + Math.atan(x / z);
        }
    }
    else if (z < 0) {
        return Math.PI + Math.atan(x / z);
    }
    else {
        if (x > 0) {
            return Math.PI / 2.0;
        }
        else {
            return 3 * Math.PI / 2.0;
        }
    }
}

GK.LatLng.toWorld = function(latLng) {
    var latRad = latLng.latitude * Math.PI / 180.0;
    var lngRad = latLng.longitude * Math.PI / 180.0;

    var radius = Math.cos(latRad);
    var y = Math.sin(latRad);
    var x = Math.sin(lngRad) * radius;
    var z = Math.cos(lngRad) * radius;

    return vec3.fromValues(x, y, z);
}

GK.LatLng.fromWorld = function(pos) {
    var normal = vec3.create();
    vec3.normalize(normal, pos);

    var latRad = Math.asin(normal.y);
    var lngRad = radiansForPosition(normal.x, normal.z);

    var lngDeg = lngRad * 180.0 / Math.PI;
    while (lngDeg > 180.0) {
        lngDeg -= 360.0;
    }

    return new GK.LatLng(latRad * 180.0 / Math.PI, lngDeg);
}

/*
mat4_t CEALatLng_getRotationMatrix(CEALatLng coords)
{
    mat4_t m = m4_rotation(M_PI * coords.longitude / 180.0, vec3(0.0, 1.0, 0.0)); // yaw
    m = m4_mul(m, m4_rotation(M_PI * coords.latitude / 180.0, vec3(-1.0, 0.0, 0.0))); // pitch
    m = m4_mul(m, m4_translation(vec3(0.0, 0.0, 1.0))); // assuming radius of 1
    return m;
}
*/
