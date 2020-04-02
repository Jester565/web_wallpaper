const { DbRef } = require('./dbPopulator');
 
exports.db1 = {
    'users': {
        'user1': {
            name: 'alex',
            devices: [new DbRef('devices', 'device1'), new DbRef('devices', 'device2')],
            sources: {
                'source1': {
                    created: 158326050000,
                    modified: 158332400000,
                    name: 'disneyland1',
                    rating: 3,
                    type: 'reddit',
                    typeConfig: {
                        minUpvotes: 0,
                        sortBy: "hot",
                        subreddit: "disneyland",
                        timeSpan: "week"
                    },
                    excludedDevices: ['device2']
                },
                'source2': {
                    created: 158326050000,
                    modified: 158332400000,
                    name: 'disneyland2',
                    rating: 5,
                    type: 'reddit',
                    typeConfig: {
                        minUpvotes: 0,
                        sortBy: "top",
                        subreddit: "disneyland",
                        timeSpan: "week"
                    }
                }
            }
        }
    },
    'devices': {
        'device1': {
            config: {
                minRes: {
                    height: "500",
                    width: 1000
                },
                name: "device1_name",
                targetAspectRatio: {
                    aspectRatio: 1.83,
                    disabled: false,
                    off: 30
                }
            },
            wallpapers: [ new DbRef('images', 'image1') ],
            sourceImages: {
                'source1': [ new DbRef('images', 'image1') ]
            }
        },
        'device2': {
            config: {
                minRes: {
                    height: "500",
                    width: 1000
                },
                name: "device2_name",
                targetAspectRatio: {
                    aspectRatio: 1.83,
                    disabled: false,
                    off: 30
                }
            },
            wallpapers: [ new DbRef('images', 'image1') ],
            sourceImages: {
                'source1': [ new DbRef('images', 'image2'), new DbRef('images', 'image1') ],
                'source2': [ new DbRef('images', 'image2') ]
            }
        }
    },
    'images': {
        'image1': {
            userID: 'user1',
            url: 'https://reddit.com/r/subr/img1',
            name: null,
            description: null,
            visionData: {
                hasFaces: false,
                hasText: false,
                cropHints: [
                    {
                        aspectRatio: 1.73,
                        pane: {
                            top: 0,
                            left: 0,
                            width: 1920,
                            height: 1080
                        }
                    }
                ]
            }
        }
    }
};

