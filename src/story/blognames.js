(function ($) {

  $.getJSON('https://rawgit.com/NeonWilderness/tdhttp/master/Twoday_Blognames.json', function (json) {
    $(function () {
      var ViewModel = function () {
        this.getNames = function () {
          for (var i=0, result=[]; i<20; i++) {
            result.push({long: json.long[i], short: json.short[i]});
          }
          return result;
        };
        this.getUrl = function(alias) {
          return 'https://' + alias + '.twoday.net/';
        };
      };
      let vm = new ViewModel();
      ko.applyBindings(vm, document.getElementById('tag-17-twoday-long-short'));
    });
  })
    .fail(function () {
      toastr.error('Sorry, die Namensdaten können derzeit nicht gelesen werden!');
    });

})(jQuery);