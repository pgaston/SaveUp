
// helper to preload images
$.fn.preload = function () {
    this.each(function () {
        $('<img/>')[0].src = this;
    });
}

/*******************
* The Application
*******************/
var RSLBase = {
    channelId: "c104",              // default, will change
    bMP3: true,                     // from canPlayType - not really accurate
    bMP4: true,                     // ""
    bOgg: true,                     // ""
    bACC: true,                     // ""
    pgTransition: 'none',
    useBackButton: true,            // iPhone, maybe others
    bLocalhost: false,
    bRSLhost: false,
    alreadyLoaded: false,           // how to catch a refresh on a child page... ???
    kBegTime: 5,                    // days between begging
    preloadImages: [
    'images/grid/showLive.png',
    'images/grid/showLive-B.png',
    'images/grid/showOff.png',
    'images/50.png',
    'images/ajax-loader.gif',
    'images/errorbutton.png',
    'images/loadingplaybutton.png',
    'images/pausebutton.png',
    'images/playbutton.png',
    'images/stopbutton.png'
    ],

    deviceDesc: "unknown",
    bPhoneGap: false,
    biOS: false,
    bAndroid: false,
    bPhone: false,          // not used yet 
    bPad: false,            // not used yet
    bDesktop: false,        // not used yet

    oldIE: false,

    bHaveWifi: true,
    bWarnWifi: false,

    playingStation: null,           // note that the show can change, leaving possibly an orphaned station playing
    // also note that we keep object - so it sticks around if the channel goes away

    initialize: function () {
        log.info("initialize baseRSL!");

    //    alert("JazzBird - pg="+window.PhoneGap);

        RSLBase.determineDevice();
        if (RSLBase.oldIE) {
            alert("Your internet explorer browser is too old for this application - please upgrade.");
            return false;
        }

        if ( RSLBase.bPhoneGap) {
            log.info("PhoneGap!");
            log.info("PhoneGap test: window.PhoneGap="+window.PhoneGap);
            log.info("media: "+window.PhoneGap.media+", window.PhoneGap.device: "+window.PhoneGap.device);
            log.info("PhoneGap version: "+device.cordova);
        } else
            log.info("Not running on phonegap");

        //       RSLBase.biOS = true;
        //  if (!window.HTMLAudioElement) {
        var audio = $('#audioPlayer')[0];
        if (!audio.canPlayType) {
            alert("Your browser/device will not play audio - you need an html5 browser!");
            return false;
        }
        log.info("canplay mp3=" + audio.canPlayType('audio/mp3'));
        log.info("canplay mp4=" + audio.canPlayType('audio/mp4'));
        log.info("canplay ogg=" + audio.canPlayType('audio/ogg'));
        RSLBase.bMP3 = audio.canPlayType('audio/mp3') != "";
        RSLBase.bMP4 = audio.canPlayType('audio/mp4') != "";
        RSLBase.bOgg = audio.canPlayType('audio/ogg') != "";
        RSLBase.bACC = audio.canPlayType('audio/mp4') != "";

        $(RSLBase.preloadImages).preload();
        RSLPersist.initialize();
        MP3Player.initialize('#audioPlayer');
        Kilroy.initialize();
        //  RSLBase.useBackButton = RSLBase.biOS;
        //  RSLBase.useBackButton = !RSLBase.bAndroid;

        log.info("baseRSL initialization complete");

        RSLBase.fireEvent('DOMisReady', null);
        RSLBase.alreadyLoaded = true;
    },
    fireCustomEvent: function () {
        var $clicked = $(this);
        var eventValue = $clicked.attr("data-appEventValue");
        var event = new jQuery.Event($(this).attr("data-appEvent"));
        if (eventValue) { event.val = eventValue; }
        $(window).trigger(event);
    },
    testInitialized: function (ev) {        // refresh on a child page should call this - need full initialization...
        if (!RSLBase.alreadyLoaded) {
            ev.stopPropagation();                                       // so page itself won't load - this causes flickering
            $.mobile.changePage("#pgHome", { changeHash: true });       // t.b.d. - use url to go to corrrect page
        }
    },
    fireEvent: function (appEvent, appValue) {      // event NOT triggered from DOM
        var event = jQuery.Event(appEvent);
        event.val = appValue;
        $(window).trigger(event);
    },
    bPlaying: function () {
        alert("depr 1");
        return (RSLBase.playingStation != null);
    },
    getPlayingStation: function () {
        alert("depr 2");
        return RSLBase.playingStation;
    },
    setPlaying: function (oStation) {
        alert("depr 3");
        RSLBase.playingStation = oStation;
    },
    stopPlaying: function () {
        alert("depr 4");
        RSLBase.playingStation = null;
    },
    showAppError: function (e) {
        log.error(e.val);
        alert("Error:" + e.val);
    },
    showError: function (e) {
        log.error("System error - " + e.val);
        //    alert("Error:" + e.val);      // t.b.d.
    },
    showWarning: function (e) {
        log.warn(e.val);

        RSLBase.fireEvent('showActualWarning', e.val);
        $("body").oneTime("15s", function () {      // timer for subsequent tries to get new channel data
            RSLBase.fireEvent('hideActualWarning', null);
        });
    },
    OnPause: function () {
        log.info("Starting OnPause");
        purePlayer.toBackground();
    },
    OnResume: function () {
        log.info("Starting OnResume");
        purePlayer.toForeground();
    },
    determineDevice: function () {
        // tests - audio available?   from modernizr   - leverage more or remove?
        // phonegap

        RSLBase.bPhoneGap = window.PhoneGap != undefined;
        RSLBase.wifiTestable = RSLBase.bPhoneGap && 		// Android, BlackBerry, BlackBerry WebWorks (OS 5.0 and higher), iPhone
	        ((device.platform.search(/Simulator/i) >= 0) ||
	         (device.platform.search(/iphone/i) >= 0) ||
	         (device.platform.search(/blackberry/i) >= 0) ||
	         (device.platform.search(/android/i) >= 0));

        RSLBase.bLocalhost = window.location.hostname.indexOf("localhost") >= 0 || window.location.hostname.indexOf("127.0.0.1") >= 0;

        if (navigator.userAgent.match(/MSIE/i)) RSLBase.deviceDesc = "MSIE Desktop";         // from general to specific
        if (navigator.userAgent.match(/Safari/i)) RSLBase.deviceDesc = "Safari Desktop";
        if (navigator.userAgent.match(/Opera/i)) RSLBase.deviceDesc = "Opera Desktop";
        if (navigator.userAgent.match(/Firefox/i)) RSLBase.deviceDesc = "Firefox Desktop";
        if (navigator.userAgent.match(/Chrome/i)) RSLBase.deviceDesc = "Chrome Desktop";
        if (navigator.userAgent.match(/Android/i)) { RSLBase.bAndroid = true; RSLBase.deviceDesc = "Android"; }
        if (navigator.userAgent.match(/webOS/i)) RSLBase.deviceDesc = "webOS";
        if (navigator.userAgent.match(/Windows Phone/i)) RSLBase.deviceDesc = "Windows Phone";
        if (navigator.userAgent.match(/iPad/i)) { RSLBase.biOS = true; RSLBase.deviceDesc = "iPad"; }
        if (navigator.userAgent.match(/iPod/i)) { RSLBase.biOS = true; RSLBase.deviceDesc = "iPod"; }
        if (navigator.userAgent.match(/iPhone/i)) { RSLBase.biOS = true; RSLBase.deviceDesc = "iPhone"; }
        log.info("determineDevice=" + RSLBase.deviceDesc);

        if ($('html').is('.ie6, .ie7, .ie8')) {
            RSLBase.oldIE = true;
        }

        if (window.location.hostname.toLowerCase().indexOf("radioshowlinks") >= 0)
            RSLBase.bRSLhost = true;
    },
    fbSimulator: function () {
        return RSLBase.bLocalhost;
    }
}


