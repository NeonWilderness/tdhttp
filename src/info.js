const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const pages = 1000;
const delay = 200;
const tdHome = 'https://www.twoday.net/main?start=';
const infoFile = path.resolve(process.cwd(), 'Twoday_Bloginfos.json');
const top50File = path.resolve(process.cwd(), 'Twodays_OldestBlogs.json');

class Blogs {

  constructor(delay, pages) {
    this.delay = delay;
    this.pages = pages;
    this.info = {};
    this.count = 0;
  }

  delayNextPromise(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  saveInfo(alias, siteId, title, icon) {
    if (alias in this.info)
      console.log(`Blog ${alias} found again.`);
    else {
      this.info[alias] = { siteId, title, icon };
      this.count++;
    }
  }

  logOldestBlogs() {
    let oldestBlogs = Object.keys(this.info).reduce( (all, alias, index) => {
      all.push({alias, ...this.info[alias] });
      return all;
    }, [])
    .sort( (a,b) => { return a.siteId - b.siteId })
    .slice(0,50)
    .map( (blog, index) => {
      console.log(`${index}.`, JSON.stringify(blog));
      return blog;
    });
    fs.writeFileSync(top50File, JSON.stringify(oldestBlogs));
    console.log(`Oldest blogs successfully written.`);
  }

  async readBlogs(page) {
    try {
      const blogrollPage = await axios.get(`${tdHome}${page*15}`);
      console.log(`Reading page=${page}, len=${blogrollPage.data.length}`);
      let $ = cheerio.load(blogrollPage.data);
      $('table[id^="twoday-site"]')
      .each( (i, el) => {
        let $el = $(el);
        let siteId = parseInt($el.attr('id').substr(11));
        let $td = $el.find('tr').eq(0).find('td');
        let m = $td.eq(0).find('a').attr('href').match(/https?:\/\/(.*)\.twoday\.net/i);
        if (!m) return true;
        let alias = m[1];
        let icon = $td.eq(0).find('img').attr('src');
        let title = $td.eq(1).find('a').eq(0).text();
        this.saveInfo(alias, siteId, title, icon);
      });
    }
    catch(err) {
      console.log(err);
    }
  }

  async readBlogrollPages() {
    console.log(`>>Processing blogroll pages 0 to ${this.pages-1} ...`);
    for (let i = 0; i < this.pages; i++) {
      await this.readBlogs(i);
      await this.delayNextPromise(this.delay);
    }
    fs.writeFileSync(infoFile, JSON.stringify(this.info));
    console.log(`Blog info file holding ${this.count} blogs successfully written.`);
    this.logOldestBlogs();
  }

}

new Blogs(delay, pages).readBlogrollPages();