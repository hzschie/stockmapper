$(document).ready(function() {
  var $productsMenuItem = $('#products'),
      $productsSubMenu = $('#products_submenu');
  $productsMenuItem.hover(
    function() { $productsSubMenu.show(); },
    function() { $productsSubMenu.hide(); }
  );
  
  quote();
  setInterval(quote, 60000);
});

function checkChange(changeEle, data){
  if(data['change'] < 0){
    if(changeEle.hasClass('up'))
      changeEle.removeClass('up');
    if(!changeEle.hasClass('down'))
      changeEle.addClass('down');
  }
  else{
    if(changeEle.hasClass('down'))
      changeEle.removeClass('down');
    if(!changeEle.hasClass('up'))
      changeEle.addClass('up');
    data['change'] = '+' + data['change'];
  }
}

function quote(){
      $.ajax({
        url: '/quote/^ETFCOMP',
        success: function(data){
          $('.etfcomp_quote > .price').text(data['last_trade_price']);
          var changeEle = $('.etfcomp_quote > .quote > .change');
          checkChange(changeEle, data);
          changeEle.text(data['change'] + ' (' + data['change_percent'] + ')');
        },
        error:function(){console.log('error');},
        dataType: 'JSON',
      });
  }