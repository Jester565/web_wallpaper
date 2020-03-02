//Ensure that RedditConfig has icon, title, name
import RedditConfig from './RedditConfig'
import GooglePhotosConfig from './GooglePhotosConfig'

//todo: add landing page components
export const ConfigComponents = { 
        [RedditConfig.name]: RedditConfig,
        [GooglePhotosConfig.name]: GooglePhotosConfig
    };
export const Consts = {
    [RedditConfig.name]: {
        icon: "/static/reddit.svg",
        displayName: "Reddit",
        initConfig: {
            subreddit: "",
            sortBy: null,
            timeSpan: null,
            minUpvotes: 0
        }
    },
    [GooglePhotosConfig.name]: {
        icon: "/static/gp.svg",
        displayName: "Google Photos"
    }
}