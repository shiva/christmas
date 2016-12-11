$(document).ready(function() {
  var $alert = $('.alert');
  $alert.hide();
  $alert.on('error', function(event, data){
    $alert.html(data)
    $alert.addClass('alert-danger');
    $alert.show();
  });
  $alert.on('success', function(event, data) {
    $alert.html(data);
    $alert.addClass('alert-info');
    $alert.show();
  })
  $('.task-delete').click(function(event) {
    $target = $(event.target)
    $.ajax({
      type: 'DELETE',
      url: '/tasks/' + $target.attr('data-task-id'),
      data: {
        _csrf: $target.attr('data-csrf')
      },
      success: function(response) {
        $target.parent().parent().remove();
        $alert.trigger('success', 'Item was removed.');
      },
      error: function(error) {
        $alert.trigger('error', error);
      }
    })
  });
  $('#fld_item_name').focus(function(event) {
    $('#fld_item_link').show()
    $('#fld_item_notes').show()
    $('#btn_submit').show()
    $('#fld_item_close').show()
  })
  $('#fld_item_close').click(function(event) {
    $('#fld_item_link').hide()
    $('#fld_item_notes').hide()
    $('#btn_submit').hide()
    $('#fld_item_close').hide()
  })

})
