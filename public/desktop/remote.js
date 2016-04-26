/**
 * Web User Interface Widget Library - Guacamole Widgets.
 * 
 * @author Michael Diponio <michael.diponio@uts.edu.au>
 * @date 21st March 2016
 */

/**
 * Guacamole widget that embeds buttons to launch pop-up window that logs into 
 * Guacamole to display a remote desktop window.
 * 
 * @constructor
 * @param {String} id the identifier of this widget
 * @param {object} config configuration object
 * @config {boolean} [resolutionCtl] whether to show resolution selector (default false)
 * @config {Array} [resolutions] list of resolutions to show in resolution selector, \
 *                      implies resolutionCtl is set (default common resolutions)
 * @config {boolean} [scalingCtl] whether to show resolution scaling check box (default false)
 * @config {String} [resolution] remote resolution if not specified by user (default '1024x768')
 * @config {boolean} [scaling] whether remote resolution scaling is enabled (default false) 
 */
function GuacamoleWidget(id, config)
{
    Widget.call(this, id, config);
    
    if (this.config.resolutionCtl === undefined) this.config.resolutionCtl = false;
    if (this.config.resolutions === undefined) this.config.resolutions = 
            [ "800x600", "1024x768", "1280x1024", "1400x1050", "1600x1200" ];
    if (this.config.scalingCtl === undefined) this.config.scalingCtl = false;
    if (this.config.resolution === undefined) this.config.resolution = "1024x768";
    if (this.config.scaling === undefined) this.config.scaling = false;
    
    /** @private {Number} Remote resolution width in pixels. */
    this.remoteWidth = undefined;
    
    /** @private {Number} Remote resolution height in pixels. */
    this.remoteHeight = undefined;
    
    /** @private {Boolean} Whether the remote popup has been launched. */
    this.launched = false;
    
    /** @private {Window} Pop-up window reference. */
    this.window = undefined;
    

    this._setResolution(this.config.resolution);
}

GuacamoleWidget.prototype = new Widget;

GuacamoleWidget.prototype.init = function($container) {
    var i, thiz = this, html = 
        "<div class='guac-buttons'>";
    
    if (this.config.resolutionCtl)
    {
        html +=
           "<div class='guac-res-outer'>" +
               "<select class='guac-res'>";
        
        for (i in this.config.resolutions)
            html +=
                   "<option value='" + this.config.resolutions[i] + "' " + 
                           (this.config.resolutions[i] == this.config.resolution ? " selected='selected'" : "") + ">" +                       
                       this.config.resolutions[i] + 
                   "</option>";
    
        html +=               
               "</select>" + 
            "</div>";
    }
    
    if (this.config.scalingCtl)
    {
        html += 
            "<div class='guac-scaling'>" +
                "<label for='guac-enable-scaling'>Scale Display: </label>" +
                "<input id='guac-enable-scaling' type='checkbox' " + 
                        (this.config.scaling ? "checked='checked" : "") + " />" + 
            "</div>";
    }
    
    html +=
           "<div class='guac-launch button'>Launch</div>" +
           "<div class='guac-terminate button disabled'>Close</div>" +
       "</div>";
    
    this.$widget = this._generate($container, html);
    
    this.$widget.find(".guac-launch").click(function() { thiz._launch(); });
    this.$widget.find(".guac-terminate").click(function() { thiz._terminate(); });
    
    /* Fix height. */
    this.$widget.children(".window-content").css("height", this.$widget.find(".guac-buttons").outerHeight());
    
    /* We also want to be notified if the main window is unloaded, which may be 
     * in the case of session completion so we close the pop-up window. */
    $(window).unload(function() { thiz._windowUnloaded(); });
};

GuacamoleWidget.prototype._launch = function() {
    if (this.launched) return;
    
    if (this.config.resolutionCtl) this._setResolution(this.$widget.find(".guac-res :selected").attr("value"));
    if (this.config.scalingCtl) this.config.scaling = this.$widget.find("#guac-enable-scaling:checked").length == 1;
    
    /* Open the Guacamole pop-up with options set. */
    var thiz = this, params, options, $w = $(window);
    
    /* The params specify the desired resolution and whether there should be 
     * scaling. */
    params = "width=" + this.remoteWidth +
             "&height=" + this.remoteHeight +
             "&scaling=" + (this.config.scaling ? "t" : "f");
    
    /* Set window height. */
    options = "width=" + this.remoteWidth + "," +
              "height=" + this.remoteHeight;
    
    /* Disable as much window chrome as possible to keep as much space as 
     * possible for remote content. */
    options += ",menubar=0,toolbar=0,location=0,personbar=0,status=0,resizable=0,scrollbars=1";
    
    /* Try to open the pop-up window. */
    if (this.window = window.open("/desktop/remote.html?" + params, this.config.title, options))
    {        
        try
        {
            /* We want to be notified if the window is closing so we can 
             * appropriately set button state to correct state. */
            if (this.window.addEventListener) 
                this.window.addEventListener("beforeunload", function() { thiz._windowUnloaded(); });
        }
        catch (e)
        {
            console.log("Error from window unload bind: " + e);
        }
        
        this.$widget.find(".guac-launch").addClass("disabled");
        this.$widget.find(".guac-terminate").removeClass("disabled");
        this.launched = true;
    }
    else
    {
        /* Pop-up blocker or some other security setting has prevented a 
         * pop-up being opened. */
        this.addMessage("Pop-up window did not open. Please allow pop-ups for this page try again.",
        		Widget.MESSAGE_TYPE.error, -15, 120, Widget.MESSAGE_INDICATOR.topCenter);
    }
};

GuacamoleWidget.prototype._windowUnloaded = function() {
    if (!(this.launched && this.window)) return;  
    
    try
    {
        if (this.window.Guac) this.window.Guac.client.disconnect();
    }
    catch (e)
    {
        console.log("Error disconnecting with Guacamole client.");
    }
        
    if (!this.window.closed) this.window.close();
    this.window = null;
    this.launched = false;
        
    this.$widget.find(".guac-launch").removeClass("disabled");
    this.$widget.find(".guac-terminate").addClass("disabled");
         
};

GuacamoleWidget.prototype._terminate = function() {
    if (!this.launched) return;
    
    var thiz = this;

    /* We are going to trigger server side log off. */
    $.post(
       "/primitive/echo/pc/au.edu.labshare.rigclient.primitive.WinLogoffController/pa/logoff",
       { },
       function () {
           thiz._windowUnloaded();
       }
    );
};

GuacamoleWidget.prototype.consume = function(data) { }

GuacamoleWidget.prototype._setResolution = function(res) {
    res = res.toLowerCase();
    var p = res.indexOf("x");
    if (p < 0)
    {
        throw "Invalid resolution specified.";
    }
    
    this.remoteWidth = parseInt(res.substr(0, p));
    this.remoteHeight = parseInt(res.substr(p + 1));
};