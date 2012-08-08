(function() {
  mapper.Graph = Graph;
  var T=0,R=1,B=2,L=3;
  function Graph($graph) {
    var w = 600,
        h = 200,
        pad = [0, 20, 20, 0],
        svg = d3.select($graph[0]).append('svg').attr('width', w + 'px').attr('height', h + 'px'),
        xax = svg.append("svg:g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + (h-pad[B]) + ")"),
        yax = svg.append("svg:g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + (w-pad[R]) + ",0)"),
        area = svg.append('path')
          .attr('class', 'graph_area'),
        path = svg.append('path')
          .attr('class', 'graph_path')
          .attr('stroke-width', 1.5),
        reference = svg.append('line')
          .attr('class', 'reference')
          .attr('stroke-dasharray', '4 2')
          .attr('x1', pad[L])
          .attr('x2', w-pad[R]),
        offset = 0,
        x = d3.time.scale.utc().range([pad[L], w-pad[R]]),
        xt = function(slice,i) { return x(slice.t); },
        y = d3.scale.linear().range([h-pad[B], pad[T]]),
        yPrice = function(slice, i) { return y(slice.price); },
        dLine = d3.svg.line().x(xt).y(yPrice),
        dArea = d3.svg.area().x(xt).y1(yPrice).y0(h-pad[B]),
        xAxis = d3.svg.axis().scale(x)
          .ticks(d3.time.hours, 1)
          .tickSize(4, 0, 0)//-(h - pad[T] - pad[B]), 0, 0)
          .tickPadding(4),
        yAxis = d3.svg.axis().scale(y)
          .tickSize(-(w-pad[L]-pad[R]))//, -w, 0)
          .ticks(4).orient("right")
          .tickPadding(-3);
          
    this.render = function(series) {
      console.log(series);
      var hours = mapper.config.marketHours,
          dayOf0 = series.t_min - (series.t_min % 8.64e7),
          date0 = new Date(dayOf0 + hours.t0 * 60000),
          dayOf1 = series.t_max - (series.t_max % 8.64e7),
          date1 = new Date(dayOf1 + hours.t1 * 60000);
          
      var t = dayOf0,
          d = 0,
          domain = [],
          range = [];
      while(t <= dayOf1) {
        domain.push(t + hours.t0 * 60000);
        domain.push(t + hours.t1 * 60000);
        range.push(d * w + pad[L]);
        range.push((d + 1) * w - pad[R]);
        d++;
        t += 8.64e7;
      }
      x.domain(domain);
      x.range(range);
      // x.domain([date0, date1]);
      // x.domain([series.t_min, series.t_max]);
      
      offset = series.t_min;
      var min = Math.min(series.price_ref, series.price_min),
          max = Math.max(series.price_ref, series.price_max),
          dPad = (max - min) * .1;
          
      y.domain([min - dPad, max + dPad]);
      xax.call(xAxis);
      yax.call(yAxis);

      yax.selectAll('text')
        .attr('text-anchor', 'end')
        .attr('dy', '-4');

      area.attr('d', dArea(series.data));
      path.attr('d', dLine(series.data));
        
      reference
        .attr('y1', y(series.price_ref))
        .attr('y2', y(series.price_ref));
    };
  }
})();