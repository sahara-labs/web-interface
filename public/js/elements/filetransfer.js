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
 * @date 25th May 2010
 */

function deleteFile(file)
{
	$.get(
		'/primitive/echo/pc/au.edu.labshare.rigclient.primitive.FileTransferController/pa/deleteFile/filename/' + file,
		null,
		function (data) {
			if (data == 'SUCCESS')
			{
				regenerateFileList();
			}
	});
}
		
function regenerateFileList()
{
	$.get(
		'/primitive/json/pc/au.edu.labshare.rigclient.primitive.FileTransferController/pa/listFiles',
		null,
		function (data) {
			
			/* If the call was successful the response is auto-serialised to a 
			 * JSON object. */
			if (typeof data == "string") return;
			
			var html = "";
			var number = 0;
			
			if (data != null) number = data.length;
			
			for (i in data)
			{
				var name = "";
				var meta = "";
				
				/* Hack for weird PHP WS parsing. */
				if (i == 'name')
				{
					name = data.name;
					meta = data.value;
					number = 1;
				}
				else if (i == 'value') continue;
				else
				{
					name = data[i].name;
					meta = data[i].value;
				}
				
				html += "<li>";
				
				/* Download link. */
				var metaParts = meta.split(';', 3);
				var url = '/primitive/file/pc/au.edu.labshare.rigclient.primitive.FileTransferController/pa/';
				if (metaParts[i] == 'text')
				{
					url += 'textFile';
				}
				else
				{
					url += 'binaryFile/tf/base64'; 
				}
				url += '/fn/' + name + '/filename/' + name;
				
				/* MIME type for files. */
//				mimeParts = metaParts[0].split('/', 2);
//				url += '/mime/' + mimeParts[0] + '-' + mimeParts[1];
				
				html += "<a class='plaina downloadlink";
				if (metaParts.length == 3 && metaParts[2] == 'new')
				{
					html += " newdownloadlink";
				}
				html += "' href='" + url + "'>";
				
				html += "<span class='ui-icon ui-icon-circle-arrow-s' style='width:15px'></span>"; // Icon
				html += name; // Name to display.
				html += "</a>";
				
				/* Delete link. */
				html += "<a class='plaina delfilelink' onclick='deleteFile(\"" + name + "\")' href='#'>";
				html += "<span class='ui-icon ui-icon-trash'></span>Delete</a>";

				html += "</li>";
			}
			
			$("#filetransferlist").html(html);
			
			/* Styling fixes to account for the scrolling. */
			if (number > 10)
			{
				$("#filetransfercontents").css("height", "240px");	
				$("#filetransfercontents").css("overflow-y", "scroll");
				$("#filetransferlist").css("width", "535px");
				
				if (/msie|MSIE 6/.test(navigator.userAgent))
				{
					$(".downloadlink").css("width", "446px");
				}
				else if (/msie|MSIE/.test(navigator.userAgent))
				{
					$(".downloadlink").css("width", "449px");
				}
				else
				{
					$(".downloadlink").css("width", "450px");
				}
			}
			else
			{
				$("#filetransfercontents").css("height", "auto");
				$("#filetransfercontents").css("overflow-y", "hidden");
				$("#filetransferlist").css("width", "555px");
				
				if (/msie|MSIE 6/.test(navigator.userAgent))
				{
					$(".downloadlink").css("width", "466px");
				}
				else if (/msie|MSIE/.test(navigator.userAgent))
				{
					$(".downloadlink").css("width", "469px");
				}
				else
				{
					$(".downloadlink").css("width", "470px");
				}
			}
	});
}