const _ = require('lodash');

class DbRef {
    constructor(collectionID, docID) {
        this.collectionID = collectionID;
        this.docID = docID;
    }
}

exports.DbRef = DbRef;
 
exports.resetDB = async (collections, db) => {
    await clearCollections(collections, db);
    await addCollections(collections, db);
}
 
const clearCollections = async (collections, db) => {
    for (let collectionID in collections) {
        let querySnapshot = await db.collection(collectionID).get();
        await Promise.all(_.map(querySnapshot.docs, (docSnapshot) => {
            return docSnapshot.ref.delete();
        }));
    }
}
 
const addCollections = async (collections, db) => {
    let addedCollections = {};
    for (let collectionID in collections) {
        if (!addedCollections[collectionID]) {
            await addCollection(collectionID, collections, addedCollections, db);
        }
    }
}
 
const addCollection = async (collectionID, collections, addedCollections, db) => {
    addedCollections[collectionID] = true;
    let pushCollection = _.cloneDeep(collections[collectionID]);
    await replaceNestedDbRefs(pushCollection, async (refInfo) => {
        if (!addedCollections[refInfo.collectionID]) {
            await addCollection(refInfo.collectionID, collections, addedCollections, db);
        }
        return db.collection(collectionID).doc(refInfo.docID);
    });
    console.log("PUSH COLLECTION: ", pushCollection);
    for (let docID in pushCollection) {
        await db.collection(collectionID).doc(docID).set(pushCollection[docID]);
    }
}
 
const replaceNestedDbRefs = async (e, cb) => {
    //check if instance of DbRef based on props (i tried typeof)
    if (e != null && e.collectionID && e.docID) {
        console.log("INSTANCE FOUND");
        return await cb(e);
    }
    else if (Array.isArray(e)) {
        console.log("ARRAY:", JSON.stringify(e));
        for (let i = 0; i < e.length; i++) {
            e[i] = await replaceNestedDbRefs(e[i], cb);
        }
    }
    else if (typeof e === 'object') {
        console.log("OBJ:", JSON.stringify(e));
        for (let key in e) {
            e[key] = await replaceNestedDbRefs(e[key], cb);
        }
    }
    return e;
}
 