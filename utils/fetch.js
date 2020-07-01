const request = require('request');

const _fetch = function (url) {
    return new Promise((resolve, reject) => {
        request(url, {
            json: true
        }, (err, res, body) => {
            if (err) {
                reject(err)
            } else {
                resolve(body)
            }
        })
    })
}

module.exports = _fetch