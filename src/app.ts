import Twilio from "twilio";
import "dotenv/config";
import express from "express";

const app = express();

app.use(Twilio.webhook());
app.use(express.json());

app.post("/", (req, res) => {
  const body = req.body;

  console.log("Received body:", body);

  const from = body.From || "unknown";
  const to = body.To || "unknown";

  const response = new Twilio.twiml.VoiceResponse();
  response.say(`Hello ${from} from ${to}!`);

  res.status(200);
  res.set("Content-Type", "text/xml");
  res.send(response.toString());
});

app.listen(process.env.PORT ? Number(process.env.PORT) : 3002);
