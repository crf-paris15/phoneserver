import Twilio from "twilio";
import "dotenv/config";
import express from "express";
import { endTwilioResponse, validateTwilioRequest } from "./helpers.ts";

const VOICE_PARAMS = {
  language: "fr-FR",
  voice: "Google.fr-FR-Chirp3-HD-Aoede",
} as const;

const LOCK_CRF_HOSTNAME = process.env.LOCK_CRF_HOSTNAME || "";
const API_SECRET = process.env.API_SECRET || "";

const app = express();
app.use(express.urlencoded({ extended: true }));

// Handle incoming calls
app.post("/", async (req, res) => {
  if (!validateTwilioRequest(req)) {
    return res.status(403).send("Forbidden");
  }

  const body = req.body;
  const from = body.From || "unknown";
  const to = body.To || "unknown";

  const formData = new FormData();
  formData.append("from", from);
  formData.append("to", to);
  formData.append("apiSecret", API_SECRET);

  const response = new Twilio.twiml.VoiceResponse();

  fetch(`${LOCK_CRF_HOSTNAME}/api/phone`, {
    method: "POST",
    body: formData,
  }).then((r) =>
    r
      .json()
      .then((data: any) => {
        if (data.success) {
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

          endTwilioResponse(res, response);
        } else {
          response.say(VOICE_PARAMS, data.error.message + " Au revoir.");
          endTwilioResponse(res, response);
        }
      })
      .catch(() => {
        response.say(
          VOICE_PARAMS,
          "Désolé, une erreur interne s'est produite. Contactez votre responsable d'activité pour actionner la serrure. Au revoir.",
        );

        endTwilioResponse(res, response);
      }),
  );
});

// Handle question
app.post("/ask", (req, res) => {
  if (!validateTwilioRequest(req)) {
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

  endTwilioResponse(res, response);
});

// Handle gather action
app.post("/action", (req, res) => {
  if (!validateTwilioRequest(req)) {
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

  endTwilioResponse(res, response);
});

// Health check endpoint
app.get("/health", (_, res) => {
  res.status(200).send("OK");
});

app.listen(process.env.PORT ? Number(process.env.PORT) : 3002);
