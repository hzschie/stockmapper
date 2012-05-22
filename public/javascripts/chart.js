(function() {
  function Chart($container) {
    var svg = d3.select($container[0]).append('svg'),
        models = null;
    
    this.setModels = function(_models) {
      if(models) {
        models.off('reset', redraw);
      }

      models = _models;
      redraw();
      
      if(models) {
        models.on('reset', redraw);
      }
    };
    
    function redraw() {
      var tt = Date.now();
      var w = $container.width() - 3,
          paddingTop = 20,
          chgMaxH = 180,
          volMaxH = 300,
          barFractionalW = (w - 40) / models.length,
          changeBars = svg.selectAll('rect.chg').data(models.models, Stock.sym),
          volumeBars = svg.selectAll('rect.vol').data(models.models, Stock.sym),

          barX = function(model, i) { return Math.round(i * barFractionalW); },
          barW = function(model, i) { return Math.max( barX(null, i+1) - barX(null, i) - 1, 1 ); },
          chgPctY = d3.scale.linear()
            .domain([0, d3.max(models.models, Stock.changePctAbs)])
            .range([0, chgMaxH]),
          volumeY = d3.scale.sqrt()
            .domain([0, d3.max(models.models, Stock.volume)])
            .range([0, volMaxH]);

      // Render Change bars
      changeBars.enter().append('rect')
        .attr('class', 'chg')
        .attr('x', barX)
        .attr('width', barW);
      changeBars
        .attr('fill', Stock.changePctToHex)
        .attr('x', barX)
        .attr('y', function(model, i) { return paddingTop + chgMaxH - chgPctY( Stock.changePctAbs(model) ); })
        .attr('width', barW)
        .attr('height', function(model, i) { return chgPctY( Stock.changePctAbs(model) ); });
      changeBars.exit()
        .remove();
        
      // Render Volume bars
      volumeBars.enter().append('rect')
        .attr('class', 'vol')
        .attr('fill', '#999')
        .attr('x', barX)
        .attr('width', barW);
      volumeBars
        .attr('x', barX)
        .attr('y', paddingTop + chgMaxH + 1)
        .attr('width', barW)
        .attr('height', function(model, i) { return volumeY( Stock.volume(model) ); });
      volumeBars.exit()
        .remove();
        
      var tickValues = chgPctY.ticks(3).slice(1),
          changeTickY = function(val) { return paddingTop + Math.round(chgMaxH - chgPctY(val)) + .5; },
          changeTicks = svg.selectAll('line.chg').data(tickValues),
          changeTicksText = svg.selectAll('text.chg').data(tickValues);
      changeTicks.enter().append('line')
        .attr('class', 'chg')
        .attr('stroke-dasharray', '2 2');
      changeTicks
        .attr('stroke', '#555555')
        .attr('x1', 0)
        .attr('x2', w)
        .attr('y1', changeTickY)
        .attr('y2', changeTickY)
        .text(String);
      changeTicks.exit()
        .remove();
        
      changeTicksText.enter().append('text')
        .attr('class', 'chg')
        .attr('text-anchor', 'end')
        .attr('fill', '#bbb')
        // .attr('opacity', .9)
        .attr('dy', -2)
        .attr('x', w)
        .attr('y', changeTickY);
      changeTicksText
        .attr('x', w)
        .attr('y', changeTickY)
        .text(function(val) { return val + '.0%'; });
      changeTicksText.exit()
        .remove();
        
      console.log(Date.now() - tt + ' ms, CHART redraw');
    };
  }
  mapper.Chart = Chart;
})();