(function ($) {

  $.getJSON('https://rawgit.com/NeonWilderness/tdhttp/master/Twoday_Antville.json', function (json) {
    $(function () {
      const materialColors = {
        pink: ["#fce4ec", "#f8bbd0", "#f48fb1", "#f06292", "#ec407a", "#e91e63", "#d81b60", "#c2185b", "#ad1457", "#880e4f", "#f50057", "#c51162"],
        purple: ["#f3e5f5", "#e1bee7", "#ce93d8", "#ba68c8", "#ab47bc", "#9c27b0", "#8e24aa", "#7b1fa2", "#6a1b9a", "#4a148c", "#d500f9", "#aa00ff"],
        indigo: ["#e8eaf6", "#c5cae9", "#9fa8da", "#7986cb", "#5c6bc0", "#3f51b5", "#3949ab", "#303f9f", "#283593"],
        blue: ["#e3f2fd", "#bbdefb", "#90caf9", "#64b5f6", "#42a5f5", "#2196f3", "#1e88e5", "#1976d2", "#1565c0"],
        cyan: ["#e0f7fa", "#b2ebf2", "#80deea", "#4dd0e1", "#26c6da", "#00bcd4", "#00acc1", "#0097a7"],
        teal: ["#e0f2f1", "#b2dfdb", "#80cbc4", "#4db6ac", "#26a69a", "#009688", "#00897b", "#00796b"]
      };
      const getRgba = (color, opacity) => {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity.toString()})`;
      };
      let ViewModel = function () {
        this.getColorPalette = function (colorNames, size, opacity) {
          let colors = colorNames.reduce((all, color, index) => {
            all = all.concat(materialColors[color]);
            return all;
          }, []);
          if (size < colors.length) colors = colors.slice(0, size);
          return colors.reduce((all, color, index) => {
            all.push((opacity < 1 ? getRgba(color, opacity) : color));
            return all;
          }, []);
        };
        this.getSingleColor = function (colorName, index, size, opacity) {
          let color = materialColors[colorName][index], palette = [];
          for (let i = 0; i < size; i++) {
            palette.push((opacity < 1 ? getRgba(color, opacity) : color));
          }
          return palette;
        };
        this.getData = function (platform) {
          return Object.keys(json[platform].counter).reduce((all, category, index) => {
            //let percent = json[platform].counter[category] * 100 / json[platform].total;
            //all.push(Math.round(percent * 100) / 100);
            all.push(json[platform].counter[category]);
            return all;
          }, []);
        };
        this.getYear = function (platform) {
          let pastYear = this.getData(platform).slice(0,12);
          return pastYear.reduce((all, monthActivity, index) => {
            all += monthActivity;
            return all;
          }, 0);
        };
        this.baseBlogs = (platform => {
          return json[platform].total;
        });
        this.baseDates = () => {
          return `Twoday - ${new Date(json['twoday'].date).toLocaleString()}, Antville - ${new Date(json['antville'].date).toLocaleString()}`;
        };
        this.sizeCategories = Object.keys(json.categories).length;
        this.barchartAllCat = {
          type: 'bar',
          data: {
            labels: Object.keys(json.categories),
            datasets: [
              {
                label: 'Twoday',
                data: this.getData('twoday'),
                fill: false,
                backgroundColor: this.getSingleColor('pink', 4, this.sizeCategories, 1),
                borderColor: this.getSingleColor('pink', 4, this.sizeCategories, 1),
                borderWidth: 1
              },
              {
                label: 'Antville',
                data: this.getData('antville'),
                fill: false,
                backgroundColor: this.getSingleColor('purple', 4, this.sizeCategories, 1),
                borderColor: this.getSingleColor('purple', 4, this.sizeCategories, 1),
                borderWidth: 1
              },
            ]
          },
          options: {
            scales: {
              yAxes: [{ ticks: { beginAtZero: true } }]
            },
            title: {
              display: true,
              text: 'Blogaktivität auf Twoday und Antville (zuletzt geänderte Blogs nach Periode)'
            }
          }
        };
        this.barchartPastYear = {
          type: 'bar',
          data: {
            labels: ['Letztes Jahr'],
            datasets: [
              {
                label: 'Twoday',
                data: [this.getYear('twoday')],
                fill: false,
                backgroundColor: this.getSingleColor('pink', 4, 1, .6),
                borderColor: this.getSingleColor('pink', 4, 1, 1),
                borderWidth: 1
              },
              {
                label: 'Antville',
                data: [this.getYear('antville')],
                fill: false,
                backgroundColor: this.getSingleColor('purple', 4, 1, .6),
                borderColor: this.getSingleColor('purple', 4, 1, 1),
                borderWidth: 1
              },
            ]
          },
          options: {
            scales: {
              yAxes: [{ ticks: { beginAtZero: true } }]
            },
            title: {
              display: true,
              text: 'Geänderte Blogs auf Twoday und Antville (Summe vergangenes Jahr)'
            }
          }
        };
      };
      let vm = new ViewModel();
      ko.applyBindings(vm, document.getElementById('twodayantville'));
      new Chart(document.getElementById('barTwodayAntville'), vm.barchartAllCat);
      new Chart(document.getElementById('barPastYear'), vm.barchartPastYear);
    });
  })
    .fail(function () {
      toastr.error('Sorry, die Chartdaten können derzeit nicht gelesen werden!');
    });

})(jQuery);