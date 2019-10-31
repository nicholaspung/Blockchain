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

  const onIdSubmit = event => {
    event.preventDefault();
    let idTransactions = [];
    let amount = 0;
    blockchain.chain.map(block => {
      let filtered = block.transactions.filter(
        transaction => transaction.recipient === id || transaction.sender === id
      );
      idTransactions = idTransactions.concat(filtered);
    });
    idTransactions.map(transaction => {
      if (transaction.sender === "0") {
        amount += 1;
      } else if (transaction.sender === id) {
        amount -= transaction.amount;
      } else if (transaction.recipient === id) {
        amount += transaction.amount;
      }
    });
    setCoins(amount);
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
        />
        <button onClick={event => onIdSubmit(event)}>Check Wallet!</button>
      </form>
      {coins ? (
        <div>
          <p>You've got {coins} coins!</p>
        </div>
      ) : null}
    </div>
  );
}

export default App;
