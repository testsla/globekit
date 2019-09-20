"use strict";

var GK = GK || {};
GK.BigQuakeDrawable = function(){
    var vertex = `
        attribute vec3 aPosition;

        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;

        uniform float uTime;
        uniform float uPointSize;
        uniform float uProgress;

        varying float vTime;
        varying float vAlpha;

        #define M_PI 3.1415926535897932384626433832795

        void main(void) {
            vec3 norm = normalize(aPosition);
            //vec3 pos = aPosition + (norm * 0.5 * (1.0 - uProgress));
            vec3 pos = aPosition;

            float t = abs(sin(mod(uTime, M_PI * 0.5)));
            //vAlpha = t;
            vAlpha = 1.0;
            vTime = uTime;

            //gl_PointSize = uPointSize + (uPointSize * t);
            gl_PointSize = uPointSize;
            gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
        }
    `;

    var fragment = `
        precision highp float;

        varying float vAlpha;
        varying float vTime;

        uniform float uAlpha;
        uniform sampler2D uSampler;

        vec2 rotTex(vec2 coord, float angle) {
            float s = sin(angle);
            float c = cos(angle);

            mat2 rot = mat2(c, s, -s, c);
            rot *= 0.5;
            rot += 0.5;
            rot = rot * 2.0 - 1.0;

            coord = coord - 0.5;
            coord = coord * rot;
            coord += 0.5;
            return coord;
        }

        void main(void) {
            vec2 coord = clamp(rotTex(gl_PointCoord, vTime), vec2(0.0, 0.0), vec2(1.0, 1.0));
            vec4 color = texture2D(uSampler, coord);
            gl_FragColor = vec4(color.rgb, color.a * uAlpha * vAlpha);
        }
    `;

    var self = this;

    var texture;
    var vertices;
    var arrayBuffer;

    // WebGL
    var geometryLoaded = false;
    this.modelMatrix = mat4.create();
    mat4.identity(this.modelMatrix);

    this.alpha = 1.0;
    this.pointSize = 12.0;
    this.progress = 1.0;
    this.shaderSpeed = 0.01;

    this.init = function() {
        this.program = GK.ProgramManager.create(vertex, fragment);
        texture = GK.TextureManager.loadTexture("/static/img/texture/bq.png", true, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        return this;
    }

    this.createGeometry = function(earthquake) {
        vertices = new Float32Array(earthquake.pos);

        if (arrayBuffer == null) {
            arrayBuffer = gl.createBuffer();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        geometryLoaded = true;
    }

    this.draw = function(camera, time){
        if (!texture.loaded) return;
        if (!geometryLoaded) return;

        gl.useProgram(this.program.name);

        gl.uniformMatrix4fv(this.program.uniforms.uPMatrix, false, camera.perspectiveMatrix);
        gl.uniformMatrix4fv(this.program.uniforms.uMVMatrix, false, this.modelMatrix);
        gl.uniform1f(this.program.uniforms.uTime, time * this.shaderSpeed);

        gl.uniform1f(this.program.uniforms.uAlpha, this.alpha);
        gl.uniform1f(this.program.uniforms.uPointSize, this.pointSize);
        gl.uniform1f(this.program.uniforms.uProgress, this.progress);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.program.uniforms.uSampler, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);

        gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, 12, 0);
        gl.enableVertexAttribArray(this.program.attributes.aPosition);

        gl.drawArrays(gl.POINTS, 0, vertices.length / 3);
    }
}
