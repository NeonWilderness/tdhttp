const fs = require('fs');

function logSortedArray(obj, name) {
  let arr = [];
  for (let key of Object.keys(obj)) {
    arr.push({ key, count: obj[key]});
  }
  arr.sort( (a,b) => b.count-a.count );
  console.log(`===== ${name.toUpperCase()} =====`);
  arr.map( entry => { console.log(entry.key, '=', entry.count); });
}

let file = fs.readFileSync("./Twoday_HTTP_Refs.json", 'utf8');
let json = JSON.parse(file);
let { date, refs } = json;

let tags = {};
let domains = {};
let blogs = Object.keys(refs);
for (let blog of blogs) {
  let badrefs = refs[blog];
  for (let badref of badrefs) {
    let [ tag, url ] = badref.split(' | ');
    if (tags.hasOwnProperty(tag))
      tags[tag]++;
    else
      tags[tag] = 1;
    let domain = url.replace('\n', '').match(/http:\/\/([a-z0-9-.]*)\//);
    if (domain) {
      domain = domain[1];
      if (domains.hasOwnProperty(domain))
        domains[domain]++;
      else
        domains[domain] = 1;
    } else {
        console.log(`${url} does not match regex pattern.`);
    }
  }
}
let hosts = Object.keys(domains).reduce( (all, item, index) => {
  let domainParts = item.split('.');
  if (domainParts.length>2) domainParts.splice(0, domainParts.length-2);
  let domain = domainParts.join('.');
  if (all.hasOwnProperty(domain))
    all[domain] += domains[item];
  else
    all[domain] = domains[item];
  return all;  
}, {});
logSortedArray(tags, 'Tags');
logSortedArray(domains, 'Domains');
logSortedArray(hosts, 'Hosts');