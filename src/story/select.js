(function($){

  // json = { date: "...", blogs: nnn, refs: {...} }
    $.getJSON('https://rawgit.com/NeonWilderness/tdhttp/master/Twoday_HTTP_Refs.json', function(json){
      $(function() {
        let $copy2clipboard = $('#copy2clipboard');
        let ViewModel = function() {
          this.blogs = ko.observableArray(Object.keys(json.data).sort());
          this.blogCount = ko.pureComputed( function() {
            return json.blogs;
          }); 
          this.formatDate = function(isodate) {
            return new Date(isodate).toLocaleString("de-DE", {
              day: "2-digit", 
              month: "2-digit", 
              year: "numeric", 
              hour: "2-digit", 
              minute: "2-digit"
            });
          }; 
          this.lastUpdate = function() {
            return this.formatDate(json.date);
          };
          this.visibleRunDates = ko.observable(false);
          this.toggleRunDates = function() {
            this.visibleRunDates(!this.visibleRunDates());
          }; 
          this.runDates = ko.pureComputed( function() {
            let self = this;
            return json.runs.map( function(isodate) {
              return self.formatDate(isodate);
            });
          }, this); 
          this.optBlog = ko.observable(this.blogs[0]);
          this.layoutName = ko.observable('');
          this.optBlog.subscribe( function(){
            this.layoutName(json.data[this.optBlog()].layoutName);
            this.wasCopied(false); 
          }, this);
          this.blogIcon = ko.pureComputed( function() {
            return `https://${this.optBlog()}.twoday.net/images/icon`;
          }, this);
          this.defaultIcon = function(vm, e) {
            e.currentTarget.src = 'https://static.twoday.net/icon.gif';
          };
          this.badRefs = ko.pureComputed( function() {
            return (json.data.hasOwnProperty(this.optBlog()) ? json.data[this.optBlog()].refs.length : 0);
          }, this);
          this.alertStatus = ko.pureComputed( function() {
            return (this.badRefs()>0 ? 'alert' : 'success');
          }, this);
          this.message = ko.pureComputed( function() {
            return (this.badRefs()>0 
            ? `In Ihrer Homepage wurde${this.badRefs()===1 ? '' : 'n'} <b>${this.badRefs()===1 ? 'eine' : this.badRefs()} http-Referenz${this.badRefs()===1 ? '' : 'en'}</b> gefunden, die im https-Modus unwirksam ${this.badRefs()===1 ? 'ist' : 'sind'}. Ersetzen Sie diese nach Möglichkeit durch ${this.badRefs()===1 ? 'einen https-Aufruf' : 'https-Aufrufe'}, wenn der Anbieter diese Möglichkeit bereitstellt! Andernfalls entfernen Sie diese Referenz.`
            : 'Alles gut. Sie nutzen keine Aufrufe von http-Adressen in Ihrer Homepage!');
          }, this);
          this.httpRefs = ko.pureComputed( function() {
            let refText = '';
            let refs = json.data[this.optBlog()].refs;
            for (let ref of refs) {
              let parts = ref.split(' | ');
              let tag = parts[0];
              let url = parts[1];
              let paramUrl = url.indexOf('?');
              if (paramUrl>=0) url = `${url.substr(0, paramUrl+1)}&hellip;`;
              refText += `<div><span class="label" style="margin-right:8px">${tag}</span><span class="code">${url}</span></div>`;
            }
            return refText;
          }, this);
          this.dummyLink = function(){ return false; };
          this.visibleLayoutGif = ko.observable(false);
          this.toggleLayoutGif = function(){ this.visibleLayoutGif(!this.visibleLayoutGif()); };
          this.StrgCmd = function(){
            return (navigator.platform.substr(0,3).toLowerCase()=="mac" ? 'Cmd' : 'Strg');
          };
          this.wasCopied = ko.observable(false);
          this.layoutUrl = ko.pureComputed( function() {
            let layoutName = this.layoutName();
            return (layoutName.length && this.wasCopied()
                    ? `https://${this.optBlog()}.twoday.net/layouts/${layoutName}/skins/edit?key=root.statsCounter`
                    : 'javascript:void(0)'
                    );
          }, this);
          this.sortedHostList = ko.observableArray();
          this.visibleHostList = ko.observable(false);
          this.toggleHostList = function(){
            this.visibleHostList(!this.visibleHostList());
            if (this.sortedHostList.length) return;
            $.getJSON('https://rawgit.com/NeonWilderness/tdhttp/master/Twoday_HTTP_Hosts_Sorted.json', function(json){
              this.sortedHostList(json);
            }.bind(this));
          };
        };
        let vm = new ViewModel();
        ko.applyBindings( vm, document.getElementById('cleanupyourblog') );
        $('#loadIcon').hide();
        let clipboard = new Clipboard($copy2clipboard[0], {
          text: function(){
            return `<!-- Begin Google Analytics Twoday -->
<script>
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-163565-3', 'auto');
ga('send', 'pageview');
</script>
<!-- End Google Analytics Twoday -->`;
          }
        });
        clipboard.on('success', function(e) {
          if (/avLoggedIn=1/.test(document.cookie)) {
            vm.wasCopied(true);
            toastr.info('Der korrekte neue Skin-Inhalt wurde in die Zwischenablage kopiert!');
          } else {
            toastr.error('Bevor Sie diese Funktion ausführen können, müssen Sie sich zuerst bei Twoday anmelden!');
          }
        });
        clipboard.on('error', function(e) {
          toastr.error(`Clipboard Fehler: ${e}.`);
        });
      });
    })
  .fail( function(){
    toastr.error('Sorry, die HTTP-Referenzen der Blogs können derzeit nicht gelesen werden!');
  });

})(jQuery);