const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

const timeout = 30000;



function isValidURL(str) {
  if(/^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g.test(str)) {
    // if(str.includes("youtube"))return false;
       console.log('YES');
       return true;
   } else {
       console.log('NO');
       return false;
   }
}

const screenshot = async (url) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      // headless: "shell",
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 1200,
      deviceScaleFactor: 1,
    });

    let u_valid = false;
    let i = 1;


    while(!u_valid && i<5){

    await page.goto(
      url,
      {
        waitUntil: "networkidle0",
        // timeout: timeout,
      }
    );

    console.log("Marked Page URL : " , page.url());

    // Click on the first non-Google search result link
    const l = await page.evaluate((i) => {
      const firstResult = document.querySelector(
        `div[id="search"] a[href^="http"]:not([href*="google"]):nth-child(${i})`
      );
      if (firstResult) {
        firstResult.click();
        return firstResult.innerText;
      }
    } , i);

    console.log("UU : " , JSON.stringify(l));

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
      path: `${path.join(__dirname , "test.jpg")}`,
      fullPage: true,
    });

    await browser.close();
  } catch (error) {
    console.error("Error searching and visiting first result:", error);
  }
};

// screenshot("https://www.google.com/search?q=Latest%20news%20and%20results%20of%20Indian%20Election");
screenshot("https://www.google.com/search?q=latest%20news%20on%20Indian%20elections");


module.exports = { screenshot };
