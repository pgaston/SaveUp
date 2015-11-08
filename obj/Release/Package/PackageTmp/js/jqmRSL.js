var RSLProduct = {
    sku: "JMSOIR80",
    channelTitle: "JazzBird",
    channelId: "c104",
    bAndroidUpgradeAvail: false,    // ask for upgrade?
    androidUpgradeLink: "http://www.radioshowlinks.com",
    biOSUpgradeAvail: true,        // ask for upgrade?
    iOSUpgradeLink: "http://itunes.apple.com/ie/app/jazzbird-from-jazzboston-best/id328568085?mt=8",
    bNoACC: true,                   // "aac" codec streams excluded
    bNoShout: true,                 // "shout" hint streams excluded
    bNoHTML5: true,                 // "nohtml5" hint streams excluded
    mailTo: "peter.gaston@gmail.com",
    bFullVersion: false
};

/*******************
* The Application
*******************/
var RSLApp = {
    firsttime: true,

    initialize: function () {           // Called when DOM is ready, first time only
        RSLChannel.initialize(RSLProduct.channelId);
        channelPage.initialize();
        $('#btnAboutFeedback').attr("href", aHrefMailTo("Here's some feedback!", null, null));
        $('#aboutDevice').text(RSLApp.deviceDesc);
        //    if (RSLBase.iOS)  $('#ftrAd').hide();     // dooesn't currently work on iOS

        $('#btnUpgrade').hide();
        if (RSLBase.bAndroid && RSLProduct.bAndroidUpgradeAvail) {
            $('#btnUpgrade').attr("href", RSLProduct.androidUpgradeLink);
            $('#btnUpgrade').show();
            $('#noUpgrade').hide();
        }
        if (RSLBase.biOS && RSLProduct.biOSUpgradeAvail) {
            $('#btnUpgrade').attr("href", RSLProduct.iOSUpgradeLink);
            $('#btnUpgrade').show();
            $('#noUpgrade').hide();
        }
    },
    showActualWarning: function (e) {
        $('#txtShowError').text(e.val);
        $('#txtChannelError').text(e.val);
        $('#txtShowError').show();
        $('#txtChannelError').show();
    },
    hideActualWarning: function (e) {
        $('#txtShowError').hide();
        $('#txtChannelError').hide();
    },
    beforeShow: function () {       // all DOM elements available...
        if (RSLPersist.firstTime)
            $("#left-panel").panel("open");
        RSLPersist.firstTime = false;
        ga('send', 'event', 'Pageview', 'Listing');
    }
}

/*******************
/* The Views
/*******************/

