const stockForm = document.getElementById('stockForm');
const stockSymbolInput = document.getElementById('stockSymbol');
const stockSuggestions = document.getElementById('stockSuggestions');
const stockQuantityInput = document.getElementById('stockQuantity');
const stockList = document.getElementById('stockList');

const cryptoForm = document.getElementById('cryptoForm');
const cryptoSymbolInput = document.getElementById('cryptoSymbol');
const cryptoQuantityInput = document.getElementById('cryptoQuantity');
const cryptoList = document.getElementById('cryptoList');

const totalValueEl = document.getElementById('totalValue');

let stockHoldings = JSON.parse(localStorage.getItem('stockHoldings')) || [];
let cryptoHoldings = JSON.parse(localStorage.getItem('cryptoHoldings')) || [];

stockForm.addEventListener('submit', e => {
    e.preventDefault();
    const symbol = stockSymbolInput.value.trim().toLowerCase() + '.us';
    const qty = parseFloat(stockQuantityInput.value);
    if (symbol && !isNaN(qty)) {
        stockHoldings.push({ symbol, quantity: qty });
        saveHoldings();
        stockSymbolInput.value = '';
        stockQuantityInput.value = '';
        updateDisplay();
    }
});

stockSymbolInput.addEventListener('input', async () => {
    const query = stockSymbolInput.value.trim();
    if (query.length === 0) {
        stockSuggestions.innerHTML = '';
        return;
    }
    const options = await fetchStockSuggestions(query);
    stockSuggestions.innerHTML = '';
    for (const opt of options) {
        const optionEl = document.createElement('option');
        optionEl.value = opt;
        stockSuggestions.appendChild(optionEl);
    }
});

cryptoForm.addEventListener('submit', e => {
    e.preventDefault();
    const symbol = cryptoSymbolInput.value.trim().toLowerCase();
    const qty = parseFloat(cryptoQuantityInput.value);
    if (symbol && !isNaN(qty)) {
        cryptoHoldings.push({ symbol, quantity: qty });
        saveHoldings();
        cryptoSymbolInput.value = '';
        cryptoQuantityInput.value = '';
        updateDisplay();
    }
});

function saveHoldings() {
    localStorage.setItem('stockHoldings', JSON.stringify(stockHoldings));
    localStorage.setItem('cryptoHoldings', JSON.stringify(cryptoHoldings));
}

async function fetchStockPrice(symbol) {
    try {
        const res = await fetch(`https://corsproxy.io/https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcvn`);
        const text = await res.text();
        const lines = text.trim().split('\n');
        if (lines.length > 1) {
            const cols = lines[1].split(',');
            return parseFloat(cols[6]); // close price
        }
    } catch (err) {
        console.error('Error fetching stock price', err);
    }
    return null;
}

async function fetchCryptoPrice(id) {
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
        const data = await res.json();
        return data[id]?.usd;
    } catch (err) {
        console.error('Error fetching crypto price', err);
    }
    return null;
}

async function fetchStockSuggestions(query) {
    try {
        const res = await fetch(`https://corsproxy.io/https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0`);
        const data = await res.json();
        return (data.quotes || []).map(q => q.symbol);
    } catch (err) {
        console.error('Error fetching stock suggestions', err);
        return [];
    }
}

async function updateDisplay() {
    stockList.innerHTML = '';
    cryptoList.innerHTML = '';
    let total = 0;

    for (const [i, stock] of stockHoldings.entries()) {
        const price = await fetchStockPrice(stock.symbol);
        const value = price ? price * stock.quantity : 0;
        total += value;
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = `${stock.symbol.toUpperCase()}: ${stock.quantity} shares @ $${price ? price.toFixed(2) : 'N/A'} = $${value.toFixed(2)}`;
        const btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.addEventListener('click', () => {
            stockHoldings.splice(i, 1);
            saveHoldings();
            updateDisplay();
        });
        li.appendChild(span);
        li.appendChild(btn);
        stockList.appendChild(li);
    }

    for (const [i, coin] of cryptoHoldings.entries()) {
        const price = await fetchCryptoPrice(coin.symbol);
        const value = price ? price * coin.quantity : 0;
        total += value;
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = `${coin.symbol.toUpperCase()}: ${coin.quantity} @ $${price ? price.toFixed(2) : 'N/A'} = $${value.toFixed(2)}`;
        const btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.addEventListener('click', () => {
            cryptoHoldings.splice(i, 1);
            saveHoldings();
            updateDisplay();
        });
        li.appendChild(span);
        li.appendChild(btn);
        cryptoList.appendChild(li);
    }

    totalValueEl.textContent = `$${total.toFixed(2)}`;
}

// initial display
updateDisplay();
