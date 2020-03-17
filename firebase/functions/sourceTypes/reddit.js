const rp = require('request-promise');
const PostStream = require('./postStream');
const querystring = require('querystring');

const REDDIT_POST_LIMIT = 100;

const decodeRedditImgUrl = (url) => {
    let qsStartI = url.indexOf('?');
    if (qsStartI >= 0) {
        let baseUrl = url.substr(0, qsStartI);
        let qsUrl = url.substr(qsStartI + 1);
        let qs = querystring.decode(qsUrl);
        //remove amp prefix from qs
        for (let key in qs) {
            if (key.indexOf('amp;') == 0) {
                let val = qs[key];
                delete qs[key];
                qs[key.substr('amp;'.length)] = val;
            }
        }
        if (Object.keys(qs).length > 0) {
            return `${baseUrl}?${querystring.encode(qs)}`;
        }
        return baseUrl;
    }
    return url;
}

const getRedditImgData = async (url) => {
    const options = {
        method: 'GET',
        url: url,
        encoding: null,
        resolveWithFullResponse: true
    };
      
    let resp = await rp(options);
    return resp.body.toString('base64');
}

exports.getImgs = async (typeConfig) => {
    return new Promise((resolve) => {
        let imgs = [];
        const readable = new PostStream(typeConfig.subreddit, typeConfig.sortBy, REDDIT_POST_LIMIT, typeConfig.timeSpan);
        readable.on('data', (postData) => {
            let post = JSON.parse(postData);
            if (post.preview && post.preview.images) {
                for (let img of post.preview.images) {
                    if (typeConfig.minUpvotes != null && post.ups >= typeConfig.minUpvotes) {
                        let sourceImg = img.source;
                        //remove invalid querystrings from url
                        let decodedUrl = decodeRedditImgUrl(sourceImg.url);
                        imgs.push({
                            id: img.id,
                            url: decodedUrl,
                            getData: getRedditImgData.bind(this, decodedUrl),
                            meta: {
                                name: post.title,
                                width: sourceImg.width,
                                height: sourceImg.height
                            }
                        });
                    }
                }
            }
        });

        readable.on('end', () => {
            resolve(imgs);
        });
    });
}