var channelPage = {

    initialize: function () {
        $("#homeTitle").text(RSLProduct.channelTitle);        // set title correctly
        $('#btnHomeNowPlaying').hide();
        $('#btnMainAbout').text("About " + RSLProduct.channelTitle);
        $('#btnMainFeedback').attr("href", aHrefMailTo("Here's some feedback!", null, null));
        $('#txtSKU').text(RSLProduct.sku);
        $("#txtChannelError").click(function () {      // timer for subsequent tries to get new channel data
            $('#txtShowError').hide();
            $('#txtChannelError').hide();
        });
    },
    // To get to a show page
    // 1. Navigate direct from channel listing
    // 2. Navigate via 'now playing' 
    showTransition: function (ev) {
        var aShowId = ev.val;
        var oShow = RSLChannel.oGetShowFromId(aShowId);
        var oStation = RSLChannel.getFavStation(oShow);
        channelPage.gotoShowPage(oShow, oStation);
    },
    gotoNowPlaying: function () {
        var oStation = MP3Player.getPlayingStation();
        var oShow = RSLChannel.oGetShowFromStationId(oStation.aStreamId);      // may or may not be there...
        channelPage.gotoShowPage(oShow, oStation);
    },
    setupNowPlaying: function () {
        var oStation = MP3Player.getPlayingStation();
        var oShow = RSLChannel.oGetShowFromStationId(oStation.aStreamId);      // may or may not be there...
        showPage.showingShow = oShow;
        showPage.showingStation = oStation;
        log.info("Now playing switch to " + (oShow != null ? oShow.aName : '-no-show-') + " on " + oStation.aName);
    },
    gotoShowPage: function (oShow, oStation) {
        showPage.showingShow = oShow;
        showPage.showingStation = oStation;
        log.info("Goto showpage " + (oShow != null ? oShow.aName : '-no-show-') + " on " + oStation.aName);

        $.mobile.changePage("#pgShow", { transition: RSLApp.pgTransition, changeHash: true });
    },
    playNowStatus: function () {
        if (MP3Player.isPlaying())
            $('#btnHomeNowPlaying').show();
        else
            $('#btnHomeNowPlaying').hide();
    },
    showListHTML: function () {

    //    alert("width: " + $(window).width() + " / " + $(document).width());


        var a = "<ul id='listingview' data-role='listview'>";

        var iSection = -1;
        var iShowTime = 0;
        var oDatePeriod = dtThisPeriod();
        var b30Period = oDatePeriod.getMinutes() == 30;
        var iHour1 = oDatePeriod.getHours();    // 1 to 24

        if (b30Period) iHour1++;
        iHour1--;                               // do modulo from 1
        iHour1 = iHour1 % 12;                   // 0 to 11
        iHour1++;                               // 1 to 12
        //     iHour1++;                               // 1 to 12 - turns out documentation was wrong
        var iHour2 = iHour1 + 1;
        if (iHour2 > 12) iHour2 = 1;


        $(RSLChannel.oChannel.vShows).each(function () {
            var oShow = this;
            //    var bSample = oShow.bS;
            var aName = oShow.aName + "";
            var bSample = oShow.bS;
            var bLive = (oShow.iShowingVector & 0x01) > 0;
            var bSoon = oShow.iShowingVector > 0;
            // first (if needed) push out the section header
            if (iSection == -1) {
                if (bLive)
                    a += "<li data-role='list-divider'>Live Now!</li>";
                iSection = 0;
            }
            if (iSection == 0) {
                if (!bLive && !bSoon) {        // skip
                    a += "<li data-role='list-divider'>Coming up...</li>";
                    iSection = 2;
                } else {
                    if (!bLive) {
                        a += "<li data-role='list-divider'>Tune in Early</li>";
                        iSection = 1;
                    }
                }
            }
            if (iSection == 1) {
                if (!bSoon) {
                    a += "<li data-role='list-divider'>Coming up...</li>";
                    iSection = 2;
                }
            }
            if ((iSection == 0) || (iSection == 1)) {
                a += "<li";
                if (bSample)
                    a += " data-theme='e'";
                a += "><a href='#pgShow' data-appEvent='showClick' data-appEventValue='" + oShow.aShowId + "' data-transition='" + RSLApp.pgTransition + "'>";   //  rel='external'

                a += "<div class='sch-li'><div class='sch-li-row'><div class='sch-li-title'>";
                a += oShow.aName;
                a += "</div>";

                // The Grid
                a += "<div class='sch-li-grid'><div class='sch-the-grid'>";
                a += "<img src='images/grid/preshow.png' class='grid-preblock' />";

                var iSlot = oShow.iShowingVector;

                for (var i = 0; i < 5; i++) {
                    if (iSlot & 0x01 == 1) {
                        if (bSample)
                            a += "<img src='images/grid/showLive-B.png' class='grid-block' />";
                        else
                            a += "<img src='images/grid/showLive.png' class='grid-block' />";
                    } else
                        a += "<img src='images/grid/showOff.png' class='grid-block' />";
                    iSlot = iSlot >> 1;
                }
                a += "</div>"

                if (oShow.iShowingVector & 0x01)
                    a += "<div class='grd-listen'>" + "Listen!" + "</div>";
                else
                    a += "<div class='grd-listen'>" + "Tune In!" + "</div>";

                if (iShowTime-- <= 0) {

                    a += "<div class='";
                    a += !b30Period ? "grd-slot1" : "grd-slot2";
                    a += "'>" + iHour1 + ":00</div>";

                    a += "<div class='";
                    a += !b30Period ? "grd-slot3" : "grd-slot4";
                    a += "'>" + iHour2 + ":00</div>";

                    iShowTime = 4;
                }


                a += "</div></div></div>";
                a += "</a></li>";

            } else {

                a += "<li";
                if (bSample)
                    a += " data-theme='e'";
                a += "><a href='#' data-appEvent='showClick' data-appEventValue='" + oShow.aShowId + "' data-transition='" + RSLApp.pgTransition + "'>";   //  rel='external'

                a += "<div class='sch-li'><div class='sch-li-row'><div class='sch-li-title'>";
                a += oShow.aName;
                a += "</div>";

                a += "<div class='sch-li-grid'><div class='sch-the-grid'>";
                a += "<img src='images/grid/clrNoShow.png' class='grid-fullblock' /></div>";

                var oNow = new Date();
                if (oNow.getDate() == oShow.oNextShowing.getDate())
                    a += "<div class='grd-timeat1'>at " + aShowTime(oShow.oNextShowing);
                else {
                    if (((oNow.getDay() + 1) % 7) == (oShow.oNextShowing.getDay() % 7))
                        a += "<div class='grd-timeat2'>Tomorrow<br />at " + aShowTime(oShow.oNextShowing);
                    else
                        a += "<div class='grd-timeat2'>On " + aShowDate(oShow.oNextShowing) + "<br />at " + aShowTime(oShow.oNextShowing);
                }
                a += "</div></div></div></div>";

                a += "</a></li>";

                //      a += "<span style='font-weight:bold;'>" + oShow.aName + "</span><br />";
                //      a += "<span style='font-size:small;'>live " + aNiceDateTime(oShow) + "</span></a></li>";
            }
        });

        a += "<li data-role='list-divider' style='font-size:large;'>Upgrade to the App!</li>";
        a += "</ul>";

        //    log.info("new html length: " + a.length);
        $("#shows-container").html(a);
        //        log.info("injection complete");
        $("#listingview").listview();       // <<--
    }
};


