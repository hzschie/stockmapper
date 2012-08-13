(function() {
  mapper.Graph = Graph;
  var T=0,R=1,B=2,L=3;
  function Graph($graph) {
    var marketHours = mapper.config.marketHours,
        w = 600,
        priceH = 160,
        gap = 20,
        volH = 80,
        h = priceH + volH + gap,
        pad = [20, 50, 10, 20],
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
    this.render = function(series) {
      console.log(series);
      switch(series.type) {
        case 'intraday':
          renderIntraday(series);
          break;
        case 'daily':
          renderDaily(series);
          break;
      }
      
      xax.call(xAxis);
      var gs = svg.selectAll('.x.axis g');
      gs.selectAll('.tick.bottom').remove();
      gs
        .append('line')
        .attr('class', 'tick bottom')
        .attr('x2', 0)
        .attr('y1', gap)
        .attr('y2', volH + gap);
      
      var min = Math.min(series.price_ref || series.price_min, series.price_min),
          max = Math.max(series.price_ref || series.price_max, series.price_max),
          dPad = (max - min) * .1;
      yp.domain([min - dPad, max + dPad]);
      priceAx.call(priceAxis);

      yv.domain([0, series.volume_max * 1.2]);
      volAx.call(volAxis);
      
      priceArea.attr('d', dArea(series.data));
      pricePath.attr('d', dLine(series.data));
      
      var bars = volChart.selectAll('.bar').data(series.data);
      bars.enter()
        .append('line')
        .attr('class', 'bar');
      bars
        .attr('x1', xt)
        .attr('x2', xt)
        .attr('y1', volH)
        .attr('y2', yVol)
        .style('display', function(slice) { return isWithinMarketHours(slice) ? '' : 'none'; });
      bars.exit().remove();
      
      reference
        .style('display', series.price_ref == null ? 'none' : '')
        .attr('y1', yp(series.price_ref || 0))
        .attr('y2', yp(series.price_ref || 0));
    };
    
    function renderDaily(series) {
      x
        .domain([series.t_min, series.t_max])
        .range([0, w]);
      
      var range = series.t_max - series.t_min;
      if(range > 922752e5)// 3 years
        xAxis.ticks(d3.time.years, 1).tickFormat(d3.time.format.utc('%Y'));
      else if(range >= 307584e5)// 1 year
        xAxis.ticks(d3.time.months, 3).tickFormat(d3.time.format.utc('%b %Y'));
      else
        xAxis.ticks(d3.time.months, 1).tickFormat(d3.time.format.utc('%b %Y'));
    };
    
    function renderIntraday(series) {
      var dayOf0 = series.t_min - (series.t_min % 8.64e7),
          date0 = new Date(dayOf0 + marketHours.t0 * 60000),
          dayOf1 = series.t_max - (series.t_max % 8.64e7),
          date1 = new Date(dayOf1 + marketHours.t1 * 60000);
          
      var t = dayOf0,
          d = 0,
          domain = [],
          range = [];
      while(t <= dayOf1) {
        domain.push(t + marketHours.t0 * 60000);
        domain.push(t + marketHours.t1 * 60000);
        range.push(d * w);
        range.push((d + 1) * w);
        d++;
        t += 8.64e7;
      }
      x.domain(domain);
      x.range(range);
      
      xAxis.ticks(d3.time.hours, 1).tickFormat(d3.time.format.utc('%H:%M'));
      
      dLine.defined(isWithinMarketHours);
      dArea.defined(isWithinMarketHours);
    };
  }
})();