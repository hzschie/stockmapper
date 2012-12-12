(function() {
  mapper.Search = Search;
  function Search($search, opts) {
    opts = opts || {};
    _.extend(this, Backbone.Events);
    var searchPending = false,
        $input = $('input', $search).on('keydown', keydown).on('focus', focus).on('blur', blur),
        $x = $('.x', $search).on('click', function() { _this.clear(); }),
        $dropdown = $('.search_dropdown', $search),
        $body = $('body'),
        selection = -1,
        baseModels = mapper.models.models,//_.filter(mapper.models.models, function(model) { return typeof(model.get('sym')) == 'string'; }),//mapper.stocks,
        term, inputTerm,
        matches = [],
        _this = this;
        
    // Detach $dropdown and re-attach it to body, so that it appears on top
    // $dropdown.appendTo($body);

    this.clear = function() {
      $input.val('');
      _this.trigger('commit_option', null);
      search();
    };
    
    function search() {
      if(searchPending) return;
      searchPending = true;
      _search();
    }
    
    function keydown(e) {
      if(e.which == 40) {// down
        setSelection(selection + 1);
      }
      else if(e.which == 38) {// up
        setSelection(selection - 1);
      }
      else if(e.which == 27) {// esc
        blur();
      }
      else if(e.which == 13) {// enter
        if($dropdown.is(':visible') && selection != -1) {
          $dropdown.fadeOut();
        }
        if(selection != -1 || (matches[0].model.get('sym').toLowerCase() == term)) {
          _this.trigger('commit_option', matches[selection == -1 ? 0 : selection].model);
          blur();
        }
      }
      else {
        search();
        return;
      }
      e.preventDefault();
      return false;
    }
    
    function focus() { 
      if(matches.length) {
        $dropdown.fadeIn();        
        repositionDropdown();
      }
      _this.trigger('focus_field');
    }
    function blur() { $dropdown.fadeOut(); }
    
    function repositionDropdown() {
      var pos = $input.show().offset(),
          css = { left:pos.left };
          
      // if(opts.dropdownNorth) css['bottom'] = $(window).height() - (pos.top + 2 - $(window).scrollTop());
      // else css['top'] = pos.top + 18;
      if(opts.dropdownNorth) css['bottom'] = $input.outerHeight() + 10;
      
      
      $dropdown.css(css);
    }
    
    function setSelection(_selection) {
      $dropdown.fadeIn();
      selection = _selection;
      if(selection < -1) {
        selection = matches.length + selection + 1;
      }
      else if(selection >= matches.length) {
        selection = 0;
      }
      $dropdown.children().removeClass('selected').eq(selection).addClass(selection == -1 ? '' : 'selected');
      
      // term = selection == -1 ? inputTerm : matches[selection].model.get('sym');
      // for not showing numeric ids, instead of above line:
      if(selection == -1)
        term = inputTerm;
      else {
        var sym = matches[selection].model.get('sym');
        term = typeof sym == "number" ? matches[selection].model.get('name') : sym;
      }
      
      $input.val(term);
      term = term.toLowerCase();
      _this.trigger('select_option', selection == -1 ? null : matches[selection].model);
    }
    
    function _search() {
      setTimeout(function() {
        searchPending = false;
        doSearch();
      }, 200);
    }
    
    function doSearch() {
      var newTerm = $input.val().toLowerCase().replace(/\\/, '');

      if(newTerm == term) return;
      
      term = inputTerm = newTerm;
      selection = -1;
      matches = [];
      
      var isInputNumeric = (/^\d*$/).test(newTerm);
      if(newTerm.length <= (isInputNumeric ? 2 : 1)) {
        render();
        _this.trigger('select_option', null);
        return;
      }
      
      if(isInputNumeric) {
        // doScripCodeSearch();
        var regexp = new RegExp('^' + term),
            models = baseModels;
        
        _.each(baseModels, function(model) {
          if(regexp.test(model.id)) {
            matches.push({ model:model, isNumeric:true, best:String(model.id).match(regexp)[0] });
          }
        });
        matches = matches.slice(0,10);
        
        render();
        return;
      }

      var regexp = [
            // term.split('').join('.*'),
            new RegExp(term.split('').join('.?.?')),
            new RegExp(term.split('').join('.?')),
            new RegExp(term)
          ],
          models = baseModels;
        
        
      for(var i = 0; i < models.length; i++) {
        var sym = String(models[i].get('sym')).toLowerCase(),
            name = models[i].get('name').toLowerCase(),
            j = 0,
            match = null,
            bestMatch;
      
        while(regexp[j] && (regexp[j].test(sym) || regexp[j].test(name))) {
          bestMatch = sym.match(regexp[j]) || name.match(regexp[j]);
      
          if(match) {
            match.level++;
            match.best = bestMatch[0];
          }
          else {
            match = { model:models[i], level:0, best:bestMatch[0] };
            matches.push(match);
          }
        
          // if(sym.charAt(0) == term.charAt(0) || name.charAt(0) == term.charAt(0)) {
          if(sym.match('^' + regexp[j].source)) {
            match.level++;
          }
          if(name.match('^' + regexp[j].source) || name.match('\\s' + regexp[j].source) ) {
            match.level++;
          }
          j++;
        }
      }
      
      matches.sort(function(a, b) {
        var aType = a.model.get('type'),
            bType = b.model.get('type');
        if(aType == bType) return (a.level < b.level) - (a.level > b.level);
        return (aType > bType) - (aType < bType);
      });
      
      matches = matches.slice(0,10);
      render();
    }
    
    function render() {
      if(matches.length > 0) {
        focus();
      }
      else {
        $dropdown.fadeOut();
        return;
      }
      var html = $.map(matches, function(match) {
        return [
          '<div>',
            '<span class="sym">', format(String(match.model.get('sym')), match.best), '</span>',
            /* for not showing numeric ids: */// typeof match.model.get('sym') == "number" ? '' : '<span class="sym">' + format(String(match.model.get('sym')), match.best) + '</span>',
            match.isNumeric ? '<span class="code">' + format(String(match.model.get('id')), match.best) + '</span>' : '',
            '<span class="name">', format(match.model.get('name'), match.best), '</span>',
          '</div>'
        ].join('');
      }).join('');
      $dropdown.html(html);
      $dropdown.children().on('mousedown', function(e) {
        setSelection($(this).index());
        _this.trigger('commit_option', matches[selection].model);
        blur();
        e.preventDefault();
        return false;
      });
    }
    
    function format(str, best) {
      var j = 0,
          bj = str.toLowerCase().indexOf(best),
          c,
          output = str.substr(0, bj);
          
      if(bj == -1) return str;
      for(var i = bj; i < bj + best.length; i++) {
        var c = str[i].toLowerCase();
        if(c == term[j] || c == term[j-1]) {
          j++;
          output += '<b>' + str[i] + '</b>';
        }
        else {
          output += str[i];
        }
      }
      output += str.substr(bj + best.length);
      return output;
    }
  }
})();