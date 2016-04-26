/**
 * Popup remote desktop interface. This uses the Guacamole API to login to
 * a Rig Client controller remote desktop interface.
 * 
 * @author Michael Diponio <michael.diponio@uts.edu.au>
 * @date 23rd March 2016
 */

if (!console) console = { };
if (!console.log) console.log = function(m) { };

/* Rig Client details for Guacamole interface. */
var RigClient = {
    CT: "au.edu.labshare.rigclient.primitive.GuacController",
    ACT: "tok"
};

/* Options for Guacamole deployment. */
var Options = {
    width:   undefined, // Width of remote window
    height:  undefined, // Height of remote window
    scale:   1,         // Scale between remote resolution and local window 
    scaling: false,     // Whether window scaling is enabled
    widSca:  true,      // Whether window scaling is use width or height ratio
};

/* Guacamole objects. */
var Guac = {
    client:    undefined, // Guacamole client    
    tunnel:    undefined, // Tunnel to communicate with Guacamole server
    websocket: undefined, // Web socket tunnel
    display:   undefined, // Display object
    mouse:     undefined, // Mouse event handler
    keybouard: undefined, // Keyboard event handler
};

/**
 * Run Guacamole remote desktop.
 */
function run_guac()
{
    var url = window.location.href, p, i, params, pm;
    
    /* Parse the URL which has user specified options. */
    if ((p = url.indexOf("?")) > 0)
    {
        params = url.substr(p + 1).split("&");
        
        for (i in params)
        {
            pm = params[i].replace(/^\s+|\s+$/g);
            
            if      (pm.indexOf("width=") == 0)  Options.width = parseInt(pm.substr(pm.indexOf("=") + 1));
            else if (pm.indexOf("height=") == 0) Options.height = parseInt(pm.substr(pm.indexOf("=") + 1));
            else if (pm.indexOf("scaling=") == 0)  Options.scaling = pm.charAt(pm.indexOf("=") + 1) == "t";
        }
    }
    
    if (!(Options.width && Options.height))
    {
        /* A geometry parameter was not provided so the window size will be used instead. */
        Options.width = window.innerWidth;
        Options.height = window.innerHeight;
    }
    else if (Options.scaling && (Options.width > window.innerWidth || Options.height > window.innerHeight))
    {
        /* If a size is set and scaling enabled the scaling factor needs to be determined
         * so that the entire remote resolution fits within the local size. We will use the smaller
         * or the width or height ratios so that the entire remote resolution is visible whilst 
         * preserving aspect ratio. */
        determine_scale();
    }
    
    if (Options.scaling && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor))
    {
        /* Chrome is a seems to be behave differently than Firefox or Internet Explorer. 
         * In Chrome, when the window opens at the requested size, which may be larger
         * than the display resolution than immediately resizes to a size that fits within
         * the bounds of the local resolution minus window chrome. This event handler 
         * captures this resize event and appropriately scales to the new size. */
        var chromeResized = false, listener;
        window.addEventListener("resize", listener = function() { 
           if (chromeResized) return;
           chomeResized = true;
           determine_scale();
           scale_guac(Options.scale);
           
           window.removeEventListener("resize", listener);
        });
    }
    
    get_guac_details();
}

/**
 * If scaling enabled determines the correct scale ratio to fit in the remote resolution in
 * the local window.
 */
function determine_scale()
{
    if (!Options.scaling) return;
    
    Options.scale = (Options.widSca = window.innerWidth / Options.width < window.innerHeight / Options.height) ?
            window.innerWidth / Options.width :
            window.innerHeight / Options.height;
}
    
/** 
 * Obtain Guacamole credentials from Rig Client. If successful trigger remote login.
 */
function get_guac_details()
{
    var req =  window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    req.onreadystatechange = function() {
        if (req.readyState != XMLHttpRequest.DONE) return;
        
        if (req.status == 200)
        {
            try
            {
                var resp = JSON.parse(req.responseText);
                if (resp.success === undefined || resp.success)
                {
                    setup_guac(resp.ws, resp.token, resp.connid);
                }
                else
                {
                    console.log("Server failed request: " + resp.errorReason);
                    close_window();
                }
            }
            catch (e)
            {
                console.log("Unexcepted content response receiving Guacamole details.");
                close_window();
            }
        }
        else
        {
            console.log("Error making Guacamole details request, HTTP code: " + req.status);
            close_window();
        }
    };
    
    req.open("GET", "/primitive/mapjson/pc/" + RigClient.CT + "/pa/" + RigClient.ACT, true);
    req.send(null);
}

