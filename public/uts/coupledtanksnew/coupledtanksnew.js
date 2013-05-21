$(function() {
    $.ui.plugin.add('draggable', 'increaseZindexOnmousedown', {
        create: function() {
            this.mousedown(function(e) {
                var inst = $(this).data('draggable');
                inst._mouseStart(e);
                inst._trigger('start', e);
                inst._clear();
            });
        }
    });
    $(".windowwrapper").draggable({
        snap: true,
        snapTolerance: 5,
        stack: '.windowwrapper',
        increaseZindexOnmousedown: true
    });
    $("#tabs").tabs();
    $(".windowcontent").resizable();
    $(".resizableVideo").resizable({
        aspectRatio: 16 / 9,
        minHeight: 192,
        minWidth: 108
    });
});
$(function() {
    $('.toggle').click(function() {
        var x = '.' + $(this).attr('name');
        var y = $(this);
        $(x).is(':visible') ? $(x).hide('fade', 150) : $(x).show('fade', 150);
        if ($(this).find('.switch').find('.slide').hasClass('off')) {
            $(this).find('.switch').find('.slide').addClass("on").removeClass("off");
        }else{
            $(this).find('.switch').find('.slide').addClass("off").removeClass("on");
        } 
    });
});
$(function() {
    $(".slider").slider({
        range: "min",
        min: 0,
        max: 100,
        value: 0,
        slide: function(event, ui) {
            $(".sliderValue").val(ui.value);
            console.log('sliding');
        }
    });
    $(".sliderValue").val($(".slider").slider("value"));
});
$(".sliderValue").change(function() {
    var value = this.value.substring(1);
    $(".slider").slider("value", parseInt(value));
});
$(".draggable").each(function(index) {
    this.name = $(this).attr('name');
    this.position = $(this).position();
});