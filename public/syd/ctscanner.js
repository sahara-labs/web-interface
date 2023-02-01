/**
 * CT Scanner web interface stylesheet. 
 *
 * @author Michael Diponio
 */

Globals.COOKIE_PREFIX = "ctscanner";
Globals.CONTROLLER    = "CTScannerControls";
Globals.THEME         = Globals.THEMES.flat;

/** List of camera URLs. */
var cameras = [ 
    { }, // Camera one should be the operator office
    { }, // Camera two should be the top view
    { }, // Camera three should be the side view
];

/** @type {integer} Currently deployed camera. */
var currentCamera = 0;

/** @type {string} Currently deployed format. */
var currentFormat = undefined;

/** @type {array} List of widgets. */
var widgets = [ ];

$(document).ready(function() {
    /* Move the Java applet to the bottom. */
    setTimeout(function() {
        $("#rdpcontrolpanel").css({
            position: "absolute",
            left: -195,
            top: 545
        });
    }, 10);    
    
    /* Event handler for camera selection. */
    $("#ct-camera-selection > div").click(function() {
        changeCamera($(this).attr("id").substr("ct-camera-".length));
    });
    
    /* Event handler for format selection.
    $("#ct-format-selection > div").click(function() {
        changeFormat($(this).text(), true);
    }); */
    
    /* Camera controls. */
    var $container = $("#ct-controls"), yl, yr, rl, rr,
        tilt = new Slider("slider-tilt", {
            field: "tilt",
            action: "control",
            min: -180,
            max: 180,
            vertical: true,
            length: 250,
            scales: 8,
            windowed: false,
            tooltip: "Tilts the camera up or down. This only has an effect if the camera is zoomed in.",
        }),
        pan = new Slider("slider-pan", {
            field: "pan",
            action: "control",
            min: -180,
            max: 180,
            length: 250,
            scales: 8,
            vertical: false,
            windowed: false,
            tooltip: "Pans the camera view left or right. This only has an effect if the camera is zoomed in.",
        }),
        zoom = new Slider("slider-zoom", {
            field: "zoom",
            action: "control",
            length: 250,
            scales: 5,
            vertical: false,
            windowed: false,
            tooltip: "Increases or decreases camera zoom."
        });
    widgets.push(tilt, pan, zoom);
    
    /* Keyboard controls. */
    widgets.push(keyMove = new Button("keyboard-move", {
        action: "pressKey",
        //label: "Move",
        image: "/syd/arrow-black.png",
        params: { "move-key": true },
        windowed: false,
        width: 65,
        height: 65,
        circular: true,
        clickColor: "#6fad6e",
        tooltip: "Presses Move button."
    }));
    
    widgets.push(keyScan = new Button("keyboard-scan", {
        action: "pressKey",
        //label: "Scan",
        image: "/syd/diamond-black.png",
        params: { "scan-key": true },
        windowed: false,
        width: 65,
        height: 65,
        circular: true,
        clickColor: "#c9c96c",
        tooltip: "Presses Scan button."
    }));
    
    widgets.push(keyAbort = new Button("keyboard-abort", {
        action: "pressKey",
        //label: "Abort",
        image: "/syd/triangle-black.png",
        params: { "abort-key": true },
        windowed: false,
        width: 65,
        height: 65,
        circular: true,
        clickColor: "#cf5a5a",
        tooltip: "Presses Abort button."
    }));
    
    widgets.push(new Button("keyboard-laser", {
        action: "pressKey",
        //label: "Laser",
        image: "/syd/laser-black.png",
        params: { "laser-key": true },
        windowed: false,
        width: 65,
        height: 65,
        circular: true,
        clickColor: "#D99058",
        tooltip: "Presses Laser button."
    }));
   
    /* Bed controls. */
    widgets.push(yl = new PushButton("button-yaw-left", {
        action: "move",
        params: { type: "yaw-left" },
        image: "/syd/arrow-left.png",
        windowed: false,
        width: 30,
        height: 30,
        callback: function(data) { widgets.consume(data); },
        tooltip: "Move left about the red dot."
    }));
    
    widgets.push(yr = new PushButton("button-yaw-right", {
        action: "move",
        params: { type: "yaw-right" },
        image: "/syd/arrow-right.png",
        windowed: false,
        width: 30,
        height: 30,
        callback: function(data) { widgets.consume(data); },
        tooltip: "Move right about the red dot."
    }));
    
    widgets.push(rl = new PushButton("button-roll-left", {
        action: "move",
        params: { type: "roll-left" },
        image: '/syd/arrow-nw.png',
        windowed: false,
        width: 30,
        height: 30,
        callback: function(data) { widgets.consume(data); },
        tooltip: "Roll to the left.",
    }));
    
    widgets.push(rr = new PushButton("button-roll-right", {
        action: "move",
        params: { type: "roll-right" },
        image: '/syd/arrow-ne.png',
        windowed: false,
        width: 30,
        height: 30,
        callback: function(data) { widgets.consume(data); },
        tooltip: "Roll to the right.",
    }));
    
    widgets.push(new LED("led-errored", {
        field: "is-errored",
        label: "Errored",
        windowed: false,
        tooltip: "This is activated if an error has occurred in the robotics system. You should report this using the " +
        		"'Contact Support' button."
    }));
    
    widgets.push(new LED("led-busy", {
        field: "is-busy",
        label: "Moving",
        windowed: false,
        tooltip: "This is activated any time the robotics are moving."
    }));
    
    widgets.push(new Switch("large-step", {
        field: "fine-control",
        action: "move",
        label: "Fine Control",
        windowed: false,
    }));
    
    /* Required functions. */
    if (!widgets.forEach) {
        widgets.forEach = function(func) {
            var i = 0;
            for (i in widgets) func(widgets[i]);
        };
    };
    
    /* Intercept camera posts to update the stored camera states. */
    pan._postControl = tilt._postControl = zoom._postControl = function(action, params, responseCallback, errorCallback) {
        params['cam'] = currentCamera;
        cameras[currentCamera][this.config.field] = this.val;
        
        Widget.prototype._postControl.call(this, action, params, responseCallback, errorCallback);
    };
    
    /* Intercept robotics posts to immediately set moving call. */
    yl._postControl = yr._postControl = rl._postControl = rr._postControl = 
            function(action, params, responseCallback, errorCallback) {
        widgets.consume({ "is-busy": true });
        Widget.prototype._postControl.call(this, action, params, responseCallback, errorCallback);
    };
    
    /* Intercept keyboard button consume so we can allow pressing only when 
     * the button is being enabled by the system. */
    keyMove.enableBgColor = "#94ed93";
    keyMove.enableSound = "key-move-sound";
    keyMove.consume = function(data) { buttonStateCheck(keyMove, data['move-on']); };
    keyScan.enableBgColor = "#f9f985";
    keyScan.enableSound = "key-scan-sound";
    keyScan.consume = function(data) { buttonStateCheck(keyScan, data['scan-on']); };
    keyAbort.enableBgColor = "#ff8282";
    keyAbort.consume = function(data) { buttonStateCheck(keyAbort, data['abort-on']); };
    
    widgets.consume = function(d) {
        widgets.forEach(function(w) { w.consume(d); });
    };
    
    /* Initialise all the widgets. */
    widgets.forEach(function(w) { w.init($container); });
    widgets.consume({ pan: 0, tilt: 0, zoom: 0 });

    /* Sets the format to an appropriate to the browser. For all non Internet
     * Explorer browsers this is MJPEG, for IE, it is H264. */
    changeFormat($.browser.msie ? 'H.264' : 'MJPEG', false);
    
    /* Request data from the server about the cameras and controls. */
    dataInit();
    cameraInit();
});

