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

/**
 * Unlocks the resource permission specified by the id.
 */
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
			
			if (data == "true")
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
				var diagTitle = $("#ui-dialog-title-permission1").text();
				$("body").append("" +
						"<div id='" + diagId + "' class='permissiondialogloading'>" +
						"	<img src='/images/ajax-loading.gif' alt='Loading' />" +
						"	<p>Loading...</p>" +
						"</div>");
				
				$("#" + diagId).dialog({
					autoOpen: false,
					modal: true,
					resizable: false,
					title: diagTitle
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

function cancelResourceRequest()
{
	alert("Cancelling queue request.");
}