/**********
 ** SHOW **
 **********/
/*     A. Navigate from channel page - first show, all there
B. Navigate from now playing
B.1 - show there
B.2 - show not found, use station only
C. Refresh based on new channel load
D. Refresh on show page - inconsistent state, restart app

For new show, kick off dereferencing immediately.
*/

var showPage = {
    showingShow: null,
    showingStation: null,
    // Note, currently playing station information is held at RSLApp level

    // Entries:
    // - from channel selection - show and station already set
    // - from 'now playing' - station set, show may be null (no longer a listing for that show)
    initialize: function () {       // First time show page is shown - will *always* have a valid show
        // if user does a 'refresh' - this page isn't valid...
        if ((RSLChannel.oChannel == null) || (showPage.showingStation == null)) {
            log.warn("refresh - aborting to front page");
            var a = window.location.href;
            var i = a.indexOf("#");         // strip this page out...
            if (i >= 0)
                a = a.substring(0, i);
            log.info("current url is " + a);
            window.location.href = a;        // will this force a complete restart???

            //            $.mobile.changePage("#pgHome", { transition: RSLApp.pgTransition, changeHash: true });
            return;
        }

        if (!RSLBase.useBackButton) $('#btnBackShow').hide();
        $("#divMultiStations").children().trigger("collapse");      // collapse if arriving from the channel listing page
        $('#txtNowPlaying').hide();

        //        $('#txtInUrl').text(showPage.showingStation.aUrl);          // debugging
        //        $('#txtdeRefUrls').text('');
        $('#txtShowError').hide();
        $('#txtChannelError').hide();
        $("#txtShowError").click(function () {      // timer for subsequent tries to get new channel data
            $('#txtShowError').hide();
            $('#txtChannelError').hide();
        });

        MP3Player.newStreamView(showPage.showingStation, showPage.showingShow.aShowId);

        RSLBase.fireEvent('showPageRefresh', null);
        RSLBase.fireEvent('showPlayerStatus', null);

        var aShow = showPage.showingShow != null ? showPage.showingShow.aName : "";
        ga('send', 'event', 'Pageview', 'Show', { 'show': aShow } );
    },
    leavePage: function () {
        MP3Player.leaveView();
        showPage.showingStation = null;
        showPage.showingShow = null;
        $('#txtShowError').hide();
        $('#txtChannelError').hide();
    },
    gotoNowPlaying: function (ev) {
        channelPage.setupNowPlaying();
        showPage.initialize();      // stays on same page, but changes information   -- need some animation???
    },
    updateChannel: function () {                         // channel was updated - leave station, show might've changed...
        if (showPage.showingStation != null) {
            showPage.showingShow = RSLChannel.oGetShowFromStationId(showPage.showingStation.aStreamId);      // may or may not be there...
            RSLBase.fireEvent('showPageRefresh', null);
        }
    },
    refreshShowPage: function () {                      // called when page first showed, when show information might refresh
        var activePage = $.mobile.activePage[0].id;     // don't bother if caught before this page is shown
        if (activePage != 'pgShow')
            return;

        if (showPage.showingShow != null) {             // we can navigate to a station, whose show has disappeared from the schedule
            log.info("initial showingPage: show:" + showPage.showingShow.aName + "/" + showPage.showingShow.aShowId + " station:" + showPage.showingStation.aName + "/" + showPage.showingStation.aStreamId + " number of stations = " + showPage.showingShow.vStations.length);

            //    $("#hdrShowTitle").text(showPage.showingShow.aName);      // leave as 'JazzBird
            $("#txtShowTitle").text(showPage.showingShow.aName);

            a = showPage.showingShow.aDescription;
            do {            // global replace - wish I could've gotten regex global to work...
                b = a;
                a = a.replace('\r', '<br />');
            } while (a != b);
            $("#txtShowDesc").html(a);
            if (a.length > 0)
                $('#txtDescTitle').show();
            else
                $('#txtDescTitle').hide();

            // For now, these both open in a new web page, driven by 
            if (showPage.showingShow.aHomeUrl.length > 0) {
                //    $('#btnHomePage').attr("href", showPage.showingShow.aHomeUrl);
                $('#btnHomePage').show();
            } else
                $('#btnHomePage').hide();

            if (showPage.showingShow.aFaceBook.length > 0) {
                //    $('#btnFacebook').attr("href", showPage.showingShow.aFaceBook);
                $('#btnFacebook').show();
            } else
                $('#btnFacebook').hide();

            if ((showPage.showingShow.iShowingVector & 0x01) != 0)
                $('#txtPlaying').text("Show is Live!");
            else
                $('#txtPlaying').text("Show will be playing live " + aNiceDateTime(showPage.showingShow));

            RSLBase.fireEvent('showRefreshStations', null);

            $('#btnShowNotOn').attr("href", aHrefMailTo("Show was not on!", showPage.showingShow.aShowId, showPage.showingStationId));
            $('#btnStationNotPlaying').attr("href", aHrefMailTo("Station was not playing!", null, showPage.showingStationId));
            $('#btnShowNotOn').show();
            $('#btnStationNotPlaying').show();
        } else {
            log.debug("no showing show!  must have timed out - just show the station");

            $("#hdrShowTitle").text("Show complete");
            $("#txtShowTitle").text("Show complete - Playing last station");

            $('#txtPlayingOn').text("Playing station " + showPage.showingStation.aName);
            $("#txtShowDesc").html("This station does not have a show in the current channel listing.");
            $('#txtDescTitle').show();

            $('#btnHomePage').show();
            $('#btnFacebook').hide();
            $('#btnShowNotOn').hide();
            $('#btnStationNotPlaying').show();
        }
    },
    showPlayerStatus: function () {        // called when the player's status might've changed - change button, anything else as needed...
        log.info("MP3Player: " + MP3Player.status + ", player: " + purePlayer.plyrStatus);
        $("#imgPlayButton").attr("src", MP3Player.getBtnImage());

        $('#txtNowPlaying').hide();
        if (MP3Player.isPlaying()) {
            var oStation = MP3Player.getPlayingStation();
            if (oStation == null) {
                log.debug("huh?   oStation is null while playing?");
                $('#txtNowPlaying').hide();
                return;
            }
            var oShow = RSLChannel.oGetShowFromStationId(oStation.aStreamId);      // may or may not be there...
            if (oShow != null) {
                if (showPage.showingShow == null) {      // no show
                    $('#txtNowPlaying').text("Station now playing: " + oStation.aName);
                    $('#txtNowPlaying').show();
                } else { // if (oShow.aShowId != showPage.showingShow.aShowId) {                // Same as page we're on
                    $('#txtNowPlaying').text("Show now playing: " + oShow.aName + " on " + oStation.aName);
                    $('#txtNowPlaying').show();
                }
            }
        }
    },
    playButton: function (ev) {
        log.info("play button clicked - MP3Player: " + MP3Player.status + ", player: " + purePlayer.plyrStatus);

        if (MP3Player.status == MP3PlayerStatus.Stopped) {      // special tests...
            if (showPage.bTryBegging())     // true means asked to go to app store
                return;
            if (!RSLApp.bHaveWifi && RSLApp.bWarnWifi) {
                if (!confirm("Play this station, even though you *do not* have a WiFi connection?"))
                    return;
            }
            var aShow = showPage.showingShow != null ? showPage.showingShow.aName : "";
            var aStation = showPage.showingStation != null ? showPage.showingStation.aName : "";
            ga('send', 'event', 'Play', { 'show': aShow, 'station': aStation });
        }

        MP3Player.btnAction();
    },
    playNowStatus: function () {
        if (MP3Player.isPlaying()) {      // currently playing

            var oCurrentlyPlaying = MP3Player.getPlayingStation();
            if (oCurrentlyPlaying != null) {    // defensive...

                if (oCurrentlyPlaying.aStreamId == showPage.showingStation.aStreamId)
                    $('#btnShowNowPlaying').hide();     // this is us
                else
                    $('#btnShowNowPlaying').show();
            }
        } else
            $('#btnShowNowPlaying').hide();
    },
    refreshStationList: function () {
        $('#txtPlayingOn').text("Playing on station " + showPage.showingStation.aName + " (" + aBW(showPage.showingStation) + " bandwidth)");
        if (showPage.showingShow.vStations.length > 1) {
            $('#divMultiStations').show();
            $('#pSlvContainer').html(showPage.aStationListHTML());
            $('#stationlistingview').listview();

        } else
            $('#divMultiStations').hide();
    },
    aStationListHTML: function () {
        var a = "<ul id='stationlistingview' data-role='listview' id='stationListings' data-inset='true'>";
        $(showPage.showingShow.vStations).each(function () {
            var oStation = this;
            a += "<li data-icon='false'";

            if (oStation.aStreamId == showPage.showingStation.aStreamId)
            //    a += " data-icon='check'";
                a += " data-theme='b'";         // data-icon='check' -- doesn't work

            a += "><a href='#' data-appEvent='stationClick' data-appEventValue='" + oStation.aStreamId + "'>";
            //      a += "<img src='images/50.png' alt='Special Show' class='ui-li-icon'>";

            a += aStationListItemHTML(oStation);
            a += "</a></li>";
        });
        a += "</ul>";
        return a;
    },
    setStation: function (ev) {
        var oTestStation = null;
        $(showPage.showingShow.vStations).each(function () {
            if (this.aStreamId == ev.val) {
                showPage.showingStation = this;
                oTestStation = this;
            }
        });
        if (oTestStation == null) {
            log.error("setStation for " + ev.val + " - NOT FOUND!!!");
            return; // leave current station
        }

        MP3Player.newStreamView(showPage.showingStation);
        RSLChannel.setFavStation(showPage.showingShow.aShowId, showPage.showingStation.aStreamId);
        RSLBase.fireEvent('showRefreshStations', null);
    },
    showElapsedTime: function (ev) {        // clear by sending null
        $("#spnElapsed").text(ev.val);
    },
    bTryBegging: function () {
        // must be iOS or Android


        var iTries = RSLPersist.getNumber('tries', 1);
        RSLPersist.setNumber(iTries + 1, 'tries');
        if (iTries % 2 == 0)    // at most every other time
            return false;
        var bAsk = false;
        var fRandom = Math.random();

        log.info("bTryBegging - iTries:" + iTries + ", fRandom:" + fRandom);

        if ((iTries > 20) && (fRandom > 0.5))
            bAsk = true;
        else if ((iTries > 10) && (fRandom > 0.75))
            bAsk = true;

        if (RSLBase.bAndroid && RSLProduct.bAndroidUpgradeAvail) {
            if (bAsk) {
                if (confirm("Are you enjoying JazzBird?    The app has a better user experience and is more robust.   Would you like to upgrade to the app?")) {
                    window.location.href = RSLProduct.androidUpgradeLink;
                    return true;
                }
            }
        }

        if (RSLBase.biOS && RSLProduct.biOSUpgradeAvail) {
            if (bAsk) {
                if (confirm("Are you enjoying JazzBird?    The app has a better user experience and is more robust.   Would you like to upgrade to the app?")) {
                    window.location.href = RSLProduct.iOSUpgradeLink;
                    return true;
                }
            }
        }

        return false;
    },
    toHomePage: function () {
        if (showPage.showingShow.aHomeUrl.length > 0) {
            //        window.location.href = showPage.showingShow.aHomeUrl;
            window.open(showPage.showingShow.aHomeUrl, "_blank");
        } else
            log.error("toHomePage - aHomeUrl is blank");
        return false;
    },
    toFacebookPage: function () {
        if (showPage.showingShow.aFaceBook.length > 0) {
            window.open(showPage.showingShow.aHomeUrl, "_blank");
            //    window.location.href = showPage.showingShow.aFaceBook;
        } else
            log.error("toFacebookPage - aFacebook is blank");
        return false;
    }
};

