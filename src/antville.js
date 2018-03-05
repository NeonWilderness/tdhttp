const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
//const setTimeout = require('timers').setTimeout;

const antvilleHome = 'https://antville.org/';
const antvilleSites = 'https://antville.org/sites?page=';
const refFile = path.resolve(process.cwd(), 'antville.json');
const timeout = 30; // ms to pause

class Stats {

  constructor() {
    this.oneDay = 1000 * 60 * 60 * 24;
    this.now = Date.now();
    this.categories = {};
    this.initCategories('m', 30, 12, 1);
    this.initCategories('j', 360, 18, 2);
    this.catKeys = Object.keys(this.categories);
    this.antville = {
      date: new Date().toISOString(),
      counter: this.initCounter(),
      total: 0,
      activeBlogs: [],
      activeAuthors: {}
    };
    this.twoday = {
      date: '',
      counter: this.initCounter(),
      total: 0,
      activeBlogs: [],
      activeAuthors: {}
    };
  }

  initCategories(type, days, count, start) {
    for (let i = start; i <= count; i++) {
      this.categories[`${i}${type}`] = i * days;
    }
  }

  initCounter() {
    return this.catKeys.reduce((all, item, index) => {
      all[item] = 0;
      return all;
    }, {});
  }

  countAntville(dateStr, $el, page) {
    let lastUpdate = new Date(dateStr);
    let daysSinceLastUpdate = (this.now - lastUpdate.getTime()) / this.oneDay;
    for (let i = 0, len = this.catKeys.length; i < len; i++) {
      let cat = this.catKeys[i];
      if (daysSinceLastUpdate <= this.categories[cat]) {
        this.antville.counter[cat]++;
        this.antville.total++;
        if (daysSinceLastUpdate < 90) {
          let author = $el.find('td').eq(2).text();
          this.antville.activeBlogs.push({
            author,
            blog: $el.find('a').attr('href'),
            date: dateStr,
            page
          });
          if (author in this.antville.activeAuthors)
            this.antville.activeAuthors[author]++;
          else
            this.antville.activeAuthors[author] = 1;
        }
        break;
      }
    }
  }

  countTwoday(fromJson) {
    this.twoday.date = fromJson.date;
    Object.keys(fromJson.data).forEach((alias) => {
      for (let i = 0, len = this.catKeys.length; i < len; i++) {
        let daysSinceLastUpdate = fromJson.data[alias].daysLastChange;
        if (daysSinceLastUpdate < 0) break;
        let cat = this.catKeys[i];
        this.twoday.total++;
        if (daysSinceLastUpdate <= this.categories[cat]) {
          this.twoday.counter[cat]++;
          if (daysSinceLastUpdate < 90) {
            this.twoday.activeBlogs.push({
              author: alias,
              blog: `https://${alias}.twoday.net/`
            });
            if (alias in this.twoday.activeAuthors)
              this.twoday.activeAuthors[alias]++;
            else
              this.twoday.activeAuthors[alias] = 1;
          }
          break;
        }
      }
    });
  }

  exportAsJSON() {
    fs.writeFileSync(path.resolve(process.cwd(), 'Twoday_Antville.json'),
      JSON.stringify({
        categories: this.categories,
        antville: this.antville,
        twoday: this.twoday
      }, null, 2)
    );
  }

}

class Blogs {

  constructor(delay) {
    this.delay = delay;
    this.stats = new Stats();
  }

  delayNextPromise(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async readAntvilleSites(toPage) {
    for (let i = 0; i <= toPage; i++) {
      console.log(`>Processing sites page ${i} ...`);
      let page = await axios.get(`${antvilleSites}${i}`);
      let $ = cheerio.load(page.data);
      $('.uk-table tbody tr').each((index, el) => {
        let $el = $(el);
        let dateStr = $el.find('.uk-text-truncate')[0].attribs.title.split(' ');
        let isoDate = `20${dateStr[0].split('.').reverse().join('-')} ${dateStr[1]}`;
        this.stats.countAntville(isoDate, $el, i);
      });
      await this.delayNextPromise(this.delay);
    }
  }

  async readHomepage() {
    try {
      const home = await axios.get(antvilleHome);
      let $ = cheerio.load(home.data);
      let visibleBlogs = parseInt($('.uk-text-muted').text().match(/öffentlicher Websites:\s(\d+)/)[1]);
      let pages = Math.floor(visibleBlogs / 25);
      await this.readAntvilleSites(pages);

      console.log('Adding Twoday stats...');
      const twodayJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'Twoday_HTTP_Refs.json')));
      this.stats.countTwoday(twodayJson);

      this.stats.exportAsJSON();
      console.log('Finished analysis.');
    }
    catch (err) {
      console.log(`ReadHomepage failed with error: ${err}`);
    }
  }

}

new Blogs().readHomepage();