(function() {
  mapper.Micrograph = Micrograph;
  var T=0,R=1,B=2,L=3;
  function Micrograph($graph) {
    var pad = [8, 15, 20, 39],
        model = PriceGraphModel(GraphModel())
          .width($graph.innerWidth() - pad[L] - pad[R])
          .height($graph.innerHeight() - pad[T] - pad[B]),
        GraphImpl = typeof Raphael != 'undefined' ? RaphaelMicrograph : SvgMicrograph,
        impl = new GraphImpl($graph, model, pad);
        
    this.setTimeSeries = function(_series) {
      model.series(_series);
      impl.update();
    };
  }
  
  function RaphaelMicrograph($graph, model, pad) {
    var paper = Raphael($graph[0]),
        
        graph = d3.select($graph[0]),
        xAxis = graph.append('div')
          .attr('class', 'x_axis')
          .style('left', pad[L] + 'px')
          .style('top', pad[T] + model.height() + 'px'),
        priceAxis = graph.append('div')
          .attr('class', 'y_axis')
          .style('left', pad[L] + 'px')
          .style('top', pad[T] + 'px')
          .style('height', model.height() + 'px')
          .style('display', 'none'),
        reference = graph.append('div')
          .attr('class', 'reference')
          .style('left', pad[L] + 'px')
          .style('width', model.width() + 'px'),
          
        priceGenerator = d3.svg.line().x(model.xTime).y(model.yPrice).defined(model.isDefined);
    
    this.update = function() {
      if(model.isGraphable) {
        var series = model.series(),
            yRef = model.priceScale(series.price_ref || 0);
            
        reference
          .style('display', series.price_ref == null ? 'none' : '')
          .style('top', (yRef + pad[T]) + 'px');

        paper.clear();
        var d = priceGenerator(series.data);
        if(d) paper.path(d).transform('t' + pad[L] + ',' + pad[T]).attr('stroke', '#ddf').attr('stroke-width', 1.5);
        
        model.xAxis.tickPadding(3).tickSize(3);
        
        if (series.type == 'intraday') model.xAxis.tickFormat(
          function(date, i) {
            var h = date.getUTCHours(),
                h12 = h == 12 ? 12 : h % 12,
                lastHour = new Date(model.timeRange[1]).getUTCHours();
            return i == 0 || h == lastHour ? h12 + (h < 12 ? 'am' : 'pm') : h12;
          }
        );

        model.priceAxis.tickValues(model.priceScale.domain())
          .tickPadding(4)
          .orient('left')
          .tickSize(-4);
          
        priceAxis.style('display', 'block').selectAll('.tick').data(model.priceScale.domain()).enter()
          .append('div')
          .attr('class', 'tick')
          .style('width', Math.abs(model.priceAxis.tickSize()) + 'px')
          .style('top', function(d) { return model.priceScale(d) + 'px'; })
          .append('div')
            .text(d3.format('f'));

        xAxis.selectAll('.tick')
          .data( model.xAxis.scale().ticks.apply(model.xAxis.scale(), model.xAxis.ticks()) )
        .enter()
          .append('div')
          .attr('class', 'tick')
          .style('position', 'absolute')
          .style('height', Math.abs(model.xAxis.tickSize()) + 'px')
          .style('left', function(d) { return model.timeScale(d) + 'px'; })
          .append('div')
            .text(model.xAxis.tickFormat());
      }
    };
  }
    
  function SvgMicrograph($graph, model, pad) {
    var svg = d3.select($graph[0]).append('svg'),
        main = svg.append('g'),
        graph = main.append('g')
          .attr('transform', 'translate(' + pad[L] + ',' + pad[T] + ')'),
        xAxis = svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(' + pad[L] + ',' + (pad[T] + model.height()) + ')'),
        priceAxis = svg.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + pad[L] + ',' + pad[T] + ')'),
        pricePath = graph.append('path')
          .attr('class', 'graph_path')
          .attr('stroke-width', 1.5)
          .attr('stroke', '#fff'),
        reference = graph.append('line')
          .attr('class', 'reference')
          .attr('stroke', '#f66')
          .attr('stroke-dasharray', '2 2')
          .attr('x1', 0),
          
        priceGenerator = d3.svg.line().x(model.xTime).y(model.yPrice).defined(model.isDefined);
    
    this.update = function() {
      if(model.isGraphable) {
        var series = model.series(),
            yRef = model.priceScale(series.price_ref || 0);
            
        reference
          .style('display', series.price_ref == null ? 'none' : '')
          .attr('y1', yRef)
          .attr('x2', model.width())
          .attr('y2', yRef);

        var d = priceGenerator(series.data);
        if(d) pricePath.style('display', 'block').attr('d', d);
        else pricePath.style('display', 'none');
        
        model.xAxis.tickPadding(3).tickSize(3);
        
        if (series.type == 'intraday') model.xAxis.tickFormat(
          function(date, i) {
            var h = date.getUTCHours(),
                h12 = h == 12 ? 12 : h % 12,
                lastHour = new Date(model.timeRange[1]).getUTCHours();
            return i == 0 || h == lastHour ? h12 + (h < 12 ? 'am' : 'pm') : h12;
          }
        );
        xAxis.call(model.xAxis);

        model.priceAxis.tickValues(model.priceScale.domain())
          .tickPadding(4)
          .orient('left')
          .tickSize(-4);
          
        priceAxis.call(model.priceAxis);
      }
    };
  }
  
  function PriceGraphModel(graphModel) {
    var h = 0,
        superSeries = graphModel.series,
        priceScale = d3.scale.linear().range([h, 0]);
    var instance = $.extend(graphModel, {
      isGraphable: false,
      priceScale: priceScale,
      yPrice: function(slice) { return instance.priceScale(slice.price); },
      priceAxis: d3.svg.axis().scale(priceScale),

      series: function(_series) {
        if (!arguments.length) return superSeries();
        superSeries(_series);
        prepare();
      },
      
      height: function(_h) {
        if (!arguments.length) return h;
        h = _h;
        instance.priceScale.range([h, 0]);
        return instance;
      }
    });
    
    function prepare() {
      var series = graphModel.series();
      if(!series || !h) {
        instance.isGraphable = false;
        return instance;
      }
      instance.isGraphable = true;

      var pMin = series.getMin('price', graphModel.timeRange),
          pMax = series.getMax('price', graphModel.timeRange);

      if (series.price_ref != null) {
        pMin = Math.min(series.price_ref, pMin || (series.price_ref * .9));
        pMax = Math.max(series.price_ref, pMax || (series.price_ref * 1.1));
      }
      
      if (!pMin) pMin = 0;
      if (!pMax) pMax = pMin;
      var dPad = (pMax - pMin) * .1;
      instance.priceScale.domain([Math.max(0, pMin - dPad), pMax + dPad]);
      
      return instance;
    }
    
    return instance;
  }
  
  function GraphModel() {
    var marketHours = mapper.config.marketHours,
        series = null,
        isDefined,
        w = 0,
        
        isWithinTimeRange = function(slice) { return slice.t >= instance.timeRange[0] && slice.t <= instance.timeRange[1]; },
        isWithinMarketHours = function(slice) { var t = (slice.t % 8.64e7) / 60000; return t >= marketHours.t0 && t <= marketHours.t1; },
        
        timeScale = d3.time.scale.utc();
        
    var instance =  {
      isGraphable: false,
      
      timeScale: timeScale,
      timeRange: [null, null],
      xTime: function(slice) { return instance.timeScale(slice.t); },
      isDefined: function(slice) { return isDefined(slice); },
      xAxis: d3.svg.axis().scale(timeScale),
      
      series: function(_series) {
        if (!arguments.length) return series;
        series = _series;
        return prepare();
      },
      
      // Wrongly returns subclass :(
      width: function(_w) {
        if (!arguments.length) return w;
        if (w == _w) return instance;
        w = _w;
        return prepare();
      }
    };
    
    function prepare() {
      var series = instance.series();
      if(!series || !w) {
        instance.isGraphable = false;
        return instance;
      }
      
      instance.isGraphable = true;
      
      switch(series.type) {
        case 'intraday':
        case '5day':
          prepareIntraday();
          break;
        case 'daily':
        default:
          console.error('GraphModel currently only supports intaday and 5day time series');
          return instance;
      }
      
      if(series.type == 'intraday') isDefined = isWithinMarketHours;
      else isDefined = isWithinTimeRange;
            
      return instance;
    }
    
    function prepareIntraday() {
      var seriesType = instance.series().type,
          dayOf0 = Math.floor((series.getMin('t') || Date.now()) / 8.64e7) * 8.64e7,
          dayOf1 = Math.floor((series.getMax('t') || Date.now()) / 8.64e7) * 8.64e7;

      // Intraday series can only be one day long
      if(seriesType == 'intraday' && dayOf0 != dayOf1) dayOf0 = dayOf1;
      
      var date0 = new Date(dayOf0 + marketHours.t0 * 60000),
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
        if(series.hasData(tOpen, tClose) || series.data.length == 0) {//dayOfWeek != 0 && dayOfWeek != 6 && 
          domain.push(tOpen);
          domain.push(tClose);
          range.push(d * _w);
          range.push((d + 1) * _w);
          values.push( new Date(tOpen) );
          d++;
        }
        t += 8.64e7;
      }

      if(series.type == '5day' && d > 5) {
        var diff = d - 5;
        domain.splice(0, diff * 2);
        range.splice(range.length - diff * 2, diff * 2);
        values.splice(0, diff);
      }

      instance.timeScale.domain(domain).range(range);
      instance.timeRange.splice(0, 2, domain[0], domain[domain.length - 1]);
      
      if(seriesType == '5day') instance.xAxis.tickValues(values);
      else instance.xAxis.tickValues(null).ticks(d3.time.hours, 1);
    };    
    return instance;
  }
})();