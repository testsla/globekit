"use strict";

var GK = GK || {};
GK.RingDrawable = function(){
    var vertex = `
        precision highp float;

        attribute vec3 aPosition;
        attribute vec3 aNormal;
        attribute vec2 aTexture;

        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        uniform float uTime;
        uniform float uProgress;

        varying vec2 vTexture;
        varying float vLightWeight;
        varying float vTime;
        varying float vProgress;

        void main(void) {
            vec4 mvPosition = uMVMatrix * vec4(aPosition, 1.0);
            gl_Position = uPMatrix * mvPosition;

            vec3 transformedNormal = normalize(mat3(uMVMatrix) * aNormal);
            vec3 lightDirection = normalize(vec3(0.0, 1.0, 0.0) - mvPosition.xyz);
            vLightWeight = min(max(dot(transformedNormal, lightDirection), 0.5), 1.0);

            vTexture = aTexture;
            vTime = uTime;
            vProgress = uProgress;
        }
    `;

    var fragment = `
        precision highp float;

        varying vec2 vTexture;
        varying float vLightWeight;
        varying float vTime;
        varying float vProgress;

        uniform sampler2D uSampler;
        uniform float uRingAlpha;
        uniform float uAlpha;

        void main(void) {
            float a = 1.0 - max(min((vTexture.y - vProgress) / 0.005, 1.0), 0.0);
            vec4 textureColor = texture2D(uSampler, vec2(vTexture.x, vTexture.y - vTime));
            gl_FragColor = vec4(textureColor.rgb * vLightWeight, textureColor.a * a * uRingAlpha * uAlpha);
        }
    `;

    var self = this;

    // WebGL
    var program = null;
    var vertexBuffer;
    var indexBuffer;
    var vertexCount;
    var indexCount;
    var texture;

    // Geometry
    var geometryLoaded = false;
    this.modelMatrix = mat4.create();
    mat4.identity(this.modelMatrix);

    // Effects
    this.shaderSpeed = 0.0002;
    this.bgAlpha = 0.1;
    this.fgAlpha = 0.9;
    this.progress = 0.0;

    this.init = function() {
        program = GK.ProgramManager.create(vertex, fragment);
        texture = GK.TextureManager.loadTexture("/static/img/texture/ring.png", true, gl.REPEAT, gl.REPEAT);
        return this;
    }

    this.loadGeometry = function(model) {
        var vertices = model.vertices;
        var indices = model.indices;

        vertexCount = vertices.length;
        indexCount = indices.length;

        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        geometryLoaded = true;
    }

    this.draw = function(camera, time){
        if (!texture.loaded) return;
        if (!geometryLoaded) return;

        gl.useProgram(program.name);

        gl.uniformMatrix4fv(program.uniforms.uPMatrix, false, camera.perspectiveMatrix);
        gl.uniformMatrix4fv(program.uniforms.uMVMatrix, false, this.modelMatrix);
        gl.uniform1f(program.uniforms.uTime, time * this.shaderSpeed);
        gl.uniform1f(program.uniforms.uAlpha, this.alpha);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(program.uniforms.uSampler, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.vertexAttribPointer(program.attributes.aPosition, 3, gl.FLOAT, false, 32, 0);
        gl.vertexAttribPointer(program.attributes.aNormal, 3, gl.FLOAT, false, 32, 12);
        gl.vertexAttribPointer(program.attributes.aTexture, 2, gl.FLOAT, false, 32, 24);

        gl.enableVertexAttribArray(program.attributes.aPosition);
        gl.enableVertexAttribArray(program.attributes.aNormal);
        gl.enableVertexAttribArray(program.attributes.aTexture);

        // Draw background ring
        gl.uniform1f(program.uniforms.uProgress, 1.0);
        gl.uniform1f(program.uniforms.uRingAlpha, this.bgAlpha);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

        // Draw foreground ring
        gl.uniform1f(program.uniforms.uProgress, this.progress);
        gl.uniform1f(program.uniforms.uRingAlpha, this.fgAlpha);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    }
}
