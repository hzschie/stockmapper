(function() {
  mapper.GroupBehaviors = {};
  
  mapper.GroupBehaviors.KeepCounts = {
    apply: function(group) {
      var updatePending = false;
      // Use Interval to collapse recalculations, to avoid doing it
      // needlessly many times during a large update
      group.updateCounts = function() {
        if(!updatePending) {
          updatePending = true;
          Interval.callOnce({ fn:function() {
            updatePending = false;
            group._updateCounts();
          }, key:'update_counts_' + group.get('urlName') }, Interval.LOW);
        }
      };
      
      // Recalculate ups and downs figures
      group._updateCounts = function() {
        var members = group.get('members'),
            upsAndDowns = [0,0],
            volumeUp = 0,
            volumeDown = 0,
            volumeTotal = 0,
            vol, dir;
        members.each(function(model) {
          vol = model.attributes.volume || 0;
          dir = model.attributes.changeDir;
          if(dir == 1) {
            upsAndDowns[0] += 1;
            volumeUp += vol;
          }
          else if(dir == -1) {
            upsAndDowns[1] += 1;
            volumeDown += vol;
          }
          volumeTotal += vol;
        });
        group.set({
          upsAndDowns: upsAndDowns,
          volumeUp: volumeUp,
          volumeDown: volumeDown,
          volumeTotal: volumeTotal
        });
      };
      
      var members = group.get('members');
      members.on('add', function(model) {
        if( model.get('hasData') ) group.updateCounts();
      });
      members.on('change:changeDir change:volume', function(model) {
        group.updateCounts();
        group.resortMembers(false);
      });
    }
  };

  mapper.GroupBehaviors.PickMembers = (function() {
    return {
      apply: function(group, n) {
        var updatePending = false;
        function updatePicks() {
          if(!updatePending) {
            updatePending = true;
            Interval.callOnce({ fn:function() {
              updatePending = false;
              _updatePicks();
            }, key:'update_picks_' + group.get('urlName') }, Interval.LOW);
          }
        }

        function _updatePicks() {
          var models = group.get('members').models,
              chgSorted = models.concat().sort(mapper.sortFunctions.chg),
              volSorted = models.concat().sort(mapper.sortFunctions.vol),

              setter = {
                gainers: _.filter(chgSorted.slice(0, n), function(model) { return model.get('changeDir') == 1; }),
                losers:  _.filter(chgSorted.slice(chgSorted.length - n, chgSorted.length), function(model) { return model.get('changeDir') == -1; }),
                active:volSorted.slice(0, n)
              };
              
          group.set(setter);
        }

        var members = group.get('members'),
            updatePending = false;
        members.on('add', function(model) {
          if( model.get('hasData') ) updatePicks();
        });
        members.on('change', function(model) {
          updatePicks();
        });
      }
    };
  })();
})();