/*******************
** The Model - channel/show/station, , persistence
*******************/

//        <items Channel="Talk Radio Shows" forTime="2011-04-24 18:00:00 -00:00" pid="aa-1234567890-bb" aN="" aP="01007107004019" aFB="http://www.facebook.com/pages/Audibilities/199660840060735">
function Channel() {
    return {
        aChannelId: '',
        aName: '',
        oForTime: null,
        aPID: '',
        aN: '',
        aP: '',
        aFB: '',
        vShows: new Array()
    };
}

//   <item bIsShow="True" hid="h762" title="The Clark Howard Show" Genre="Other, Business, and Other genres" Language="English" HomeUrl="http://www.971talk.com/weekends/clark_howard.aspx" bArchive="False" ArchiveUrl="" bPodcast="False" PodcastUrl="" oNextShowing="2011-04-24 19:00:00 -00:00" ShowingVector="28" bS="0" aFB="">
function Show() {
    return {
        aShowId: '',
        aName: '',
        aDescription: '',
        aGenre: '',
        aLanguage: '',
        aHomeUrl: '',
        oNextShowing: null,             // "2011-04-24 18:00:00 -00:00"
        //      aNextShowing: '',
        iShowingVector: 0,
        sample: false,
        bS: true,
        aFaceBook: '',
        vStations: new Array()
    }
}

var RSLChannel = {          // Manage stream Model

    oChannel: null,
    fileChannel: null,
    jqXHRplsDeref: null,

    initialize: function (aChannelId) {
        RSLChannel.abort();             // just in case
        RSLChannel.oChannel = null,
        RSLChannel.fileChannel = "iP" + aChannelId + ".xml";
        RSLChannel.getNewChannelData();

        //        if (!RSLBase.bLocalhost)       // don't bother rereading while testing
        $("body").everyTime("60s", function () {      // timer for subsequent tries to get new channel data
            log.debug("Check channel validity");
            if (RSLChannel.oChannel != null) {
                var oNowPeriod = dtThisPeriod();
                if (oNowPeriod.getTime() == RSLChannel.oChannel.oForTime.getTime()) {
                    log.info("No need for new channel");
                    return;         // no need to get new data
                }
            }
            RSLChannel.getNewChannelData();
        });


    },
    getNewChannelData: function () {
        var oCacheDate = RSLPersist.getCachedDataDate();    // Check the cached version first

        //    oCacheDate = null;

        if (oCacheDate != null) {
            var oNowPeriod = dtThisPeriod();
            log.info("dttm chk Now: " + oNowPeriod.getTime() + "; cache:" + oCacheDate.getTime());
            if (oNowPeriod.getTime() == oCacheDate.getTime()) {     // fine so far
                log.warn("CACHE hit");
                var aC = RSLPersist.getCachedChannelData();
                if (aC != null) {
                    var xmlDoc = $.parseXML(aC);
                    RSLChannel.oChannel = RSLChannel.fParseChannel(xmlDoc);
                    log.info("newChannelRead");
                    RSLBase.fireEvent("newChannelRead", null);
                    return;
                }
            }
        }
        //   log.info("Going to web to get new channel");
        RSLChannel.webGetChannel();
    },
    webGetChannel: function () {
        log.info("read web for channel: " + RSLChannel.fileChannel);
        if (RSLBase.bLocalhost) {      // debugging - from localhost            
            $.ajax({
                type: "GET",
                url: "testdata/" + RSLChannel.fileChannel,
                dataType: "text",       //        dataType: "xml",
                timeout: 5000,
                success: function (data) {
                    //           log.info("success - read from web - size:" + data.length);
                    var xmlDoc = $.parseXML(data);
                    RSLChannel.oChannel = RSLChannel.fParseChannel(xmlDoc);
                    if (RSLChannel.oChannel != null) {
                        RSLPersist.setCachedData(RSLChannel.oChannel.oForTime, data);
                        RSLBase.fireEvent("newChannelRead", null);
                    } else
                        RSLBase.fireEvent("newChannelXMLFailure", "Internal error - server returned bad data");
                },
                error: function (req, status, errThrown) {
                    RSLChannel.abort();
                    RSLBase.fireEvent("newChannelReadFailure", "Localhost? -- Channel server is not currently reachable, please try again later");
                }
            });
        } else {        // normal - get from the live server
            $.ajax({
                type: "GET",
                url: "http://www.radioshowlinks.com/f/d/" + RSLChannel.fileChannel,
                //        dataType: "xml",
                dataType: "text",
                timeout: 25000,
                success: function (data) {
                    //           log.info("success - read from web - size:" + data.length);
                    var xmlDoc = $.parseXML(data);
                    RSLChannel.oChannel = RSLChannel.fParseChannel(xmlDoc);
                    if (RSLChannel.oChannel != null) {
                        RSLPersist.setCachedData(RSLChannel.oChannel.oForTime, data);
                        RSLBase.fireEvent("newChannelRead", null);
                    } else
                        RSLBase.fireEvent("newChannelXMLFailure", "Internal error - server returned bad data");
                },
                error: function (req, status, errThrown) {
                    RSLChannel.abort();
                    RSLBase.fireEvent("newChannelReadFailure", "Channel server is not currently reachable, please try again later");
                }
            });
        }
    },
    fParseChannel: function (oNode) {
        var iCountItems = 0;
        var oChannel = new Channel();
        var oChanNode = $(oNode).find('items');

        if (oChanNode == null) {
            log.error("ParseChannel - node was null");
            return null;
        }

        oChannel.aChannelId = RSLProduct.channelId;
        oChannel.aName = $(oChanNode).attr('Channel');
        //    log.info("oChannel.aName:" + oChannel.aName);

        var aForTime = $(oChanNode).attr('forTime');
        oChannel.oForTime = parseOurDate(aForTime);
        oChannel.aPID = $(oChanNode).attr('pid');
        oChannel.aN = $(oChanNode).attr('aN');
        oChannel.aP = $(oChanNode).attr('aP');
        oChannel.aFB = $(oChanNode).attr('aFB');

        $(oChanNode).find("item").each(function () {      // loop through all shows
            var oShowNode = this;
            var oShow = new Show();
            oShow.aShowId = $(oShowNode).attr('hid');
            var aName = $(oShowNode).attr('title');
            var bSample = aName.indexOf("(B)") > 0;
            if (bSample)
                aName = aName.replace(" (B)", "");
            oShow.aName = aName;
            oShow.aDescription = $(oShowNode).text();
            oShow.aDescription = oShow.aDescription.trim();
            oShow.aGenre = $(oShowNode).attr('Genre');
            oShow.aLanguage = $(oShowNode).attr('Language');
            oShow.aHomeUrl = $(oShowNode).attr('HomeUrl');
            var aNextShowing = $(oShowNode).attr('oNextShowing');
            oShow.oNextShowing = parseOurDate(aNextShowing);
            oShow.iShowingVector = parseInt($(oShowNode).attr('ShowingVector'));
            //            var abS = $(oShowNode).attr('bS');
            //            oShow.bS = abS == "1";
            oShow.bS = bSample;
            oShow.aFaceBook = $(oShowNode).attr('aFB');
            iCountItems++;

            $(oShowNode).find("station").each(function () {      // loop through all stations for this show
                var oStatNode = this;
                var aCdc = $(oStatNode).attr('cdc');
                var aHnt = $(oStatNode).attr('hnt');
                var bNoAAC = RSLProduct.bNoACC && (aCdc == "aac");
                var bNoShout = RSLProduct.bNoShout && (aHnt == "shout");
                var bNoHTML5 = RSLProduct.bNoHTML5 && (aHnt == "nohtml5");

                if (!(bNoAAC || bNoShout || bNoHTML5)) {     // don't bother reading them in
                    var oStation = new Station();

                    oStation.aStreamId = $(oStatNode).attr('StrId');
                    var aName = $(oStatNode).attr('stitle');
                    var bSample = aName.indexOf("(B)") > 0;
                    if (bSample)
                        aName = aName.replace(" (B)", "");
                    oStation.aName = aName;
                    //    oStation.aName = $(oStatNode).attr('stitle');
                    oStation.aLocation = $(oStatNode).attr('location');
                    oStation.aBandwidth = $(oStatNode).attr('bw');
                    var abS = $(oShowNode).attr('bS');
                    oStation.bS = abS == "1";
                    oStation.aUrl = $(oStatNode).attr('su');
                    oStation.aHint = $(oStatNode).attr('hnt');
                    oStation.aCodec = aCdc;

                    //     var oStation = RSLChannel.newStation($(oStatNode).attr('StrId'), $(oStatNode).attr('stitle'), $(oStatNode).attr('location'), $(oStatNode).attr('bw'), $(oShowNode).attr('bS'), $(oStatNode).attr('su'), $(oStatNode).attr('hnt'), $(oStatNode).attr('cdc'));

                    oShow.vStations.push(oStation);
                }
            });

            // and throw away shows with no stations (due to AAC...)

            /*        // If lite, no non-sample shows
            if ((RSLProduct.bFullVersion || oShow.bS) && (oShow.vStations.length > 0))      // if we were removing AAC, then this show may not be valid
            oChannel.vShows.push(oShow);
            */

            if (oShow.vStations.length > 0)      // if we were removing AAC, then this show may not be valid
                oChannel.vShows.push(oShow);
        });

        if (iCountItems == 0) {
            log.error("parse channel - no shows");
            return null;
        }

        //    log.info("Channel parsed: shows:" + iCountItems);
        return oChannel;
    },
    oGetShowFromId: function (hId) {
        for (var i = 0; i < RSLChannel.oChannel.vShows.length; i++) {
            if (this.oChannel.vShows[i].aShowId == hId)
                return this.oChannel.vShows[i];
        }
        return null;
    },
    oGetShowFromStationId: function (strmId) {
        for (var i = 0; i < RSLChannel.oChannel.vShows.length; i++) {
            var oShow = this.oChannel.vShows[i];
            for (var j = 0; j < oShow.vStations.length; j++) {
                if (oShow.vStations[j].aStreamId == strmId)
                    return oShow;
            }
        }
        return null;
    },
    oGetStationFromStationId: function (strmId) {
        for (var i = 0; i < RSLChannel.oChannel.vShows.length; i++) {
            var oShow = this.oChannel.vShows[i];
            for (var j = 0; j < oShow.vStations.length; j++) {
                if (oShow.vStations[j].aStreamId == strmId)
                    return oShow.vStations[j];
            }
        }
        return null;
    },
    getFavStation: function (oShow) {
        var dictShSt = RSLPersist.getJSON('favShowStation', {});
        var aStId = dictShSt[oShow.aShowId];        // fav station for this show
        if (aStId != null) {
            for (var i = 0; i < oShow.vStations.length; i++) {
                var oStation = oShow.vStations[i];
                if (oStation.aStreamId == aStId)
                    return oStation;
            }
        }
        // no luck, try to get the latest station from the list of all of our favorite stations
        var vSt = RSLPersist.getJSON('favStations', {});
        for (var j = vSt.length - 1; j >= 0; j--) {
            var aStId = vSt[j];
            for (var i = 0; i < oShow.vStations.length; i++) {
                var oStation = oShow.vStations[i];
                if (oStation.aStreamId == aStId)
                    return oStation;
            }
        }
        return oShow.vStations[0];      // default - first one
    },
    setFavStation: function (aShow, aStation) {
        var dictShSt = RSLPersist.getJSON('favShowStation', {});
        dictShSt[aShow] = aStation;             // save station for this show
        RSLPersist.setJSON(dictShSt, 'favShowStation');

        var vSt = RSLPersist.getJSON('favStations', []);
        removeByElement(vSt, aStation);
        vSt.push(aStation);                     // save as general, favorite station
        RSLPersist.setJSON(vSt, 'favStations');
    },
    abort: function () {
        if (this.jqXHRplsDeref != null)
            this.jqXHRplsDeref.abort();
        this.jqXHRplsDeref = null;
    }
};

