const db = require('../database/dbconfig.js')

module.exports = {
    find,
    findById,
    add
}

function find() {
    return db('users').select('id', 'username', 'password')
}

function findById(id) {
    return db('users')
        .where({ id })
        .first()
}

async function add(user) {
    const [id] = await db('users').insert(user);

    return findById(id)
}