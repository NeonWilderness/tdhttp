/**
 * Identifies progress (level of change) between to JSON status files of invalid http-references
 * -- compares two of any Twoday_HTTP_Refs file (current or any archived version)
 * -- match up blogs and logs any change in invalid http refs
 * -- call pattern: node ./src/utils/progress --first={current|1|2|3...} --second={current|1|2|3...}
 * -- defaults: --first=current (if not given)
 */
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;

/**
 * Identifies and returns the highest archived JSON file number in the './archive' directory
 * @param {void}
 * @returns {number} highest found file version number
 */
const getHighestArchiveNumber = () => {
  let archives = fs.readdirSync(path.resolve(process.cwd(), 'archive'));
  return archives.reduce((all, filename, index) => {
    let archiveNumber = parseInt(filename.match(/Refs.([0-9]+)/)[1]);
    if (archiveNumber > all) all = archiveNumber;
    return all;
  }, 0);
};

/**
 * Returns the full json file name of a given file id {current|1|2|3...}
 * @param {string} id current|1|2|3...
 * @returns {string} full path to filename
 */
const getFullFilename = (id) => {
  let dir = '';
  if (id === 'current')
    id = '';
  else {
    dir = 'archive';
    id = `.${id}`;
  }
  return path.resolve(process.cwd(), dir, `Twoday_HTTP_Refs${id}.json`);
};

// handle and sanitize script parameters
let first = argv.first || 'current';
let second = argv.second || getHighestArchiveNumber().toString();

// set file names and read json content
let file1 = JSON.parse(fs.readFileSync(getFullFilename(first)));
let file2 = JSON.parse(fs.readFileSync(getFullFilename(second)));
console.log(`Comparing ${isNaN(first) ? first + " json file" : "archive version " + first} to ${isNaN(second) ? second + " json file" : "archive version " + second}`);

// compare and log differences
let diff = Object.keys(file1.data).reduce((all, blog, index) => {
  if (blog in file2.data) {
    let firstRefs = file1.data[blog].refs.length;
    let secondRefs = file2.data[blog].refs.length;
    let change = firstRefs - secondRefs;
    let rootStat = file1.data[blog].analytics;
    if (change < 0 || rootStat) {
      all.push({ blog, refs: firstRefs, change, rootStat });
    }
  }
  return all;
}, []);
console.dir(diff.sort((a, b) => a.change - b.change));
let days = Math.round((Date.parse(file1.date) - Date.parse(file2.date)) / (24 * 60 * 60 * 1000));
console.log(`${diff.length} people have updated their blog/s in ${days} days.`);
