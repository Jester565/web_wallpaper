# Web Wallpaper
Update your desktop wallpaper with images from Reddit, Google Photos, or your local files every morning. Of course, we want to make sure the images we're getting match our device's resolution and we can specify if images that include faces or text are used.

## Getting Started
In order to set up the back end, you'll need to make sure you've provided [credentials](https://cloud.google.com/docs/authentication/getting-started) to a [firebase](https://firebase.google.com/) project with [Cloud Vision](https://cloud.google.com/vision), [Firestore](https://firebase.google.com/docs/firestore), [Cloud Functions](https://firebase.google.com/docs/functions), and [Authentication](https://firebase.google.com/docs/auth/web/google-signin) enabled. Set a [Service Account](https://cloud.google.com/docs/authentication/getting-started) on your local machine.

Enter the firebase folder in [{PROJECT_ROOT}/firebase](./firebase).  In order to limit users' access to data, push the firestore rules with: `firebase deploy --only firestore:rules`.

Configure your firebase functions with the command: 
```
firebase functions:config:set 
env.secret={ANY STRING FOR YOU APP SECRET}
env.func_url={THE URL FOR YOUR FIREBASE FUNCTIONS}
env.api_key={API KEY FOUND IN GCP > APIS & Services > CREDENTIALS > API_KEYS}
```
Deploy the cloud functions using the command: `firebase deploy --only functions` .  You can also test these functions before deployment by running `npm test` in [{PROJECT ROOT}/firebase/functions](./firebase/functions).  These test will populate your Firestore with test collections due to the difficulty in mocking the database API.

Open the configuration in [{PROJECT ROOT}/web_wallpaper/src/constants.js](./web_wallpaper/src/constants.js) and set the API_URL to your firebase API.

Build the background service using [pkg](https://github.com/zeit/pkg).  First, install the `pkg` command with `npm install -g pkg`.  Next, run `npm run pack:service` in [{PROJECT ROOT}/web_wallpaper](./web_wallpaper).  This will bundle es6 imports in a dist directory.  We still need to build the service executable.  Goto [{PROJECT ROOT}/web_wallpaper/src/service](./web_wallpaper/src/service) and execute `pkg .`.  A `webwallservice.exe` file should now be in the [{PROJECT ROOT}/web_wallpaper/src/service](./web_wallpaper/src/service) directory.

Now that your back end is setup, enter the front end folder at [{PROJECT_ROOT}/web_wallpaper](./web_wallpaper). The front end runs on [electron](https://github.com/electron/electron) and [electron-vue](https://github.com/SimulatedGREG/electron-vue).  Install these and other dependencies by running `npm install` in the front end directory.  To launch the electron app use `npm run dev`

## Functionality
Source Configuration            |  Device Configuration
:-------------------------:|:-------------------------:
![Configurations for a Reddit source, includes favor, subreddit, sorting method, and timespan](./concept/source_config.PNG)  |  ![A popup with resolution, aspect ratio, and background setting for a device](./concept/device_config.PNG)

There are two major components to the app: sources and devices.  Sources are places where images are pulled from.  Subreddits, Google Photo Albums, and local files are all potential sources and each one has a unique configuration.  Devices are laptops, desktops, and (later) phones that you've used the app on.  Different devices can specify restrictions on resolution, aspect ratio, and background color while using global sources.


## Electron App WIP
#### Device Configurations
- [X] Wallpaper carousel
- [X] Minimum Resolution
- [X] Aspect Ratio Config
- [X] Color Filters
#### Home Page
- [X] Source Cards
- [X] Wallpaper carousel
#### Source Configurations
- [X] Image carousel
- [X] Face and text filtering
- [X] Show different configuration types
- [X] Exclude devices
#### Reddit
- [X] Add missing subreddit sorting options (random, hot, etc.)
#### Google Photos
- [ ] Select person, album, or place
- [ ] Authenticate with API (after login)
#### Background Service
- [X] Pull image from database every morning
- [X] Handle wallpaper updates from electron
- [ ] Prompt on expired credentials

## Serverless Back End WIP
- [X] Tests
- [X] Update wallpapers for all users
- [X] Cleanup expired data
- [X] Handle user deletion
- [ ] Color filters
- [ ] Google Photos
- [ ] Local files