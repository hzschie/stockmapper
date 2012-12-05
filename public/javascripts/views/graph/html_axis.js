d3.html.axis = function() {  
  var scale = d3.scale.linear(),
      orient = "bottom",
      tickMajorSize = 6,
      tickMinorSize = 6,
      tickEndSize = 6,
      tickPadding = 3,
      tickArguments_ = [10],
      tickValues = null,
      tickFormat_,
      tickSubdivide = 0;

  var APPLY_CSS_HACK = $ && $.browser && $.browser.msie && $.browser.version.indexOf("8") == 0;
  function axis(element) {
    element.each(function() {
      var element = d3.select(this);
      
      // Ticks, or domain values for ordinal scales.
      var ticks = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments_) : scale.domain()) : tickValues,
          tickFormat = tickFormat_ == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments_) : String) : tickFormat_;
          
      // Minor ticks.
      var subticks = d3_html_axisSubdivide(scale, ticks, tickSubdivide),
          subtick = element.selectAll(".minor").data(subticks, String),
          subtickEnter = subtick.enter().insert("div", ".major").attr("class", (orient == "bottom" || orient == "top" ? "x" : "y") + " tick minor").style("opacity", 1e-6),
          subtickExit = d3.transition(subtick.exit()).style("opacity", 1e-6).remove(),
          subtickUpdate = d3.transition(subtick).style("opacity", 1);

      // Major ticks.
      var tick = element.selectAll(".major").data(ticks, String),
          tickEnter = tick.enter().insert("div", ".domain").attr("class", (orient == "bottom" || orient == "top" ? "x" : "y") + " tick major").style("opacity", 1e-6),
          tickExit = d3.transition(tick.exit()).style("opacity", 1e-6).remove(),
          tickUpdate = d3.transition(tick).style("opacity", 1),
          tickTransform;

      // Domain.
      var range = scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range()),
          path = element.selectAll(".domain").data([0]),
          pathEnter = path.enter().append("div").attr("class", "domain").style("position", "absolute"),
          pathUpdate = d3.transition(path);

      // Stash a snapshot of the new scale, and retrieve the old snapshot.
      var scale1 = scale.copy(),
          scale0 = this.__chart__ || scale1;
      this.__chart__ = scale1;

      tickEnter.append("label");
      tickUpdate.select("label").text(tickFormat);
      
      switch (orient) {
        case "bottom": {
          tickTransform = d3_html_axisX;
          subtickEnter.style("height", Math.abs(tickMinorSize) + 'px').style("top", Math.min(0, tickMinorSize) + 'px');
          subtickUpdate.style("height", Math.abs(tickMinorSize) + 'px').style("top", Math.min(0, tickMinorSize) + 'px');
          tickEnter.style("height", Math.abs(tickMajorSize) + 'px');
          tickEnter.select("label").style('position', 'relative').style('margin-left', '-50%').style('display', 'inline-block').style('*display', 'inline').style('zoom', 1);
          tickUpdate.style("height", Math.abs(tickMajorSize) + 'px').style('top', Math.min(0, tickMajorSize) + 'px');
          tickUpdate.select("label").style("top", -Math.min(0, tickMajorSize) + Math.max(tickMajorSize, 0) + tickPadding + 'px').style("text-align", "center");
          pathUpdate.style("height", tickEndSize + 'px').style("left", range[0] + 'px').style("width", range[1] - range[0] - 1 + 'px').style("border-bottom", "none");
          APPLY_CSS_HACK && $(pathUpdate[0][0]).css({ 'border-bottom': 'none' });// IE8 hack
          break;
        }
        case "top": {
          tickTransform = d3_html_axisX;
          subtickEnter.style("height", Math.abs(tickMinorSize) + 'px').style("top", -Math.max(0, tickMinorSize) + 'px');
          subtickUpdate.style("height", Math.abs(tickMinorSize) + 'px').style("top", -Math.max(0, tickMinorSize) + 'px');
          tickEnter.style("height", Math.abs(tickMajorSize) + 'px');
          tickEnter.select("label").style('position', 'relative').style('margin-left', '-50%').style('display', 'inline-block').style('*display', 'inline').style('zoom', 1);
          tickUpdate.style("height", Math.abs(tickMajorSize) + 'px').style('top', -Math.max(0, tickMajorSize) + 'px');
          tickUpdate.select("label").style("bottom", 0*Math.max(0, tickMajorSize) - 0*Math.max(tickMajorSize, 0) + tickPadding + 'px').style("text-align", "center")
            .style('line-height', 0).style('margin-top', '-100%');
          pathUpdate.style("height", tickEndSize + 'px').style("left", range[0] + 'px').style("width", range[1] - range[0] - 1 + 'px').style("border-top", "none").style("top", -Math.max(0, tickEndSize) + 'px');
          APPLY_CSS_HACK && $(pathUpdate[0][0]).css({ 'border-top': 'none' });// IE8 hack
          break;
        }
        case "left": {
          tickTransform = d3_html_axisY;
          subtickEnter.style("width", Math.abs(tickMinorSize) + 'px').style("left", -Math.max(0, tickMinorSize) + 'px');
          subtickUpdate.style("width", Math.abs(tickMinorSize) + 'px').style("left", -Math.max(0, tickMinorSize) + 'px');
          tickEnter.style("width", Math.abs(tickMajorSize));
          tickEnter.select("label").style('position', 'absolute');
          tickUpdate.style('width', Math.abs(tickMajorSize) + 'px').style("left", -Math.max(0, tickMajorSize) + 'px');
          tickUpdate.select("label").style("right", -Math.min(tickMajorSize, 0) + Math.max(tickMajorSize, 0) + tickPadding + 'px');
          pathUpdate.style("width", tickEndSize + 'px').style("top", range[0] + 'px').style("height", range[1] - range[0] - 1 + 'px').style("border-left", "none").style("left", -Math.max(0, tickEndSize) + 'px');
          APPLY_CSS_HACK && $(pathUpdate[0][0]).css({ 'border-left': 'none' });// IE8 hack
          break;
        }
        case "right": {
          tickTransform = d3_html_axisY;
          subtickEnter.style("width", Math.abs(tickMinorSize) + 'px').style("left", Math.min(0, tickMinorSize) + 'px');
          subtickUpdate.style("width", Math.abs(tickMinorSize) + 'px').style("left", Math.min(0, tickMinorSize) + 'px');
          tickEnter.style("width", Math.abs(tickMajorSize));
          tickEnter.select("label").style('position', 'absolute');
          tickUpdate.style('width', Math.abs(tickMajorSize) + 'px').style("left", Math.min(0, tickMajorSize) + 'px');
          tickUpdate.select("label").style("left", -Math.min(tickMajorSize, 0) + Math.max(tickMajorSize, 0) + tickPadding + 'px');
          pathUpdate.style("width", tickEndSize + 'px').style("top", range[0] + 'px').style("height", range[1] - range[0] - 1 + 'px').style("border-right", "none");
          APPLY_CSS_HACK && $(pathUpdate[0][0]).css({ 'border-right': 'none' });// IE8 hack
          break;
        }
      }
      
      // For quantitative scales:
      // - enter new ticks from the old scale
      // - exit old ticks to the new scale
      if (scale.ticks) {
        tickEnter.call(tickTransform, scale0);
        tickUpdate.call(tickTransform, scale1);
        tickExit.call(tickTransform, scale1);
        subtickEnter.call(tickTransform, scale0);
        subtickUpdate.call(tickTransform, scale1);
        subtickExit.call(tickTransform, scale1);
      }

      // For ordinal scales:
      // - any entering ticks are undefined in the old scale
      // - any exiting ticks are undefined in the new scale
      // Therefore, we only need to transition updating ticks.
      else {
        var dx = scale1.rangeBand() / 2, x = function(d) { return scale1(d) + dx; };
        tickEnter.call(tickTransform, x);
        tickUpdate.call(tickTransform, x);
      }
    });
  }

  axis.scale = function(x) {
    if (!arguments.length) return scale;
    scale = x;
    return axis;
  };

  axis.orient = function(x) {
    if (!arguments.length) return orient;
    orient = x;
    return axis;
  };

  axis.ticks = function() {
    if (!arguments.length) return tickArguments_;
    tickArguments_ = arguments;
    return axis;
  };

  axis.tickValues = function(x) {
    if (!arguments.length) return tickValues;
    tickValues = x;
    return axis;
  };

  axis.tickFormat = function(x) {
    if (!arguments.length) return tickFormat_;
    tickFormat_ = x;
    return axis;
  };

  axis.tickSize = function(x, y, z) {
    if (!arguments.length) return tickMajorSize;
    var n = arguments.length - 1;
    tickMajorSize = +x;
    tickMinorSize = n > 1 ? +y : tickMajorSize;
    tickEndSize = n > 0 ? +arguments[n] : tickMajorSize;
    return axis;
  };

  axis.tickPadding = function(x) {
    if (!arguments.length) return tickPadding;
    tickPadding = +x;
    return axis;
  };

  axis.tickSubdivide = function(x) {
    if (!arguments.length) return tickSubdivide;
    tickSubdivide = +x;
    return axis;
  };

  return axis;
};

function d3_html_axisX(selection, x) {
  selection.style("left", function(d) { return x(d) + 'px'; });
}

function d3_html_axisY(selection, y) {
  selection.style("top", function(d) { return y(d) + 'px'; });
}

function d3_html_axisSubdivide(scale, ticks, m) {
  subticks = [];
  if (m && ticks.length > 1) {
    var extent = d3_scaleExtent(scale.domain()),
        subticks,
        i = -1,
        n = ticks.length,
        d = (ticks[1] - ticks[0]) / ++m,
        j,
        v;
    while (++i < n) {
      for (j = m; --j > 0;) {
        if ((v = +ticks[i] - j * d) >= extent[0]) {
          subticks.push(v);
        }
      }
    }
    for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
      subticks.push(v);
    }
  }
  return subticks;
}

function d3_scaleExtent(domain) {
  var start = domain[0], stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}
