const _ = require('lodash');
const functions = require('firebase-functions');

exports.allSuccessfulPromises = async (promises) => {
    let results = Promise.all(_.map(promises, (promise) => {
        return (async () => {
            try {
                let res = await promise;
                return { successful: true, value: res, err: null };
            } catch (e) {
                return { successful: false, value: null, err: e };
            }
        })
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
    
    return (await Promise.all(_.map(refs, async (ref) => {
        return await ref.get();
    })));
}

exports.getReqUserID = async (req, admin) => {
    if (req.headers.secret != null && req.headers.userid != null) {
        if (req.headers.secret == functions.config().env.secret) {
            return req.headers.userid;
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