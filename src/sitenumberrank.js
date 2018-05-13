const fs = require('fs');
const info = require('../Twoday_Bloginfos.json');
const refs = require('../Twoday_HTTP_Refs.json');
const path = require('path');

const limitDaysLastChange = 6 * 30;

let siteIdRank = Object.keys(refs.data).reduce((all, alias, index) => {
  let daysLastChange = refs.data[alias].daysLastChange;
  if (daysLastChange >= 0 && daysLastChange <= limitDaysLastChange && alias in info && info[alias].title.indexOf('xxx') < 0)
    all.push({ alias, daysLastChange, ...info[alias] });
  return all;
}, [])
  .sort((a, b) => a.siteId - b.siteId);

fs.writeFileSync(path.resolve(process.cwd(), 'Twoday_SiteIdRank.json'), JSON.stringify(siteIdRank));
console.log(`${siteIdRank.length} ranked sites written.`);

let highestSiteId = Object.keys(info).reduce( (all, alias, index) => {
  let siteId = info[alias].siteId;
  if (all < siteId) all = siteId;
  return all;
}, 0);
console.log(`Highest siteId found: ${highestSiteId}`);