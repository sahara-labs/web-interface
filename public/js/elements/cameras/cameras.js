/**
 * SAHARA Web Interface
 *
 * User interface to Sahara Remote Laboratory system.
 *
 * @license See LICENSE in the top level directory for complete license terms.
 *
 * Copyright (c) 2010, University of Technology, Sydney
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *  * Neither the name of the University of Technology, Sydney nor the names
 *    of its contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author Michael Diponio (mdiponio)
 * @date 13th March 2010
 */

jpegIntervals = new Array();
count = new Array();

function changeCameraOption(id, vid, url)
{
	undeploy(id);
	
	setCameraCookie("CamOption-" + id, vid);
	
	/* First make panel visible. */
	if ($("#camerapanel" + id).css("display") == "none" && vid != 'off')
	{
		$("#camerapanel" + id).slideDown("slow", function() {
			setTimeout("resizeFooter()", 100);
		});
	}
	
	switch (vid)
	{
	case 'off':
		$("#camerapanel" + id).slideUp("slow");
		break;
	case 'jpeg':
		deployJpeg(id, url, 0);
		break;
	case 'mms':
		deployWinMedia(id, url);
		break;
	case 'mmsh':
		deployVLC(id, url);
		break;
	default:
		/* Fall back to the jQuery media plugin which may be able to detect
		 * the media type and the correct plugin. */
		var cameraDiv = "#camera" + id;
		var html = "<a class='media' href='" + url + "' />";
		$(cameraDiv).html(html);
		$(cameraDiv + " .media").media({
			width: vcameras[id].width,
			height: vcameras[id].height,
			src: url,
			autoplay: true,
			caption: false,
			params: { uiMode: 'none' },
			bgColor: '#606060'
		});
		break;
	}
}

function deployJpeg(id, url, tm)
{
	var cameraDiv = "#camera" + id;
	
	var html = "<div id='jpegframe" + id + "' style='height:" + (vcameras[id].height + 10) + "px'>" +
				"	<img src='" + url + "?" + new Date().getTime() + "'/>" +
				"</div>" +
				"<div class='jpegsliderholder'>" +
				"	<div id='jpegslider" + id + "' class='jpegslider'></div>";
	
	for (i = 0; i < 5; i++)
	{
		html += "<div style='width:" + Math.floor(vcameras[id].width / 5) + "px;float:left;text-align:center'>" +
				"	<span class='ui-icon ui-icon-arrowthick-1-n jpegtickarrow'></span>" +
				"   <span class='jpegtick'>" + (i == 0 ? "Off" : (0.25 * Math.pow(2, i - 1)) + "s") + "</span>" +
				"</div>";
	}	
	html += "</div>"; // jpegsliderholder

	$(cameraDiv).html(html);

	$("#jpegslider" + id).slider({
		animate: true,
		min: 0,
		max: 30,
		step: 1,
		stop: function(event, ui) {
			var spe = Math.floor(Math.pow(2, (ui.value / 10)) * 250) - 100;
			if (spe < 250)
			{
				if (jpegIntervals[id] != undefined) clearInterval(jpegIntervals[id]);
			}
			else
			{
				if (jpegIntervals[id] != undefined) clearInterval(jpegIntervals[id]);
				jpegIntervals[id] = setInterval("updateJpeg(" + id + ", '" + url + "', " + spe + ")", spe);
			}
		}
	});
	
	$("#jpegslider" + id).css('width', vcameras[id].width - 20);
	
	$(cameraDiv).css("height", vcameras[id].height + 60);
	
	/* Hack so the footer doesn't overlay the camera panel while the background
	 * image is downloading. */
	resizeFooter();
	
	$(cameraDiv).css("background-image", "url(" + url + ")");
	$(cameraDiv).css("background-repeat", "no-repeat");
	
	if (tm > 0)
	{
		jpegIntervals[id] = setInterval("updateJpeg(" + id + ", '" + url + "')", tm);
	}
	
	count[id] = 0;
}

function updateJpeg(id, url, tm)
{
	$("#jpegframe" + id).html("<img src='" + url + "?" + new Date().getTime() + "'/>");
	count[id]++;
	if (count[id] == 50)
	{
		$("#camera" + id).css("background-image", "url(" + url + "?" + new Date().getTime() + ")");
		count[id] = 0;
	}
}

