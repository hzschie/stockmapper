(function() {
  mapper.Graph = Graph;
  var T=0,R=1,B=2,L=3;
  function Graph($graph, _w, opts) {
    opts = opts || {};
    var marketHours = mapper.config.marketHours,
        series,
        w, innerW,
        hasVolume = opts.graphVolume || (opts.graphVolume == null),
        priceH = opts.priceH || 160,
        gap = opts.timelineH || 20,
        volH = hasVolume ? opts.volumeH || 80 : 0,
        pad = opts.padding || [10, 50, 10, 20],
        h = pad[T] + priceH + volH + gap + pad[B],
        svg = d3.select($graph[0]).select('svg'),
        xax = svg.append('svg:g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(' + pad[L] + ',' + (priceH+pad[T]) + ')'),
        divider1 = svg.append('line').attr('class', 'divider')
          .attr('x1', pad[L])
          .attr('y1', pad[T] + priceH + gap).attr('y2', pad[T] + priceH + gap),

        x = d3.time.scale.utc(),
        xt = function(slice,i) { return x(slice.t); },
        isWithinMarketHours = function(slice) { var t = (slice.t % 8.64e7) / 60000; return t >= marketHours.t0 && t <= marketHours.t1; },
        
        xAxis = d3.svg.axis().scale(x)
          .tickSize(-(priceH + pad[T]), 0, 0)
          .tickPadding(7),
    
        priceGraph = new PriceGraph(svg, pad[L], pad[T], _w - pad[L] - pad[R], priceH, gap),
        volumeGraph = hasVolume && new VolumeGraph(svg, pad[L], pad[T] + priceH + gap, _w - pad[L] - pad[R], volH);
        
    this.setWidth = function(_w) {
      w = _w;
      innerW = w - pad[L] - pad[R];
      svg.attr('width', w + 'px').attr('height', h + 'px');
      divider1.attr('x2', w - pad[R]);
      x.range([0, innerW]);
      priceGraph.setWidth(innerW);
      hasVolume && volumeGraph.setWidth(innerW);
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
              
          priceGraph.highlight(slice, x);
          hasVolume && volumeGraph.highlight(slice, x);
          
          template.applyBindings(bindings, $slice.css({ opacity:1 }), slice);
        });
      },
      function() {
        $svg.off('mousemove');
        $slice.css({ opacity:0 });
        priceGraph.highlight(null);
        hasVolume && volumeGraph.highlight(null);
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
      
      if(!series) return svg.style('opacity', .1);
      else svg.style('opacity', 1);
      
      switch(series.type) {
        case 'intraday':
        case '5day':
          prepareIntraday();
          break;
        case 'daily':
          prepareDaily();
          break;
      }

      // Add extentions of the x axis's ticks down into the volume graph
      var gs = svg.selectAll('.x.axis g');
      gs.selectAll('.tick.bottom').remove();
      gs
        .append('line')
        .attr('class', 'tick bottom')
        .attr('x2', 0)
        .attr('y1', gap)
        .attr('y2', gap + volH);

      var xd = x.domain(),
          tRange = [ xd[0], xd[xd.length - 1] ];
      priceGraph.render(series, tRange, xt, isWithinMarketHours);
      hasVolume && volumeGraph.render(series, tRange, xt, isWithinMarketHours);
    };
    
    function prepareDaily() {
      var tMin;
      if(rangeId == 'rMax') tMin = series.getMin('t');
      else if(rangeId == 'r1y') tMin = series.getMax('t') - 314496e5;
      else if(rangeId == 'r3m') tMin = series.getMax('t') - 78624e5;
      x
        .domain([tMin, series.getMax('t')])
        .range([0, innerW]);
      
      xAxis.tickValues(null);
      
      var span = x.domain()[1] - x.domain()[0];
      if(span > 922752e5)// 3 years
        xAxis.ticks(d3.time.years, 1).tickFormat(d3.time.format.utc('%Y'));
      else if(span >= 307584e5)// 1 year
        xAxis.ticks(d3.time.months, 3).tickFormat(d3.time.format.utc('%b %Y'));
      else
        xAxis.ticks(d3.time.months, 1).tickFormat(d3.time.format.utc('%b %Y'));
        
      xax.call(xAxis);
    };
    
    function prepareIntraday() {
      var dayOf0 = Math.floor(series.getMin('t') / 8.64e7) * 8.64e7,
          date0 = new Date(dayOf0 + marketHours.t0 * 60000),
          dayOf1 = Math.floor(series.getMax('t') / 8.64e7) * 8.64e7,
          date1 = new Date(dayOf1 + marketHours.t1 * 60000);

      var t = dayOf0,
          d = 0,
          _w = series.type == '5day' ? innerW / 5 : innerW,
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
    };
  }


  
