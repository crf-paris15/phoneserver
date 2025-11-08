import Twilio from "twilio";
import "dotenv/config";
import express from "express";
import { validateTwilioRequest } from "./helpers.ts";

const VOICE_PARAMS = {
  language: "fr-FR",
  voice: "Google.fr-FR-Chirp3-HD-Aoede",
} as const;

const app = express();
app.use(express.urlencoded({ extended: true }));

// Handle incoming calls
app.post("/", (req, res) => {
  if (!validateTwilioRequest(req, res)) {
    return res.status(403).send("Forbidden");
  }

  const body = req.body;
  const from = body.From || "unknown";
  const to = body.To || "unknown";

  const response = new Twilio.twiml.VoiceResponse();

  response.gather({
    input: ["dtmf"],
    numDigits: 1,
    timeout: 2,
    actionOnEmptyResult: false,
    action: "/action",
    method: "POST",
  });

  response.say(VOICE_PARAMS, "Bienvenue");
  response.redirect({ method: "POST" }, "/ask");

  res.status(200);
  res.set("Content-Type", "text/xml");
  res.send(response.toString());
});

// Handle question
app.post("/ask", (req, res) => {
  if (!validateTwilioRequest(req, res)) {
    return res.status(403).send("Forbidden");
  }

  const response = new Twilio.twiml.VoiceResponse();
  response.say(
    VOICE_PARAMS,
    "Pour ouvrir la serrure, appuyez sur 1. Pour fermer la serrure, appuyez sur 2.",
  );

  response.gather({
    input: ["dtmf"],
    numDigits: 1,
    timeout: 5,
    actionOnEmptyResult: true,
    action: "/action",
    method: "POST",
  });

  res.status(200);
  res.set("Content-Type", "text/xml");
  res.send(response.toString());
});

// Handle gather action
app.post("/action", (req, res) => {
  if (!validateTwilioRequest(req, res)) {
    return res.status(403).send("Forbidden");
  }

  const body = req.body;
  const digits = body.Digits || "";

  const response = new Twilio.twiml.VoiceResponse();

  switch (digits) {
    case "1":
      response.say(VOICE_PARAMS, "Vous avez choisi l'option un.");
      break;
    case "2":
      response.say(VOICE_PARAMS, "Vous avez choisi l'option deux.");
      break;
    case "":
      response.say(VOICE_PARAMS, "Aucune entrée reçue.");
      response.redirect({ method: "POST" }, "/ask");
      break;
    default:
      response.say(VOICE_PARAMS, "Option non reconnue. Au revoir.");
      break;
  }

  res.status(200);
  res.set("Content-Type", "text/xml");
  res.send(response.toString());
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(process.env.PORT ? Number(process.env.PORT) : 3002);
