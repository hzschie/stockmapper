(function() {
  function Chart($container) {
    var models = null,
        svg = d3.select($container[0]).append('svg'),
        mostActive = svg.append('g').attr('class', 'most_active').attr('fill', '#76f9fb'),
        $mostActive = $container.find('.most_active');
        
    mostActive.append('text').text('VOLUME').attr('dy', 4);
    mostActive.append('text').attr('class', 'sym').attr('dy', 17);
    mostActive.append('path').attr('stroke', '#76f9fb').attr('stroke-width', 2);

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
        
      // Render Change ticks
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
        .attr('y2', changeTickY);
      changeTicks.exit()
        .remove();
        
      // Render Change ticks' text
      changeTicksText.enter().append('text')
        .attr('class', 'chg')
        .attr('text-anchor', 'end')
        .attr('fill', '#bbb')
        .attr('dy', -2)
        .attr('x', w)
        .attr('y', changeTickY);
      changeTicksText
        .attr('x', w)
        .attr('y', changeTickY)
        .text(function(val) { return val + '.0%'; });
      changeTicksText.exit()
        .remove();
        
      // Render Volume ticks
      var tickValues = volumeY.ticks(4).slice(1),
          tickValues = d3.scale.sqrt()
            .domain([0, tickValues[0]])
            .range([0, volumeY(tickValues[0])]).ticks(4).slice(1).concat(tickValues),
          volumeTickY = function(val) { return paddingTop + chgMaxH + Math.round(volumeY(val)) + .5; },
          changeTicks = svg.selectAll('line.vol').data(tickValues),
          changeTicksText = svg.selectAll('text.vol').data(tickValues);
      changeTicks.enter().append('line')
        .attr('class', 'vol')
        .attr('stroke-dasharray', '2 2');
      changeTicks
        .attr('stroke', '#555555')
        .attr('x1', 0)
        .attr('x2', w)
        .attr('y1', volumeTickY)
        .attr('y2', volumeTickY);
      changeTicks.exit()
        .remove();

      // Render Volume ticks' text
      changeTicksText.enter().append('text')
        .attr('class', 'vol')
        .attr('text-anchor', 'end')
        .attr('fill', '#bbb')
        .attr('dy', -2)
        .attr('x', w)
        .attr('y', volumeTickY);
      changeTicksText
        .attr('x', w)
        .attr('y', volumeTickY)
        .text(function(val) {
          if(val >= 1e+12)
            return val / 1e+12 + 'T';
          else if(val >= 1e+9)
            return val / 1e+9 + 'B';
          else if(val >= 1e+6)
            return val / 1e+6 + 'M';
          else if(val >= 1e+3)
            return val / 1e+3 + 'K';
          else
            return String(val);
        });
      changeTicksText.exit()
        .remove();
  
      var mostActiveStock = models.where({ 'volume': d3.max(models.models, Stock.volume) })[0];
      if(mostActiveStock) {
        var arrowIndex = _.indexOf(models.models, mostActiveStock),
            mult = arrowIndex > models.models.length / 2 ? -1 : 1,
            arrowX = barX(null, arrowIndex + (mult == -1 ? 0 : 1)) - (mult == -1 ? 1 : 0),
            arrowY = volumeTickY(mostActiveStock.get('volume')) - 44;
        $mostActive.show().find('path').attr('d', [
          'M' + arrowX + ',' + arrowY,
          'l' + 20*mult + ',0',
          'M' + arrowX + ',' + arrowY,
          'l' + 7*mult + ',-5',
          'M' + arrowX + ',' + arrowY,
          'l' + 7*mult + ',5'
        ].join(' '));
        
        $mostActive.find('text').attr({ 
          x: arrowX,
          y: arrowY,
          dx: 25 * mult,
          'text-anchor': mult == 1 ? 'start' : 'end'
        });
        $mostActive.find('text.sym').text('Most Active Stock: ' + mostActiveStock.get('sym'));
      }
      else {
        $mostActive.hide();
      }

      console.log(Date.now() - tt + ' ms, CHART redraw');
    };
  }
  mapper.Chart = Chart;
})();