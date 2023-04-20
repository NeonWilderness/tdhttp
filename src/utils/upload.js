/**
 * upload: updates the relevant stories (html) on twoday
 * =====================================================
 */
const { argv } = require('yargs');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const Twoday = require('@neonwilderness/twoday');
require('dotenv-safe').config();

const stories = {
  select: {
    name: 'cleanupyourblog',
    title: 'Korrigiert Eure Blogs! Jetzt!'
  },
  performance: {
    name: 'cleanupresults',
    title: 'Die Blogaufräum-Heldenliste'
  },
  blognames: {
    name: 'tag-17-twoday-long-short',
    title: 'Tag 17 - Die längsten und kürzesten Blognamen'
  },
  siterank: {
    name: 'tag-18-twoday-blog-rank',
    title: 'Tag 18 - Die ältesten, aktiven Blogs'
  },
  twodayantville: {
    name: 'twodayantville',
    title: 'Zukunft Antville?'
  }
};

(async () => {
  try {
    const platform = argv.platform.toLowerCase();
    const td = new Twoday.Twoday(platform, { delay: 100 });
    await td.login();

    const uploadStory = argv.story || 'twodayantville';
    const storyFile = path.resolve(process.cwd(), `src/story/${uploadStory}.html`);
    const $ = cheerio.load(fs.readFileSync(storyFile, 'utf8'), { decodeEntities: false });
    const storyContent = $('.storyContent').html();

    await td.updateStory('neonwilderness', {
      title: stories[uploadStory].title,
      body: storyContent,
      niceurl: stories[uploadStory].name,
      action: 'publish'
    });
    await td.logout();
  } catch (err) {
    console.log(`>>> Error updating story "${argv.story}": ${err}.`);
  }
})();
