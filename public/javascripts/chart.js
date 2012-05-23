(function() {
  function Chart($container) {
    var models = null,
        svg = d3.select($container[0]).append('svg'),
        ticks = svg.append('g'),
        bars = svg.append('g'),
        mostActive = svg.append('g').attr('class', 'most_active').attr('fill', '#76f9fb'),
        $mostActive = $container.find('.most_active'),
        upsAndDowns = svg.append('g').attr('class', 'ups_and_downs'),
        $upsAndDowns = $container.find('.ups_and_downs');
        
    mostActive.append('text').text('VOLUME').attr('dy', 4);
    mostActive.append('text').attr('class', 'sym').attr('dy', 17);
    mostActive.append('path').attr('stroke', '#76f9fb').attr('stroke-width', 2);
    
    upsAndDowns.append('text').attr('class', 'up_count').attr('fill', '#76f9fb').attr('dy', -3).attr('text-anchor', 'middle');
    upsAndDowns.append('text').attr('class', 'dn_count').attr('fill', '#76f9fb').attr('dy', -3).attr('text-anchor', 'middle');
    upsAndDowns.append('path').attr('class', 'up_arrow').attr('stroke', '#76f9fb').attr('stroke-width', 2);
    upsAndDowns.append('path').attr('class', 'dn_arrow').attr('stroke', '#76f9fb').attr('stroke-width', 2);

    this.setModels = function(_models) {
      if(models) {
        models.off('reset', redraw);
      }

      models = _models;
      redraw(null);
      
      if(models) {
        models.on('reset', redraw);
      }
    };
    
    function redraw(collection) {
      if(!models.at(0).get('hasData')) return;
      var tt = Date.now();
      var w = $container.width() - 3,
          paddingTop = 20,
          chgMaxH = 180,
          volMaxH = 300,
          barFractionalW = (w - 40) / models.length,
          changeBars = bars.selectAll('rect.chg').data(models.models, Stock.sym),
          volumeBars = bars.selectAll('rect.vol').data(models.models, Stock.sym),

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
        .attr('fill', Stock.changePctToHex)
        .attr('x', barX)
        .attr('y', function(model, i) { return paddingTop + chgMaxH - chgPctY( Stock.changePctAbs(model) ); })
        .attr('width', barW)
        .attr('height', function(model, i) { return chgPctY( Stock.changePctAbs(model) ); });
      changeBars
        .transition().duration(collection ? 1000 : 0)
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
        .attr('y', paddingTop + chgMaxH + 1)
        .attr('width', barW)
        .attr('height', function(model, i) { return volumeY( Stock.volume(model) ); });
      volumeBars
        .transition().duration(collection ? 1000 : 0)
        .attr('x', barX)
        .attr('y', paddingTop + chgMaxH + 1)
        .attr('width', barW)
        .attr('height', function(model, i) { return volumeY( Stock.volume(model) ); });
      volumeBars.exit()
        .remove();
        
      // Render Change ticks
      var tickValues = chgPctY.ticks(3).slice(1),
          changeTickY = function(val) { return paddingTop + Math.round(chgMaxH - chgPctY(val)) + .5; },
          changeTicks = ticks.selectAll('line.chg').data(tickValues),
          changeTicksText = ticks.selectAll('text.chg').data(tickValues);
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
          changeTicks = ticks.selectAll('line.vol').data(tickValues),
          changeTicksText = ticks.selectAll('text.vol').data(tickValues);
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
            arrowY = volumeTickY(mostActiveStock.get('volume')) - 17;
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
      
      if(models.comparator == mapper.sortFunctions['chg'] && !isNaN(models.at(0).get('changePct'))) {
        var firstNotUp = models.find(function(model, i) { return model.get('changePct') <= 0; }),
            firstDn = models.find(function(model, i) { return model.get('changePct') < 0; }),
            firstNA = models.find(function(model, i) { return isNaN(model.get('changePct')); }),
            
            lastUpIndex = _.indexOf(models.models, firstNotUp),
            firstDnIndex = _.indexOf(models.models, firstDn),
            lastDnIndex = firstNA ? _.indexOf(models.models, firstNA) : models.length,
            
            firstUpX = barX(null, 0),
            lastUpX  = barX(null, lastUpIndex) - 1,
            firstDnX = barX(null, firstDnIndex),
            lastDnX  = barX(null, lastDnIndex) - 1,
            
            upSpan = lastUpX - firstUpX,
            dnSpan = lastDnX - firstDnX;

        $upsAndDowns.show();
        $upsAndDowns.find('.up_arrow').attr('d',
          getArrowPath( firstUpX, paddingTop + 55, Math.floor(upSpan/2),  1 ) + 
          getArrowPath( lastUpX,  paddingTop + 55, Math.ceil( upSpan/2), -1 )
        );
        $upsAndDowns.find('.dn_arrow').attr('d',
          getArrowPath( firstDnX, paddingTop + 55, Math.floor(dnSpan/2),  1 ) + 
          getArrowPath( lastDnX,  paddingTop + 55, Math.ceil( dnSpan/2), -1 )
        );
        $upsAndDowns.find('.up_count').attr({
          x: firstUpX + upSpan / 2,
          y: paddingTop + 55
        }).text(lastUpIndex + ' Stocks UP');
        $upsAndDowns.find('.dn_count').attr({
          x: firstDnX + dnSpan / 2,
          y: paddingTop + 55
        }).text((lastDnIndex - firstDnIndex) + ' Stocks DOWN');
      }
      else {
        $upsAndDowns.hide();
      }

      console.log(Date.now() - tt + ' ms, CHART redraw');
    };
    
    function getArrowPath(arrowX, arrowY, length, mult) {
      return [
        'M' + arrowX + ',' + arrowY,
        'l' + length*mult + ',0',
        'M' + arrowX + ',' + arrowY,
        'l' + 7*mult + ',-5',
        'M' + arrowX + ',' + arrowY,
        'l' + 7*mult + ',5'
      ].join(' ');
    }
  }
  mapper.Chart = Chart;
})();