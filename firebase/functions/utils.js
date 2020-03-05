exports.allSuccessfulPromises = async (promises) => {
    let results = Promise.all(_.map(promises, (promise) => {
        return async () => {
            try {
                let res = await promise;
                return { successful: true, value: res, err: null };
            } catch (e) {
                return { successful: false, value: null, err: e };
            }
        }
    }));
    let values = [];
    for (let result of results) {
        if (result.successful) {
            values.push(result.value);
        } else {
            console.log("PROMISE ERR: ", result.err);
        }
    }
    return values;
}

exports.getAll = async (refs) => {
    //return empty array if no refs
    if (refs.length == 0) {
        return [];
    }
    
    let collection = refs[0].parent;
    let ids = refs.map(ref => ref.id);
    //in query for matching document ids
    let querySnapshot = await collection.where(firebase.firestore.FieldPath.documentId(), 'in', ids).get();
    return querySnapshot.docs;
}

exports.getReqUserID = (req, admin) => {
    if (req.headers.secret != null && req.headers.userID != null) {
        if (req.headers.secret == functions.config().secret) {
            return req.headers.userID;
        } else {
            throw "Invalid secret";
        }
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        let idToken = req.headers.authorization.split('Bearer ')[1];
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        return decodedIdToken.uid;
    } else {
        throw "No valid authentication method";
    }
}