function buttonStateCheck(button, value)
{
    if (button.enabled === undefined || (value !== undefined && button.enabled ^ value))
    {
        if (!(button.enabled = value))
        {
            /* Button enabled. */
            button.config.color = button.enableBgColor;
            button.$widget.children(".button").css({
                "background-color": button.enableBgColor,
                opacity: 1,
                cursor: 'pointer'
            });
            button._clicked = Button.prototype._clicked;
            button._buttonEngaged = Button.prototype._buttonEngaged;
            
            if (button.enableSound)
            {
                /* Button has a sound to play when it is enabled. */
                var $sound = $("#" + button.enableSound);
                if ($sound.length > 0 && typeof $sound[0].play == 'function')
                {
                    /* Older browsers won't have HTML5 audio support. */
                    $sound[0].play();
                }
            }
        }
        else
        {
            /* Button disabled. */
            button.config.color = "#efefef";
            button.$widget.children(".button").css({
                "background-color": "#efefef",
                opacity: 0.3,
                cursor: 'not-allowed'
            });
            button._buttonEngaged = button._clicked = function() { };
        }
    }
}

function dataInit()
{
    /* Request the initial positions from the server. */
    $.ajax({
        url: "/primitive/mapjson/pc/CTScannerControls/pa/data",
        success: function (resp) {
            widgets.consume(resp);
            setTimeout(function() { dataInit(); }, 2000);
        },
        error: function() { setTimeout(function() { dataInit(); }, 5000); }
    });
}

function cameraInit()
{
    /* Request the initial positions from the server. */
    $.ajax({
        url: "/primitive/mapjson/pc/CTScannerControls/pa/cameras",
        success: function (resp) {
            if (typeof resp == "object") 
            {
                var i;
                for (i = 1; i <= 3; i++)
                {
                    if (!resp["Camera_" + i]) continue;
                    
                    cameras[i - 1] = $.parseJSON(resp["Camera_" + i]);
                    cameras[i - 1].name = "Camera_" + i;
                }

                changeCamera("1");
            }
        },
        error: function() { setTimeout(function() { dataInit(); }, 5000); }
    });
}

