const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/users', (req, res) => {
    res.json([{ id: 1, name: 'Alice', email: 'alice@example.com' }]);
});

app.get('/api/products', (req, res) => {
    res.json([{ id: 101, name: 'Laptop', price: 999.99 }]);
});

app.listen(3000, () => console.log('v1 listening on 3000'));
