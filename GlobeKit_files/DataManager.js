"use strict";

var Site = Site || {};
Site.DataManager = function(){
    var self = this;
    var url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson";
    this.earthquakes = [];
    this.loadSignal = new BK.Signal();

    this.load = function() {
        var a = new BK.Ajax({
            url: url,
            method: "GET",
            onComplete: function(response, headers) {
                for (var i=0; i<response.features.length; i++) {
                    var feature = response.features[i];
                    self.earthquakes.push(new Site.DataManager.Earthquake(feature));
                }

                self.loadSignal.fire();
            }
        });

        a.fire();
    }
}

Site.DataManager.Earthquake = function(data) {
    this.magnitude = data.mag;
    this.desc = data.place;
    this.data = data;

    var coords = data.geometry.coordinates;
    this.latLng = new GK.LatLng(coords[1], coords[0]);
    this.pos = GK.LatLng.toWorld(this.latLng);
}
