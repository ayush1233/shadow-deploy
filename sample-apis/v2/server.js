const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/users', (req, res) => {
    // V2 adds an extra field and has artificial latency
    setTimeout(() => {
        res.json([{ id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' }]);
    }, 150);
});

app.get('/api/products', (req, res) => {
    // V2 changes the type of price from float to string (breaking change maybe)
    setTimeout(() => {
        res.json([{ id: 101, name: 'Laptop', price: '999.99' }]);
    }, 50);
});

app.listen(4000, () => console.log('v2 listening on 4000'));
