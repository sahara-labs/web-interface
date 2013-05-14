$(function(){
    $(".draggable").draggable({ snap: true , snapTolerance: 5});
    $( ".resizable" ).resizable();
    $( ".resizableVideo" ).resizable({
      aspectRatio: 16 / 9,
      minHeight: 192,
      minWidth: 108
    });
});
$(function(){
    $('.toggle').click(function(){
        var x = '.' + $(this).attr('name');
        var y = $(this);
        $(x).is(':visible')? y.css('background','#ddd'):y.css('background','#f3f3f3'); 
        $(x).is(':visible')?$(x).hide('fade',150):$(x).show('fade',150); 
    });   
});
$( ".draggable" ).each(function( index ){
    this.name = $(this).attr('name');
    this.position = $(this).position();
});
$(function(){
    $( ".slider" ).slider({
      range: "min",
      min: 0,
      max: 100,
      value: 0,
      slide: function( event, ui ) {
        $( ".sliderValue" ).val( ui.value );
      }
  });
  $( ".sliderValue" ).val( $( ".slider" ).slider( "value" ) );
});