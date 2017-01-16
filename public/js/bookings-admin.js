/**
 * Reload the page to show reservations for specified date range.
 * 
 * @param rig rig name
 * @param from start date
 * @param to end date
 */
function load_reservations_for_dates(rig, from, to)
{
    var url = window.location.href, p = url.indexOf('rig');

    url = url.substr(0, p + 4);
    url += 'for/' + rig;
    url += '/from/' + from.replace(/\//g, '-');
    url += '/to/' + to.replace(/\//g, '-');

    window.location.href = url;
}

/**
 * Confirms cancellation of a booking.
 * 
 * @param id booking identifier
 */
function confirm_cancel_booking(id)
{
    var thiz = this,
        html = 
        "<div id='confirmcancel' title='Cancel Reservation'>" +
            "<p>Are you sure you want to cancel the reservation for '" +
            $("#booking-" + id + "-row .user-cell").text() + "'?</p>" +
        "</div>";
    
    $("body").append(html);
    $("#confirmcancel").dialog({
        autoOpen: true,
        modal: true,
        width: 400,
        resizable: false,
        buttons: {
            'Cancel Reservation': function() {
                cancel_booking(id);
            },
            'Close': function() {
                $(this).dialog('close');
            }
        },
        close: function() {
            $(this).dialog('destroy').remove();
        }
    });
};

/**
 * Cancels a booking.
 * 
 * @param id booking identifier
 */
function cancel_booking(id) 
{
    /* Tear down dialog. */
    var thiz = this, diagsel = "div[aria-labelledby=ui-dialog-title-confirmcancel]";
    $(diagsel + " div.ui-dialog-titlebar").css("display", "none");
    $(diagsel + " div.ui-dialog-buttonpane").css("display", "none");
    $("#confirmcancel").html(
        "<div class='bookingconfirmationloading'>" +
        "   <img src='/images/ajax-loading.gif' alt='Loading' /><br />" +
        "   <p>Requesting...</p>" +
        "</div>");
    
    $.post(
        '/bookings/cancel',
        {
            bid: id,
            reason: "Administrator cancellation."
        },
        function(response) { 
            if (typeof response != "object") window.location.reload();
            
            $("#confirmcancel").dialog('close');
            
            if (response.success)
            {
                $("#booking-" + id + "-row").remove();
                if ($("#bookings-list .booking-row").size() == 0)
                {
                    $("#bookings-list").remove();
                    $("#no-bookings").show();
                }
            }
            else
            {
                alert("FAILED: " + response.failureReason);
            }
        });
};