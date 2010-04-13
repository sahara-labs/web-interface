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
	
	/* First make panel visible. */
	if ($("#camerapanel" + id).css("display") == "none" && vid != 'off')
	{
		$("#camerapanel" + id).slideDown("slow");
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
		deployWMP(id, url);
	default:
		//alert("Changing " + id + " to " + vid + " url " + url);
		break;
	}
}

function deployJpeg(id, url, tm)
{
	var cameraDiv = "#camera" + id;
	
	var html = "<div id='jpegframe" + id + "' style='height:" + (parseInt($(cameraDiv).css('height')) + 10) + "px'>" +
				"	<img src='" + url + "?" + new Date().getTime() + "'/>" +
				"</div>" +
				"<div class='jpegsliderholder'>" +
				"	<div id='jpegslider" + id + "' class='jpegslider'></div>";
	
	var indWidth = Math.floor(parseInt($(cameraDiv).css('width')) / 5);
	for (i = 0; i < 5; i++)
	{
		html += "<div style='width:" + indWidth + "px;float:left;text-align:center'>" +
				"	<span class='ui-icon ui-icon-arrowthick-1-n jpegtickarrow'></span>" +
				"   <span class='jpegtick'>" + (i == 0 ? "Off" : (0.25 * Math.pow(2, i - 1)) + "s") + "</span>" +
				"</div>";
	}	
	html += "</div>";

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
	$("#jpegslider" + id).css('width', '300px');
	
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

function deployWMP(id, url)
{
	var cameraDiv = "#camera" + id;
	$(cameraDiv).css("background-image", "");
	var html = "<object width='320' height='240' " + 
					" classid='CLSID:6BF52A52-394A-11d3-B153-00C04F79FAA6' " +
					" type='application/x-oleobject'>" +
					"<param NAME='URL' VALUE='" + url + "'>" +
					"<param NAME='SendPlayStateChangeEvents VALUE='true'>" +
					"<param NAME='AutoStart' VALUE='true'>" +
					"<param name='uiMode' value='none'>" +
					"<param name='PlayCount' value='9999'>" +
				"</object>";
	$(cameraDiv).html(html);
}

function undeploy(id)
{
	if (jpegIntervals[id] !== undefined)
	{
		$("#jpegslider" + id).slider("destroy");
		clearInterval(jpegIntervals[id]);
		jpegIntervals[id] = undefined;
	}
	
}



