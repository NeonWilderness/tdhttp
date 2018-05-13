(function ($) {

  $.getJSON('https://rawgit.com/NeonWilderness/tdhttp/master/Twoday_SiteIdRank.json', function (json) {
    $(function () {
      var ViewModel = function () {
        this.activeOptions = [
          { name: 'Einen Monat (30 Tage)', val: '30'},
          { name: 'Zwei Monate (60 Tage)', val: '60'},
          { name: 'Drei Monate (90 Tage)', val: '90'},
          { name: 'Vier Monate (120 Tage)', val: '120'},
          { name: 'Fünf Monate (150 Tage)', val: '150'},
          { name: 'Sechs Monate (180 Tage)', val: '180'}
        ];
        this.activeTime = ko.observable(this.activeOptions[5]);
        this.getRank = function () {
          var activeTimeSpan = parseInt(this.activeTime());
          return json.filter(function (blog) {
            return (blog.daysLastChange <= activeTimeSpan);
          })
            .map(function (blog, index) {
              let item = Object.assign({}, blog, {
                index: index + 1,
                href: 'https://' + blog.alias + '.twoday.net/'
              });
              return item;
            });
        };
      };
      let vm = new ViewModel();
      ko.applyBindings(vm, document.getElementById('tag-18-twoday-blog-rank'));
    });
  })
    .fail(function () {
      toastr.error('Sorry, die Rankingdaten können derzeit nicht gelesen werden!');
    });

})(jQuery);