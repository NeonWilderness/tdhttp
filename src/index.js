/**
 *  Finding non-working http references on Twoday (in https-mode)
 *  Call script: node index --from=xx --to=xx --delay=20 --rebuild
 *       whereas {from} number: startpage of analysis (>=0 and <50)
 *               {to} number: endpage of analysis (>=0 and <50)
 *               {delay} number: milliseconds delay between axios GET calls (>=20)
 *               {rebuild} purge JSON result file and rebuild entire content
 * 
 *               ! {from} must be less or equal {to}
 *               ! first page number is 0, second 1 ...
 *           or: node index --help
 */
const Blogs = require('./blogs');
const argv = require('yargs').argv;

const from = argv.from || 0;
const to = Math.min(argv.to || 4, 106);
const delay = Math.max(argv.delay || 20, 20);
const rebuild = !!argv.rebuild;
if (from>to) throw new Error('from-Page must be less of equal to to-Page!');
console.log(`Using params: from=${from}, to=${to}, delay=${delay}ms, rebuild=${rebuild}.`);
new Blogs(delay, rebuild).readBlogrollPages(from, to);