/**
 * Changes the camera to specified camera.
 * 
 * @param {string} clicked camera id number
 */
function changeCamera(camera) 
{   
    $("#ct-camera-selection .ct-camera-selected").removeClass("ct-camera-selected");
    $("#ct-camera-" + camera).addClass("ct-camera-selected");
    
    currentCamera = parseInt(camera) - 1;
    
    /* Tell the server to reset the cameras. */
    //$.get("/primitive/json/pc/VapixControls/pa/reset");
    
    /* Restore the set zoom / pan / tilt values. */
    widgets.consume(cameras[currentCamera]);
    
    /* Tear down old stream. */
    undeployCamera();
    
    /* Deploy new camera. */
    switch (currentFormat)
    {
    case 'MJPEG':
        deployMJPEGCamera(currentCamera);
        break;
        
    case 'H.264':
        deployH264Camera(currentCamera);
        break;
       
    default:
        alert("Error, unknown format stored: " + currentFormat);
        break;
    }
    
};

/**
 * Changes the format of the deployed camera.
 * 
 * @param {String} format format to deploy
 * @param {boolean} whether to also deploy camera
 */
function changeFormat(format, deploy)
{
    $("#ct-format-selection .ct-format-selected").removeClass("ct-format-selected");
    $("#ct-format-selection div:contains('" + format + "')").addClass("ct-format-selected");
    currentFormat = format;

    if (deploy)
    {
        /* Deploy new camera. */
        switch (currentFormat)
        {
        case 'MJPEG':
            deployMJPEGCamera(currentCamera);
            break;
            
        case 'H.264':
            deployH264Camera(currentCamera);
            break;
           
        default:
            alert("Error, unknown format stored: " + currentFormat);
            break;
        }
    }
}

/**
 * Deploys the camera with the MJPEG stream format.
 * 
 * @param {integer} camera camera index
 */
function deployMJPEGCamera(camera) 
{
    $("#ct-camera").html(
        !$.browser.msie ?
        
            /* Firefox, Chrome, Safari and Opera play MJpeg natively so we can 
             * directly deploy MJpeg inside an img element. */
            "<img src='" + cameras[camera].url + "' alt='' style='width:640px;height:480px;'/>"
         : 
            /* Microsoft IE does not support playing MJpeg natively so we need to 
             * deploy an ActiveX object to stream the video. */
            '<object id="Player" height="480" width="640" border="1" classid="CLSID:745395C8-D0E1-4227-8586-624CA9A10A8D" ' +
                 'codebase="/syd/AXISMediaControlSDK_redist.exe">' +
               '<param name="AutoStart" value="1">' +
               '<param name="UIMode" value="none">' +
               '<param name="MediaType" value="mjpeg">' +
               '<param name="MediaURL" value="http://' + cameras[camera].address + '/mjpg/' + cameras[camera].index + '/video.mjpg?resolution=640x480"' +
            '</object>'
        );
}

/**
 * Deploys the camera with the H264 stream format.
 * 
 * @param camera
 */
function deployH264Camera(camera)
{
    $("#ct-camera").html(
        "<object classid='clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B' width='640' height='480' " +
                "codebase='http://www.apple.com/qtactivex/qtplugin.cab'>" +
                "<param name='autoplay' value='true' />" +
                "<param name='controller' value='false' />" +
                "<param name='type' value='video/quicktime' />" +
                "<param name='target' value='myself' />" +
                "<param name='qtsrc' value='rtsp://" + cameras[camera].address + "/axis-media/media.amp?resolution=640x480&camera=" + cameras[camera].index + "' />" +
                "<param name='src='' value='http://" + cameras[camera].address + "/view/AxisMoviePoster.mov' />" +
                "<embed qtsrc='rtsp://" + cameras[camera].address + "/axis-media/media.amp?resolution=640x480&camera=" + cameras[camera].index + "' " +
                		"src='http://" + cameras[camera].address + "/view/AxisMoviePoster.mov' " +
                		"target='myself' controller='false' width='640' height='480' " +
                        "loop='false' autoplay='true' plugin='quicktimeplugin' type='video/quicktime' cache='false' " +
                        "pluginspace='http://www.apple.com/quicktime/download' />" +
        "</object>" 
    );
}

/**
 * Removes a previously deployed stream from displaying.
 */
function undeployCamera()
{
    try
    {
        /* Firefox (atleast some versions) need to be explictaly told to stop 
         * downloading the MJPEG stream. */
        $("#ct-camera img").attr("src", "#");
        $("#ct-camera").empty();
    }
    catch (e) { /* Swallowing error. */ }
}
