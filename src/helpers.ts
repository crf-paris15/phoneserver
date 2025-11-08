import express from "express";
import Twilio from "twilio";

export const validateTwilioRequest = (
  req: express.Request,
  res: express.Response,
) => {
  const twilioSignature = req.get("x-twilio-signature") || "";
  const body = req.body;

  return Twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN || "",
    twilioSignature,
    (process.env.URL || "") + req.originalUrl,
    body,
  );
};
