const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const db = require('./database/dbconfig.js')

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.listen(4000, () => {
    console.log('Server listening on port 4000.')
})