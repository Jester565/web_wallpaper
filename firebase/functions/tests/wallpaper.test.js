//Mock firebase such that all collections are prefixed with TEST_
const fs = require('fs');
const util = require('util');
const asyncReadFile = util.promisify(fs.readFile);
const querystring = require('querystring');

function mockFirebaseDb() {
    let admin = jest.requireActual('firebase-admin');
    admin.initializeApp({
        projectId: 'webwall-4ab1f',
    });
    const db = admin.firestore();
    db.collection2 = db.collection;
    db.collection = ((colID) => {
        return db.collection2('TEST_' + colID)
    }).bind(db);
    admin.firestore = () => { return db };
    return admin;
}


jest.mock('firebase-functions', () => {
    return {
        config() {
            return { 
                secret: 'shh...secret',
                func_url: 'funcurl'
            }
        }
    }
});
jest.mock('firebase-admin', () => { return mockFirebaseDb() });
jest.mock('@google-cloud/vision');
jest.mock('request-promise');

const { db1: dbData1 } = require('./fakedb');
const { resetDB } = require('./dbpopulator');

const rp = require('request-promise');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');
const functions = require('firebase-functions');

const { addSourceImages } = require('../addSourceImages');
const { pickDeviceWallpaper } = require('../pickDeviceWallpaper');
const { batchUpdateUsers } = require('../updateUsers');

jest.setTimeout(25000);

beforeEach(async () => {
    const db = admin.firestore();
    await resetDB(dbData1, db);
});

test('Add Source Images - No Edge', async () => {
    const db = admin.firestore();

    let mockReqNum = 0;
    rp.mockImplementation(async (options) => {
        let url = options.url;
        let qs = querystring.decode(url);
        if (options.qs) {
            qs = {
                ...options.qs,
                qs
            }
        }
        if (qs["s"] != null) {
            let imgData = await asyncReadFile(`${__dirname}/mockData/reddit_img.jpg`);
            return {
                body: imgData
            }
        }
        let res = JSON.parse(await asyncReadFile(`${__dirname}/mockData/posts${++mockReqNum}.json`));
        return res;
    });

    vision.ImageAnnotatorClient.mockImplementation(
        () => ({
        batchAnnotateImages: async () => { return JSON.parse(await asyncReadFile(`${__dirname}/mockData/gresp.json`)); }
        })
    )

    await addSourceImages('user1', 'source1', [ 'device1' ], db);

    let imgID = 'GeCuzw6dZxbSmK1CjEpo76zhZ_OOwFGEJAypwQPh0mM';
    let imgDoc = await db.collection('images').doc(imgID).get();
    expect(imgDoc.exists).toBeTruthy();
    expect(imgDoc.data()).toMatchObject({
        url: 'https://preview.redd.it/1d5g0655rum41.jpg?auto=webp&s=f3faaa32a9cb79f6275210ce0c62a7f4c09ce835',
        name: `The park might be closed, but that won't stop me from visiting virtually via "Disneyland Adventures!" It's forever stuck in 2011 Disneyland so I got to see an old favorite.`,
        visionData: {
            hasFaces: true,
            hasText: false,
            cropHints: [{
                aspectRatio: 1.83,
                pane: {
                    height: 2045,
                    left: 0,
                    top: 234,
                    width: 3619
                }
            },]
        }
    });

    let deviceDoc = await db.collection('devices').doc('device1').get();
    expect(deviceDoc.data()).toMatchObject({
        sourceImages: {
            'source1': [ 
                { path: 'TEST_images/GeCuzw6dZxbSmK1CjEpo76zhZ_OOwFGEJAypwQPh0mM' }, 
                { path: 'TEST_images/image1' } ]
        }
    });
});

test('Pick device wallpaper - No Edge', async () => {
    const db = admin.firestore();

    await pickDeviceWallpaper('user1', 'device2', db);

    let deviceDoc = await db.collection('devices').doc('device2').get();
    expect(deviceDoc.data()).toMatchObject({
        wallpapers: [ { path: 'TEST_images/image2' }, { path: 'TEST_images/image1' } ]
    });
});

test('Update all user wallpapers - No Edge', async () => {  
    const db = admin.firestore();

    let mockReqNum = 0;
    rp.mockImplementation(async (options) => {
        let url = options.url;
        let qs = querystring.decode(url);
        if (options.qs) {
            qs = {
                ...options.qs,
                qs
            }
        }
        //Mock requests to invoke other functions
        if (url.indexOf(`${functions.config().func_url}/addSourceImages`) == 0) {
            expect(options.headers['secret']).toEqual(functions.config().secret);
            await addSourceImages(options.headers['userID'], options.data['sourceID'], options.data['deviceIDs'], db);
            return;
        } else if (url.indexOf(`${functions.config().func_url}/pickDeviceWallpaper`) == 0) {
            expect(options.headers['secret']).toEqual(functions.config().secret);
            await pickDeviceWallpaper(options.headers['userID'], options.data['deviceID'], db);
            return;
        } else if (qs["s"] != null) {
            let imgData = await asyncReadFile(`${__dirname}/mockData/reddit_img.jpg`);
            return {
                body: imgData
            }
        }
        //reset post pagination if afterID not specified
        if (qs['after'] == null) {
            mockReqNum = 0;
        }
        let res = JSON.parse(await asyncReadFile(`${__dirname}/mockData/posts${++mockReqNum}.json`));
        return res;
    });

    vision.ImageAnnotatorClient.mockImplementation(
        () => ({
        batchAnnotateImages: async () => { return JSON.parse(await asyncReadFile(`${__dirname}/mockData/gresp.json`)); }
        })
    )

    await batchUpdateUsers(null, db);
    
    let imgID = 'GeCuzw6dZxbSmK1CjEpo76zhZ_OOwFGEJAypwQPh0mM';
    let imgDoc = await db.collection('images').doc(imgID).get();
    expect(imgDoc.exists).toBeTruthy();

    let device1Doc = await db.collection('devices').doc('device1').get();
    expect(device1Doc.data()).toMatchObject({
        sourceImages: {
            source1: [ { path: 'TEST_images/GeCuzw6dZxbSmK1CjEpo76zhZ_OOwFGEJAypwQPh0mM' },
                { path: 'TEST_images/image1' } ],
            source2: [ { path: 'TEST_images/GeCuzw6dZxbSmK1CjEpo76zhZ_OOwFGEJAypwQPh0mM' } ]
        },
        wallpapers: [
            { path: 'TEST_images/GeCuzw6dZxbSmK1CjEpo76zhZ_OOwFGEJAypwQPh0mM' },
            { path: 'TEST_images/image1' }
        ]
    });
    let device2Doc = await db.collection('devices').doc('device2').get();
    expect(device2Doc.data()).toMatchObject({
        sourceImages: {
            source1: [ { path: 'TEST_images/image2' },
                { path: 'TEST_images/image1' } ],
            source2: [ { path: 'TEST_images/GeCuzw6dZxbSmK1CjEpo76zhZ_OOwFGEJAypwQPh0mM' },
                {path: 'TEST_images/image2'} ]
        }
    });
    expect(device2Doc.data().wallpapers.length).toEqual(2);
    let possibleWallpaperPaths = ['TEST_images/image2', 'TEST_images/GeCuzw6dZxbSmK1CjEpo76zhZ_OOwFGEJAypwQPh0mM'];
    let wallpaperPath = device2Doc.data().wallpapers[0].path;
    expect(possibleWallpaperPaths.includes(wallpaperPath)).toBeTruthy();
});