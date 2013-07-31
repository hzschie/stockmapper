$(document).ready(function() {
  var $productsMenuItem = $('#products'),
      $productsSubMenu = $('#products_submenu');
  $productsMenuItem.hover(
    function() { $productsSubMenu.show(); },
    function() { $productsSubMenu.hide(); }
  );
  
  quote();
  checkChange();
  setInterval(quote, 60000);
});

function checkChange(){
	var changes = $('li > .change');
	for(var i = 0; i < changes.length; i++){
		if(change.startsWith("-"))
			if(!$(changes[i]).hasClass('down'))
				$(changes[i]).addClass('down');
	}
}

function quote(){
      $.ajax({
        url: '/quote/^ETFCOMP',
        success: function(data){
          $('.etfcomp_quote > .price').text(data['last_trade_price']);
          if(data['change'] < 0)
          	$('.etfcomp_quote > .change').addClass('down');
          $('.etfcomp_quote > .change').text(data['change'] + ' (' + data['change_percent'] + ')');
        },
        error:function(){console.log('error');},
        dataType: 'JSON',
      });
  }