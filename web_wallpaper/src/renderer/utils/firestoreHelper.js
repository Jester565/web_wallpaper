import firebase from 'firebase'
import _ from 'lodash'

const cloneDeepKeepRefs = (e) => {
    //Check if has Firestore reference properties (is there a better way to do this)
    if (e.firestore && e.path) {
        return e;
    } else if (typeof e === 'object') {
        let newObj = {};
        for (let key in e) {
            newObj[key] = cloneDeepKeepRefs(e[key]);
        }
        return newObj;
    } else if (typeof e === 'array') {
        let newArr= [];
        for (let i = 0; i < e.length; i++) {
            newArr[i] = cloneDeepKeepRefs(e[i]);
        }
        return newArr;
    } else {
        return _.clone(e);
    }
}

export default {
    //Get snapshots from array of references
    getAll: async (refs) => {
        //return empty array if no refs
        if (refs.length == 0) {
            return [];
        }
        
        let collection = refs[0].parent;
        let ids = refs.map(ref => ref.id);
        //in query for matching document ids
        let querySnapshot = await collection.where(firebase.firestore.FieldPath.documentId(), 'in', ids).get();
        
        //Sort to order references were passed in
        let idsIndex = {};
        for (let i = 0; i < ids.length; i++) {
            idsIndex[ids[i]] = i;
        }
        let docs = _.sortBy(querySnapshot.docs, (doc) => idsIndex[doc.id]);
        return docs;
    },
    getDataDiff: (object, base) => {
        function changes(e, base) {
            return _.transform(e, function(result, value, key) {
                if (value != null && value.path && value.firestore) {
                    if (base[key].path !== value.path) {
                        result[key] = value;
                    }
                } else if (typeof value === 'object') {
                    let diff = changes(value, base[key]);
                    if (Object.keys(diff).length > 0) {
                        result[key] = diff;
                    }
                } else if (typeof value === 'array') {
                    let diff = changes(value, base[key]);
                    if (diff.length > 0) {
                        result[key] = diff;
                    }
                } else if (!_.isEqual(value, base[key])) {
                    result[key] = value;
                }
            });
        }
        return changes(object, base);
    },
    cloneDeepKeepRefs
}