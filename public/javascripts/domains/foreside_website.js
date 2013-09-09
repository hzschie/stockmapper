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
});

mapper.dataReady = function() {
  var Template = mapper.Template,
      template = new mapper.Template({
        product: [
          { $:'.price', field:'lastTrade', formatter:Template.priceFormat },
          { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
          { $:'.change .amount', field:'change', formatter:Template.postfix(Template.changeFormat, '&nbsp;(') },
          { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%)') },
          { $:'img', field:'domName', formatter:function(val, $img) {
            $img.attr('src', "/images/domains/foreside/" + val + "_quote_logo.png"); }
          }
        ]
      });
  
  function updateProducts() {
    var $products = $('.product_quote'),
        symbols = null;
        
    if (window.currentPage == 'composite') { symbols = ['^ETFCOMP']; }
    else if (window.currentPage == 'etf50') { symbols = ['^ETFF']; }
    else if (window.currentPage == 'etf25') { symbols = ['^ETF25']; }
    else { symbols = ['^ETFCOMP', '^ETFF']; }
    
    _.each(symbols, function(sym, i) {
      template.applyBindings('product', $products.eq(i), mapper.groups.get(sym));
    });
  }
  setInterval(updateProducts, 60000);
  updateProducts();
};