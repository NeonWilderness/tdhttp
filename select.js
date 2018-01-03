(function($){

  // json = { date: "...", blogs: nnn, refs: {...} }
  $.getJSON('./Twoday_HTTP_Refs.json', function(json){
    $(function() {
        var ViewModel = function() {
          this.blogs = ko.observableArray(Object.keys(json.refs).sort());
          this.blogCount = ko.pureComputed( function() {
            return json.blogs;
          }); 
          this.lastUpdate = ko.pureComputed( function() {
            return new Date(json.date).toLocaleString("de-DE", {
              day:"2-digit", 
              month:"2-digit", 
              year: "numeric", 
              hour: "2-digit", 
              minute: "2-digit"
            });
          }); 
          this.optBlog = ko.observable(this.blogs[0]);
          this.blogIcon = ko.pureComputed( function() {
            return `https://${this.optBlog()}.twoday.net/images/icon`;
          }, this);
          this.defaultIcon = function(vm, e) {
            e.currentTarget.src = 'https://static.twoday.net/icon.gif';
          };
          this.badRefs = ko.pureComputed( function() {
            return (json.refs.hasOwnProperty(this.optBlog()) ? json.refs[this.optBlog()].length : 0);
          }, this);
          this.alertStatus = ko.pureComputed( function() {
            return (this.badRefs()>0 ? 'alert' : 'success');
          }, this);
          this.message = ko.pureComputed( function() {
            return (this.badRefs()>0 
            ? `In Ihrer Homepage wurde${this.badRefs()===1 ? '' : 'n'} <b>${this.badRefs()===1 ? 'eine' : this.badRefs()} http-Referenz${this.badRefs()===1 ? '' : 'en'}</b> gefunden, die im https-Modus unwirksam ${this.badRefs()===1 ? 'ist' : 'sind'}. Ersetzen Sie diese nach Möglichkeit durch ${this.badRefs()===1 ? 'einen https-Aufruf' : 'https-Aufrufe'}, wenn der Anbieter diese Möglichkeit bereitstellt! Im <b>FAQ</b> unten finden Sie weitere Lösungshinweise.`
            : 'Alles gut. Sie nutzen keine Aufrufe von http-Adressen in Ihrer Homepage!');
          }, this);
          this.httpRefs = ko.pureComputed( function() {
            let refText = '';
            let refs = json.refs[this.optBlog()];
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
        };
        ko.applyBindings( new ViewModel() );
      });
    })
  .fail( function(){
    window.toastr.error('Die HTTP-Referenzen der Blogs konnten nicht gelesen werden!');
  });

})(jQuery);