import firebase from 'firebase'
import _ from 'lodash'

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
        return querySnapshot.docs;
    },
    getDataDiff: (object, base) => {
        function changes(object, base) {
            return _.transform(object, function(result, value, key) {
                if (!_.isEqual(value, base[key])) {
                    result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
                }
            });
        }
        return changes(object, base);
    }
}