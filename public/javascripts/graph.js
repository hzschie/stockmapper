(function() {
  mapper.Graph = Graph;
  var T=0,R=1,B=2,L=3;
  function Graph($graph, _w) {
    var marketHours = mapper.config.marketHours,
        series,
        w,
        priceH = 160,
        gap = 20,
        volH = 80,
        h = priceH + volH + gap,
        pad = [10, 50, 10, 20],
        svg = d3.select($graph[0]).select('svg'),
        xax = svg.append('svg:g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(' + pad[L] + ',' + (priceH+pad[T]) + ')'),
        priceAx = svg.append('svg:g')
          .attr('class', 'y axis'),
        volAx = svg.append('svg:g')
          .attr('class', 'y axis'),
        divider1 = svg.append('line').attr('class', 'divider')
          .attr('x1', pad[L])
          .attr('y1', pad[T] + priceH + gap).attr('y2', pad[T] + priceH + gap),
        divider2 = svg.append('line').attr('class', 'divider')
          .attr('x1', pad[L])
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
          .attr('x1', pad[L]),
        ball = svg.append('circle')
          .attr('class', 'ball')
          .attr('stroke-width', 2)
          .attr('r', 3),
        ballBar = svg.append('rect')
          .attr('class', 'ball_bar')
          .attr('width', 4)
          .attr('stroke-width', 2),

        x = d3.time.scale.utc(),
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
          .ticks(4)
          .tickPadding(4)
          .orient('right'),
        volAxis = d3.svg.axis().scale(yv)
          .ticks(2)
          .tickPadding(4)
          .orient('right')
          .tickFormat(mapper.Template.metricFormat);
          
    this.setWidth = function(_w) {
      w = _w - 50;
      svg.attr('width', (w+pad[L]+pad[R]) + 'px').attr('height', (h+pad[T]+pad[B]) + 'px');
      priceAx.attr('transform', 'translate(' + (w+pad[L]) + ',' + pad[T] + ')');
      volAx.attr('transform', 'translate(' + (w+pad[L]) + ',' + (priceH + pad[T] + gap) + ')');
      divider1.attr('x2', w+pad[L]);
      divider2.attr('x2', w+pad[L]);
      reference.attr('x2', w+pad[L]);
      x.range([0, w]);
      priceAxis.tickSize(-w);
      volAxis.tickSize(-w);
      if(series) this.render(series);
    };
    this.setWidth(_w);
        
    var $svg = $('svg', $graph),
        $slice = $('.slice', $graph),
        bindings = [
          { $:'.time', field:'t', formatter:mapper.Template.timestamp },
          { $:'.price', field:'price', formatter:mapper.Template.priceFormat },
          { $:'.volume', field:'volume', formatter:mapper.Template.metricFormat }
        ],
        template = new mapper.Template();
    $svg.hover(
      function() {
        $svg.on('mousemove', function(event) {
          if(!series || isPending) return;
          var localX = event.pageX - $svg.offset().left - pad[L],
              time = x.invert(localX),
              slice = series.getNearestSlice(time);
          ball
            .style('display', 'block')
            .attr('cx', pad[L] + x(slice.t))
            .attr('cy', pad[T] + yp(slice.price));
            
          ballBar
            .style('display', 'block')
            .attr('x', pad[L] + x(slice.t) - 2)
            .attr('y', priceH + pad[T] + gap + yv(slice.volume) - 2)
            .attr('height', volH - yv(slice.volume) + 4);
          
          template.applyBindings(bindings, $slice.css({ opacity:1 }), slice);
        });
      },
      function() {
        $svg.off('mousemove');
        $slice.css({ opacity:0 });
        ball.style('display', 'none');
        ballBar.style('display', 'none');
      }
    );
    
    var rangeId;
    this.setRange = function(_rangeId) {
      rangeId = _rangeId;
    };
    
    var isPending = false;
    this.setPending = function(_isPending) {
      isPending = _isPending;
      if(isPending) $graph.addClass('pending');
      else $graph.removeClass('pending');
    };
    
    this.render = function(_series) {
      series = _series;
      this.setPending(false);
      switch(series.type) {
        case 'intraday':
        case '5day':
          renderIntraday();
          break;
        case 'daily':
          renderDaily();
          break;
      }

      // Update the price and volume yscale's domains
      var xd = x.domain(),
          tRange = [ xd[0], xd[xd.length - 1] ],
          pMin = series.getMin('price', tRange),
          pMax = series.getMax('price', tRange);
          
      if(series.price_ref != null) {
        pMin = Math.min(series.price_ref, pMin || (series.price_ref * .9));
        pMax = Math.max(series.price_ref, pMax || (series.price_ref * 1.1));
      }
      var dPad = (pMax - pMin) * .1;
      
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
      
      reference
        .style('display', series.price_ref == null ? 'none' : '')
        .attr('y1', yp(series.price_ref || 0))
        .attr('y2', yp(series.price_ref || 0));
        
      if(series.data.length == 0) return;
      
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
      
    };
    
    function renderDaily() {
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
    
    function renderIntraday() {
      var dayOf0 = Math.floor(series.getMin('t') / 8.64e7) * 8.64e7,
          date0 = new Date(dayOf0 + marketHours.t0 * 60000),
          dayOf1 = Math.floor(series.getMax('t') / 8.64e7) * 8.64e7,
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
        if(dayOfWeek != 0 && dayOfWeek != 6 && series.hasData(tOpen, tClose) || series.data.length == 0) {
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
      
      if(series.type == '5day') {
        dLine.defined(function(slice) { return slice.t >= date0 && slice.t <= date1; });
        dArea.defined(function(slice) { return slice.t >= date0 && slice.t <= date1; });
      }
      else {
        dLine.defined(isWithinMarketHours);
        dArea.defined(isWithinMarketHours);
      }
    };
  }
})();