function deployWinMedia(id, url)
{
	var cameraDiv = "#camera" + id;
	$(cameraDiv).css('background-color', '#606060');
	
	var html = "<object " +
		"	classid='CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95' " +
		"	codebase='http://activex.microsoft.com/activex/controls/ mplayer/en/nsmp2inf.cab' " +
		"	standby='Loading Microsoft Windows Media Player...' " +
		"	type='application/x-oleobject' " +
		"	width='" + vcameras[id].width + "' " +
		"	height='" + vcameras[id].height + "' >" +
		"		<param name='fileName' value='" + url + "'>" +
		"		<param name='animationatStart' value='1'>" +
		"		<param name='transparentatStart' value='1'>" +
		"		<param name='autoStart' value='1'>" +
		"		<param name='ShowControls' value='0'>" +
		"		<param name='ShowDisplay' value='0'>" +
		"		<param name='ShowStatusBar' value='0'>" +
		"		<param name='loop' value='0'>" +
		"		<embed type='video/x-ms-asf-plugin' " +
		"			pluginspage='http://microsoft.com/windows/mediaplayer/ en/download/' " +
		"			showcontrols='0' " +
		"			showtracker='1' " +
		"			showdisplay='0' " +
		"			showstatusbar='0' " +
		"			videoborder3d='0' " +
		"			width='" + vcameras[id].width + "' " +
		"			height='" + vcameras[id].height + "' " +
		"			src='" + url + "' " +
		"			autostart='1' " +
		"			loop='0' /> " +
		"</object>";
	
	$(cameraDiv).html(html);
}

function deployVLC(id, url)
{
	var cameraDiv = "#camera" + id;
	$(cameraDiv).css('background-color', '#606060');
	
	var html = "<object " +
		"classid='clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921' " +
		"codebase='http://downloads.videolan.org/pub/videolan/vlc/latest/win32/axvlc.cab'" +
		"width='" + vcameras[id].width + "' " +
		"height='" + vcameras[id].height + "' " +
		"id='vlc" + id + "' events='True'>" +
        "	<param name='Src' value='" + url + "' />" +
        "	<param name='ShowDisplay' value='True' />" +
        "	<param name='AutoLoop' value='no' />" +
        "	<param name='AutoPlay' value='yes' />" +
        "	<embed type='application/x-google-vlc-plugin' " +
        "          name='vlcfirefox' " +
        "          autoplay='yes' " +
        "          loop='no' " +
        "          width='" + vcameras[id].width + "' " +
        "          height='" + vcameras[id].height + "' " +
        "          target='"  + url + "' /> " +
    "</object>";

	$(cameraDiv).html(html);
	
	/* Start VLC playing. */
	var vlc = document.getElementById('vlc' + id);
	if (typeof vlc.playlist != "undefined")
	{
		vlc.playlist.playItem(vlc.playlist.add(url));
	}
}

function undeploy(id)
{
	if (jpegIntervals[id] !== undefined)
	{
		$("#jpegslider" + id).slider("destroy");
		clearInterval(jpegIntervals[id]);
		jpegIntervals[id] = undefined;
	}

	var cameraDiv = "#camera" + id;
	$(cameraDiv).css("background-image", "");
	$(cameraDiv).css("background-color", "#FFFFFF");
	$(cameraDiv).html("<p>Camera off.</p>");
	$(cameraDiv).css("height", vcameras[id].height);
	
	resizeFooter();
}

function setCameraCookie(key, value)
{
	var expiry = new Date();
	expiry.setDate(expiry.getDate() + 365);
	var cookie = 'Camera_' + cameraRigType + '-' + key + '=' + value + ';expires=' + expiry.toUTCString();

	document.cookie = cookie;
}

function getCameraCookie(key)
{
	var cookies = document.cookie.split('; ');
	var fqKey = 'Camera_' + cameraRigType + '-' + key;
	for (i in cookies)
	{
		var c = cookies[i].split('=', 2);
		if (c[0] == fqKey)
		{
			return c[1];
		}
	}
	return "";
}

