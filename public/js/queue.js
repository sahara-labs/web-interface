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
 * @date 26th March 2010
 */

function loadPermissionInfo(pid)
{
	$.get(
		"/queue/info",   // URL to obtain information about the permission
		{id: pid},       // GET parameter the permission ID
		function(p) { // Callback to handle permission information
			var diagDiv = "div[aria-labelledby=ui-dialog-title-permission" + pid + "]";
			var conDiv = "#permission" + pid;
			
			/* The permission is not viable, so put up an error */
			if (!p.viable)
			{
				$(conDiv).html(
					"<div class='dialogcentercontent'>" +
					"	<div class='dialogheader'>" +
					"		<img src='/images/balls/red.gif' alt='Not viable' />" +
					"		<h3>" + (p.queuedResource.type == "RIG" ? "Offline" : "All Offline") + "</h3>" +
					"   </div>" +
					"	<div class='ui-state-error ui-corner-all'>" +
					"   <span class='ui-icon ui-icon-alert alertspan'></span>" +
					"   	This permission is not queueable because all of its resources are offline." +
					"   </div>" +
					"</div>"
				);
				return;
			}
			
			var html = "<div class='dialogcentercontent'>" +
					   "	<div class='dialogheader'>";
			if (p.hasFree)
			{
				/* The permission resource(s) is free, so put up the number free. */
				html += "<img src='/images/balls/green.gif' alt='Free' />" +
						"<h3>" + (p.queuedResource.type == "RIG" ? "Free" : p.numberFree + " Free") + "</h3>";
			}
			else
			{
				/* The permission resource(s) are in use. */
				html += "<img src='/images/balls/yellow.gif' alt='In Use' />" +
						"<h3>" + (p.queuedResource.type == "RIG" ? "In Use" : "All In Use") + "</h3>";
			}
			html += "</div>";
			
			/* List out all the target resources. */
			if (p.queuedResource.type == 'TYPE' || p.queuedResource.type == 'CAPABILITY')
			{
				html += "<div class='dialogreslist'><ul>";
				for (key in p.queueTarget)
				{
					if (key == "resource") t = p.queueTarget;
					else if (!isNaN(key))  t = p.queueTarget[key];
					else continue;
					
					html += "<li>";
					if (!t.viable) html += "<img src='/images/balls/red_small.gif' alt='Not viable' class='dialogreslisticon' />";
					else if (!t.isFree) html += "<img src='/images/balls/yellow_small.gif' alt='In Use' class='dialogreslisticon' />";
					else html += "<img src='/images/balls/green_small.gif' alt='Free' class='dialogreslisticon' />";
					html += t.resource.resourceName.split('_').join(' ') + "</li>";
				}
				html += "</ul></div>";
			}
			
			/* Add queue button. */
			html += "<div id='queuebuttonpane" + pid + "' class='ui-dialog-buttonpane ui-widget-content'>" +
			        "	<button class='queuebutton ui-button ui-button-text-icon ui-widget ui-state-default ui-corner-all ui-priority-primary'" +
			        "		id='queuebutton" + pid +"' type='button'>Queue</button>" +
			        "   <button class='queuebutton ui-button ui-button-text-icon ui-widget ui-state-default ui-corner-all'" +
			        "		id='queuecancelbutton" + pid +"' type='button'>Cancel</button>" +
			        "</div>";
			
			$(conDiv).html(html);
			
			/* Queue button. */
			$("#queuebutton" + pid).hover(
					function() { $(this).addClass("ui-state-hover"); },
					function() { $(this).removeClass("ui-state-hover"); }
			);
			$("#queuebutton" + pid).click(function() {
				queueResourceRequest(pid);
			});
			
			/* Cancel button. */
			$("#queuecancelbutton" + pid).hover(
					function() { $(this).addClass("ui-state-hover"); },
					function() { $(this).removeClass("ui-state-hover"); }
			);
			$("#queuecancelbutton" + pid).click(function() {
				$("#permission" + pid).dialog('close');
			});
		}
	);
}

