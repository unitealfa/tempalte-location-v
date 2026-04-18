const express = require("express");
const { getHomePageContent, getCurrentSiteContentStatus } = require("../services/contentService");

const router = express.Router();

router.get("/home", async (request, response) => {
  const payload = await getHomePageContent();
  response.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.json(payload);
});

router.get("/status", async (request, response) => {
  response.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.json(await getCurrentSiteContentStatus());
});

module.exports = router;