/**
 * Setup Guacamole to start streaming. 
 * 
 * @param ws Web service address. 
 * @param token Authentication token.
 * @param conn Connection identifier.
 */
function setup_guac(ws, tok, id)
{
    var ele, options = 
            "token=" + tok + "&" +                  // Authentication token
            "GUAC_DATA_SOURCE=Sahara&" +            // Use Sahara authenticator
            "GUAC_ID=" + id + "&" +                 // Connection ID, i.e. rig
            "GUAC_TYPE=c&" +                        // Not sure (?)
            "GUAC_WIDTH=" + Options.width + "&" +   // Remote resolution width
            "GUAC_HEIGHT=" + Options.height + "&" + // Remote resolution height
            "GUAC_DPI=96&" +                        // Remote DPI
            "GUAC_AUDIO=audio%2FL8&GUAC_AUDIO=audio%2FL16&GUAC_IMAGE=image%2Fjpeg&GUAC_IMAGE=image%2Fpng&" + 
            "GUAC_IMAGE=image%2Fwebp";
    /* Instantiate client, using Web Services tunnel with HTTP fallback if that fails. */
    Guac.client = new Guacamole.Client(
        Guac.tunnel = new Guacamole.ChainedTunnel(
            Guac.websocket = new Guacamole.WebSocketTunnel(ws + "?" + options),
            new Guacamole.HTTPTunnel("/remote/tunnel")         
       )
    );
    
    Guac.display = Guac.client.getDisplay();
    
    /* Add Guacamole display canvas to page. There should only ever be one display
     * attached however if the tunnel error handler restarts Guacamole the old
     * display will need to removed. */
    ele = document.getElementById("guac-container");
    if (ele.hasChildNodes()) ele.removeChild(ele.firstChild);
    ele.appendChild(Guac.display.getElement());
    
    /* Set Guacamole error handler. */
    Guac.client.onerror = function() { 
        console.log("Client error handler");
    };
    
    Guac.tunnel.onerror = function() {
        console.log("Error received, will restart connection.");
        setTimeout(function() { setup_guac(ws, tok, id); }, 100);
    };
    
    try
    {
        Guac.client.connect(options);
    }
    catch (e)
    {
        console.log("Guacamole client connect error: " + e);
    }
    
    /* Set mouse and keyboard handlers. */
    Guac.mouse = new Guacamole.Mouse(Guac.display.getElement());
    Guac.mouse.onmousedown = 
    Guac.mouse.onmouseup   =
    Guac.mouse.onmousemove = function(mouseState) {
        Guac.client.sendMouseState(mouseState);
    };

    Guac.keyboard = new Guacamole.Keyboard(document);

    Guac.keyboard.onkeydown = function (keysym) {
        Guac.client.sendKeyEvent(1, keysym);
    };

    Guac.keyboard.onkeyup = function (keysym) {
        Guac.client.sendKeyEvent(0, keysym);
    };

    /* Set initial display scale. */    
    if (Options.scaling) scale_guac(Options.scale);
}

/**
 * Returns true if the Guacamole client is connected to the remote server.
 * 
 * @return {Boolean} true if connected
 */
function is_guac_connected() 
{
    return Guac.client && Guac.tunnel.state != Guacamole.Tunnel.State.CLOSED;
}

/**
 * Scales local display be the specified scale ratio.
 */
function scale_guac(scale) 
{
    /* If true scale, no need to actually scale anything as true scale is the 
     * default scale. */
    if (scale == 1) return;
    
    if (Guac.display) Guac.display.scale(scale);
    if (Guac.mouse) Guac.mouse.scale(scale);
    
    /* When scaled the window aspect ratio may not be the same as the
     * remote resolution aspect ratio so the window will be resized to the aspect ratio. */
    window.resizeTo(
        Options.widSca ? window.outerWidth :  Math.round(Options.width * Options.scale),
        Options.widSca ? Math.round(Options.height * Options.scale) : window.outerHeight
    );    
}

/**
 * Closes the popup window.
 */
function close_window() 
{
    disconnect_guac();
    window.close();
}

/** 
 * Disconnect from Guac. 
 */
function disconnect_guac()
{
    Guac.client.disconnect();    
}

