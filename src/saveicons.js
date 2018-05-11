const { argv } = require('yargs');
const axios = require('axios');
const fs = require('fs');
const info = require('../Twoday_Bloginfos.json');
const path = require('path');

const limit = 10;
const delay = 200;

class Icons {

  constructor(delay, limit) {
    this.delay = delay;
    this.limit = (!!argv.all ? Number.MAX_SAFE_INTEGER : limit);
    this.dir = path.resolve(process.cwd(), 'icons');
    this.sOk = 0;
    this.s404 = 0;
    this.genericIcons = 0;
    this.totalDownloads = 0;
    this.totalDownloadSize = 0;
  }

  delayNextPromise(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async downloadIcon(alias, uri) {

    const iconFile = path.resolve(this.dir, `${alias}.${uri.split('.').pop()}`);

    const response = await axios({
      method: 'GET',
      url: uri,
      responseType: 'stream'
    });

    response.data.pipe(fs.createWriteStream(iconFile));

    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        console.log(`OK: ${alias} | ${response.headers['content-type']}, len=${response.headers['content-length']}`);
        this.sOk++;
        this.totalDownloadSize += parseInt(response.headers['content-length']);
        resolve();
      })

      response.data.on('error', () => {
        if (response.status == 404) {
          console.log(`404: ${alias} @ ${uri}`);
          this.s404++;
          resolve();
        } else reject();
      })
    })
  }

  hasOwnIcon(alias) {
    let generic = (info[alias].icon == 'https://static.twoday.net/icon.gif');
    this.genericIcons += Number(generic);
    return !generic;
  }

  downloadTwodayIcons() {
    this.downloadIcon('static', 'https://static.twoday.net/icon.gif')
      .then(() => {
        let promises = [];
        Object.keys(info).forEach((alias, index) => {
          if (index < this.limit && this.hasOwnIcon(alias)) {
            this.totalDownloads++;
            promises.push(
              this.delayNextPromise(this.delay*this.totalDownloads)
                .then(() => this.downloadIcon(alias, info[alias].icon))
            );
          }
        });
        return Promise.all(promises);
      })
      .then(() => {
        console.log(`\nImages downloaded: ${this.sOk} | 404 errors: ${this.s404} | total download size: ${Math.ceil(this.totalDownloadSize / 1024)} KB.`);
        console.log(`Blogs with generic icon: ${this.genericIcons}.`);
      });
  }

}

new Icons(delay, limit).downloadTwodayIcons();