function unlockPermission(id)
{
	var formId = "#perm_lock_form_" + id;
	if (!$(formId).validationEngine({returnIsValid:true}))
	{
		return false;
	}
	
	/* Disable the dialog, while waiting for a response. */
	var dialogDiv = "div[aria-labelledby=ui-dialog-title-permission" + id + "]";
	$(dialogDiv).css("height", "auto");
	$(dialogDiv + " div.ui-dialog-titlebar").hide();
	$(dialogDiv + " div.ui-dialog-content").hide();
	$(dialogDiv + " div.ui-dialog-buttonpane").hide();
	$(dialogDiv).append(
		"<div class='dialogwaiting'>" +
		"	<img src='/images/ajax-loading.gif' alt='Loading' />" +
		"   <br />" +
		"	<p class='ui-priority-secondary'>Loading...</a>" + 
		"</div>"
	);

	$.get("/queue/unlock", {
		permission: id,
		passkey: $("input[name=passkey_" + id + "]").val()
		},
		function(data) {
			/* Reenable dialog. */
			$(dialogDiv + " div.ui-dialog-titlebar").show();
			$(dialogDiv + " div.ui-dialog-content").show();
			$(dialogDiv + " div.ui-dialog-buttonpane").show();
			$(dialogDiv + " div.dialogwaiting").remove();
			
			if (data.successful)
			{
				/* Put a success message. */
				$(dialogDiv).css("height", "auto");
				$(dialogDiv + " div.ui-dialog-content").css("height", "74px");
				$("#perm_lock_div_" + id).slideUp();
				$("#perm_lock_result_fail_" + id).hide();
				$("#perm_lock_result_" + id).slideDown("slow");

				/* Change the buttons. */
				$(dialogDiv + " button:contains('Cancel')").html("<span class='ui-button-text'>OK</span>");
				$(dialogDiv + " button:contains('Unlock')").hide();
				
				/* Disable form submission. */
				$("#perm_lock_form_" + id).unbind();
				$("#perm_lock_form_" + id).submit(function() {
					return false; 
				});
				
				/* Change the permission icon to active. */
				var icon = $("#permission" + id + "_link img"); 
				icon.attr("src", "/images/permission_launch.png");
				icon.attr("alt", "launch");
				
				/* Add active queue dialog. */
				var oldDiag = $("#permission" + id);
				oldDiag.attr("id", "old_permission" + id);
				$("#permission" + id + "_link").unbind();
				
				var diagId = "permission" + id;
				var diagTitle = $("#ui-dialog-title-permission" + id).text();
				$("body").append("" +
						"<div id='" + diagId + "' class='permissiondialogloading'>" +
						"	<img src='/images/ajax-loading.gif' alt='Loading' />" +
						"	<p>Loading...</p>" +
						"</div>");
				
				$("#" + diagId).dialog({
					autoOpen: false,
					modal: true,
					resizable: false,
					title: diagTitle,
					open: function (event, ui) { loadPermissionInfo(id); }
				});
				
				$("#permission" + id + "_link").click(function() {
					$("#" + diagId).dialog('open');
				});
			}
			else
			{
				$(dialogDiv).css("height", "210px");
				$(dialogDiv + " div.ui-dialog-content").css("height", "100px");
				$("#perm_lock_result_fail_" + id).slideDown("slow");
			}
		}
	);
}

function queueResourceRequest(pid)
{
	var diagDiv = "div[aria-labelledby=ui-dialog-title-permission" + pid + "]";
	var conDiv = "#permission" + pid;
	
	/* Cancel all buttons. */
	$("#queuebutton" + pid).unbind();
	$("#queuecancelbutton" + pid).unbind();
	$("#queuebuttonpane" + pid).css("display", "none");
	$(diagDiv + " div.ui-dialog-titlebar").css("display", "none");
	$(conDiv).dialog({'closeOnEscape': false});
	
	html = "<div class='permissiondialogloading'>" +
		   "	<img src='/images/ajax-loading.gif' alt='Loading' /><br />" +
		   "	<p>Requesting...</p>" +
		   "</div>";
	
	$(conDiv).html(html);
	
	$.get(
		"/queue/queue",   // URL to queue a sc
		{id: pid},        // GET parameter the permission ID
		function (r) {
			if (r.successful)
			{
				/* Succeeding requesting resource. */
				$(conDiv).html("Success, redirecting...");
				window.location.replace("/queue/queuing");
			}
			else
			{
				/* Failed requesting resource. */
				$(conDiv).html(
						"<div class='dialogcentercontent'>" +
						"	<div class='dialogheader'>" +
						"		<img src='/images/alert.png' alt='Failed' style='width:60px;height:60px;'/><br />" +
						"		<h3 style='display:block;margin-top:20px'>Requesting resource has failed.</h3>" +
						"   </div>" +
						"	<div class='ui-state-error ui-corner-all' style='margin-top:-25px'>" +
						"   	<span class='ui-icon ui-icon-alert alertspan'></span>" +
						"   	Please use the 'Send Feedback' button to provide information about this failure." +
						"   </div>" +
						"</div>"
				);
				$(conDiv).dialog({'closeOnEscape': true});
				$(diagDiv + " div.ui-dialog-titlebar").css("display", "block");
			}
		}
	);
}

function cancelResourceRequest()
{
	alert("Cancelling queue request.");
}
