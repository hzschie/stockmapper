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
          { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%)') }
        ]
      });
  
  function updateProducts() {
    _.each(['^ETFCOMP', '^ETFF'], function(sym) {
      var product = mapper.groups.get(sym);
      var $product = $('.product_quote.' + product.get('domName'));
      template.applyBindings('product', $product, product);
    });
  }
  setInterval(updateProducts, 60000);
  updateProducts();
};