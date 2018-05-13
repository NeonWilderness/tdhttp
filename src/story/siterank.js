(function ($) {

  $.getJSON('https://rawgit.com/NeonWilderness/tdhttp/master/Twoday_SiteIdRank.json', function (json) {
    $(function () {
      var ViewModel = function () {
        this.activeTime = ko.observable('180');
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