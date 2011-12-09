/**
 * Move applets, embeds and objects off screen.
 */
function moveObjectsOffScreen() 
{
	/* Move all the applet, object and embeds to a margin right off
	 * screen. */
	appletMargins = new Array();
	var applets = $("applet").toArray();
	for (var i in applets)
	{
		appletMargins[i] = applets[i].style.marginLeft;
		applets[i].style.marginLeft = "10000px";
	}

	objectMargins = new Array();
	var objects = $("object").toArray();
	for (var i in objects)
	{
		objectMargins[i] = objects[i].style.marginLeft;
		objects[i].style.marginLeft = "10000px";
	}

	embedMargins = new Array();
	var embeds = $("embed").toArray();
	for (var i in embeds)
	{
		embedMargins[i] = embeds[i].style.marginLeft;
		embeds[i].style.marginLeft = "10000px";
	}

	/* Remove the validation tooltips. */
	$(".formError").remove();
}

/**
 * Restores applets, embeds and objects back to original position.
 */
function restoreObjects() 
{
	/* Move the applet, object and embeds back to their original
	 * position. */
	var applets = $("applet").toArray();
	for (var i in applets)
	{
		applets[i].style.marginLeft = appletMargins[i];
	}

	var objects = $("object").toArray();
	for (var i in objects)
	{
		objects[i].style.marginLeft = objectMargins[i];
	}

	var embeds = $("embed").toArray();
	for (var i in embeds)
	{
		embeds[i].style.marginLeft = embedMargins[i];
	}
	/* Remove the validation tooltips. */
	$(".formError").remove();
}

/**
 * Resize format to page size.
 */
function resizeFooter()
{
	$("#wrapper").css("min-height", "0");

	if (/msie|MSIE 8/.test(navigator.userAgent))
	{
		/* For some reason IE 8 in "standards mode" finds an extra four pixels
		 * height that no other browser has. */
		$("#wrapper").css("min-height", $(document).height() - 4);
	}
	else
	{
		$("#wrapper").css("min-height", $(document).height() );
	}
}