function aBW(oStation) {
    switch (parseInt(oStation.aBandwidth)) {
        case 0:
            return "very low";
            break;
        case 1:
            return "low";
            break;
        case 2:
            return "moderate";
            break;
        case 3:
            return "high";
            break;
        case 4:
            return "very high";
            break;
    }
    return "unknown";
}

// Regex to help parse out the stream
/*
var chkPreRE = /audioport|mp3streamer/i;
var notShoutCastRE = /MP3|wpfwfm|wgbh|greenhost.nl|streaming.siue.edu|wbaa.purdue.edu|llnw|stretchinternet|streamguys|icecast|pubint|linux|liquidcompass|streamtheworld|warpradio|affordablestreaming|mp3streamer|audioport|warpradio|\.icy\.|\/\/stream\.wbai|\/\/stream\.kpft/i;
*/
var playListKey = /\[playlist\]/;
var urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
var fileNRegEx = /File\d=/;
var whiteRegEx = /\s/;
var eolRegEx = /$/m;
var localRE = /localhost/i;
//       <station StrId="185063" stitle="KRLA" location="California/USA/North America" bw="2" bS="0" su="http://den-a.plr.liquidcompass.net/pls/KRLAAMAAC.pls" hnt="" cdc="aac" />
function Station() {
    return {
        aStreamId: '',
        aName: '',
        aLocation: '',
        aBandwidth: '',
        bS: false,
        aUrl: '',
        aCodec: '',
        aHint: '',
        plList: null,           // get's fed after first read
        indexPlayList: 0,    // currently teed up url in playlist
        jqXHRplsDeref: null, // used for http call

        activate: function () {   // called when want to prep the station to be ready to stream
            if (this.plList == null) {
                this.plList = new Array();
                this.indexPlayList = 0;
            }
            this.derefUrl();            // kick off dereferencing -- result is a good or bad event trigger
        },
        getCurrentUrl: function () {
            return this.plList[this.indexPlayList];
        },
        getNextUrl: function () {        // progress through playlist
            var aUrl = this.plList[this.indexPlayList++];
            if (this.indexPlayList >= this.plList.length)        // simply cycle on last one...
                this.indexPlayList = this.plList.length - 1;
            return aUrl;
        },
        derefDone: function () {
            return (this.plList.length > 0);
        },
        derefUrl: function () {       // Actually go out and retrieve it from the web
            if (this.plList.length > 0) {      // never mind, we've already read this from the web - re-use last time
                this.indexPlayList = 0;
                RSLBase.fireEvent("derefComplete", this.aStreamId);
                return;
            }

            this.abort();                           // just in case an existing request was out there - for consistency it's got to be removed...

            if (RSLBase.bPhoneGap) {            // Always deref otherwise
                log.info("derefUrl - going direct for " + this.aUrl);
                jqXHRplsDeref = $.ajax({
                    type: "GET",
                    url: this.aUrl,
                    //    dataType: "html",
                    crossDomain: true,      // per jQuery doc
                    timeout: 15000,
                    context: this,
                    success: function (data, textStatus, jqXHR) {
                        //    log.debug("Direct deref read success - returned " + data);
                        log.info("direct deref payload: " + data);
                        this.jqXHRplsDeref = null;
                        this.derefSuccess(data);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        log.debug("direct deref read failure: " + textStatus + "; errThrown: " + errorThrown);     // could interrogate the jqXHR object if needed...
                        RSLBase.fireEvent("derefFail", { error: "Stream (PLS/M3U) unknown read failure", aStreamId: this.aStreamId } );
                    }
                });
            } else {        // using JSONP to RSL
                var aGetUrl = "http://www.radioshowlinks.com/fill.aspx?fuse=98&streamid=stream" + this.aStreamId;      //  +"&callback=?";   automatically added in by jQuery
                log.debug("using JSONP to RSL to dereference stream url : " + aGetUrl);

                jqXHRplsDeref = $.ajax({
                    url: aGetUrl,
                    dataType: "jsonp",
                    crossDomain: true,      // per jQuery doc
                    cache: true,
                    context: this,
                    timeout: 15000,             // extra - RSL can be very slowwwww
                    success: function (data) {
                        if (data.success == "no stream") {
                            log.debug("RSL - no stream");
                            RSLBase.fireEvent("derefFail",  { error: "No Stream from RSL server read", aStreamId: this.aStreamId } );
                            return;
                        }
                        if ((data.success == "true") || (data.success == "fail")) {
                            var aPayload = unescape(data.payload);
                            if (data.success == "fail")
                                aPayload = unescape(data.url);
                            log.info("jsonp payload: " + aPayload);
                            this.jqXHRplsDeref = null;
                            this.derefSuccess(aPayload);
                            return;
                        }

                        log.debug("RSL jsonp -ERROR- returns!");
                        RSLBase.fireEvent("derefFail", { error: "Stream (PLS/M3U) unknown read failure", aStreamId: this.aStreamId });

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        this.abort();
                        if (textStatus != "abort")
                            RSLBase.fireEvent("derefFail", { error: "Stream (PLS/M3U) read failure", aStreamId: this.aStreamId });
                    }
                });
            }
        },
        activateDirect: function () {   // called when want to prep the station to be ready to stream
            if (this.plList == null) {
                this.plList = new Array();
                this.indexPlayList = 0;
            }
            this.dirDeref();            // kick off dereferencing -- result is a good or bad event trigger
        },
        dirDeref: function () {                 // Actually go out and retrieve it from the web
            this.abort();                           // just in case an existing request was out there - for consistency it's got to be removed...

            var aGoFor = 'http://whateverorigin.org/get?url=' + encodeURIComponent(this.aUrl) + "&callback=?";
            //     var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + aUrl + '"') + '&format=xml&callback=?'; // cbFunc';
            log.info("dirDeref - going direct for " + this.aUrl + "using: " + aGoFor);

            jqXHRplsDeref = $.ajax({
                dataType: "json",
                url: aGoFor,
                context: this,
                timeout: 15000,             // extra - RSL can be very slowwwww
                success: function (data, txtStatus, jqXHR) {
                    this.abort();
                    if (data.contents[0]) {     // If we have something to work with...  
                        this.jqXHRplsDeref = null;
                        this.derefSuccess(data.contents);
                    } else
                        RSLBase.fireEvent("derefFail", { error: "dirDeref unknown failure", aStreamId: this.aStreamId });

                },
                error: function (jqXHR, textStatus, errorThrown) {
                    log.info("jsonp - ERROR");
                    if (textStatus != "abort")
                        RSLBase.fireEvent("derefFail", { error: "Stream (PLS/M3U) read failure", aStreamId: this.aStreamId });
                }
            });

        },
        derefSuccess: function (aPayload) {      // common code, no matter how we got the deref'd data
            log.info("derefSuccess!");
            RSLBase.fireEvent("derefData", aPayload);
            this.parseDeref(aPayload);
            this.returnCheckForAnything();
            RSLBase.fireEvent("derefComplete", this.aStreamId);
        },
        parseDeref: function (aDeRefed) {      // called when a deref event returns successfully
            var aFileUrl;
            var iStart, iEnd, iUrlEnd;
            var aDeref = aDeRefed;      // save, just in case

            iStart = aDeRefed.search(playListKey);
            // Two sides -- 1. pls/php/aspx   2. m3u
            if (iStart >= 0) {       // at least one m3u is really a playlist...
                // sample for http://media.kcrw.com/live/kcrwlive.pls
                // [playlist] 
                // numberofentries=1
                // File1=http://64.12.61.1:80/stream/1046
                // Title1=KCRW
                iStart = aDeRefed.search(playListKey);
                if (iStart < 0) {                         // case insensitive
                    plMsg = "Deref'd - not real playlist";
                    // okay, next best thing - take the first set of characters (hopefully url) ending with space/newline
                    aDeRefed = aDeRefed.trim();
                    iEnd = aDeRefed.search(whiteRegEx);      // url is from past the '=' to the next space or return
                    if (iEnd < 0) iEnd = aDeRefed.length;
                    aFileUrl = aDeRefed.substr(0, iEnd);
                    this.plAddUrl(aFileUrl);
                } else {
                    plMsg = "pls decode";
                    aDeRefed = aDeRefed.substr(iStart + 10);       // [playlist]
                    iStart = aDeRefed.search(fileNRegEx);
                    while (iStart >= 0) {
                        aDeRefed = aDeRefed.substr(iStart + 6);    // File3=

                        iUrlEnd = aDeRefed.search(whiteRegEx);      // url is from past the '=' to the next space or return
                        if (iUrlEnd < 0) iUrlEnd = aDeRefed.length;
                        aFileUrl = aDeRefed.substr(0, iUrlEnd);
                        this.plAddUrl(aFileUrl);

                        aDeRefed = aDeRefed.substr(iUrlEnd);
                        iStart = aDeRefed.search(fileNRegEx);       // search for next one
                    }
                }
            } else {        // m3u side
                // Should be either lines starting with # or a url
                // in some cases (http://wuga.org/wuga-hi.m3u) the url is on the same line...
                plMsg = "m3u decode";
                // skip all lines starting with # - add the rest to the playlist
                iEnd = aDeRefed.indexOf("\n");
                if (iEnd < 0) iEnd = aDeRefed.length;
                //    iEnd = aDeRefed.search(eolRegEx);
                while (iEnd > 0) {
                    iStart = aDeRefed.indexOf("#");
                    if ((iStart < 0) || (iStart >= iEnd)) {      // then use this line!
                        iUrlEnd = aDeRefed.search(whiteRegEx);      // url is from past the '=' to the next space or return
                        if (iUrlEnd < 0) iUrlEnd = aDeRefed.length;
                        aFileUrl = aDeRefed.substr(0, iUrlEnd);
                        this.plAddUrl(aFileUrl);
                    }

                    aDeRefed = aDeRefed.substr(iEnd + 1);    // to end of line
                    aDeRefed = aDeRefed.trim();
                    iEnd = aDeRefed.indexOf("\n");       // to next line, or end...
                    if (iEnd < 0) iEnd = aDeRefed.length;
                }
                // Special test - url not found, but on the line...
                if (this.plList.length <= 0) {       // didn't find anything
                    var m = urlRegex.exec(aDeref);
                    if (m != null) {         // found one - good enough for now (if we find one with a pre-roll we can loop for all urls...
                        aFileUrl = m[0];
                        this.plAddUrl(aFileUrl);
                    }
                }
            }
        },
        plAddUrl: function (aNewUrl) {
            aNewUrl = aNewUrl.trim();
            if (aNewUrl.length <= 0)
                return;
            if (aNewUrl.toLowerCase().indexOf("http://") != 0)
                return;

            if (this.aHint == "shout") {   // not needed now - would've been excluded earlier at load time
                var aLastChar = aNewUrl[aNewUrl.length - 1];
                if (aLastChar == "/")
                    aNewUrl += ";";        // shoutcast addition...
                else
                    aNewUrl += "/;"        // shoutcast addition...
            }

            /*
            // Previous shoutcast 'algorithm'
            var aCurrentExt = fileNameExtension(aNewUrl);
            var aInitialExt = fileNameExtension(this.aUrl);

            // http://stream.wbai.org:8000/24k.m3u --> http://localhost:8000/24k 
            if ((aNewUrl.search(localRE) > 0) && (aInitialExt == "m3u"))     // this seems very hard-coded...
            aNewUrl = this.aUrl.substr(0, this.aUrl.length - 4);

            var iPreNotSC = this.aUrl.search(chkPreRE);

            // hmmm http://stream.weta.org:8000/ is shoutcast...
            // but http://stream.wbai.org:8000/24k is NOT   -- hard coded for now for wbai...
            // but http://stream.kpft.org:8000/live is NOT   -- hard coded for now for wbai...

            var iNotSC = aNewUrl.search(notShoutCastRE);
            var bNotShoutHint = this.aHint.search(/noshout/i) >= 0;
            var bNotShout = bNotShoutHint || (aCurrentExt == "mp3") || (iNotSC >= 0) || (iPreNotSC >= 0);
            var bShout = this.aHint.search(/shout/i) >= 0;

            if (bShout || !bNotShout) {  // Check if needs shoutcast addition to url
            //    log.warn("Shoutcast detected, ignored for " + aNewUrl);
            if (aLastChar == "/")
            aNewUrl += ";";        // shoutcast addition...
            else
            aNewUrl += "/;"        // shoutcast addition...
            }
            */

            this.plList.push(aNewUrl);
        },
        returnCheckForAnything: function () {
            if (this.plList.length == 0) {
                this.plAddUrl(this.aUrl);                 // add it on - it's the best we have
            }
        },
        abort: function () {
            if (this.jqXHRplsDeref != null)
                this.jqXHRplsDeref.abort();
            this.jqXHRplsDeref = null;
        }
    }
}


