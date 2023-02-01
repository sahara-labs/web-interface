$(document).ready(function() {
    $("#guac-launch").click(guac_start_launch);
    $("#guac-terminate").click(guac_terminate);
});

/** Whether Guacamole has already launched. */
var isLaunched = false;

/** The popup window that has the Guacamole client. */
var guacWindow = undefined;

/**
 * Starts the Guacamole launch process. The first step is to obtain the Guacamole
 * login information from the Rig Client.
 */
function guac_start_launch()
{
    if (isLaunched && !guacWindow.closed) 
    {
        /* We should only open a single view at a time, so we will focus the 
         * existing window. */
        guacWindow.focus();
        return;
    }
    
    /* We first needs to get Guacamole launch details. */
    $.get(
         "/primitive/mapjson/pc/GuacController/pa/guacLogin",
        { },
        function (resp) {
            if (typeof resp == 'object' && resp.user && resp.pass)
            {
                /* Received Guacamole login information so we can move to posting login. */
                guac_received_login(resp.user, resp.pass);
            }
        }
    );
}

/** @const Guacamole directory on the web server. This is actually the URL of the Apache
 *  proxy configuration that passes through to the Guacamole application. */
var GUAC_DIRECTORY = "/guacamole";

/**
 * Performs the second step in the Guacamole launch process, by logging into 
 * the Guacmole application.
 * 
 * @param user login user name
 * @param pass login password
 */
function guac_received_login(user, pass)
{
    $.get(GUAC_DIRECTORY + "/logout");
    $.post(
        GUAC_DIRECTORY + "/login",
        {
            username: user,
            password: pass
        },
        function (resp) {
            /* If login was successful, the server returns a 200 success response
             * and this function is called. */
            guac_open_window();
        }
    );
}

/**
 * Opens the Guacamole client window.
 */
function guac_open_window()
{
    var res = $("#guac-res :selected").attr("value"), options;
        
    if (res == 'Fullscreen')
    {
        options = 'fullscreen=yes';
    }
    else
    {
        options = "width=" + res.substr(0, res.indexOf("x")) + ",height=" + res.substr(res.indexOf("x") + 1);
    }
    
    /* Other feature options are disabling toolbars and menubars. */
    options += ",menubar=off,toolbar=off,location=off,personbar=off,status=off";
    
    /* The window is not resizable as the resizing Guac screws up resolution 
     * and aspect ratio. */
    options += ",resizable=off";
    
    if (guacWindow = window.open(
        GUAC_DIRECTORY + "/client.xhtml?id=c%2F" + guacRig,
        "Remote session on " + guacRig.replace('_', ' '),
        options
    ))
    {
        /* Launching remote window was successful. */
        isLaunched = true;
        $("#guac-buttons .button").toggleClass("disabled");
        guacWindow.onbeforeunload = guac_window_closed;
    }
    else
    {
        /* Launching Guacamole window failed, perhaps because the browser has 
         * a popup blocked enabled. */
        alert("Launching remote window has failed. Ensure your browsers popup blocker is disabled for this site and " +
              "try again.");
    }
}

/**
 * Event triggered with the Guacamole window has closed. 
 */
function guac_window_closed()
{
    if (isLaunched)
    {
        isLaunched = false;
        guacWindow = null;
        $("#guac-buttons .button").toggleClass("disabled");
    }
}

/**
 * Terminate the Guacamole session. This does two things, forces a server log
 * off and closes the Guacamole window.
 */
function guac_terminate() 
{
    if (isLaunched)
    {
        $.post(
           "/primitive/echo/pc/au.edu.labshare.rigclient.primitive.WinLogoffController/pa/logoff",
           { },
           function () {
               if (!guacWindow.closed)
               {
                   guacWindow.close();
               }
               
               isLaunched = false;
               guacWindow = null;
           }
        );
        
        $.get(GUAC_DIRECTORY + "/logout");
    }
}