function aStationListItemHTML(oStation) {
    var a = "<span style='font-weight:bold;'>" + oStation.aName + "</span><br />";
    a += "<span style='font-size:small'>" + oStation.aLocation + " - " + aBW(oStation) + " bandwidth</span>";
    return a;
}

var aboutPage = {
    initialize: function () {
        if (!RSLBase.useBackButton) $('#btnBackAbout').hide();
        $('#btnAboutFeedback').attr("href", aHrefMailTo("Here's some feedback!", null, null));
        $('#aboutDevice').text(RSLApp.deviceDesc);
        ga('send', 'event', 'Pageview', 'About');
    }
};

var upgradePage = {
    initialize: function () {
        if (!RSLBase.useBackButton) 
            $('#btnBackUpgrade').hide();
        $('#btnActualUpgrade').attr("href", RSLApp.upgradeLink );
    }
};


// The Events

$(document).on('pageinit', '#pgHome', RSLBase.initialize);            // Requires a 'pgHome' as the first page, eh?   Triggers DOMisReady event when done
$(window).on("DOMisReady", RSLApp.initialize);

$(document).on('pagebeforeshow', "#pgHome", RSLApp.beforeShow);

$(document).on('pagebeforeshow', "#pgShow", showPage.initialize);
$(document).on('pagebeforehide', "#pgShow", showPage.leavePage);
$(document).on('pagebeforeshow', "#pgAbout", aboutPage.initialize);
$(document).on('pagebeforeshow', "#pgUpgrade", upgradePage.initialize);

