const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const log = require('./hooklog');
const setTimeout = require('timers').setTimeout;

const tdHome = "https://www.twoday.net/main?start=";
const refFile = "./Twoday_HTTP_Refs.json";

class Blogs {

  constructor(delay, rebuild) {
    this.delay = delay;
    if (rebuild) {
      this.lastUpdate = null;
      this.httpRefs = {};
    } else {
      let file = JSON.parse(fs.readFileSync(refFile, 'utf8'));
      this.lastUpdate = file.date;
      this.httpRefs = file.refs;
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
      if (href.length) {
        let tdDomain = href.match(/static\/(.*)\/images/);
        return (tdDomain ? tdDomain[1].toLowerCase() : '');
      } else 
        return '';
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
          this.httpRefs[blogname] = [];
        } else {
          (async() =>{ // inject IIFE async function inside cheerio's sync each function
            const tdBlog = await this.readBusinessDomain(el.attribs.href);
            if (tdBlog.length) {
              console.log(`Switching to twoday domain: ${tdBlog}.twoday.net from ${el.attribs.href}.`);
              this.httpRefs[tdBlog] = [];
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
      let refs = this.httpRefs[blog];
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
      refs: this.httpRefs
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

  async readHomepage(blogname) {
    try {
      const blogHomepage = await axios.get(`https://${blogname}.twoday.net/`);
      console.log(`Analyzing site ${blogname}, len=${blogHomepage.data.length}`);
      let $ = cheerio.load(blogHomepage.data);
      $('[src^="http://"]')
      .filter( (i, el) => {
        let src = el.attribs.src || '';
        return (!(src.length===0 || el.name==='img' || el.name==='input' || /urchin.js/.test(src)));
      })
      .each( (i, el) => {
        let entry = `${el.name} | ${el.attribs.src}`;
        if (this.httpRefs[blogname].indexOf(entry)<0) this.httpRefs[blogname].push(entry);
      })
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