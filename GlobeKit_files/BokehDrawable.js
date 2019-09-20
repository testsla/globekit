"use strict";

var GK = GK || {};
GK.BokehDrawable = function(){
    var vertex = `
        attribute vec3 aPosition;
        attribute vec3 aDirection;
        attribute float aVariance;

        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;

        uniform float uAlphaSpeed;
        uniform float uAlphaRange;
        uniform float uAlphaMul;
        uniform float uPointSize;

        uniform float uTime;
        varying float vAlpha;

        #define M_PI 3.1415926535897932384626433832795

        void main(void) {
            float variedTime = uTime + (aVariance * 10.0);
            float slowTime = variedTime * 0.1;
            float dist = sin(mod(slowTime, M_PI / 2.0));

            vAlpha = abs(sin(slowTime * 2.0));
            vAlpha *= min(abs(tan(variedTime) * uAlphaSpeed * aVariance), uAlphaRange);
            vAlpha *= uAlphaMul;

            vec3 pos = aPosition;
            pos += aDirection * dist * 2.0;

            gl_PointSize = aVariance * uPointSize;
            gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
        }
    `;

    var fragment = `
        precision mediump float;

        varying float vAlpha;
        uniform float uAlpha;
        uniform sampler2D uSampler;

        void main(void) {
            vec4 color = texture2D(uSampler, gl_PointCoord);
            gl_FragColor = vec4(color.rgb, color.a * vAlpha * uAlpha);
        }
    `;

    var self = this;

    var texture1;
    var texture2;
    var vertices;
    var vertexCount;
    var arrayBuffer;

    // WebGL
    var geometryLoaded = false;
    this.modelMatrix = mat4.create();
    mat4.identity(this.modelMatrix);

    // Effects
    this.shaderSpeed = 0.00005;     // default is 0.00005
    this.alphaRange = 10.0;         // default is 10
    this.alphaSpeed = 0.1;          // default is 0.1
    this.alphaMul = 0.05;           // default is 0.05
    this.alpha = 1.0;

    // default is 84
    this.pointSize = 84.0;

    this.init = function() {
        this.program = GK.ProgramManager.create(vertex, fragment);
        this.createGeometry();

        texture1 = GK.TextureManager.loadTexture("/static/img/texture/bokeh1.png", true, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        texture2 = GK.TextureManager.loadTexture("/static/img/texture/bokeh2.png", true, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);

        return this;
    }

    this.createGeometry = function() {
        vertexCount = 100;
        vertices = new Float32Array(vertexCount * 7);

        var i = 0;
        while(i < vertices.length) {
            var rando1 = Math.random();
            var rando2 = Math.random();
            var rando3 = Math.random();

            if (rando3 > 0.9) {
                rando3 *= 1.5;
            }
            if (rando3 > 0.95) {
                rando3 *= 1.5;
            }
            if (rando3 > 0.99) {
                rando3 *= 1.5;
            }

            var lat = Math.acos(2.0 * rando1 - 1.0) - (Math.PI * 0.5);
            var lng = Math.PI * 2.0 * rando2;

            var y = Math.sin(lat);
            var x = Math.sin(lng);
            var z = Math.cos(lng);

            var pos = vec3.fromValues(x, y, z);
            var normal = vec3.create();
            vec3.normalize(normal, pos);

            vertices[i+0] = pos[0];
            vertices[i+1] = pos[1];
            vertices[i+2] = pos[2];
            vertices[i+3] = normal[0];
            vertices[i+4] = normal[1];
            vertices[i+5] = normal[2];
            vertices[i+6] = Math.PI * Math.random();

            i += 7;
        }

        arrayBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        geometryLoaded = true;
    }

    this.draw = function(camera, time){
        if (!texture1.loaded && !texture2.loaded) return;
        if (!geometryLoaded) return;

        gl.useProgram(this.program.name);

        gl.uniformMatrix4fv(this.program.uniforms.uPMatrix, false, camera.perspectiveMatrix);
        gl.uniformMatrix4fv(this.program.uniforms.uMVMatrix, false, this.modelMatrix);
        gl.uniform1f(this.program.uniforms.uTime, time * this.shaderSpeed);

        gl.uniform1f(this.program.uniforms.uAlpha, this.alpha);
        gl.uniform1f(this.program.uniforms.uAlphaMul, this.alphaMul);
        gl.uniform1f(this.program.uniforms.uAlphaSpeed, this.alphaSpeed);
        gl.uniform1f(this.program.uniforms.uAlphaRange, this.alphaRange);
        gl.uniform1f(this.program.uniforms.uPointSize, this.pointSize);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.uniform1i(this.program.uniforms.uSampler, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);

        gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, 28, 0);
        gl.vertexAttribPointer(this.program.attributes.aDirection, 3, gl.FLOAT, false, 28, 12);
        gl.vertexAttribPointer(this.program.attributes.aVariance, 1, gl.FLOAT, false, 28, 24);

        gl.enableVertexAttribArray(this.program.attributes.aPosition);
        gl.enableVertexAttribArray(this.program.attributes.aDirection);
        gl.enableVertexAttribArray(this.program.attributes.aVariance);

        gl.drawArrays(gl.POINTS, 0, vertexCount / 2);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.uniform1i(this.program.uniforms.uSampler, 0);

        gl.drawArrays(gl.POINTS, vertexCount / 2, vertexCount / 2);
    }
}
