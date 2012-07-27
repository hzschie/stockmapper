(function() {
  function Chart($chart) {
    _.extend(this, Backbone.Events);
    var models,
        $bars = $('.bars', $chart),
        $ticks = $('.ticks', $chart),
        _this = this;
        
    // $chart.mouseout(function(event) { 
    //   if(event.toElement != $map[0] && !$(event.toElement).is('li')) 
    //     _this.trigger('inspect_tag', null);
    // });

    this.setModels = function(_models) {
      if(models) {
        models.off('change', updateModel);
        models.off('reset', rebuild);
      }
      
      models = _models;
      rebuild(null, null, true);

      // Subscribe to subsequent adding of models
      models.on('change', updateModel);
      models.on('reset', rebuild);
    };
    
    function addModel(model, i, animate) {
      var $bar = model.$bar = $(this)
            .addClass('bar')
            .css({
              width: wi(i)
            }),
          $chgBar = model.$chgBar = $('<div></div>')
            .addClass('chg')
            .css({
              'background-color': mapper.changePctToHex( model.get('changePct') ),
              'top': chgMaxH - chgY(model.get('changePct')),
              'height': chgY(model.get('changePct'))
            })            
            .appendTo($bar),
          $volBar = model.$volBar = $('<div></div>')
            .addClass('vol')
            .css({
              'top': chgMaxH + 1,
              'background-color': '#999',
              'height': volY(model.get('volume'))
            })
            .appendTo($bar);
            
      
      $bar.css({
        left:xi(i),
        display:'none'
      });
      setTimeout(function() {
        $bar.css({ display:'' });
      }, getDelay(model, i));
    }
    
    function updateModel(model, i) {
      var $bar = model.$bar,
          $chgBar = model.$chgBar,
          $volBar = model.$volBar;
      var force = !isNaN(i);
      if(force) model.index = i;
      
      if(model.hasChanged('change') || force) {
        $chgBar.css({
          'background-color': mapper.changePctToHex( model.get('changePct') ),
          'top': chgMaxH - chgY(model.get('changePct')),
          'height': chgY(model.get('changePct'))
        });
      }
      if(model.hasChanged('volume') || force) {
        $volBar.css({
          'height': volY(model.get('volume'))
        });        
      }
      
      if(!force) return;
      
      setTimeout(function() {
        $bar.css({
          left:xi(i),
          width: wi(i)
        });
      }, getDelay(model, i));
    }
    
    var getDelay,
        iDelay = function(model, i) { return 400 * i / models.length; },
        xtraDelay = function(extra) { return function(model, i) { return extra + iDelay(model, i); }; };// slow device, make delay 1 sec longer
    function rebuild(collection, options, isNewCollection) {
      updateHelpers();
      updateBounds();
      
      /* ------ UPDATE BARS ------ */
      var tt = Date.now();
      var bars = d3.select($bars[0]).selectAll('.bar'),
          oldLength = bars[0].length;
      bars = bars.data(models.models, models.modelId);

      var exiting = 0; bars.exit().each(function() { exiting++; });
      if(exiting == oldLength) getDelay = xtraDelay(200);//getDelay = xtraDelay( 200 + (oldLength - exiting) * 2);
      else getDelay = xtraDelay(1000);//xtraDelay( 1000 + (oldLength - exiting) * 2);
      bars.enter().append('div').each(addModel);
        
      getDelay = xtraDelay(200);
      bars.each(updateModel);
      
      bars.exit()
        .each(function(model, i) {
          setTimeout(function() {
            model.$bar.remove();
          }, 400 * model.index / oldLength);
        });
        
      /* ------ UPDATE TICKS ------ */
      for(var type = 0; type < 2; type++) {
        var ticks = d3.select($ticks[0]).selectAll(!type ? '.chg_tick' : '.vol_tick').data(!type ? chgTicks : volTicks, Number);
        ticks.enter()
          .append('div')
          .each(function(val) {
            if(type) {
              if(val >= 1e+12)
                val = val / 1e+12 + 'T';
              else if(val >= 1e+9)
                val = val / 1e+9 + 'B';
              else if(val >= 1e+6)
                val = val / 1e+6 + 'M';
              else if(val >= 1e+3)
                val = val / 1e+3 + 'K';
              else
                val = String(val);
            }
            else if(val) {
              val = mapper.Template.pctFormat(val);
            }
            var $this = $(this)
              .addClass((!type ? 'chg_tick' : 'vol_tick') + ' tick')
              .css({ opacity:0 })
              .append('<div class="left">' + val + '</div>')
              .append('<div class="right">' + val + '</div>');
            setTimeout(function() {
              $this.css({ opacity:1 });
            }, 600);
          });
        ticks
          .each(function(val) {
            var $this = $(this);
            $this.css({
              top: !type ? chgMaxH - chgY(val) : chgMaxH + volY(val)
            });
          });
        ticks.exit().remove();
      }
      
      if(models.at(0).get('hasData') && !$chart.hasClass('animated')) {
        setTimeout(function() {
          $chart.addClass('animated');
        }, 0);
      }
      
      console.log(Date.now() - tt + ' ms, HTML CHART redraw');
    }
    
    function updateBounds() {
    }
    
    var chgMaxH = 180,
        volMaxH = 300,
        fBarWidth,
        xi = function(i) { return Math.round(i * fBarWidth); },
        wi = function(i) { return Math.max(1, xi(i+1) - xi(i) - 1); },
        chgMax,
        volMax,
        chgScl = d3.scale.linear().range([0, chgMaxH]),
        volScl = d3.scale.sqrt().range([0, volMaxH]),
        volSubScl = d3.scale.sqrt(),
        chgY = function(chg, i) { return Math.round( Math.abs(chgScl(chg)) ); },
        volY = function(vol, i) { return Math.round( volScl(vol) ); },
        chgTicks,
        volTicks;
    function updateHelpers() {
      var stocks = models.models;
      fBarWidth = Math.min(60, $bars.width() / stocks.length);
      chgMax = 0;
      chgMax = $.map(stocks, function(m, i) {
        chgMax = Math.max(chgMax, Math.abs(m.attributes['changePct'] || 0));
        return i == stocks.length - 1 ? chgMax : null;
      })[0];
      volMax = 0;
      volMax = $.map(stocks, function(m, i) {
        volMax = Math.max(volMax, (m.attributes['volume'] || 0));
        return i == stocks.length - 1 ? volMax : null;
      })[0];
      
      chgScl.domain([0, chgMax]);
      volScl.domain([0, volMax]);
      chgTicks = chgScl.ticks(3);
      volTicks = volScl.ticks(12).slice(1);
      
      return;
      volTicks = volScl.ticks(4).slice(1);
      volTicks = _.unique(volSubScl.domain([0, volTicks[0]])
        .range([0, volScl(volTicks[0])]).ticks(4).slice(1).concat(volTicks));
    }
  };
  
  mapper.HtmlChart = Chart;
})();