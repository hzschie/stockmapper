(function() {
  function Chart($chart) {
    _.extend(this, Backbone.Events);
    var models,
        $bars = $('.bars', $chart),
        $ticks = $('.ticks', $chart),
        $mostActive = $('.most_active', $chart),
        $advances = $('.advances', $chart),
        $declines = $('.declines', $chart),
        _this = this;
        
    $chart.mouseout(function(event) { 
      if(event.toElement != $chart[0] && !$(event.toElement).is('li')) 
        _this.trigger('inspect_bar', null);
    });

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
      model._chart = {};
      var $bar = model._chart.$bar = $(this)
            .addClass('bar ok')
            .css({
              left:xi(i),
              width: wi(i),
              visibility:'hidden',
              height: chgMaxH + 1 + volMaxH
            }),
          chgPct = model.get('changePct') || 0,
          $chgBar = model._chart.$chgBar = $('<div></div>')
            .addClass('chg')
            .css({
              'top': chgMaxH - chgY(chgPct),
              'height': chgY(chgPct)
            })            
            .appendTo($bar),
          $volBar = model._chart.$volBar = $('<div></div>')
            .addClass('vol')
            .css({
              'top': chgMaxH + 1,
              'background-color': '#999',
              'height': volY(model.get('volume'))
            })
            .appendTo($bar);
            
      setTimeout(function() {
        $bar.css({ visibility:'visible' });
        $bar.mouseover(function(e) {
          var barTop = $bar.offset().top,
              isVol = e.pageY - barTop > chgMaxH;
          _this.trigger('inspect_bar', model, isVol ? $volBar : $chgBar, isVol, barTop + (isVol ? chgMaxH + 1 + volMaxH - 80 : -40) );
        });
      }, getDelay(model, i));
    }
    
    function updateModel(model, i) {
      if(!model._chart) return;
      var force = !isNaN(i),
          $bar = model._chart.$bar,
          $chgBar = model._chart.$chgBar,
          $volBar = model._chart.$volBar;
      
      if(model.hasChanged('change') || force) {
        var chgPct = model.get('changePct') || 0;
        $chgBar.css({
          'background-color': mapper.changePctToHex(chgPct),
          'top': chgMaxH - chgY(chgPct),
          'height': chgY(chgPct)
        });
      }
      if(model.hasChanged('volume') || force) {
        $volBar.css({
          'height': volY(model.get('volume'))
        });        
      }
      
      if(!force) return;
      
      var _chart = model._chart;
      if(_chart.updateTimeout) clearTimeout(_chart.updateTimeout);
      _chart.updateTimeout = setTimeout(function() {
        _chart.updateTimeout = null;
        _chart.index = i;
        $bar.css({
          left:xi(i),
          width: wi(i)
        });
        
        if(model.get('volume') == volMax) {
          $('.sym', $mostActive).text(model.get('sym'));
          var left = barsX + xi(i + 1);
          if(left + 240 > barsX + barsWidth)
            $mostActive
              .addClass('right')
              .css({
                display:'block',
                left: xi(i) + barsX - $mostActive.width()
              });
          else
            $mostActive
              .removeClass('right')
              .css({
                display:'block',
                left:left
              });
        }
      }, getDelay(model, i));
    }
    
    var oldLength,
        getDelay,
        sizeMult = 1,
        iDelay = function(model, i) { return mapper.perf.chartDelayMult * sizeMult * i / models.length; },
        xtraDelay = function(extra, fn) { 
          return function(model, i) { return extra + (fn ? fn(model, i) : iDelay(model, i)); };
        };// slow device, make delay 1 sec longer
    function rebuild(collection, options, isNewCollection) {
      sizeMult = models.length > 1000 ? 3 : 1;
      updateHelpers();
      updateBounds();
      
      if(models.comparator == mapper.sortFunctions['chg'] && models.at(0).get('hasData')) {
        showUpsAndDowns();
      }
      else {
        $advances.hide();
        $declines.hide();
      }
        
      /* ------ UPDATE BARS ------ */
      var tt = Date.now();
      
      Interval.remove({ key:'chart_add' });
      Interval.callOnce({ fn:function() {
        var bars = d3.select($bars[0]).selectAll('.bar.ok');
        oldLength = bars[0].length;
        bars = bars.data(models.models, models.modelId);

        var exiting = 0; bars.exit().each(function() { exiting++; });
        if(exiting == oldLength) getDelay = xtraDelay(200);//getDelay = xtraDelay( 200 + (oldLength - exiting) * 2);
        else getDelay = xtraDelay(1000);//xtraDelay( 1000 + (oldLength - exiting) * 2);
        bars.enter().append('div').each(addModel);
        
        Interval.remove({ key:'chart_update' });
        Interval.callOnce({ fn:function() {
          getDelay = xtraDelay(200);
          bars.each(updateModel);
          
          if(mapper.perf.animate != false && models.at(0).get('hasData') && !$chart.hasClass('animated')) {
            setTimeout(function() {
              $chart.addClass('animated');
            }, 0);
          }
        }, key:'chart_update' });
        
        bars.exit()
          .each(function(model, i) {
            var _chart = model._chart,
                $bar = _chart.$bar;
            $bar.removeClass('ok');
            setTimeout(function() {
              $bar.remove();
            }, .5 * mapper.perf.chartDelayMult * model._chart.index / oldLength);
            delete model._chart;
          });
      }, key:'chart_add' });
        
      /* ------ UPDATE TICKS ------ */
      for(var type = 0; type < 2; type++) {
        var ticks = d3.select($ticks[0]).selectAll(!type ? '.chg_tick' : '.vol_tick').data(!type ? chgTicks : volTicks, Number);
        ticks.enter()
          .append('div')
          .each(function(val, i) {
            if(type) {
              val = mapper.Template.metricFormat(val);
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
          .each(function(val, i) {
            var $this = $(this);
            $this.css({
              top: !type ? chgMaxH - chgY(val) : chgMaxH + volY(val)
            }).children().css({ 'display': !type || (i % 2) ? 'block' : 'none' });
          });
        ticks.exit().remove();
      }
      // console.log(Date.now() - tt + ' ms, HTML CHART redraw');
    }
    
    function updateBounds() {
    }
    
    function showUpsAndDowns() {
      var firstNotUp = models.find(function(model, i) { return model.get('changePct') <= 0; }),
          firstDn = models.find(function(model, i) { return model.get('changePct') < 0; }),
          firstNA = models.find(function(model, i) { return isNaN(model.get('changePct')); }),
          
          lastUpIndex = _.indexOf(models.models, firstNotUp),
          firstDnIndex = _.indexOf(models.models, firstDn),
          lastDnIndex = firstNA ? _.indexOf(models.models, firstNA) : models.length,
          
          firstUpX = xi(0),
          lastUpX  = xi(lastUpIndex == -1 ? models.length : lastUpIndex) - 1,
          firstDnX = xi(firstDnIndex == -1 ? models.length : firstDnIndex),
          lastDnX  = xi(lastDnIndex == -1 ? models.length : lastDnIndex) - 1,
          
          upSpan = lastUpX - firstUpX,
          dnSpan = lastDnX - firstDnX;

      $advances.show().css({
        left: barsX + firstUpX,
        width: lastUpX - firstUpX,
        display: lastUpX > firstUpX ? 'block' : 'none'
      });
      $declines.show().css({
        left: barsX + firstDnX,
        width: lastDnX - firstDnX,
        display: lastDnX > firstDnX ? 'block' : 'none'
      });
      
      $('.count', $advances).text(lastUpIndex);
      $('.count', $declines).text(lastDnIndex - firstDnIndex);
    }
    
    var chgMaxH = 180,
        volMaxH = 300,
        barsX, barsWidth, fBarWidth, chgMax, volMax, chgTicks, volTicks,
        xi = function(i) { return Math.round(i * fBarWidth); },
        wi = function(i) { return Math.max(2, xi(i+1) - xi(i) - 1); },
        chgScl = d3.scale.linear().range([0, chgMaxH]),
        volScl = d3.scale.sqrt().range([0, volMaxH]),
        volSubScl = d3.scale.sqrt(),
        chgY = function(chg, i) { return Math.round( Math.abs(chgScl(chg)) ); },
        volY = function(vol, i) { return Math.round( volScl(vol) ); };
    function updateHelpers() {
      var stocks = models.models;
      barsX = $bars.offset().left - $chart.offset().left;
      barsWidth = $bars.width();
      fBarWidth = Math.min(60, barsWidth / stocks.length);
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
    }
  };
  
  mapper.HtmlChart = Chart;
})();