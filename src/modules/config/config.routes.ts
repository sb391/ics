import { Router, type RequestHandler } from "express";

import { getIndustryModel } from "../scoring/industry.registry";

export function createAutoConfigHandler(): RequestHandler {
  return (_request, response) => {
    response.status(200).json(getIndustryModel("auto").config);
  };
}

export function createConfigRouter() {
  const router = Router();
  router.get("/config/auto", createAutoConfigHandler());
  return router;
}
