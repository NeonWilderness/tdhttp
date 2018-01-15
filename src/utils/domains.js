const fs = require('fs');
const path = require('path');

function logSortedArray(obj, name) {
  let isHosts = (name === 'Hosts');
  if (isHosts) {
    var filename = path.resolve(process.cwd(), 'Twoday_HTTP_Hosts.json');
    var hosts = JSON.parse(fs.readFileSync(filename, 'utf8'));
  }
  let arr = [];
  for (let key of Object.keys(obj)) {
    arr.push({ key, count: obj[key]});
  }
  arr.sort( (a,b) => b.count-a.count );
  console.log(`===== ${name.toUpperCase()} =====`);
  arr.map( entry => { 
    console.log(entry.key, '=', entry.count);
    if (isHosts && entry.count > 3) {
      if (hosts.hasOwnProperty(entry.key))
        hosts[entry.key].count = entry.count;
      else;
        hosts[entry.key] = { count: entry.count, alive: false, https: false, text: '' };
    }
  });
  if (isHosts) {
    fs.writeFileSync(filename, JSON.stringify(hosts));
    let sortedHosts = [];
    Object.keys(hosts)
      .sort()
      .map( host => sortedHosts.push({host, ...hosts[host]}) );
    fs.writeFileSync(path.resolve(process.cwd(), 'Twoday_HTTP_Hosts_Sorted.json'), JSON.stringify(sortedHosts));
  }
}

let filename = path.resolve(process.cwd(), 'Twoday_HTTP_Refs.json'); 
console.log(`Processing file ${filename}.`);
let file = fs.readFileSync(filename, 'utf8');
let json = JSON.parse(file);
let { date, data } = json;

let tags = {};
let domains = {};
let blogs = Object.keys(data);
for (let blog of blogs) {
  let badrefs = data[blog].refs;
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