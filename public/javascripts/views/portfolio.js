(function() {
  var Acquisition = Backbone.Model.extend({
    get: function (prop) {
      var stock = mapper.stocks.get(this.attributes.sym);
      switch(prop) {
        case 'dayGain': return this.get('quantity') * stock.get('change');
        case 'marketValue': return this.get('quantity') * stock.get('lastTrade');
        case 'totalGain': return this.get('quantity') * (stock.get('lastTrade') - this.get('price'));
        case 'totalGainPct': return 100 * (stock.get('lastTrade') - this.get('price')) / this.get('price');
        case 'totalGainDir':
          var diff = stock.get('lastTrade') - this.get('price');
          return diff == 0 ? 0 : diff / Math.abs(diff);
      }
      var stockVal = stock && stock.get(prop);
      if(stockVal != null) { return stockVal; }
      else { return Backbone.Model.prototype.get.call(this, prop); }
    }
  });
  var Holdings = Backbone.Collection.extend({
    model: Acquisition,
    localStorage: new Backbone.LocalStorage("stockmapperPortfolio")
  });
  
  mapper.Portfolio = Backbone.View.extend({
    events: {
      "click td.remove": "removeAcquisition"
    },
    
    addAcquisition: function(acq) {
      this.holdings.create(acq);
    },
    
    removeAcquisition: function(event) {
      var $entry = $(event.target).parent();
      var removed = this.holdings.at( $entry.index() );
      removed.destroy();
      $entry.fadeOut();
      this.updateBottomLine();
    },
    
    updateBottomLine: function() {
      var bottomLine = this.holdings.reduce(function(memo, acq) {
        memo.dayGain += acq.get('dayGain');
        memo.totalGain += acq.get('totalGain');
        memo.marketValue += acq.get('marketValue');
        return memo;
      }, { dayGain: 0, totalGain: 0, marketValue: 0 });
      bottomLine.totalGainPct = 100 * bottomLine.totalGain / (bottomLine.marketValue - bottomLine.totalGain);
      bottomLine.changeDir = bottomLine.dayGain == 0 ? 0 : Math.abs(bottomLine.dayGain) / bottomLine.dayGain;
      bottomLine.totalGainDir = bottomLine.totalGain == 0 ? 0 : Math.abs(bottomLine.totalGain) / bottomLine.totalGain;
      this.template.applyBindings("acquisition", this.$bottomLine, bottomLine);
    },
    
    initialize: function() {
      var _this = this,
          Template = mapper.Template,
          bindings = [
            { $:'.sym', field:'sym' },
            { $:'.last_trade', field:'lastTrade', formatter:Template.priceFormat },

            { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
            { $:'.change.amount', field:'change', formatter:Template.changeFormat },
            { $:'.change.percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%') },

            { $:'.quantity input', field:'quantity', formatter: function(quantity, $field, acq) { $field.val(Template.commaFormat(quantity)); } },
            { $:'.price input', field:'price', formatter: function(price, $field, acq) { $field.val(Template.priceFormat(price)); } },

            { $:'.day_gain', field:'changeDir', formatter:Template.makeRedOrGreen },
            { $:'.day_gain', field:'dayGain', formatter: Template.changeFormat }, // formatter: function(d, $field, acq) {
              
            { $:'.total_gain', field:'totalGainDir', formatter:Template.makeRedOrGreen },
            { $:'.total_gain.amount', field:'totalGain', formatter:Template.changeFormat },
            { $:'.total_gain.percent', field:'totalGainPct', formatter:Template.postfix(Template.changeFormat, '%') },
            
            { $:'.market_value', field:'marketValue', formatter:Template.priceFormat }
          ];
          
      this.template = new mapper.Template({ "acquisition": bindings });
          
      this.$prompt = this.$(".portfolio_prompt");
      this.$holdings = this.$(".portfolio_holdings");
      this.$bottomLine = this.$holdings.find('.bottom_line');
      
      this.holdings = new Holdings();
      this.holdings.on('add', function(acq) {
        _this.$prompt.hide();
        var $entry = $([
          '<tr class="portfolio_entry">',
            '<td class="sym"></td>',
            '<td class="last_trade"></td>',
            '<td class="change amount"></td>',
            '<td class="change percent"></td>',
            '<td class="quantity"><input/></td>',
            '<td class="price"><input/></td>',
            '<td class="day_gain"></td>',
            '<td class="total_gain amount"></td>',
            '<td class="total_gain percent"></td>',
            '<td class="market_value"></td>',
            '<td class="remove">X</td>',
          '</div>'
        ].join(''))
          .hide()
          .insertBefore(_this.$bottomLine);
        _this.$holdings.fadeIn();
        _this.template.applyBindings("acquisition", $entry, acq);
        $entry.fadeIn();
        
        _this.updateBottomLine();
      });
      this.holdings.fetch();
      
      this.$el.hover(
        function() {
          _this.isOver = true;
        },
        function() {
          _this.isOver = false;
        }
      );

      this.$cursor = $('<div class="drag_cursor">ETF</div>')
        .css({
          position: "absolute",
          color: "#fff",
          top: 0,
          left: 0,
          "font-size": "1.2em",
          "z-index": 20,
          "pointer-events": "none",
          background: "rgba(0,0,0,.8)",
          "line-height": 1,
          padding: "2px 4px"
        })
        .hide()
        .appendTo($('body'));
      var drag = d3.behavior.drag()
        .on('dragstart', function() {
          _this.$cursor
            .html(d3.select(this).html())
            .fadeIn();
        })
        .on('drag', function() {
          var mouse = d3.mouse(_this.$cursor.parent().parent()[0]);
          _this.$cursor.css({
            left: mouse[0] + 3,
            top: mouse[1] + 3
          });
        })
        .on('dragend', function() {
          if(_this.isOver) {
            var stock = d3.select(this).datum();
            _this.addAcquisition({
              sym: stock.get('sym'),
              quantity: 3100,
              price: stock.get('lastTrade') * (1 - .5 * (Math.random() - .5))
            });
          }
          _this.$cursor.fadeOut();
        });
        
      this.options.map.on('inspect_tag', function(model, $tag) {
        if($tag) {
          d3.select($tag[0]).call(drag);
        }
      });
      
      
    }
  });
})();