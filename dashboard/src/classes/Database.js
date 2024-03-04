const fs = require('fs');
const path = require('path');


class Database {
    constructor(config = {}) {
        this.path = config.path || path.join(__dirname, "..", "database.json")
        this.data = {}
    }
    save(cb) {
        fs.writeFile(this.path, JSON.stringify(data), (err) => {
            cb(err)
        })
    }
    load (cb) {
        fs.readFile(this.path, (err, data) => {
            if (!err) {
                this.data = JSON.parse(data.toString())
            }
            cb(err)
        })
        return this
    }
}

module.exports = Database