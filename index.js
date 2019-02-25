const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const db = require('./database/dbconfig.js')
const UserFuncs = require('./helpers/userHelpers.js')

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.post('/api/register', (req, res) => {
    let user = req.body;

    if (!user.username || !user.password) {
        return res.status(400).json({message: 'New users must have a username and password.'})
    }

    const hash = bcrypt.hashSync(user.password, 10);

    user.password = hash;

    UserFuncs.add(user)
        .then(newUser => {
            res.status(201).json(newUser);
        })
        .catch(err => {
            res.status(500).json(err);
        })
});

function restricted(req, res, next) {
    const { username, password } = req.headers;

    if (!username || !password) {
        return res.status(400).json({ message: "You must provide a username and password."})
    }

    UserFuncs.findBy({ username})
        .first()
        .then(user => {
            if (user && bcrypt.compareSync(password, user.password)) {
                next();
            } else {
                res.status(400).json({ message: "Invalid credentials."})
            }
        })
        .catch(error => {
            res.status(500).json({message: 'Unexpected error.'})
        })
}

server.listen(4000, () => {
    console.log('Server listening on port 4000.')
})