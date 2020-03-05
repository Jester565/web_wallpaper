const MAX_POSTS = 200;
const rp = require("request-promise");
const PostStream = require("./postStream");
const querystring = require('querystring');
const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
 
const adapter = new FileSync('db.json');
const db = low(adapter);
 
db.defaults({ excludeIDs: {}, subreddits: [ "disneyland" ] })
  .write();
 
const decodeRedditImgUrl = (url) => {
    let qsStartI = url.indexOf('?');
    if (qsStartI >= 0) {
        let baseUrl = url.substr(0, qsStartI);
        let qsUrl = url.substr(qsStartI + 1);
        let qs = querystring.decode(qsUrl);
        if (qs["s"] == null) {
            qs["s"] = qs["amp;s"];
        }
        delete qs["amp;s"];
        console.log("QS: ", JSON.stringify(qs));
        if (Object.keys(qs).length > 0) {
            return `${baseUrl}?${querystring.encode(qs)}`;
        }
        return baseUrl;
    }
    return url;
}
 
/*
    subreddit: The subreddit to get images from
    age: day, week, year, etc. used to determine the age of posts to list
    resolution: The target resolution (other resolutions may be cropped to meet)
    excludeIDs: Previous reddit post IDs to not include
    
    Returns: URL to image
*/
let getPrioritizedSubredditImgUrls = (subreddit, age, resolution, excludeIDs = {}) => {
    return new Promise((resolve) => {
        let validImgs = [];
        let maxUpvotes = 0;
        const readable = new PostStream(subreddit, 'hot', MAX_POSTS, age);
        readable.on('data', (postData) => {
            let post = JSON.parse(postData);
            if (excludeIDs == null || !excludeIDs[post.id]) {
                if (post.preview && post.preview.images) {
                    for (let img of post.preview.images) {
                        let sourceImg = img.source;
                        if (sourceImg.width >= resolution.w && sourceImg.height >= resolution.h) {
                            if (post.ups > maxUpvotes) {
                                maxUpvotes = post.ups;
                            }
                            validImgs.push({
                                upvotes: post.ups,
                                aspectRatioDiff: Math.abs((sourceImg.width / sourceImg.height) - (resolution.w / resolution.h)),
                                url: decodeRedditImgUrl(sourceImg.url),
                                id: post.id
                            });
                        }
                    }
                }
            }
        });
        readable.on('end', () => {
            console.log("CLOSED");
            validImgs.sort((img1, img2) => {
                return (img2.upvotes / maxUpvotes + (1 - img2.aspectRatioDiff)) - (img1.upvotes / maxUpvotes + (1 - img1.aspectRatioDiff));
            });
            console.log("VALID IMGS: ", validImgs.length);
            resolve(validImgs);
        });
    });
}
 
let run = async (resolution) => {
    let imgs = await getPrioritizedSubredditImgUrls('disneyland', 'week', resolution, null);
    const client = new vision.ImageAnnotatorClient();
    // Creates a client
    for (let img of imgs) {
        const options = {
            method: 'GET',
            url: decodeRedditImgUrl(img.url),
            encoding: null,
            resolveWithFullResponse: true
        };
          
        let resp = await rp(options);
        console.log("GOT REDDIT IMG");
        let data = resp.body.toString('base64');
        let gPayload = { 
            image: { content: data }, 
            features: [{type: 'TEXT_DETECTION'}, {type: 'CROP_HINTS'}, {type: 'FACE_DETECTION'}],
            imageContext: {
                cropHintsParams: {
                aspectRatios: [
                    (resolution.w / resolution.h)
                ]
                }
            } };
        const gRes = await client.batchAnnotateImages({requests: [gPayload]});
        const detections = gRes[0].responses[0];
        console.log("Detections: " + JSON.stringify(detections));
        if (detections.faceAnnotations.length == 0 && detections.textAnnotations.length < 5) {
            let vertices = detections.cropHintsAnnotation.cropHints[0].boundingPoly.vertices;
            let top = vertices[0].y;
            let left = vertices[0].x;
            let width = vertices[2].x - left;
            let height = vertices[2].y - top;
            return;
        }
    }
}
 
run({w: 1920, h: 1080});