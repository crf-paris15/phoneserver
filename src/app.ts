import Twilio from "twilio";
import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  const response = new Twilio.twiml.VoiceResponse();
  response.say("Hello World!");

  return c.body(response.toString(), 200, {
    "Content-Type": "application/xml",
  });
});

serve({
  fetch: app.fetch,
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
});
