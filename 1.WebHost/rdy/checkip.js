// npm install express cors request-ip

const express = require('express');
const requestIp = require('request-ip');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(requestIp.mw())

app.get('/checkip', (req, res) => {
    var ip = req.clientIp;
    if (ip.substring(0, 7) == '::ffff:') {
        ip = ip.substring(7);
    }
    res.send(ip);
});

const PORT = process.argv[2] || process.env.PORT || 8080;
app.listen(PORT, () => console.log(`checkip Server running on port ${PORT}`));
