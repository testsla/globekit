"use strict";

var GK = GK || {};
GK.Program = function(){
    var self = this;

    this.name;
    this.program;
    this.vertexShader;
    this.fragmentShader;

    this.uniforms = {};
    this.attributes = {};

    this.init = function(vertexShaderStr, fragmentShaderStr){
        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        this.compileShader(this.fragmentShader, fragmentShaderStr);

        this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
        this.compileShader(this.vertexShader, vertexShaderStr);

        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertexShader);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.log("Could not initialise shaders", this);
        }

        this.name = this.program;
        this.assignAttributesAndUniforms();
        return this;
    }

    this.assignAttributesAndUniforms = function(){
        var info = this.getInfo();

        for (var i=0; i<info.attributes.length; i++){
            var attribute = info.attributes[i];
            this.attributes[attribute.name] = gl.getAttribLocation(this.name, attribute.name);
        }

        for (var j=0; j<info.uniforms.length; j++){
            var uniform = info.uniforms[j];
            this.uniforms[uniform.name] = gl.getUniformLocation(this.name, uniform.name);
        }
    }

    this.compileShader = function(shader, str){
        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    this.getInfo = function() {
        var result = {
            attributes: [],
            uniforms: [],
            attributeCount: 0,
            uniformCount: 0
        };

        var activeUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        var activeAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);

        // Taken from the WebGl spec:
        // http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14
        var enums = {
            0x8B50: 'FLOAT_VEC2',
            0x8B51: 'FLOAT_VEC3',
            0x8B52: 'FLOAT_VEC4',
            0x8B53: 'INT_VEC2',
            0x8B54: 'INT_VEC3',
            0x8B55: 'INT_VEC4',
            0x8B56: 'BOOL',
            0x8B57: 'BOOL_VEC2',
            0x8B58: 'BOOL_VEC3',
            0x8B59: 'BOOL_VEC4',
            0x8B5A: 'FLOAT_MAT2',
            0x8B5B: 'FLOAT_MAT3',
            0x8B5C: 'FLOAT_MAT4',
            0x8B5E: 'SAMPLER_2D',
            0x8B60: 'SAMPLER_CUBE',
            0x1400: 'BYTE',
            0x1401: 'UNSIGNED_BYTE',
            0x1402: 'SHORT',
            0x1403: 'UNSIGNED_SHORT',
            0x1404: 'INT',
            0x1405: 'UNSIGNED_INT',
            0x1406: 'FLOAT'
        };

        // Loop through active uniforms
        for (var i=0; i < activeUniforms; i++) {
            var uniform = gl.getActiveUniform(this.program, i);
            uniform.typeName = enums[uniform.type];
            result.uniforms.push(uniform);
            result.uniformCount += uniform.size;
        }

        // Loop through active attributes
        for (var i=0; i < activeAttributes; i++) {
            var attribute = gl.getActiveAttrib(this.program, i);
            attribute.typeName = enums[attribute.type];
            result.attributes.push(attribute);
            result.attributeCount += attribute.size;
        }

        return result;
    }
}
