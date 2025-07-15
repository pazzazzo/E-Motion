const path = require('path');
const DB = require("pouchdb")

class Database {
    constructor(config = {}) {
        console.log("✅ Database class invoked");
        this.path = config.path || path.join(__awd, "database")
        this.engine = new DB(this.path)
    }
    get(id) {
        return new Promise((r, e) => {
            this.engine.get(id).then(doc => {
                r(doc.value)
            }).catch(err => {
                r(err)
            })
        })
    }
    set(id, value) {
        return new Promise((r, e) => {
            this.engine.get(id).then(doc => {
                doc.value = value
                this.engine.put(doc).then(() => {
                    r(true)
                })
            }).catch(err => {
                if (err.status === 404) {
                    this.engine.put({
                        _id: id,
                        value
                    }).then(() => {
                        r(true)
                    })
                } else {
                    e(err)
                }
            })
        })
    }
}

module.exports = Database