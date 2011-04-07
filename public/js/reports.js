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
 * @author Tania Machet (tmachet)
 * @date 13th December 2010
 */

function getValue(type, group, like)
{
   var queryDest = "/reports/getvalue/group/" + group + "/like/" + like + "/limit/4";	
   
   $.get(
		queryDest, 
		{}, 
		function (data) 
		{
			$("#" + type + "valuelist ul").empty();
			$("#" + type + "valuelist").hide();
			for (results in data['selectionResult'])
			{
				// There is a result
				if (!isNaN(results))
				{
					if (typeof data['selectionResult'] == 'string') 
					{
						// Only one value
						$("#" + type + "valuelist ul").append("<li  class=\""+ type + "listitem\">" + data['selectionResult'] + "</li>");
						$("#" + type + "valuelist").show();
						break;
					}
					else
					{
						// Array of values
						$("#" + type + "valuelist ul").append("<li  class=\""+ type + "listitem\">" + data['selectionResult'][results] + "</li>");
						$("#" + type + "valuelist").show();
					}
				}
			}
			
			
			$	("." +type + "listitem").hover(
					function(){
						if($(this).hasClass("ui-state-hover"))
						{
							$(this).removeClass("ui-corner-all ui-selectmenu-item-focus ui-state-hover");
						}
						else
						{
							var selectedname = $(this).html();
							$("#" + type + "value").val(selectedname);
							$(this).addClass("ui-corner-all ui-selectmenu-item-focus ui-state-hover");
						}
					}
			);

		}
	);
		
}

function getSessionValue(group, like)
{
   var queryDest = "/reports/getvalue/group/" + group + "/like/" + like + "/limit/4";	
   
   $.get(
		queryDest, 
		{}, 
		function (data) 
		{
			$("#sessionvaluelist ul").empty();
			$("#sessionvaluelist").hide();
			for (results in data['selectionResult'])
			{
				// There is a result
				if (!isNaN(results))
				{
					if (typeof data['selectionResult'] == 'string') 
					{
						// Only one value
						$("#sessionvaluelist ul").append("<li  class=\"sessionlistitem\">" + data['selectionResult'] + "</li>");
						$("#sessionvaluelist").show();
						break;
					}
					else
					{
						// Array of values
						$("#sessionvaluelist ul").append("<li  class=\"sessionlistitem\">" + data['selectionResult'][results] + "</li>");
						$("#sessionvaluelist").show();
					}
				}
			}
			
			
			$(".sessionlistitem").hover(
					function(){
						if($(this).hasClass("ui-state-hover"))
						{
							$(this).removeClass("ui-corner-all ui-selectmenu-item-focus ui-state-hover");
						}
						else
						{
							var selectedname = $(this).html();
							$("#sessionvalue").val(selectedname);
							$(this).addClass("ui-corner-all ui-selectmenu-item-focus ui-state-hover");
						}
					}
			);

		}
	);
		
}