// View events
$(window).on("showActualWarning", RSLApp.showActualWarning);
$(window).on("hideActualWarning", RSLApp.hideActualWarning);

$(window).on("newChannelRead", channelPage.showListHTML);
$(window).on("homeNowPlaying", channelPage.gotoNowPlaying);         // show status changed - refresh
$(window).on("showClick", channelPage.showTransition);              // show status changed - refresh
$(window).on("showNowPlaying", showPage.gotoNowPlaying);            // show status changed - refresh
$(window).on("showPlayerStatus", showPage.showPlayerStatus);        // main Play button (also loading and pause/stop)
$(window).on("showElapsedTime", showPage.showElapsedTime);          // main Play button (also loading and pause/stop)
$(window).on("showPageRefresh", showPage.refreshShowPage);          // main Play button (also loading and pause/stop)
$(window).on("newChannelRead", showPage.updateChannel);             // new show may display for currently selected station
$(window).on("btnPlay", showPage.playButton);                       // main Play button (also loading and pause/stop)
$(window).on("stationClick", showPage.setStation);
$(window).on("homePageClick", showPage.toHomePage);
$(window).on("facebookPageClick", showPage.toFacebookPage);

$(window).on("showRefreshStations", showPage.refreshStationList);   // show station on, list

$(window).on("showPlayerStatus", showPage.playNowStatus);
$(window).on("showPlayerStatus", channelPage.playNowStatus);


