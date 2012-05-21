(function() {
  function Chart($container) {
    var svg = d3.select($container[0]).append('svg');
    
    this.setModels = function(_models) {
      var graph = svg.selectAll('rect')
          .data(_models.models);
      
      graph.enter().append('rect')
        .attr('x', function(d, i) { return i*6; })
        .attr('height', 10)
        .attr('width', 5)
        .attr('fill', '#ccc');
      graph.exit()
        .attr('height', function(d,i){console.log(d,i);})
        .remove();
    };
  }
  mapper.Chart = Chart;
})();