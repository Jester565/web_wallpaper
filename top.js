const commons = require('./commons');
const POST_PER_REQ_COUNT = 50;
const STREAM_FORMAT = 'utf-8';

const stream = require('stream');
const rp = require('request-promise');

/*
    Readable to get top subreddit posts
*/
module.exports = class TopStream extends stream.Readable {
    constructor(subreddit, age, postLimit, opts) {
        super(opts);
        this._subreddit = subreddit;
        this._age = age;
        this._postLimit = postLimit;
        this._postI = 0;
        this._lastPostFullName = null;
    }

    async _getTopRedditPosts() {
        console.log("GET TOP REDDIT POSTS INVOKED: ", this._lastPostFullName, this._postI);
        let posts = await rp({
            url: `${commons.REDDIT_URL}/r/${this._subreddit}/top/.json`,
            method: 'GET',
            qs: {
                count: POST_PER_REQ_COUNT,
                after: this._lastPostFullName,
                t: this._age
            },
            json: true
        });
        //If children is empty, the subreddit is out
        if (posts.data.children.length == 0) {
            console.log("PUSH NULL");
            this.push(null);
        }
        posts.data.children.forEach((post, i) => {
            if (this._postI >= this._postLimit) {
                console.log("PUSH NULL");
                this.push(null);
                return;
            }
            this._postI++;
            this.push(JSON.stringify(post.data), STREAM_FORMAT);
            if (i == posts.data.children.length - 1) {
                this._lastPostFullName = `${post.kind}_${post.data.id}`;
            }
        });
    }

    _read() {
        this._getTopRedditPosts();
    }
}