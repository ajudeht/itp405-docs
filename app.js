const WebSocket = require('ws');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const express = require('express');
var cors = require('cors');
var app = express();
var expressWs = require('express-ws')(app);

const port = process.env.PORT || 3000;

const adapter = new FileSync('db.json')
const db = low(adapter)

let insertAt = (str, sub, pos) => `${str.slice(0, pos)}${sub}${str.slice(pos)}`;
let workingBody = "";

db.defaults({ body : "" }).write();

setBody("bye");

app.use(cors());

app.get('/api/body', function(req, res) {
  res.send(db.get('body').value());
})

app.ws('/api/ws', function(ws, req) {
  ws.on('message', function(msg) {
    msg = JSON.parse(msg);
    if(msg.type == "add"){
      let b = workingBody;
      b = insertAt(b, msg.char, msg.position);
      console.log(b);
      setBody(b);
    } else if(msg.type == "subtract"){
      let b = workingBody;
      let tsa = b.split("");
      tsa.splice(msg.position, msg.char.length);
      let nv = tsa.join("");
      //console.log(nv);
      setBody(nv);
    }

    expressWs.getWss().clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    });

  });
});

function setBody(text, callback){
  db.set("body", text).write();
  workingBody = text;
}

let server = app.listen(port, () => console.log(`Serving at http://localhost:${port}`));
