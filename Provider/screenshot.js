const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

const timeout = 30000;

function isValidURL(str) {
  if (
    /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g.test(
      str
    )
  ) {
    // if(str.includes("youtube"))return false;
    console.log("YES");
    return true;
  } else {
    console.log("NO");
    return false;
  }
}

const screenshot = async (req, res) => {
  const { query, id } = req.body; // Assuming the search query is sent in the request body

  console.log("Query on backend : ", query, "ID : ", id);

  if (fs.existsSync(path.join(__dirname, "..", "screenshots", `${id}.jpg`))) {
    fs.unlinkSync(path.join(__dirname, "..", "screenshots", `${id}.jpg`));
  }

  try {
    // const browser = await puppeteer.launch({
    //   headless: true,
    //   // headless: "shell",
    //   executablePath:
    //     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    //   // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // });

    const browser = await puppeteer.launch({
      headless: true, // Render environment does not have a GUI
      args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Reduce the size of shared memory, useful on cloud providers
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined // Use Puppeteer bundled executable path
  });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 1200,
      deviceScaleFactor: 1,
    });

    console.log(
      "Maked Url : ",
      `https://www.google.com/search?q=${encodeURIComponent(query)}`
    );

    let u_valid = false;
    let i = 1;

    while (!u_valid && i < 5) {
      await page.goto(
        `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        {
          waitUntil: "networkidle0",
          // timeout: timeout,
        }
      );

      console.log("Marked Page URL : ", page.url());

      // Click on the first non-Google search result link
      await page.evaluate((i) => {
        const firstResult = document.querySelector(
          `div[id="search"] a[href^="http"]:not([href*="google"]):nth-child(${i})`
        );
        if (firstResult) {
          firstResult.click();
        }
      }, i);

      await page.waitForNavigation({ waitUntil: "networkidle0" });
      i++;

      const currentURL = page.url();
      if (isValidURL(currentURL)) {
        u_valid = true;
        console.log("Found a valid URL:", currentURL);
      } else {
        console.log("Current URL is not valid. Trying the next URL...");
        // You can implement your logic to fetch the next URL from search results here
      }
    }

    // Take a screenshot of the current page
    await page.screenshot({
      path: `./Screenshots/${id}.jpg`,
      // fullPage: true,
    });

    await browser.close();

    res.status(200).send({ path: id });

    const screenshotPath = path.join(__dirname, "Screenshots", `${id}.jpg`);

    console.log(
      `Screenshot saved: ${screenshotPath}. It will be deleted after 2 hours.`
    );

    setTimeout(() => {
      fs.unlink(screenshotPath, (err) => {
        if (err) {
          console.error(`Error deleting screenshot: ${screenshotPath}`, err);
        } else {
          console.log(`Screenshot deleted: ${screenshotPath}`);
        }
      });
    }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds
    return;
  } catch (error) {
    console.error("Error searching and visiting first result:", error);
    res.status(500).send("Error searching and visiting first result");
  }
};

module.exports = { screenshot };
