$(document).ready(function() {
  $('#nav [data-id=' + window.currentPage + ']').addClass('selected')[0];
  
  var $productsMenuItem = $('#products'),
      $productsSubMenu = $('#products_submenu');
  $productsMenuItem.hover(
    function() { $productsSubMenu.show(); },
    function() { $productsSubMenu.hide(); }
  );

  var $loginMenuItem = $('#login'),
      $loginBox = $('#login_box');
  $loginMenuItem.hover(
    function() { $loginBox.show(); },
    function() { $loginBox.hide(); }
  );

  quotes();
  setInterval(quotes, 60000);
});

function quotes(){
  quote('comp');
  quote(50);
  quote(25);
}

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

function quote(kind){
      var target = 'etf' + kind + '_quote';
      $.ajax({
        url: '/' + target + '/^ETFCOMP',
        success: function(data){
          $('.' + target + ' > .quote > .price').text(data['last_trade_price']);
          var changeEle = $('.' + target + ' > .quote > .change');
          checkChange(changeEle, data);
          changeEle.text(data['change'] + ' (' + data['change_percent'] + ')');
        },
        error:function(){console.log('error');},
        dataType: 'JSON'
      });
  }