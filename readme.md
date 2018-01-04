# Searching invalid http references on Twoday blog sites
### Background
The [Twoday](https://twoday.net) blogger platform has recently implemented **https** as its standard mode over the previously used insecure http mode. However, as part of the individual blog sites (subdomains), there are still lots of old, hard-coded **HTTP** references in various *script*, *iframe* or *embed* statements.

Unfortunately, these http-references are invalid, because they will be suppressed by the browser when called in https-mode (which, as stated, is now Twoday's standard mode). This means, that scripts with http url are not executed, iframes not shown or embeds (e.g. from youtube) not displayed.

### Solution
This tool reads Twodays first 50 blogroll pages (each page holds 15 blog site references) and checks each blog homepage for unwanted http references. All identified bad references are stored in a resulting json file.

The results are conveniently display in a blog article, where people can select their own blogname to learn more about the ineffective http references on their own site.

The FAQ that comes with the article explains potential solutions and how to migrate to working https links (in case this is offered by the respective provider).

### Ingredients
The [blog](https://neonwilderness.twoday.net/) that features this article/tool utilizes Twoday-adapted versions of [**Foundation 5**](https://foundation.zurb.com/sites/docs/v/5.5.3/) and [**Knockout**](http://knockoutjs.com/) &mdash; *select.html* and *select.js* are hence built with these frameworks.

The node script to create the underlying JSON data (blog scraper) runs locally, is ES6 JavaScript and makes heavy use of native Promises as well as async/await and [Axios](https://github.com/axios/axios) (see *index.js* and especially *blogs.js*. *hooklog.js* features a utility module to additionally copy console-log output to a file 'build.log'). *domains.js* is just a small helper script to get some stats about the scraped JSON data.