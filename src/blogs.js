const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const log = require('./hooklog');
const path = require('path');
const setTimeout = require('timers').setTimeout;

const tdHome = "https://www.twoday.net/main?start=";
const refFile = path.resolve(process.cwd(), 'Twoday_HTTP_Refs.json');

/*
interface RefData {
  layoutName: string;     // active layout name of blog (if found, else empty string)
  daysLastChange: number; // number of days ago when the last article was published
  analytics: boolean;     // indicates if the new Twoday Google Analytics has been installed
  refs: string[];         // array of urls
}
interface RefFile {
  date: string;       // CreateDate or LastUpdate
  blogs: Number;      // Number of blogs (=keys in data)
  data: {
    [blogname: string]: RefData: 
  }
}
*/
class Blogs {

  constructor(delay, rebuild) {
    this.delay = delay;
    if (rebuild) { // rebuild from scratch
      this.lastUpdate = null;
      this.httpRefs = {};
    } else { // add to existing entries
      let file = JSON.parse(fs.readFileSync(refFile, 'utf8'));
      this.lastUpdate = file.date;
      this.httpRefs = file.data;
    }
  }

    delayNextPromise(delay) {
      return new Promise(resolve => setTimeout(resolve, delay));
    }

    async readBusinessDomain(domain) {
      console.log(`### Lookup business domain: ${domain}.`);
      const businessSite = await axios.get(`${domain.replace('https', 'http')}`);
      let $ = cheerio.load(businessSite.data);
      let href = $('[rel*="shortcut"]').attr('href');
      if (href) {
        let tdDomain = href.match(/static\/(.*)\/images/);
        if (tdDomain) return tdDomain[1];
      }
      let fallback = domain.match(/www\.([a-z0-9-_]*)\./);
      return (fallback ? fallback[1] : '');
    }

    initRef(blog, daysLastChange) {
      this.httpRefs[blog] = { layoutName: '', daysLastChange, refs: [] };
    }

    getDaysLastChange($, blogname) {
      try {
        let timeLastChange = $(`a[href^="https://${blogname}.twoday.net/stories/"]`)
          .eq(0)
          .next()
          .text()
          .match(/vor ([0-9]+)\s(.*)/);
        if (timeLastChange) {
          let [, count, unit] = timeLastChange;
          return (unit.substr(0,5)==='Tagen' ? parseInt(count) : 1);
        } else return 1;
      } catch(e) {
        return 0;
      }
    }

    async readBlogs(page) {
    try {
      const blogrollPage = await axios.get(`${tdHome}${page*15}`);
      console.log(`Reading page=${page}, len=${blogrollPage.data.length}`);
      let $ = cheerio.load(blogrollPage.data);
      $('.storyTitle>span')
      .filter( (i, el) => {
        return (i%2 == 1); // all odd spans
      })
      .find('a')
      .each( (i, el) => {
        let href = el.attribs.href.match(/\/\/(.*).twoday.net/);
        if (href) {
          let blogname = href[1].toLowerCase();
          let daysLastChange = this.getDaysLastChange($, blogname);
          this.initRef(blogname, daysLastChange);
        } else {
          (async() =>{ // inject IIFE async function inside cheerio's sync each-function
            const tdBlog = await this.readBusinessDomain(el.attribs.href);
            if (tdBlog.length) {
              console.log(`Switching to twoday domain: ${tdBlog}.twoday.net from ${el.attribs.href}.`);
              this.initRef(tdBlog);
            } else console.log(`No secondary twoday domain found for ${el.attribs.href}.`);
          })();
        }
      })
    }
    catch(err) {
      console.log(err);
    }
  }

  logHttpRefs() {
    let blogs = Object.keys(this.httpRefs);
    blogs.sort();
    let countAllRefs = 0;
    for (let blog of blogs) {
      let refs = this.httpRefs[blog].refs;
      countAllRefs += refs.length;
      console.log(`->Blog ${blog} (${refs.length})`);
      if (refs.length) {
        for (let ref of refs) {
          console.log(`${ref}`);
        }
      }
    }
    this.lastUpdate = new Date().toISOString();
    fs.writeFileSync(refFile, JSON.stringify({
      date: this.lastUpdate,
      blogs: blogs.length, 
      data: this.httpRefs
    }), 'utf8');
    console.log(`JSON file written: ${countAllRefs} http refs in ${blogs.length} blogs.`);
  }

  async readBlogrollPages(fromPage, toPage) {
    console.log(`>>Processing blogroll pages ${fromPage} to ${toPage} ...`);
    for (let i=fromPage; i<=toPage; i++) {
      await this.readBlogs(i);
      await this.delayNextPromise(this.delay);
    }
    await this.readAllHomepages();
    this.logHttpRefs();
    log.unhook_stdout();
    log.unhook_stderr();
  }

  async readMainCss(blogname) {
    const css = await axios.get(`http://${blogname}.twoday.net/main.css`);
    const regex = new RegExp(`${blogname}\\/layouts\\/(.*?)\\/`, 'i');
    let layoutRefs = css.data.match(regex);
    return (layoutRefs ? layoutRefs[1] : '');
  }

  async readHomepage(blogname) {
    try {
      const blogHomepage = await axios.get(`https://${blogname}.twoday.net/`);
      console.log(`Analyzing site ${blogname}, len=${blogHomepage.data.length}`);
      let $ = cheerio.load(blogHomepage.data);
      // Find and store the blog's active layout name, if any
      let layoutRefs = $('body').html().match(/\/layouts\/(.*?)\//);
      if (layoutRefs) {
        this.httpRefs[blogname].layoutName = layoutRefs[1];
      } else {
        this.httpRefs[blogname].layoutName = await this.readMainCss(blogname);
      }
      // Check if new Google analytics code is present
      this.httpRefs[blogname].analytics = /Google Analytics Twoday/.test(blogHomepage.data);
      // Find and push all relevant http url references
      $('[src^="http://"]')
      .filter( (i, el) => {
        let src = el.attribs.src || '';
        return (!(src.length===0 || el.name==='img' || el.name==='input' || /urchin.js/.test(src)));
      })
      .each( (i, el) => {
        let entry = `${el.name} | ${el.attribs.src}`;
        if (this.httpRefs[blogname].refs.indexOf(entry)<0) this.httpRefs[blogname].refs.push(entry);
      });
    }
    catch(err) {
      console.log(err);
    }
  }

  async readAllHomepages() {
    let promises = Object.keys(this.httpRefs).reduce( (all, item, index) => {
      all.push( this.delayNextPromise(index*this.delay).then( () => this.readHomepage(item) ));
      return all;
    }, []);
    await Promise.all(promises);
  }
  
}

module.exports = Blogs;