"use strict";

var GK = GK || {};
GK.PointGlobeDrawable = function(){
    var vertex = `
        precision lowp float;

        attribute vec3 aPosition;
        attribute vec2 aTexture;
        attribute float aStrength;
        attribute float aOffset;

        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;

        uniform float uOffsetPower;
        uniform float uPointSize;
        uniform float uTime;

        varying vec2 vTexture;
        varying float vAlpha;
        varying float vTime;

        uniform vec3 uWaveVector;
        uniform float uWaveHeight;
        uniform float uWaveWidth;
        uniform float uWaveVariety;
        uniform float uWaveEffectStr;
        uniform float uWaveTime;
        varying float vWavePower;
        varying float vWaveAmp;

        uniform float uRingProgress;
        uniform float uRingHeight;
        uniform float uRingWidth;
        uniform float uRingVariety;
        uniform float uRingEffectStr;
        varying float vRingPower;

        #define M_PI 3.1415926535897932384626433832795

        void main(void) {
            // Scatter effect
            vec3 pos = aPosition + ((aPosition * aOffset) * uOffsetPower);

            // Earthquake effect
            float waveCos = dot(uWaveVector, pos);
            vWavePower = smoothstep(1.0 - uWaveWidth, 1.1, max(waveCos, 0.0));
            float waveAngle = vWavePower * (-M_PI * 4.0);
            vWaveAmp = sin(waveAngle + uWaveTime) * vWavePower;
            pos += pos * vWaveAmp * uWaveHeight * uWaveEffectStr;
            pos += pos * aOffset * uWaveVariety * vWavePower * uWaveEffectStr;

            // Ring effect
            vRingPower = smoothstep(uRingProgress, uRingProgress + uRingWidth, waveCos);
            vRingPower -= smoothstep(uRingProgress + uRingWidth, uRingProgress + uRingWidth * 2.0, waveCos);
            pos += pos * vRingPower * uRingHeight * uRingEffectStr;
            pos += pos * aOffset * uRingVariety * vRingPower * uRingEffectStr;

            // Adjust point size
            float pointSize = uPointSize + (uPointSize * vWaveAmp * uWaveEffectStr) + (uPointSize * pow(vRingPower, 6.0) * uRingEffectStr);
            gl_PointSize = max(pointSize - (pow(pointSize * aOffset, 2.0) * uOffsetPower * 0.25), 1.0);
            //gl_PointSize = pointSize;

            // Project position
            vec4 mvPosition = uMVMatrix * vec4(pos, 1.0);
            gl_Position = uPMatrix * mvPosition;

            // Fade out at back of sphere
            vec3 transformedNormal = normalize(mat3(uMVMatrix) * aPosition);
            vec3 lightDirection = normalize(vec3(0.0, 0.0, 1.0) - mvPosition.xyz);
            float lightWeight = max(dot(transformedNormal, lightDirection), 0.0);
            vAlpha = max(aStrength * lightWeight, 0.1);

            // Apply lighting to effects
            vRingPower *= lightWeight * uRingEffectStr;
            vWavePower *= lightWeight * uRingEffectStr;

            // Pass along
            vTexture = aTexture;
            vTime = uTime;
        }
    `;

    var fragment = `
        precision lowp float;

        varying vec2 vTexture;
        varying float vAlpha;
        varying float vTime;

        varying float vWavePower;
        varying float vWaveAmp;
        varying float vRingPower;

        uniform float uAlpha;
        uniform sampler2D uSampler;
        uniform sampler2D uNoiseSampler;

        void main(void) {
            vec4 textureColor = texture2D(uSampler, gl_PointCoord);
            vec4 noiseColor = texture2D(uNoiseSampler, vec2(vTexture.x + vTime, vTexture.y));
            float noiseAlpha = pow(noiseColor.r, 3.0);
            gl_FragColor = vec4(textureColor.rgb, (textureColor.a * vAlpha * noiseAlpha + vWavePower + vRingPower) * uAlpha);
        }
    `;

    var self = this;

    // WebGL
    var vertices;
    var arrayBuffer;
    var texture;
    var noiseTexture;

    // Geometry
    var geometryLoaded = false;
    this.modelMatrix = mat4.create();
    mat4.identity(this.modelMatrix);

    // Effects
    this.alpha = 1.0;
    this.offsetPower = 0.0;
    this.pointSize = 2.0;
    this.shaderSpeed = 0.00001;

    this.ringHeight = 0.04;
    this.ringWidth = 0.04;
    this.ringProgress = 0.0;
    this.ringEffectStr = 1.0;
    this.ringVariety = 0.0;

    this.waveHeight = 0.04;
    this.waveWidth = 0.1;
    this.waveVariety = 0.0;
    this.waveEffectStr = 1.0;

    this.waveVector = vec3.fromValues(0.0, 1.0, 1.0);
    vec3.normalize(this.waveVector, this.waveVector);

    this.init = function() {
        this.program = GK.ProgramManager.create(vertex, fragment);
        texture = GK.TextureManager.loadTexture("/static/img/texture/dot.png", true, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        noiseTexture = GK.TextureManager.loadTexture("/static/img/texture/clouds.png", true, gl.REPEAT, gl.REPEAT);
        return this;
    }

    this.loadGeometry = function(model) {
        vertices = model.vertices

        arrayBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        geometryLoaded = true;
    }

    this.draw = function(camera, time) {
        if (!(texture.loaded && noiseTexture.loaded)) return;
        if (!geometryLoaded) return;

        // Activate program
        gl.useProgram(this.program.name);

        // Uniforms
        gl.uniformMatrix4fv(this.program.uniforms.uPMatrix, false, camera.perspectiveMatrix);
        gl.uniformMatrix4fv(this.program.uniforms.uMVMatrix, false, this.modelMatrix);
        gl.uniform1f(this.program.uniforms.uOffsetPower, this.offsetPower);
        gl.uniform1f(this.program.uniforms.uPointSize, this.pointSize);
        gl.uniform1f(this.program.uniforms.uTime, time * this.shaderSpeed);
        gl.uniform1f(this.program.uniforms.uAlpha, this.alpha);

        // Wave
        gl.uniform1f(this.program.uniforms.uWaveVariety, this.waveVariety);
        gl.uniform1f(this.program.uniforms.uWaveHeight, this.waveHeight);
        gl.uniform1f(this.program.uniforms.uWaveWidth, this.waveWidth);
        gl.uniform1f(this.program.uniforms.uWaveEffectStr, this.waveEffectStr);
        gl.uniform1f(this.program.uniforms.uWaveTime, time * 0.01);
        gl.uniform3fv(this.program.uniforms.uWaveVector, this.waveVector);

        // Ring
        gl.uniform1f(this.program.uniforms.uRingWidth, this.ringWidth);
        gl.uniform1f(this.program.uniforms.uRingHeight, this.ringHeight);
        gl.uniform1f(this.program.uniforms.uRingProgress, 1.0 - this.ringProgress);
        gl.uniform1f(this.program.uniforms.uRingEffectStr, this.ringEffectStr);
        gl.uniform1f(this.program.uniforms.uRingVariety, this.ringVariety);

        // Textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.program.uniforms.uSampler, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
        gl.uniform1i(this.program.uniforms.uNoiseSampler, 1);

        // Array data
        gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);

        gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, 28, 0);
        gl.vertexAttribPointer(this.program.attributes.aTexture, 2, gl.FLOAT, false, 28, 12);
        gl.vertexAttribPointer(this.program.attributes.aStrength, 1, gl.FLOAT, false, 28, 20);
        gl.vertexAttribPointer(this.program.attributes.aOffset, 1, gl.FLOAT, false, 28, 24);

        gl.enableVertexAttribArray(this.program.attributes.aPosition);
        gl.enableVertexAttribArray(this.program.attributes.aTexture);
        gl.enableVertexAttribArray(this.program.attributes.aStrength);
        gl.enableVertexAttribArray(this.program.attributes.aOffset);

        // Draw
        gl.drawArrays(gl.POINTS, 0, vertices.length / 7);
    }
}

