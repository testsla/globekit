"use strict";

var GK = GK || {};
GK.NebulaDrawable = function(){
    var vertex = `
        precision highp float;

        attribute vec3 aPosition;
        attribute vec3 aNormal;
        attribute vec2 aTexture;

        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        uniform float uTime;

        varying vec2 vTexture;
        varying float vAlpha;
        varying float vTime;

        void main(void) {
            vec4 mvPosition = uMVMatrix * vec4(aPosition, 1.0);
            gl_Position = uPMatrix * mvPosition;

            vec3 transformedNormal = normalize(mat3(uMVMatrix) * aNormal);
            vec3 camDir = normalize(vec3(0.0, 0.0, 1.0) - mvPosition.xyz);
            vAlpha = pow(abs(dot(transformedNormal, camDir)), 6.0);

            vTexture = aTexture;
            vTime = uTime;
        }
    `;

    var fragment = `
        precision highp float;

        varying vec2 vTexture;
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
            vec2 coord = rotTex(vTexture, vTime);
            vec4 color = texture2D(uSampler, coord);
            gl_FragColor = vec4(color.rgb, color.a * vAlpha * uAlpha);
        }
    `;

    var self = this;

    // WebGL
    var vertexBuffer;
    var indexBuffer;
    var indexCount;
    var vertexCount;
    var texture;

    // Geometry
    var geometryLoaded = false;
    this.modelMatrix = mat4.create();
    mat4.identity(this.modelMatrix);

    // Effects
    this.shaderTime = 0.0001;
    this.alpha = 1.0;

    this.init = function() {
        this.program = GK.ProgramManager.create(vertex, fragment);
        texture = GK.TextureManager.loadTexture("/static/img/texture/nebula.png", false, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
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

        gl.useProgram(this.program.name);

        gl.uniformMatrix4fv(this.program.uniforms.uPMatrix, false, camera.perspectiveMatrix);
        gl.uniformMatrix4fv(this.program.uniforms.uMVMatrix, false, this.modelMatrix);
        gl.uniform1f(this.program.uniforms.uTime, time * this.shaderTime);
        gl.uniform1f(this.program.uniforms.uAlpha, this.alpha);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.program.uniforms.uSampler, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, 32, 0);
        gl.vertexAttribPointer(this.program.attributes.aNormal, 3, gl.FLOAT, false, 32, 12);
        gl.vertexAttribPointer(this.program.attributes.aTexture, 2, gl.FLOAT, false, 32, 24);

        gl.enableVertexAttribArray(this.program.attributes.aPosition);
        gl.enableVertexAttribArray(this.program.attributes.aNormal);
        gl.enableVertexAttribArray(this.program.attributes.aTexture);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    }
}
