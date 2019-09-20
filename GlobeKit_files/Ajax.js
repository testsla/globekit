var BK = BK || {};
BK.Ajax = function(config){
    var vars = "";
    var self = this;

    self.request = (window.XMLHttpRequest) ?
        new XMLHttpRequest():
        new ActiveXObject("Microsoft.XMLHTTP");

    self.request.onreadystatechange = function(){
        if (self.request.readyState == 4 && self.request.status == 200) {
            var ctype = self.request.getResponseHeader("Content-Type");
            var response;

            // Header contains XML in it
            if (ctype.match(/xml/gi)) {
                response = self.request.responseXML;
            }

            // Header contains JSON in it
            else if (ctype.match(/json/gi)){
                eval("var qqq=" + self.request.responseText);
                response = qqq;
            }

            // Not xml or json
            else {
                response = self.request.responseText;
            }

            // Execute complete
            if (config.onComplete) {
                var headers = BK.Ajax.convertHeadersToObject(self.request.getAllResponseHeaders());
                config.onComplete(response, headers);
            }
        }

        // Error
        else if(self.request.readyState == 4 && self.request.status != 200){
            if(config.onFailure) config.onFailure({
                text: self.request.responseText,
                code: self.request.status
            });
        }
    }

    // Any params?
    if (config.params) {

        // Params is a string?
        if (config.params.substr) {
            vars = config.params;
        }
        else { // Params is an object
            for (param in config.params) {
                vars += "&" + encodeURIComponent(param) + "=" + encodeURIComponent(config.params[param]);
            }

            // Remove extra ampersand
            vars = vars.substr(1);
        }
    }

    self.fire = function(){
        if (config.method == "GET") {

            // Prepend question mark
            if(vars) vars = "?" + vars;

            // Prime a GET request
            self.request.open("GET", config.url + vars, true);

            // Set additional headers
            for (header in config.headers) {
                self.request.setRequestHeader(header, config.headers[header]);
            }

            // Add request header
            if (config.xRequestedWith) {
                self.request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            }

            // Send the request
            self.request.send(null);
        }
        else { // POST request

            // Prime a POST request
            self.request.open('POST', config.url, true);

            // Set additional headers
            for (header in config.headers) {
                self.request.setRequestHeader(header, config.headers[header]);
            }

            // Add request header
            if (config.xRequestedWith) {
                self.request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            }

            // Necessary POST headers
            self.request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

            // Send the request
            self.request.send(vars);
        }

        return self;
    }

    self.abort = function(){
        self.request.onreadystatechange = null;
        self.request.abort();

        // Fire failure function
        if(config.onFailure) {
            config.onFailure({
                text: self.request.responseText,
                code: self.request.status
            });
        }
    }
}

BK.Ajax.convertHeadersToObject = function(headers) {
    var lines = headers.split("\n");
    var obj = {};

    for (var i = 0; i < lines.length; i++) {
        var components = lines[i].split(": ", 2);
        if (components.length > 1) {
            obj[components[0]] = components[1];
        }
    }

    return obj;

}

