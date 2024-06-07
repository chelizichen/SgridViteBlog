import { Resp } from "sgridnode/build/main";
import { validationResult } from "express-validator";
import { Response } from "express";

export function Handler(e: Error) {
  return Resp.Error(-9999, e.message, null);
}

export function validateMiddleWare(req, res: Response, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json(Resp.Error(-1, "validateError", errors.array()));
    return res.end();
  }
  next();
}
