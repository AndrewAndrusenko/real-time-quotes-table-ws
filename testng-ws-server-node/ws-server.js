const WebSocket = require("ws");
const http = require("http");
const symbolList = require("./symbols-list.js"); //list of instrumets to mock data stream
class Rate {
  time; //quotes time
  symbol; //instrument code
  bid; //buy price
  ask; //sell price
}
const symbolToTrack = "BEN-RM"; //instrument to track through console log
var wsStreamMockInt; // interval to mock data stream from server
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end("WS-Serever is running");
});
const wsServer = new WebSocket.Server({ server: httpServer }); //webSocket Server
//function to mock quotes data stream from a websocket server
//param timeToWork - time of intereval or time of server working and streaming data
//param intervalToEmit - interval of emmision. frequency of emits
//param symbolQty - quantity of instruments inside stream
function simulateRatesFlow(
  timeToWork = 60000 * 30,
  intervalToEmit = 100,
  symbolQty = 500
) {
  wsStreamMockInt = setInterval(() => {
    let ratesSet = []; // quotes set to be emited from the mock server
    let symbols = []; //symbols used to mock the stream
    symbolList.symbolList.forEach((el) => symbols.push(...el)); //getting symbols lists
    symbols.forEach((symbol) => {
      let changeQuote = Math.round(Math.random() * 0.51); //flag to generate or not quotes for the specific instrument
      if (changeQuote) {
        let rate = new Rate();
        rate.bid = Math.round(Math.random() * 100000) / 10000; //random bid price
        rate.ask =
          Math.round(rate.bid * (1 + Math.random() / 10) * 10000) / 10000; // random ask price = random bid + random deviation from bid
        rate.symbol = symbol;
        rate.time = new Date();
        // log data for symbol to track
        rate.symbol === symbolToTrack
          ? console.log(`${new Date(rate.time).getSeconds()}:${new Date(rate.time).getMilliseconds()} - ${rate.ask}`) : null;
        ratesSet.push(rate);
      }
    });
    console.log("emit");
    wsServer.clients.forEach((client) => {
      //sending data to the clients
      if (client !== wsServer && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(ratesSet));
      }
    });
  }, intervalToEmit);

  ws_timeout = setTimeout(() => {
    //setting timer to stop emmision after given time
    console.log("stopped by timer");
    clearTimeout(wsStreamMockInt);
  }, timeToWork);
}
wsServer.on("connection", async (ws, req) => {
  console.log("A new client has connected."); 
  ws.on("close", (client) => {
    console.log(`Client has disconnected: ${client}`);
  });
  ws.on("message", (message) => { // handle commands sent to server to manage streams of quotes
    let cmdIns = JSON.parse(message.toString());
    switch (cmdIns.cmd) {
      case "start": //start new stream and stop existing
        typeof wsStreamMockInt !== "undefined"? clearInterval(wsStreamMockInt) : null; // stop intervals from emmision
        typeof ws_timeout !== "undefined" ? clearTimeout(ws_timeout) : null; // stop times to stop emmision
        simulateRatesFlow( cmdIns.timeToWork, cmdIns.intervalToEmit, cmdIns.symbolQty ); //create new stream of quotes
        break;
      case "stop": //stop stream of quotes
        typeof wsStreamMockInt !== "undefined"? clearInterval(wsStreamMockInt) : null; // stop intervals from emmision
        typeof ws_timeout !== "undefined" ? clearTimeout(ws_timeout) : null; // stop times to stop emmision
      break;
    }
  });
});
const PORT = 3003;
httpServer.listen(PORT, () => { //sever starting
  console.log(`WebSocket server is listening on port ${PORT}`);
});
