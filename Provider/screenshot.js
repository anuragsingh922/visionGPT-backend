const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

// Function to validate URL and exclude YouTube links
function isValidURL(str) {
  const urlPattern =
    /^(http(s)?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
  const isYouTube = str.includes("youtube.com") || str.includes("youtu.be");
  return urlPattern.test(str) && !isYouTube;
}

// Main function to take a screenshot of the first valid search result
const screenshot = async (req, res) => {
  const { query, id } = req.body;

  console.log("Query on backend:", query, "ID:", id);

  const screenshotPath = path.join(__dirname, "..", "screenshots", `${id}.jpg`);

  // Delete existing screenshot if it exists
  if (fs.existsSync(screenshotPath)) {
    fs.unlinkSync(screenshotPath);
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });

    console.log(
      "Making URL:",
      `https://www.google.com/search?q=${encodeURIComponent(query)}`
    );

    let u_valid = false;
    let attempts = 0;

    // Loop until we find a valid URL or exceed max attempts
    while (!u_valid && attempts < 5) {
      await page.goto(
        `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        {
          waitUntil: "networkidle0",
          timeout: 60000,
        }
      );

      // Click on the first non-Google search result link excluding top stories
      await page.evaluate(() => {
        const results = Array.from(
          document.querySelectorAll(
            'div[id="search"] a[href^="http"]:not([href*="google"]):not([href*="youtube"])'
          )
        );
        const firstResult = results.find(
          (result) => !result.closest(".top-stories")
        ); // Exclude top stories
        if (firstResult) {
          firstResult.click();
        }
      });

      await page.waitForNavigation({ waitUntil: "networkidle0" });
      const currentURL = page.url();

      if (isValidURL(currentURL)) {
        u_valid = true;
        console.log("Found a valid URL:", currentURL);
      } else {
        console.log("Current URL is not valid. Trying the next URL...");
        attempts++;
      }
    }

    if (u_valid) {
      // Take a screenshot of the current page
      await page.screenshot({ path: screenshotPath });
      console.log(
        `Screenshot saved: ${screenshotPath}. It will be deleted after 2 hours.`
      );

      // Set a timer to delete the screenshot after 2 hours
      setTimeout(() => {
        if (fs.existsSync(screenshotPath)) {
          fs.unlink(screenshotPath, (err) => {
            if (err) {
              console.error(
                `Error deleting screenshot: ${screenshotPath}`,
                err
              );
            } else {
              console.log(`Screenshot deleted: ${screenshotPath}`);
            }
          });
        }
      }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds

      res.status(200).send({ path: id });
    } else {
      res.status(404).send("No valid URL found after multiple attempts.");
    }

    await browser.close();
  } catch (error) {
    console.error("Error searching and visiting first result:", error);
    res.status(500).send("Error searching and visiting first result");
  }
};

module.exports = { screenshot };