/* ------------------------ PriceGraph class ------------------------ */
  
  function PriceGraph(svg, x, y, w, h, gap) {
    var priceAx = svg.append('svg:g')
          .attr('class', 'y axis'),
        priceArea = svg.append('path')
          .attr('class', 'graph_area')
          .attr('transform', 'translate(' + x + ',' + y + ')'),
        pricePath = svg.append('path')
          .attr('class', 'graph_path')
          .attr('stroke-width', 1.5)
          .attr('transform', 'translate(' + x + ',' + y + ')'),
        reference = svg.append('line')
          .attr('class', 'reference')
          .attr('stroke-dasharray', '4 2')
          .attr('x1', x),
        highlighter = svg.append('circle')
          .attr('class', 'ball')
          .attr('stroke-width', 2)
          .attr('r', 3),
      
        yp = d3.scale.linear().range([h, 0]),
        yPrice = function(slice, i) { return yp(slice.price); },

        dLine = d3.svg.line().y(yPrice),
        dArea = d3.svg.area().y1(yPrice).y0(h + gap),
    
        priceAxis = d3.svg.axis().scale(yp)
          .ticks(4)
          .tickPadding(4)
          .orient('right');
          
    (this.setWidth = function(w) {
      priceAx.attr('transform', 'translate(' + (x + w) + ',' + y + ')');
      reference.attr('x2', x + w);
      priceAxis.tickSize(-w);
    })(w);
    
    this.highlight = function(slice, fx) {
      if(!slice) return highlighter.style('display', 'none');
      highlighter
        .style('display', 'block')
        .attr('cx', x + fx(slice.t))
        .attr('cy', y + yp(slice.price));
    };
      
    this.render = function(series, tRange, xt, isWithinMarketHours) {
      var pMin = series.getMin('price', tRange),
          pMax = series.getMax('price', tRange);

      if(series.price_ref != null) {
        pMin = Math.min(series.price_ref, pMin || (series.price_ref * .9));
        pMax = Math.max(series.price_ref, pMax || (series.price_ref * 1.1));
      }
      var dPad = (pMax - pMin) * .1;
      
      yp.domain([Math.max(0, pMin - dPad), pMax + dPad]);
      
      priceAx.call(priceAxis);

      reference
        .style('display', series.price_ref == null ? 'none' : '')
        .attr('y1', y + yp(series.price_ref || 0))
        .attr('y2', y + yp(series.price_ref || 0));
        
      if(series.data.length == 0) return;


      if(series.type == 'intraday') {
        dLine.defined(isWithinMarketHours);
        dArea.defined(isWithinMarketHours);
      }
      else {
        dLine.defined(function(slice) { return slice.t >= tRange[0] && slice.t <= tRange[1]; });
        dArea.defined(function(slice) { return slice.t >= tRange[0] && slice.t <= tRange[1]; });
      }

      var area = dArea.x(xt)(series.data),
          line = dLine.x(xt)(series.data);
      if(area && line) {
        priceArea.style('display', 'block').attr('d', area);
        pricePath.style('display', 'block').attr('d', line);
      }
      else {
        priceArea.style('display', 'none');
        pricePath.style('display', 'none');
      }
    };
  }
  
  
  
  /* ------------------------ VolumeGraph class ------------------------ */
  
  function VolumeGraph(svg, x, y, w, h) {
    var volAx = svg.append('svg:g')
          .attr('class', 'y axis'),
        divider2 = svg.append('line').attr('class', 'divider')
          .attr('x1', x)
          .attr('y1', y + h).attr('y2', y + h),
        volChart = svg.append('g')
          .attr('class', 'volume_chart')
          .attr('stroke-width', 1)
          .attr('transform', 'translate(' + x + ',' + y + ')'),
        highlighter = svg.append('rect')
          .attr('class', 'ball_bar')
          .attr('width', 4)
          .attr('stroke-width', 2),
          
        yv = d3.scale.linear().range([h, 0]),
        yVol = function(slice, i) { var yvv = yv(slice.volume); return yvv == h ? h : Math.min(h-1, yvv); },
        
        volAxis = d3.svg.axis().scale(yv)
          .ticks(2)
          .tickPadding(4)
          .orient('right')
          .tickFormat(mapper.Template.metricFormat);
    
    (this.setWidth = function(w) {
      volAx.attr('transform', 'translate(' + (x + w) + ',' + y + ')');
      divider2.attr('x2', x + w);
      volAxis.tickSize(-w);
    })(w);
    
    this.highlight = function(slice, fx) {
      if(!slice) return highlighter.style('display', 'none');
      highlighter
        .style('display', 'block')
        .attr('x', x + fx(slice.t) - 2)
        .attr('y', y + yv(slice.volume) - 2)
        .attr('height', h - yv(slice.volume) + 4);
    };

    
    this.render = function(series, tRange, xt, isWithinMarketHours) {
      yv.domain([0, series.getMax('volume', tRange) * 1.2]);
        
      volAx.call(volAxis);
      
      var bars = volChart.selectAll('.bar').data(series.data);
      bars.enter()
        .append('line')
        .attr('class', 'bar');
      bars
        .attr('x1', xt)
        .attr('x2', xt)
        .attr('y1', h)
        .attr('y2', yVol)
        .style('display', function(slice) { return series.type == 'daily' ? true : isWithinMarketHours(slice) ? '' : 'none'; });
      bars.exit().remove();
    };
  }
})();