//***************
//**MP3 Player **   Control over stream dereferencing and audio player
//***************

var MP3PlayerStatus = {
    Stopped: 0,
    WaitingOnDeref: 1,
    Starting: 2,
    Playing: 3,
    Paused: 4,
    Error: 5
};

var MP3Player = {
    status: MP3PlayerStatus.Stopped,
    oViewStream: null,      // Station/Stream object
    oPlayStream: null,
    timeLastSeenPlaying: 0, // for return from background
    bWasPlaying: false,     // for return from background

    initialize: function (audioDOM) {
        log.info("MP3 player initialize");
        purePlayer.initialize(audioDOM);
        // watchdog

        $("body").everyTime("2s", function () {      // watchdog timer - looking for play state, but not playing
            if (purePlayer.playerIsPlaying()) {
                var elapsed = (new Date()).getTime() - purePlayer.timeLastSeenPlaying;
                if (elapsed > 5000) {
                    log.info("WATCHDOG - resetting - timed out at: " + elapsed / 1000.0 + " seconds");
                    log.info("AUDIO - readyState:" + purePlayer.aPlayer.readyState + ", playing time: " + purePlayer.aPlayer.currentTime);
                    log.info("AUDIO - played-start:" + purePlayer.aPlayer.played.start(0) + "AUDIO - played-end:" + purePlayer.aPlayer.played.end(0) + ", networkState: " + purePlayer.aPlayer.networkState);
                    log.info("AUDIO - error:" + purePlayer.aPlayer.error + ", paused: " + purePlayer.aPlayer.paused);
                    log.info("AUDIO - duration:" + purePlayer.aPlayer.duration + ", currentSrc: " + purePlayer.aPlayer.currentSrc);
                    log.info("AUDIO - playbackRate:" + purePlayer.aPlayer.playbackRate + ", defaultPlaybackRate : " + purePlayer.aPlayer.defaultPlaybackRate);

                    MP3Player.resetPlayer();
                    RSLBase.fireEvent('playerError', 'Source stream stopped playing');
                }
            }
        });

    },
    resetPlayer: function () {
        purePlayer.resetPlayer();
        MP3Player.toState(MP3PlayerStatus.Stopped);
        RSLBase.fireEvent('showPlayerStatus', null);
    },
    isPlaying: function () {
        return (purePlayer.playerIsPlaying());
    },
    getPlayingStation: function () {
        if (MP3Player.oPlayStream == null) {
            log.error("oPlayStream was null in MP3Player - getPlayingStation");
            return null;
        }
        return MP3Player.oPlayStream;
    },
    newStreamView: function (oNewStream, aNewShowId) {       // Start off with this stream.    Note that another stream could be playing
        MP3Player.aShowId = aNewShowId;
        MP3Player.oViewStream = oNewStream;
        if (MP3Player.status == MP3PlayerStatus.Paused)     // no quick restart
            MP3Player.status = MP3PlayerStatus.Stopped;

        oNewStream.abort();                 // Pre-read - just in case
        oNewStream.activate();              // Kick off pre-read - just for performance, not baked into state machine
        RSLBase.fireEvent('showPlayerStatus', null);
    },
    newTestStream: function (oNewStream) {
        MP3Player.oViewStream = oNewStream;
        if (MP3Player.status == MP3PlayerStatus.Paused)     // no quick restart
            MP3Player.status = MP3PlayerStatus.Stopped;

        oNewStream.abort();                 // Pre-read - just in case
        RSLBase.fireEvent('showPlayerStatus', null);
    },
    toState: function (newState) {
        if (newState != MP3Player.status) log.info("MP3 state: " + newState);
        MP3Player.status = newState;
    },
    startOff: function () {
        RSLBase.fireEvent('hideActualWarning', null);
        MP3Player.clearElapsedTime();
        purePlayer.resetPlayer();           // stops current playing if in action
        RSLChannel.setFavStation(MP3Player.aShowId, MP3Player.oViewStream.aStreamId);

        MP3Player.toState(MP3PlayerStatus.WaitingOnDeref);
        MP3Player.oViewStream.activate();

        Kilroy.fill(MP3Player.oViewStream.aStreamId);                 // tell RSL that we were here and kicked off a stream...
    },
    leaveView: function () {
        if (MP3Player.oViewStream == null) {
            log.error("oViewStream was null in MP3Player - leaveView");
            return;
        }
        MP3Player.oViewStream.abort();
        MP3Player.oViewStream = null;

        if (purePlayer.playerIsPlaying())
            return;

        if (MP3Player.status == MP3PlayerStatus.Error)
            MP3Player.toState(MP3PlayerStatus.Stopped);

        purePlayer.resetPlayer();
        MP3Player.toState(MP3PlayerStatus.Stopped);
    },
    btnAction: function () {
        if (MP3Player.oViewStream == null) {
            log.error("oViewStream was null in MP3Player - btnAction");
            return;
        }
        switch (MP3Player.status) {
            case MP3PlayerStatus.Stopped:                       // needs to dereference before playing
                MP3Player.startOff();
                break;
            case MP3PlayerStatus.WaitingOnDeref:                // stream should not be playing
                oViewStream.abort();
                MP3Player.toState(MP3PlayerStatus.Stopped);
                break;
            case MP3PlayerStatus.Starting:
                purePlayer.resetPlayer();                       // starting, possibly already playing
                MP3Player.toState(MP3PlayerStatus.Stopped);
                break;
            case MP3PlayerStatus.Playing:
                purePlayer.pausePlayer();                      // starting, possibly already playing

                if (MP3Player.oPlayStream == MP3Player.oViewStream)   // quick restart, or full restart?
                    MP3Player.toState(MP3PlayerStatus.Paused);
                else
                    MP3Player.toState(MP3PlayerStatus.Stopped);
                MP3Player.oPlayStream = null;
                MP3Player.clearElapsedTime();
                break;
            case MP3PlayerStatus.Paused:
                purePlayer.dePausePlayer();                    // starting, possibly already playing
                MP3Player.toState(MP3PlayerStatus.Starting);
                break;
            case MP3PlayerStatus.Error:
                MP3Player.toState(MP3PlayerStatus.Stopped);
                break;
        }
        RSLBase.fireEvent('showPlayerStatus', null);
    },
    deRefComplete: function (ev) {                              // first, a few checks before continuing state machine
        if (MP3Player.oViewStream == null) {                              // pre-read - wouldn't have clicked play yet...
            log.info("deRefComplete - no viewstream");
            return;
        }
        var aStreamId = ev.val;
        log.info("derefComplete: viewing: " + MP3Player.oViewStream.aStreamId + "  Deref for " + aStreamId);
        if (aStreamId != MP3Player.oViewStream.aStreamId) {
            log.info("deRefComplete - stream was not from current viewstream");
            return;
        }

        if (MP3Player.status != MP3PlayerStatus.WaitingOnDeref) {   // just the pre-read (or some other random state) - ignore
            log.info("deref complete - preread");
            return;
        }

        // Next state, kick off playing!
        purePlayer.startPlaying(MP3Player.oViewStream);
        MP3Player.toState(MP3PlayerStatus.Starting);
        RSLBase.fireEvent('showPlayerStatus', null);
    },
    deRefError: function (ev) {
        if (oViewStream == null) {                              // pre-read - wouldn't have clicked play yet...
            log.info("deRefError - no viewstream - ignore error");
            return;
        }

        var aErr = ev.val.error;
        var aStreamId = ev.val.aStreamId;
        log.info("deRefError: viewing: " + MP3Player.oViewStream.aStreamId + "  Deref for " + aStreamId);
        if (aStreamId != MP3Player.oViewStream.aStreamId) {
            log.info("deRefError - stream was not from current viewstream - ignore");
            return;
        }

        if (MP3Player.status != MP3PlayerStatus.WaitingOnDeref) {
            log.warn("deRefComplete, our stream, but wrong state!   ignore");
        }

        MP3Player.toState(MP3PlayerStatus.Error);
        log.warn('deRef Failure! ' + aErr);
        RSLBase.fireEvent('warning', aErr);
        RSLBase.fireEvent('showPlayerStatus', null);
    },
    // now transition to playing, to error, to pause ??
    streamPlaying: function () {
        if (MP3Player.status != MP3PlayerStatus.Playing) {
            MP3Player.oPlayStream = MP3Player.oViewStream;
            MP3Player.toState(MP3PlayerStatus.Playing);
            RSLBase.fireEvent('showPlayerStatus', null);
        }
    },
    streamReStarting: function () {
        if (MP3Player.status != MP3PlayerStatus.Starting) {
            MP3Player.oPlayStream = MP3Player.oViewStream;
            MP3Player.toState(MP3PlayerStatus.Starting);
            RSLBase.fireEvent('showPlayerStatus', null);
        }
    },
    streamError: function (ev) {
        MP3Player.oPlayStream = null;
        MP3Player.clearElapsedTime();
        MP3Player.toState(MP3PlayerStatus.Error);
        RSLBase.fireEvent('warning', ev.val);
        RSLBase.fireEvent('showPlayerStatus', null);
    },
    getBtnImage: function () {
        switch (MP3Player.status) {
            case MP3PlayerStatus.Stopped:
                return "images/playbutton.png";
            case MP3PlayerStatus.WaitingOnDeref:
                return "images/ajax-loader.gif";      // would be fun to show going in reverse...
            case MP3PlayerStatus.Starting:
                return "images/ajax-loader.gif";
            case MP3PlayerStatus.Playing:
                return "images/pausebutton.png";
            case MP3PlayerStatus.Paused:
                return "images/playbutton.png";
            case MP3PlayerStatus.Error:
                return "images/errorbutton.png";
        }
        return "images/50.png";     // bad...
    },
    clearElapsedTime: function () {                    // btw, showElapsedTime passes directly up w/ real seconds
        RSLBase.fireEvent('showElapsedTime', "");     // signal to clear out min:sec display
    },

    // only used w/ phonegap - ignore for now
    toBackground: function () {
        log.debug("player to background");
        MP3Player.bWasPlaying = purePlayer.playerIsPlaying();
        if (!RSLProduct.bFullVersion && MP3Player.bWasPlaying)
            purePlayer.pausePlayer();
    },
    toForeground: function () {
        log.debug("player to foreground");
        // if lite and was playing - restart
        if (!RSLProduct.bFullVersion && MP3Player.bWasPlaying) {
            purePlayer.dePausePlayer();
            RSLBase.fireEvent('showPlayerStatus', null);
        }

        // if full and was playing - check to see if still playing - if not, reset plyrStatus
        /*
        if (RSLProduct.bFullVersion && purePlayer.bWasPlaying && (purePlayer.timeLastSeenPlaying != null)) {
        // not sure if our time update method will be called while we're in the background...
        log.debug("back!!  timeLastSeenPlaying=" + purePlayer.timeLastSeenPlaying / 1000 + "; currently=" + (new Date()).getTime() / 1000);
        var delta = (new Date()).getTime() - purePlayer.timeLastSeenPlaying;
        if (delta > 5000) {
        purePlayer.resetPlayer();
        RSLBase.fireEvent('showPlayerStatus', null);
        }
        }
        */
    }

}




