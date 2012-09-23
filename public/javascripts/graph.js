(function() {
  mapper.Graph = Graph;
  var T=0,R=1,B=2,L=3;
  function Graph($graph, _w) {
    var marketHours = mapper.config.marketHours,
        w = _w - 50,//600,
        priceH = 160,
        gap = 20,
        volH = 80,
        h = priceH + volH + gap,
        pad = [10, 50, 10, 20],
        svg = d3.select($graph[0]).select('svg').attr('width', (w+pad[L]+pad[R]) + 'px').attr('height', (h+pad[T]+pad[B]) + 'px'),
        xax = svg.append('svg:g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(' + pad[L] + ',' + (priceH+pad[T]) + ')'),
        priceAx = svg.append('svg:g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + (w+pad[L]) + ',' + pad[T] + ')'),
        volAx = svg.append('svg:g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + (w+pad[L]) + ',' + (priceH + pad[T] + gap) + ')'),
        divider1 = svg.append('line').attr('class', 'divider')
          .attr('x1', pad[L]).attr('x2', w+pad[L])
          .attr('y1', pad[T] + priceH + gap).attr('y2', pad[T] + priceH + gap),
        divider2 = svg.append('line').attr('class', 'divider')
          .attr('x1', pad[L]).attr('x2', w+pad[L])
          .attr('y1', pad[T] + h).attr('y2', pad[T] + h),
        priceArea = svg.append('path')
          .attr('class', 'graph_area')
          .attr('transform', 'translate(' + pad[L] + ',' + pad[T] + ')'),
        pricePath = svg.append('path')
          .attr('class', 'graph_path')
          .attr('stroke-width', 1.5)
          .attr('transform', 'translate(' + pad[L] + ',' + pad[T] + ')'),
        volChart = svg.append('g')
          .attr('class', 'volume_chart')
          .attr('stroke-width', 1)
          .attr('transform', 'translate(' + pad[L] + ',' + (priceH + pad[T] + gap) + ')'),
        reference = svg.append('line')
          .attr('class', 'reference')
          .attr('stroke-dasharray', '4 2')
          .attr('x1', pad[L])
          .attr('x2', w+pad[L]),

        x = d3.time.scale.utc().range([0, w]),
        xt = function(slice,i) { return x(slice.t); },
        isWithinMarketHours = function(slice) { var t = (slice.t % 8.64e7) / 60000; return t >= marketHours.t0 && t <= marketHours.t1; },
        
        yp = d3.scale.linear().range([priceH, 0]),
        yPrice = function(slice, i) { return yp(slice.price); },

        yv = d3.scale.linear().range([volH, 0]),
        yVol = function(slice, i) { var yvv = yv(slice.volume); return yvv == volH ? volH : Math.min(volH-1, yvv); },
        
        dLine = d3.svg.line().x(xt).y(yPrice),
        dArea = d3.svg.area().x(xt).y1(yPrice).y0(priceH + gap),
        
        xAxis = d3.svg.axis().scale(x)
          .tickSize(-(priceH + pad[T]), 0, 0)
          .tickPadding(7),
        priceAxis = d3.svg.axis().scale(yp)
          .tickSize(-w)//, -w, 0)
          .ticks(4)
          .tickPadding(4)
          .orient('right'),
        volAxis = d3.svg.axis().scale(yv)
          .tickSize(-w)
          .ticks(2)
          .tickPadding(4)
          .orient('right');
    
    var rangeId;
    this.setRange = function(_rangeId) {
      rangeId = _rangeId;
    };
    
    this.setPending = function(isPending) {
      if(isPending) $graph.addClass('pending');
      else $graph.removeClass('pending');
    };
    
    this.render = function(series) {
      this.setPending(false);
      switch(series.type) {
        case 'intraday':
        case '5day':
          renderIntraday(series);
          break;
        case 'daily':
          renderDaily(series);
          break;
      }

      // Update the price and volume yscale's domains
      var xd = x.domain(),
          tRange = [ xd[0], xd[xd.length - 1] ],
          pMin = series.getMin('price', tRange),
          pMax = series.getMax('price', tRange),
          dPad = (pMax - pMin) * .1;
      yp.domain([Math.max(0, pMin - dPad), pMax + dPad]);
      yv.domain([0, series.getMax('volume', tRange) * 1.2]);
      
      var gs = svg.selectAll('.x.axis g');
      gs.selectAll('.tick.bottom').remove();
      gs
        .append('line')
        .attr('class', 'tick bottom')
        .attr('x2', 0)
        .attr('y1', gap)
        .attr('y2', volH + gap);
      
      priceAx.call(priceAxis);

      volAx.call(volAxis);
      
      var area = dArea(series.data),
          line = dLine(series.data);
      if(area && line) {
        priceArea.style('display', 'block').attr('d', area);
        pricePath.style('display', 'block').attr('d', line);
      }
      else {
        priceArea.style('display', 'none');
        pricePath.style('display', 'none');
      }
      
      var bars = volChart.selectAll('.bar').data(series.data);
      bars.enter()
        .append('line')
        .attr('class', 'bar');
      bars
        .attr('x1', xt)
        .attr('x2', xt)
        .attr('y1', volH)
        .attr('y2', yVol)
        .style('display', function(slice) { return series.type == 'daily' ? true : isWithinMarketHours(slice) ? '' : 'none'; });
      bars.exit().remove();
      
      reference
        .style('display', series.price_ref == null ? 'none' : '')
        .attr('y1', yp(series.price_ref || 0))
        .attr('y2', yp(series.price_ref || 0));
    };
    
    function renderDaily(series) {
      var tMin;
      if(rangeId == 'rMax') tMin = series.getMin('t');
      else if(rangeId == 'r1y') tMin = series.getMax('t') - 314496e5;
      else if(rangeId == 'r3m') tMin = series.getMax('t') - 78624e5;
      x
        .domain([tMin, series.getMax('t')])
        .range([0, w]);
      
      xAxis.tickValues(null);
      
      var span = x.domain()[1] - x.domain()[0];
      if(span > 922752e5)// 3 years
        xAxis.ticks(d3.time.years, 1).tickFormat(d3.time.format.utc('%Y'));
      else if(span >= 307584e5)// 1 year
        xAxis.ticks(d3.time.months, 3).tickFormat(d3.time.format.utc('%b %Y'));
      else
        xAxis.ticks(d3.time.months, 1).tickFormat(d3.time.format.utc('%b %Y'));
        
      dLine.defined(function(slice) { return slice.t >= tMin; });
      dArea.defined(function(slice) { return slice.t >= tMin; });
      
      xax.call(xAxis);
    };
    
    function renderIntraday(series) {
      var dayOf0 = series.getMin('t') - (series.getMin('t') % 8.64e7),
          date0 = new Date(dayOf0 + marketHours.t0 * 60000),
          dayOf1 = series.getMax('t') - (series.getMax('t') % 8.64e7),
          date1 = new Date(dayOf1 + marketHours.t1 * 60000);

      var t = dayOf0,
          d = 0,
          _w = series.type == '5day' ? w / 5 : w,
          domain = [],
          range = [],
          values = [];
      while(t <= dayOf1) {
        var dayOfWeek = new Date(t).getUTCDay(),
            tOpen = t + marketHours.t0 * 60000,
            tClose = t + marketHours.t1 * 60000;
        if(dayOfWeek != 0 && dayOfWeek != 6 && series.hasData(tOpen, tClose)) {
          domain.push(tOpen);
          domain.push(tClose);
          range.push(d * _w);
          range.push((d + 1) * _w);
          values.push( new Date(tOpen) );
          d++;
        }
        t += 8.64e7;
      }

      x.domain(domain);
      x.range(range);
      
      if(series.type == '5day') xAxis.tickValues(values).tickFormat(d3.time.format.utc('%a %b %e'));
      else xAxis.tickValues(null).ticks(d3.time.hours, 1).tickFormat(d3.time.format.utc('%H:%M'));
      
      xax.call(xAxis);
      
      if(series.type == '5day') xax.selectAll('text').attr('dx', _w/2);
      else xax.selectAll('text').attr('dx', 0);
        
      dLine.defined(isWithinMarketHours);
      dArea.defined(isWithinMarketHours);
    };
  }
})();