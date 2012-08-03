(function() {
  mapper.Graph = Graph;
  var T=0,R=1,B=2,L=3;
  function Graph($graph) {
    var w = 400,
        h = 250,
        pad = [0, 0, 20, 0],
        svg = d3.select($graph[0]).append('svg'),
        path = svg.append('path')
          .attr('stroke-width', 2),
        xax = svg.append("svg:g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + (h-pad[B]) + ")"),

        yax = svg.append("svg:g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + w + ",0)"),
        offset = 0,
        interval = 0,
        xi = function(v,i) { return x(offset + i * interval ); },
        x = d3.time.scale.utc().range([0,w]),
        y = d3.scale.linear().range([h-pad[B], pad[T]]),
        d = d3.svg.line().x(xi).y(y),
        xAxis = d3.svg.axis().scale(x)
          .ticks(d3.time.hours, 1)
          .tickSize(4, 0, 0)//-(h - pad[T] - pad[B]), 0, 0)
          .tickPadding(4),
        yAxis = d3.svg.axis().scale(y)
          .tickSize(-w)//, -w, 0)
          .ticks(4).orient("right")
          .tickPadding(-3);
    this.render = function(series) {
      offset = series.t0;
      interval = series.interval;
      var dPad = (series.max - series.min) * .1;
      x.domain([series.t0, series.t1]);
      y.domain([series.min - dPad, series.max + dPad]);
      xax.call(xAxis);
      yax.call(yAxis);

      yax.selectAll('text')
        .attr('text-anchor', 'end')
        .attr('dy', '-4');

      path
        .attr('stroke', '#fff')
        .attr('fill', 'none')
        .attr('d', d(series.data));
    };
  }
})();