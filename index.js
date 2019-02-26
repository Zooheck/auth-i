const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session)

const db = require('./database/dbconfig.js')
const UserFuncs = require('./helpers/userHelpers.js')

const server = express();

const sessionConfig = {
    name: 'Session',
    secret: 'This is the session secret',
    cookie: {
        maxAge: 1000 * 60 * 60,
        secure: false
    },
    httpOnly: true,
    resave: false,
    saveUninitialized: false,

    store: new KnexSessionStore({
        knex: db,
        tablename: 'sessions',
        sidfieldname: 'sid',
        createtable: true,
        clearInterval: 1000 * 60 * 60,
    })
}

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

server.post('/api/register', (req, res) => {
    let user = req.body;

    if (!user.username || !user.password) {
        return res.status(400).json({message: 'New users must have a username and password.'})
    }

    const hash = bcrypt.hashSync(user.password, 10);

    user.password = hash;

    UserFuncs.add(user)
        .then(newUser => {
            req.session.user = newUser;
            res.status(201).json(newUser);
        })
        .catch(err => {
            res.status(500).json(err);
        })
});

server.post('/api/login', (req, res) => {
    let { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please include a username and password."})
    }

    UserFuncs.findBy( {username} )
        .first()
        .then(user => {
            if (user && bcrypt.compareSync(password, user.password)) {
                req.session.user = user;
                res.status(200).json({ message: `Successfully logged in as ${user.username}`})
            } else {
                res.status(401).json({ message: 'Invalid credentials.'})
            }
        })
        .catch(error => {
            res.status(500).json(error)
        })

});

function restricted(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'You are not authorized to view this content.'})
    }
}

// function restricted(req, res, next) {
//     const { username, password } = req.headers;

//     if (!username || !password) {
//         return res.status(400).json({ message: "You must provide a username and password."})
//     }

//     UserFuncs.findBy({ username})
//         .first()
//         .then(user => {
//             if (user && bcrypt.compareSync(password, user.password)) {
//                 next();
//             } else {
//                 res.status(400).json({ message: "Invalid credentials."})
//             }
//         })
//         .catch(error => {
//             res.status(500).json({message: 'Unexpected error.'})
//         })
// }

server.get('/api/users', restricted, async (req, res) => {
    try {
        const users = await UserFuncs.find();

        // users.map(user => {
        //     res.json({id: user.id, username: user.username})
        // })
        res.json(users)
    } catch (error) {
        res.send(error)
    }
});

server.get('/api/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                res.send('Error logging out')
            } else {
                res.send('Deuces!')
            }
        })
    } else {
        res.end();
    }
})

server.listen(4000, () => {
    console.log('Server listening on port 4000.')
})