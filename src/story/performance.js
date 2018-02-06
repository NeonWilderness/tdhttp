(function ($) {

  $.getJSON('https://rawgit.com/NeonWilderness/tdhttp/master/Twoday_Results.json', function (json) {
    $(function () {
      const daysAgo = 90; // xx days ago last new story was added: qualifies blog as active (<=xx) or inactive (>xx)
      let ViewModel = function () {
        this.daysAgo = function () { return `${daysAgo} Tage`; }
        this.getTotal = function (group) {
          return json[`${group}Blogs`];
        };
        this.getRefsIssue = function (group) {
          return json[`${group}RefsBlogs`];
        };
        this.getRootIssue = function (group) {
          return json[`${group}RootBlogs`];
        };
        this.filterBlogs = function (group) {
          return json.blogs.filter( function(blog){
            return ((group === 'active' && blog.daysLastChange <= daysAgo) || 
                    (group === 'inactive' && blog.daysLastChange > daysAgo));
          })
        };
        this.updatePercent = function (type, group, count) {
          let total = json[`${group}${type}Blogs`];
          let percent = (Math.round(count / total * 1000))/10;
          return `<b>${percent}%</b> (${count} von ${total})`;
        };
        this.ceilPercent = function(){
          let total = json.activeRefsBlogs;
          let count = this.getRefsCount('active');
          let percent = Math.ceil(count / total * 100);
          return `${percent}%`;
        };
        this.getLink = function(blog){
          return `<a target="_blank" href="https://${blog}.twoday.net/">https://${blog}.twoday.net/</a>`;
        };
        this.getCandidates = function(){
          return json.candidates;
        };
        this.getRefsCount = function (group) {
          return this.filterBlogs(group).filter( function(blog){
            return (blog.change<0);
          }).length;
        };
        this.getRootCount = function (group) {
          return this.filterBlogs(group).filter( function(blog){
            return (blog.rootStat);
          }).length;
        };
        this.getRefsPercent = function(group) {
          return this.updatePercent('Refs', group, this.getRefsCount(group));
        };
        this.getRootPercent = function(group) {
          return this.updatePercent('Root', group, this.getRootCount(group));
        };
        this.listOfGoodGuys = function() {
          return blogs = json.blogs.map( function(blog){
            return {
              blog: blog.blog,
              refs: ((blog.refs+blog.change)===0 ? '--- (0)' : (blog.change<0 ? 'ja' : 'nein')),
              change: `(${Math.abs(blog.change)})`,
              root: (blog.rootStat ? 'ja' : 'nein')
            };
          });
        };
      };
      let vm = new ViewModel();
      ko.applyBindings(vm, document.getElementById('cleanupresults'));
    });
  })
    .fail(function () {
      toastr.error('Sorry, die Fortschrittsdaten können derzeit nicht gelesen werden!');
    });

})(jQuery);