//***************
//**Pure Player**
//***************

var PlayerStatus = {
    Stopped: "stop",
    Starting: "starting",
    Playing: "playing",
    Paused: "paused"
};

var Media = {           // PhoneGap media status
        MEDIA_NONE: 0,
        MEDIA_STARTING: 1,
        MEDIA_RUNNING: 2,
        MEDIA_PAUSED: 3,
        MEDIA_STOPPED: 4
};
var MediaError = {
    MEDIA_ERR_NONE_ACTIVE: 0,
    MEDIA_ERR_ABORTED: 1,
    MEDIA_ERR_NETWORK: 2,
    MEDIA_ERR_DECODE: 3,
    MEDIA_ERR_NONE_SUPPORTED: 4,
};

var purePlayer = {

    aPlayer: null,          // points to <audio> object
    pgMedia: null,          // PhoneGap Media object
    plyrStatus: PlayerStatus.Stopped,
    oStream: null,          // Station/Stream object
    timeLastSeenPlaying: 0, // for return from background test (were we still playing?   not debugged yet)

    initialize: function (audioDOM) {
        log.info("initialize audio with " + audioDOM);
        if (RSLBase.bPhoneGap) {
            log.info("MEDIA - initialize");
        } else {
            purePlayer.aPlayer = $(audioDOM)[0];
            $(purePlayer.aPlayer).bind('playing', purePlayer.playerPlaying);
            $(purePlayer.aPlayer).bind('timeupdate', purePlayer.timeUpdate);
            $(purePlayer.aPlayer).bind('ended', purePlayer.playerEnded);            // not sure that this ever occurs w/ our streams
            $(purePlayer.aPlayer).bind('error', purePlayer.playerError);
        }
    },
    playerIsStopped: function () {
        return ((purePlayer.plyrStatus == PlayerStatus.Stopped) || (purePlayer.plyrStatus == PlayerStatus.Paused));
    },
    playerIsPlaying: function () {
        return (purePlayer.plyrStatus == PlayerStatus.Playing);
    },
    resetPlayer: function () {
        log.info("reset player");
        purePlayer.newTimeUpdate(0);
        if (RSLBase.bPhoneGap) {
            if (purePlayer.pgMedia != null) {
                purePlayer.pgMedia.stop();
                $("body").stopTime( "pgTimer" );
                purePlayer.pgMedia.release();
                purePlayer.pgMedia = null;
            }
        } else {
            purePlayer.aPlayer.pause();
            purePlayer.aPlayer.type = "";
        }
        purePlayer.plyrStatus = PlayerStatus.Stopped;
    },
    startPlaying: function (oNewStream) {
        purePlayer.oStream = oNewStream;
        purePlayer.resetPlayer();
        purePlayer.setupAndStart();
    },
    getNextUrl: function () {        // progress through playlist
        var aUrl = purePlayer.plList[this.indexPlayList++];
        if (purePlayer.indexPlayList >= this.plList.length)        // simply cycle on last one...
            purePlayer.indexPlayList = this.plList.length - 1;
        return aUrl;
    },
    setupAndStart: function () {
        var aUrl = purePlayer.oStream.getNextUrl();
        var aType = "";       // default
        //        if (purePlayer.oStream.aCodec == "mp3") aType = "audio/mp3";
        if (purePlayer.oStream.aCodec == "mp3") aType = "audio/mpeg";
        if (purePlayer.oStream.aCodec == "acc") aType = "audio/mp4";
        if (purePlayer.oStream.aCodec == "ogg") aType = "audio/ogg";

        if (RSLBase.bPhoneGap) {
            purePlayer.resetPlayer();
            log.info("MEDIA - create and start: "+aUrl);
            purePlayer.pgMedia = new Media(aUrl, purePlayer.playerEnded, purePlayer.mediaError, purePlayer.mediaStatus);
            purePlayer.pgMedia.play();

            $("body").everyTime("1s", "pgTimer", function () {     // look to update the duration
                if ( ( purePlayer.pgMedia != null ) && (purePlayer.playerIsPlaying()) )
                    purePlayer.pgMedia.getCurrentPosition(
                        function(position) {
                            if (position > -1)
                                purePlayer.newTimeUpdate(position);
                        },
                        function(err) {
                            log.info("ERROR: getPosition: "+err);
                        }
                    );
            });

        } else {
            log.info("start player with " + aUrl + " --" + aType + "--");
            purePlayer.aPlayer.src = aUrl;
            purePlayer.aPlayer.type = aType;
            purePlayer.aPlayer.play();
        }
        purePlayer.plyrStatus = PlayerStatus.Starting;
    },
    mediaStatus: function (stat) {
        switch (stat) {
            case Media.MEDIA_NONE:
                break;
            case Media.MEDIA_STARTING:
                break;
            case Media.MEDIA_RUNNING:
                purePlayer.plyrStatus = PlayerStatus.Playing;
                RSLBase.fireEvent('playerStarted', null);
                break;
            case Media.MEDIA_PAUSED:
                break;
            case Media.MEDIA_STOPPED:
                break;
            default:
                //
        }
    },
    pausePlayer: function () {
        if ( RSLBase.bPhoneGap) {
            purePlayer.pgMedia.pause();
        } else {
            purePlayer.aPlayer.pause();
        }
        purePlayer.plyrStatus = PlayerStatus.Paused;
    },
    dePausePlayer: function () {
        if ( RSLBase.bPhoneGap)
            purePlayer.pgMedia.play();
        else 
            purePlayer.aPlayer.play();
        
        purePlayer.plyrStatus = PlayerStatus.Starting;
    },
    // events from player itself
    playerPlaying: function () {
        //    log.info("player is playing!");
        purePlayer.plyrStatus = PlayerStatus.Playing;
        RSLBase.fireEvent('playerStarted', null);
    },
    timeUpdate: function () {
        purePlayer.plyrStatus = PlayerStatus.Playing;
        purePlayer.newTimeUpdate( Math.floor( purePlayer.aPlayer.currentTime ) );
    },
    newTimeUpdate: function(iElapsed) {
        var iPlayingMins = Math.floor(iElapsed / 60);
        var iPlayingSecs = iElapsed - iPlayingMins * 60;
        var aElapsed = iPlayingMins + ":" + pad(iPlayingSecs)
        RSLBase.fireEvent('showElapsedTime', aElapsed);
        if (purePlayer.plyrStatus == PlayerStatus.Starting) {      // sometimes get stuck in 'loading'
            purePlayer.plyrStatus = PlayerStatus.Playing;
            RSLBase.fireEvent('playerStarted', null);
        }
        purePlayer.timeLastSeenPlaying = (new Date()).getTime();     // useful when we're playing in background, i.e., are we still playing?
    },
    playerEnded: function () {      // current stream ended (pre-roll?), 'probably' another following, not sure how to handle this...
        log.info("this stream ended...on to next in playlist");
        purePlayer.setupAndStart();
        RSLBase.fireEvent('playerReStarting', null);
    },
    mediaError: function (error) {      // PhoneGap errors
        log.info("MEDIA ERROR - "+error);
        handleError(error);
    },
    playerError: function (e) {         // html5 error
        if (e.target.error == null) {
            log.warn("playerError called without an error being present");
            handleError(0);
        } else 
            handleError(e.target.error.code);
    },
    handleError: function (err) {
        purePlayer.resetPlayer();
        var aErr = "Unknown Audio Error";
        switch (err) {
            case MediaError.MEDIA_ERR_NONE_ACTIVE:
                aErr = 'No error (?)';
                break;
            case MediaError.MEDIA_ERR_ABORTED:
                aErr = 'You aborted the playback.';
                break;
            case MediaError.MEDIA_ERR_NETWORK:
                aErr = 'A network error caused the audio download to fail.';
                break;
            case MediaError.MEDIA_ERR_DECODE:
                aErr = 'The audio playback was aborted due to a corruption problem or because it used features your browser did not support.';
                break;
            case MediaError.MEDIA_ERR_DECODE:
                aErr = 'The audio playback failed as the source stream in excrypted.';
                break;
            case MediaError.MEDIA_ERR_NONE_SUPPORTED:
                aErr = 'The audio could not be loaded, either because the server or network failed or because the format is not supported.';
                break;
            default:
                aErr = 'An unknown audio error occurred.';
                break;
        }
        log.warn("Player error: " + aErr + " --src: " + purePlayer.aPlayer.src);
        RSLBase.fireEvent('playerError', aErr);
    }
}

