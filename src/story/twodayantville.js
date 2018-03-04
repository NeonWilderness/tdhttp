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
        this.getData = function(platform) {
          return Object.keys(json[platform].counter).reduce( (all, category, index) => {
            all.push(json[platform][category]);
            return all;
          }, []);
        };
        this.sizeCategories = Object.keys(json.categories).length;
        this.barchartOptions = {
          type: 'bar',
          data: {
            labels: Object.keys(json.categories),
            datasets: [
              {
                label: 'Twoday',
                data: this.getData('twoday'),
                fill: false,
                backgroundColor: this.getColorPalette(['pink', 'indigo', 'cyan'], this.sizeCategories, 0.5),
                borderColor: this.getColorPalette(['pink', 'indigo', 'cyan'], this.sizeCategories, 1),
                borderWidth: 1
              },
              {
                label: 'Antville',
                data: this.getData('antville'),
                fill: false,
                backgroundColor: this.getColorPalette(['purple', 'blue', 'teal'], this.sizeCategories, 0.5),
                borderColor: this.getColorPalette(['purple', 'blue', 'teal'], this.sizeCategories, 1),
                borderWidth: 1
              },
            ]
          },
          options: {
            scales: {
              yAxes: [{ ticks: { beginAtZero: true } }]
            }
          }
        };
      };
      let vm = new ViewModel();
      ko.applyBindings(vm, document.getElementById('twodayantville'));
    });
  })
    .fail(function () {
      toastr.error('Sorry, die Chartdaten können derzeit nicht gelesen werden!');
    });

})(jQuery);