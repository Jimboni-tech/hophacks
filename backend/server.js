const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const app = express();


app.listen(3000, () => {
require('dotenv').config();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
    
});