var RSLPersist = {          // Model of our persistent store
    bFirstTime: false,
    oFirstUsed: null,
    oLastBegged: null,

    initialize: function () {
        this.oFirstUsed = this.getDate('firstUsed');
        this.bFirstTime = this.oFirstUsed == null;
        if (this.bFirstTime) {
            this.oFirstUsed = new Date();
            this.setDate(this.oFirstUsed, 'firstUsed');
        }
    },
    getLastBegged: function () {
        var oDate = this.getDate('lastBegged');
        if (oDate == null) oDate = new Date();
        return oDate;
    },
    setLastDate: function () {
        this.setDate(new Date(), 'lastBegged');     // today
    },
    getDate: function (key) {
        var aDateC = $.Storage.get(key);
        if (aDateC == null)
            return null;
        var dtC = new Date(aDateC);
        return dtC;
    },
    setDate: function (oDate, key) {
        var aDt = oDate.toJSON();
        $.Storage.set(key, aDt);

    },
    getCachedDataDate: function () {
        return RSLPersist.getDate('cachedDate');
    },
    getCachedChannelData: function () {
        var aC = $.Storage.get("cachedChannel");
        return aC;
    },
    setCachedData: function (oDate, aChannelData) {
        RSLPersist.setDate(oDate, "cachedDate");
        $.Storage.set("cachedChannel", aChannelData);
    },
    getOnOff: function (key, bDefault) {
        var aOnOff = $.Storage.get(key);
        if (aOnOff == null)
            return bDefault;
        return aOnOff.search(/true/i) >= 0;
    },
    setOnOff: function (bValue, key) {
        var aValue = bValue ? "true" : "false";
        $.Storage.set(key, aValue);
    },
    getNumber: function (key, iDefault) {
        var aNumber = $.Storage.get(key);
        if (aNumber == null)
            return iDefault;
        return parseInt(aNumber);
    },
    setNumber: function (iValue, key) {
        var aValue = iValue.toString();
        $.Storage.set(key, aValue);
    },
    getJSON: function (key, oDefault) {


        //   return oDefault;      // debug

        var aJSON = $.Storage.get(key);
        if (aJSON == null)
            return oDefault;
        var jJSON = JSON.parse(aJSON);      // built-in
        //    var jJSON = $.parseJSON(aJSON);
        if (jJSON == null)
            return oDefault;
        return jJSON;
    },
    setJSON: function (jValue, key) {
        var aValue = JSON.stringify(jValue);
        //    var aValue = JSON.stringify(jValue);         // requires json2.js to be included
        $.Storage.set(key, aValue);
    }
}

