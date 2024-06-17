// npm install express cors request-ip

const express = require('express');
const requestIp = require('request-ip');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(requestIp.mw())

app.get('/checkip', (req, res) => {
    var ip = req.clientIp;
    res.send(ip);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`checkip Server running on port ${PORT}`));
