
var Base = {
    initialize: function () {
        console.info("initialize Base!");

        $("#popup1").popup({
            positionTo: $('#hdrHome')
            //    "window"
        });
        $("#popup2").popup({
            positionTo: $('#hdrHome')
            //    "window"
        });
        $("#popup3").popup({
            positionTo: $('#hdrHome')
            //    "window"
        });

        // Show the first prompt in a little
        setTimeout(function () {
            $("#popup2").popup("open");
        }, 2500);

        $( "popup2" ).bind({
            popupafterclose: function (event, ui) {
                setTimeout(function () {
                    $("#popup1").popup("open");
                }, 1000);
            }
        });

        $("popup1").bind({
            popupafterclose: function (event, ui) {
                setTimeout(function () {
                    $("#popup3").popup("open");
                }, 1000);
            }
        });

//        Base.alreadyLoaded = true;
//        Base.fireEvent('DOMisReady', null);

        console.info("Base initialized");
    },
    fireEvent: function (appEvent, appValue) {      // event NOT triggered from DOM
        var event = jQuery.Event(appEvent);
        event.val = appValue;
        $(window).trigger(event);
    },


    drawMap: function () {
        console.info("drawMap");

/*
if (navigator.geolocation) {
    function success(pos) {
        // Location found, show map with these coordinates
        drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
    }
    function fail(error) {
        drawMap(defaultLatLng);  // Failed to find location, show default map
    }
    // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
    navigator.geolocation.getCurrentPosition(success, fail, { maximumAge: 500000, enableHighAccuracy: true, timeout: 6000 });
} else {
    drawMap(defaultLatLng);  // No geolocation support, show default map
}
*/

        var latlng = new google.maps.LatLng(43.6410974, -79.3809379);  // Queen's Quay, Toronto
        var myOptions = {
            zoom: 15,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        //  AIzaSyAhBEyND3Q2d7hG6qsiEa0W_PkA9PlIR8A
        var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

    //    return;

        //        console.log("built map");

        // Add an overlay to the map of current lat/lng
        var contentStr = '<div id="content">' +
           '<div id="siteNotice">' +
           '</div>' +
           '<h1 id="firstHeading" class="firstHeading">Prompt Here!</h1>' +
           '<div id="bodyContent">' +
           '<p>Add this as a place to get prompted when you get here?</p>' +
           '<a href="#pgHome">Make this a Prompt</a>' +
           '</div>' +
           '</div>';
        var infowindow = new google.maps.InfoWindow({
            content: contentStr
        });

        //        console.info("build infoWindow");

        setTimeout(function () {
            var marker = new google.maps.Marker({
                position: latlng,
                map: map,
                draggable: true,
                animation: google.maps.Animation.DROP,              // or bounce
                title: "Your current location - Add for Nudging?"
            });
            marker.addListener('click', function () {
                infowindow.open(map, marker);
            });
        }, 1500);

        var otherLocations = [
          ['Community Favorite', 43.645361, -79.389292, 4],
          ['Community Favorite', 43.646103, -79.392242, 5],
          ['Community Favorite', 43.645043, -79.383230, 3],
          ['Community Favorite', 43.646568, -79.382205, 2],
          ['Community Favorite', 43.648253, -79.383300, 1],
          ['Community Favorite', 43.640252, -79.378817, 1]
        ];

        var mineLocations = [
          ['My Favorite', 43.641289, -79.375792, 4],
          ['My Favorite', 43.640000, -79.378732, 5],
          ['My Favorite', 43.641180, -79.385255, 3]
        ];

        var image = {
            url: 'images/yellow_Marker.png',
            // This marker is 20 pixels wide by 32 pixels high.
            size: new google.maps.Size(20, 34),
            // The origin for this image is (0, 0).
            origin: new google.maps.Point(0, 0),
            // The anchor for this image is the base of the flagpole at (0, 32).
            anchor: new google.maps.Point(10, 34)
        };

        var mineimage = {
            url: 'images/green_Marker.png',
            // This marker is 20 pixels wide by 32 pixels high.
            size: new google.maps.Size(20, 34),
            // The origin for this image is (0, 0).
            origin: new google.maps.Point(0, 0),
            // The anchor for this image is the base of the flagpole at (0, 32).
            anchor: new google.maps.Point(10, 34)
        };

        for (var i = 0; i < otherLocations.length; i++) {
            var loc = otherLocations[i];
            var aName = loc[0];
            var aLat = loc[1];
            var aLon = loc[2];
            var mrkr = new google.maps.Marker({
                position: { lat: aLat, lng: aLon },
                map: map,
                icon: image,
                title: aName
            });
        }

        for (var i = 0; i < mineLocations.length; i++) {
            var loc = mineLocations[i];
            var aName = loc[0];
            var aLat = loc[1];
            var aLon = loc[2];
            var mrkr = new google.maps.Marker({
                position: { lat: aLat, lng: aLon },
                map: map,
                icon: mineimage,
                title: aName
            });
        }

    //    console.log("doing the resize thing");
        google.maps.event.trigger(map, 'resize');
     //   var bounds = new google.maps.LatLngBounds();
     //   map.fitBounds(bounds);

        console.info("drawMap done");
    },

    getRealContentHeight: function () {
        var header = $.mobile.activePage.find("div[data-role='header']:visible");
        var footer = $.mobile.activePage.find("div[data-role='footer']:visible");
        var content = $.mobile.activePage.find("div[data-role='content']:visible:visible");
        var viewport_height = $(window).height();
 
        var content_height = viewport_height - header.outerHeight() - footer.outerHeight();
        if((content.outerHeight() - header.outerHeight() - footer.outerHeight()) <= viewport_height) {
            content_height -= (content.outerHeight() - content.height());
        } 
        console.log("getRealContentHeight: " + content_height);
        return content_height;
    }
};

$(document).on('pagecreate', '#pgHome', Base.initialize);
// pagecreate
$(document).on("pageshow", "#pgLocations", function () {
    console.info("in pagecreate/pgLocations");
    Base.drawMap();
});

function initMap() {
    console.log("initMap called...");
}