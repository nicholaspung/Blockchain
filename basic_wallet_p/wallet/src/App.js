import React, { useState, useEffect, useRef } from "react";

function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function App() {
  const [blockchain, setBlockchain] = useState([]);
  const [id, setId] = useState("");
  const [coins, setCoins] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [lastUpdated, setLastUpdated] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [transaction, setTransaction] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/chain", {
      headers: { "Access-Control-Allow-Origin": "*" },
      mode: "cors"
    })
      .then(response => response.json())
      .then(response => setBlockchain(response));
  }, []);

  useInterval(() => {
    fetch("http://localhost:5000/chain", {
      headers: { "Access-Control-Allow-Origin": "*" },
      mode: "cors"
    })
      .then(response => response.json())
      .then(response => {
        setBlockchain(response);
        let endTime = Date.now();
        setLastUpdated((endTime - startTime) / 1000);
        setStartTime(Date.now());
      });
  }, 10000);

  const onIdChange = event => {
    setId(event.target.value);
  };

  const onRecipientChange = event => {
    setRecipient(event.target.value);
  };

  const onTransactionChange = event => {
    setTransaction(event.target.value);
  };

  const onIdSubmit = event => {
    event.preventDefault();
    let amount = checkCoins();
    setCoins(`${parseInt(amount)}`);
  };

  const checkCoins = () => {
    let idTransactions = [];
    let amount = 0;
    blockchain.chain.map(block => {
      let filtered = block.transactions.filter(
        transaction => transaction.recipient === id || transaction.sender === id
      );
      idTransactions = idTransactions.concat(filtered);
    });
    console.log(idTransactions);
    idTransactions.map(transaction => {
      if (transaction.sender === "0") {
        amount += 1;
      } else if (transaction.sender === id) {
        amount -= parseInt(transaction.amount);
      } else if (transaction.recipient === id) {
        amount += parseInt(transaction.amount);
      }
    });
    console.log(amount);

    return amount;
  };

  const onTransactionSubmit = event => {
    event.preventDefault();
    let amount = checkCoins();
    if (parseInt(amount) < parseInt(transaction)) {
      setMessage("Not enough coins to transfer.");
      return;
    }
    let data = JSON.stringify({
      sender: id,
      recipient: recipient,
      amount: transaction
    });
    fetch("http://localhost:5000/transactions/new", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      mode: "cors",
      method: "POST",
      body: data
    })
      .then(response => response.json())
      .then(response => {
        setMessage(response.message);
        setTransaction(0);
        setRecipient("");
      });
  };

  return (
    <div className="App">
      <div>
        <p>Blockchain Last Updated: {lastUpdated} seconds ago</p>
      </div>
      <form onSubmit={event => onIdSubmit(event)}>
        <input
          type="text"
          name="id"
          value={id}
          onChange={event => onIdChange(event)}
          placeholder="ID..."
        />
        <button onClick={event => onIdSubmit(event)}>Check Wallet!</button>
      </form>
      {coins ? (
        <div>
          <p>You've got {coins} coins!</p>
        </div>
      ) : null}
      <div>
        <p>Send some coins to someone else?</p>
        <input
          type="text"
          name="recipient"
          value={recipient}
          onChange={event => onRecipientChange(event)}
          placeholder="Recipient ID..."
        />
        <input
          type="text"
          name="transaction"
          value={transaction}
          onChange={event => onTransactionChange(event)}
          placeholder="Recipient ID..."
        />
        <button onClick={event => onTransactionSubmit(event)}>
          Send coins!
        </button>
      </div>
      <div>{message}</div>
    </div>
  );
}

export default App;
