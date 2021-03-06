/**
 * upload: upload/update this story (html) on twoday
 * =================================================
 * @param {string} build Target Blogname, e.g. --build (for prod blog)
 * @param {string} story Story Type: select | performance, e.g. --story=select
 * 
 */
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const request = require('request-promise');
const argv = require('yargs').argv;

const stories = {
  'select': {
    name: 'cleanupyourblog',
    title: 'Korrigiert Eure Blogs! Jetzt!'
  },
  'performance': {
    name: 'cleanupresults',
    title: 'Die Blogaufräum-Heldenliste'
  },
  'blognames': {
    name: 'tag-17-twoday-long-short',
    title: 'Tag 17 - Die längsten und kürzesten Blognamen'
  },
  'siterank': {
    name: 'tag-18-twoday-blog-rank',
    title: 'Tag 18 - Die ältesten, aktiven Blogs'
  },
  'twodayantville': {
    name: 'twodayantville',
    title: 'Zukunft Antville?'
  }
}

//request.debug = true; // uncomment to activate debugging
require('dotenv-safe').load();

// set some defaults
const req = request.defaults({
  followAllRedirects: true,
  jar: true,
  simple: false,
  rejectUnauthorized: false,
  resolveWithFullResponse: true
});

const loginUrl = 'https://www.twoday.net/members/login';
const blogUrl = `http://${argv.build ? process.env.BUILD : process.env.DEV}.twoday.net/stories/`;
const uploadStory = (argv.story || 'twodayantville');

/**
 * Returns a GETs secretKey to be used in a subsequent POST
 */
const getSecretKey = function (body, response, resolveWithFullResponse) {
  var $ = cheerio.load(body);
  return $('[name="secretKey"]').val();
};

/**
 * Returns GET story input field values to be used in a subsequent POST
 */
const getIncomingData = function (body, response, resolveWithFullResponse) {
  var $ = cheerio.load(body);
  return {
    secretKey: $('[name="secretKey"]').val(),
    content_title: $('[name="content_title"]').val(),
    modNiceUrls_urlid: $('[name="modNiceUrls_urlid"]').val(),
    addToFront: $('[name="addToFront"]').val(),
    checkbox_addToFront: $('[name="checkbox_addToFront"]').val(),
    addToTopic: $('[name="addToTopic"]').val(),
    topic: $('[name="topic"]').val(),
    editableby: $('[name="editableby"]').val(),
    discussions: $('[name="discussions"]').val(),
    checkbox_discussions: $('[name="checkbox_discussions"]').val(),
    createtime: $('[name="createtime"]').val(),
    publish: $('[name="publish"]').val()
  };
};

/**
 * Request-Promise sequence to update one file
 * @param story object
 *      name     string niceurl name of the story
 *      title    string title of the story
 *      src      string html file which includes the story content
 *      selector string cheerio selector to isolate the story's html
 */
const updateStory = function (story) {
  let $ = cheerio.load(fs.readFileSync(story.src, 'utf8'), { decodeEntities: false });
  let storyContent = $(story.selector).html();
  let storyEditUrl = `${blogUrl}${story.name}/edit`;
  console.log('Preparing to edit story:', storyEditUrl, `(len=${storyContent.length})`);
  req.get({
    uri: storyEditUrl,
    transform: getIncomingData
  })
    .then(function (incoming) {
      console.log('Updating story:', storyEditUrl);
      let storyTitle = story.title || incoming.content_title;
      return req.post({
        uri: storyEditUrl,
        form: {
          'secretKey': incoming.secretKey,
          'content_title': storyTitle,
          'modNiceUrls_urlid': incoming.modNiceUrls_urlid,
          'content_text': storyContent,
          'addToFront': incoming.addToFront,
          'checkbox_addToFront': incoming.checkbox_addToFront,
          'addToTopic': incoming.addToTopic,
          'topic': incoming.topic,
          'editableby': incoming.editableby,
          'discussions': incoming.discussions,
          'checkbox_discussions': incoming.checkbox_discussions,
          'createtime': incoming.createtime,
          'publish': incoming.publish
        }
      });
    })
    .then(function () {
      console.log(`Update completed for story: ${story.name} (${story.src}).`);
    })
    .catch(function (err) {
      console.log('Update ***failed*** for story:', story.src, 'with Error', err);
    });
};

/**
 * Login to Twoday to establish auth cookie
 */
req.get({
  url: loginUrl,
  transform: getSecretKey
})
  .then(function (secretKey) {
    return req.post({
      url: loginUrl,
      form: {
        'secretKey': secretKey,
        'popup': '',
        'step': '',
        'isuser': 1,
        'name': process.env.USER,
        'password': process.env.PASSWORD,
        'remember': 1,
        'modSoruaAuthServerAuthUri': 'http://www.sorua.net/typekey',
        'login': 'Anmelden'
      }
    });
  })
  // process story upload
  .then(function () {
    return updateStory({
      name: stories[uploadStory].name,
      title: stories[uploadStory].title,
      src: path.resolve(process.cwd(), `src/story/${uploadStory}.html`),
      selector: '.storyContent'
    });
  })
  .catch(function (err) {
    console.log('Update failed with error: ', err);
  });