const POST_PER_REQ_COUNT = 50;
const STREAM_FORMAT = 'utf-8';
 
const stream = require('stream');
const rp = require('request-promise');
 
/*
    Readable to get top subreddit posts
*/
module.exports = class PostStream extends stream.Readable {
    constructor(subreddit, sortBy, postLimit, age, opts) {
        super(opts);
        this._subreddit = subreddit;
        this._sortBy = sortBy;
        this._postLimit = postLimit;
        this._age = age;
        this._postI = 0;
        this._lastPostFullName = null;
        this._requesting = false;
    }
 
    async _getRedditPosts() {
        this._requesting = true;
        let qs = {
            count: POST_PER_REQ_COUNT,
            after: this._lastPostFullName
        };
        if (this._age != null) {
            qs["t"] = this._age;
        }
        let opts = {
            url: `https://reddit.com/r/${this._subreddit}/${this._sortBy}/.json`,
            method: 'GET',
            qs,
            json: true
        };
        let posts = await rp(opts);
        //If children is empty, the subreddit is out
        if (posts.data.children.length == 0) {
            this._requesting = false;
            this.push(null);
        }
        posts.data.children.forEach((post, i) => {
            if (this._postI >= this._postLimit) {
                this.push(null);
                return;
            }
            this._postI++;
            if (i == posts.data.children.length - 1) {
                this._requesting = false;
                this._lastPostFullName = `${post.kind}_${post.data.id}`;
            }
            this.push(JSON.stringify(post.data), STREAM_FORMAT);
        });
    }
 
    _read() {
        if (!this._requesting) {
            this._getRedditPosts();
        }
    }
}
