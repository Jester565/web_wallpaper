//Mock firebase such that all collections are prefixed with TEST_

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
jest.mock('firebase-admin', () => { return mockFirebaseDb() });

const { db1: dbData1 } = require('./fakedb');
const { resetDB } = require('./dbpopulator');

const admin = require('firebase-admin');

beforeAll(async () => {
    const db = admin.firestore();
    await resetDB(dbData1, db);
});

test('Add Source Image - No Edge', async () => {
    console.log("First Test Placeholder");
});