/****************
** Phone Home **
****************/

var Kilroy = {
    initialize: function () {
        var aUrl = "fuse=" + (RSLPersist.bFirstTime ? "1" : "2");
        Kilroy.phoneHome(aUrl);
    },
    ending: function () {        // not currently being triggered - somewhat problematic for phonegap
        log.info("Kilroy ending");
        Kilroy.phoneHome("fuse=3");
    },
    fill: function (streamId) {
        this.phoneHome("streamid=" + streamId);
    },
    phoneHome: function (aUrl) {
        aUrl += "&ap=" + RSLProduct.sku;
        aUrl += "&full=" + (RSLProduct.bFullVersion ? "1" : "0");
        aUrl += "&un=" + (RSLBase.bPhoneGap ? device.uuid : "jQMWeb");


        if (RSLBase.fbSimulator()) {                     // remove evetually
            log.info("Simulate Kilroy: " + aUrl);
            return;
        }


        aUrl = "http://www.radioshowlinks.com/fill.aspx?" + aUrl;

        if (RSLBase.bRSLhost || RSLBase.bPhoneGap) {            // Always deref otherwise
            log.debug("Kilroy Fill - going direct - " + aUrl);
            jqXHRKilroy = $.ajax({
                type: "GET",
                url: aUrl,
                dataType: "html",
                timeout: 15000,
                success: function (data) {
                    //    no success handling
                }
                // no error handling either
            });
        } else {        // using JSONP to RSL
            log.debug("using JSONP to RSL for Kilroy fill - ");
            jqXHRKilroy = $.ajax({
                url: aUrl,
                dataType: "jsonp",
                crossDomain: true,
                cache: true,
                context: this,
                timeout: 45000,             // extra - RSL can be very slowwwww
                success: function (data) {
                    // don't care
                }
                // don't care
            });
        }
    }
}

