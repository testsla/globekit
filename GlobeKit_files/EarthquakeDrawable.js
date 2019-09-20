"use strict";

var GK = GK || {};
GK.EarthquakeDrawable = function(){
    var vertex = `
        attribute vec3 aPosition;
        attribute float aMagnitude;
        attribute float aVariance;

        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;

        uniform float uPointSize;
        uniform float uTime;
        varying float vTime;
        varying float vAlpha;
        varying float vAnimP;

        #define M_PI 3.1415926535897932384626433832795

        void main(void) {
            vTime = uTime;

            vec3 norm = normalize(aPosition);
            vAnimP = abs(sin(mod((uTime * aVariance) + aVariance * 100.0, M_PI * 0.5)));
            vec3 pos = aPosition + (0.0 * norm * vAnimP);
            float a = smoothstep(0.9, 1.0, vAnimP);

            // Fade out at back of sphere
            vec4 mvPosition = uMVMatrix * vec4(pos, 1.0);
            vec3 transformedNormal = normalize(mat3(uMVMatrix) * aPosition);
            vec3 lightDirection = normalize(vec3(0.0, 0.0, 1.0) - mvPosition.xyz);
            float lightWeight = max(dot(transformedNormal, lightDirection), 0.0);
            vAlpha = max(lightWeight, 0.05) * vAnimP;
            vAlpha = vAlpha - a;

            float pointSize = uPointSize + min(uPointSize * pow(aMagnitude / 5.0, 8.0), 14.0);
            pointSize = pointSize + (8.0 * pow(vAnimP, 9.0));

            gl_PointSize = pointSize;
            gl_Position = uPMatrix * mvPosition;
        }
    `;

    var fragment = `
        precision mediump float;

        varying float vAlpha;
        varying float vAnimP;
        uniform float uAlpha;
        uniform sampler2D uSampler;

        void main(void) {
            vec4 color = texture2D(uSampler, gl_PointCoord);
            gl_FragColor = vec4(vec3(color.r, color.g, color.b), color.a * vAlpha * uAlpha);
        }
    `;

    var self = this;

    var texture;
    var vertices;
    var vertexCount;
    var arrayBuffer;

    // WebGL
    var geometryLoaded = false;
    this.modelMatrix = mat4.create();
    mat4.identity(this.modelMatrix);

    this.pointSize = 3.0;
    this.alpha = 1.0;
    this.shaderSpeed = 0.001;

    this.init = function() {
        this.program = GK.ProgramManager.create(vertex, fragment);
        texture = GK.TextureManager.loadTexture("/static/img/texture/eq.png", true, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        return this;
    };

    this.createGeometry = function(earthquakes) {
        var vertexArray = [];

        for (var i=0; i<earthquakes.length; i++) {
            var e = earthquakes[i];
            vertexArray.push(e.pos[0]);
            vertexArray.push(e.pos[1]);
            vertexArray.push(e.pos[2]);
            vertexArray.push(e.data.properties.mag);
            vertexArray.push(Math.random());
        }

        vertices = new Float32Array(vertexArray);

        arrayBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        geometryLoaded = true;
    };

    this.draw = function(camera, time){
        if (!texture.loaded) return;
        if (!geometryLoaded) return;

        gl.useProgram(this.program.name);

        gl.uniformMatrix4fv(this.program.uniforms.uPMatrix, false, camera.perspectiveMatrix);
        gl.uniformMatrix4fv(this.program.uniforms.uMVMatrix, false, this.modelMatrix);
        gl.uniform1f(this.program.uniforms.uTime, time * this.shaderSpeed);

        gl.uniform1f(this.program.uniforms.uAlpha, this.alpha);
        gl.uniform1f(this.program.uniforms.uPointSize, this.pointSize);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.program.uniforms.uSampler, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);

        gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(this.program.attributes.aMagnitude, 1, gl.FLOAT, false, 20, 12);
        gl.vertexAttribPointer(this.program.attributes.aVariance, 1, gl.FLOAT, false, 20, 16);
        gl.enableVertexAttribArray(this.program.attributes.aPosition);

        gl.drawArrays(gl.POINTS, 0, vertices.length / 5);
    };
}
