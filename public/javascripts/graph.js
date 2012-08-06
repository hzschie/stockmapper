(function() {
  mapper.Graph = Graph;
  var T=0,R=1,B=2,L=3;
  function Graph($graph) {
    var w = 600,
        h = 200,
        pad = [0, 20, 20, 0],
        svg = d3.select($graph[0]).append('svg'),
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
        interval = 0,
        xi = function(v,i) { return x(offset + i * interval ); },
        x = d3.time.scale.utc().range([pad[L], w-pad[R]]),
        y = d3.scale.linear().range([h-pad[B], pad[T]]),
        dLine = d3.svg.line().x(xi).y(y),
        dArea = d3.svg.area().x(xi).y1(y).y0(h-pad[B]),
        xAxis = d3.svg.axis().scale(x)
          .ticks(d3.time.hours, 1)
          .tickSize(4, 0, 0)//-(h - pad[T] - pad[B]), 0, 0)
          .tickPadding(4),
        yAxis = d3.svg.axis().scale(y)
          .tickSize(-(w-pad[L]-pad[R]))//, -w, 0)
          .ticks(4).orient("right")
          .tickPadding(-3);
    this.render = function(series) {
      series.ref = series.max + .29;// TEMP!!
      var hours = mapper.config.marketHours,
          dayOf = series.t0 - (series.t0 % 8.64e7),
          date0 = new Date(dayOf + hours.t0 * 60000),
          date1 = new Date(dayOf + hours.t1 * 60000);
      
      offset = series.t0;
      interval = series.interval;
      var min = Math.min(series.ref, series.min),
          max = Math.max(series.ref, series.max),
          dPad = (max - min) * .1;console.log(min,max);
      x.domain([date0, date1]);
      y.domain([min - dPad, max + dPad]);
      xax.call(xAxis);
      yax.call(yAxis);

      yax.selectAll('text')
        .attr('text-anchor', 'end')
        .attr('dy', '-4');

      area.attr('d', dArea(series.data));
      path.attr('d', dLine(series.data));
        
      reference
        .attr('y1', y(series.ref))
        .attr('y2', y(series.ref));
    };
  }
})();