/********************
** Helper Functions
********************/

function fileNameExtension(aUrl) {
    return aUrl.split('.').pop();
}
function dtThisPeriod() {       // move to top/bottom of hour
    dtNow = new Date();
    iMinutes = dtNow.getMinutes();
    if (iMinutes <= 25)
        dtNow.setMinutes(0);
    else {
        if (iMinutes <= 55)
            dtNow.setMinutes(30);
        else {
            dtNow.setMinutes(0);
            dtNow.setHours(dtNow.getHours() + 1);
        }
    }
    dtNow.setSeconds(0);
    dtNow.setMilliseconds(0);
    //	log.debug("dtThisPeriod - returning="+dtNow.toString());
    return dtNow;
}

function pad(num) {
    return ("0" + num).slice(-2);
}

function aElapsedTime() {
    iPlayingMins = Math.floor(iPlayingSecs / 60);
    iPlayingSecs = iPlayingSecs - iPlayingMins * 60;
    return (iPlayingMins + ":" + pad(iPlayingSecs));
}

function aShowTime(oDate) {
    var iHours = oDate.getHours();      // 0-23
    iShow = iHours % 12;
    if (iShow == 0) iShow = 12;         // 1-12

    if (iHours < 12)
        return iShow + ":" + pad(oDate.getMinutes()) + " AM";
    else
        return iShow + ":" + pad(oDate.getMinutes()) + " PM";
}

function aShowDate(oDate) {
    return (oDate.getMonth() + 1) + "/" + oDate.getDate();
}

function aNiceDateTime(oShow) {         // date/time in UTC
    var aTime = aShowTime(oShow.oNextShowing);
    if (oShow.iShowingVector != 0)      // just time if close in
        return "at " + aTime
    var oNow = new Date();
    if (oNow.getDate() == oShow.oNextShowing.getDate())
        return "Today at " + aTime;
    if (((oNow.getDay() + 1) % 7) == (oShow.oNextShowing.getDay() % 7))
        return "Tomorrow at " + aTime;
    return "on " + aShowDate(oShow.oNextShowing) + " at " + aTime;
}

function parseOurDate(aUTCDate) {
    // 2011-04-24 18:00:00 -00:00
    var iYear = parseInt(aUTCDate.substr(0, 4));
    var iMonth = parseInt(aUTCDate.substr(5, 2));
    if (--iMonth == 0) iMonth = 12;
    var iDate = parseInt(aUTCDate.substr(8, 2));
    var iHour = parseInt(aUTCDate.substr(11, 2));
    var iMin = parseInt(aUTCDate.substr(14, 2));
    // no seconds 
    // always comes in UTC, i.e., 00:00 off
    var dt = new Date(iYear, iMonth, iDate, iHour, iMin, 0, 0);
    var localTime = dt.getTime();
    var localOffset = dt.getTimezoneOffset() * 60000;
    var utc = localTime - localOffset;
    var utcDt = new Date(utc);
    return utcDt;
}

function aHrefMailTo(aSubject, aChannelId, aShowId, aStreamId) {

    var mt = RSLProduct.mailTo;
    var a = "mailto:" + RSLProduct.mailTo + "?subject=" + aSubject + " (";
    if (aChannelId != null)
        a += "channel:" + aChannelId + ",";
    if (aShowId != null)
        a += "show:" + aShowId + ",";
    if (aStreamId != null)
        a += "stream:" + aStreamId + ",";
    a += "product:" + RSLProduct.sku + ",Platform:" + RSLBase.deviceDesc;
    a += ")";
    return a;
}

function removeByElement(arrayName, arrayElement) {
    for (var i = 0; i < arrayName.length; i++) {
        if (arrayName[i] == arrayElement)
            arrayName.splice(i, 1);
    }
}

// The Events
//Application Events
$(document).on("vclick", "[data-appEvent]", RSLBase.fireCustomEvent);
$(document).on('pause', RSLBase.fOnPause);               // for phonegap
$(document).on('resume', RSLBase.fOnResume);
$(window).on('unload', Kilroy.ending);                  // log that we're leaving
$(window).on("warning", RSLBase.showWarning);
// $(window).on("hideActualWarning", RSLBase.hideActualWarning);        // at RSLApp level

// Model Events
$(window).on("newChannelReadFailure", RSLBase.showWarning);
$(window).on("newChannelXMLFailure", RSLBase.showWarning);

$(window).on("derefComplete", MP3Player.deRefComplete);              // wire into player/show view object
$(window).on("derefFail", MP3Player.deRefError);
$(window).on("playerStarted", MP3Player.streamPlaying);
$(window).on("playerReStarting", MP3Player.streamReStarting);
$(window).on("playerError", MP3Player.streamError);
