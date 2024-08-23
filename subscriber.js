const { Worker, isMainThread, parentPort } = require("worker_threads");
const puppeteer = require("puppeteer");

class Subscriber {
  constructor() {
    this.browser = null;

  }

  listen() {
    parentPort.once("message", (message) => {
      if (message === "shutdown") {
        console.log("Worker received shutdown signal.");
        process.exit(0);
      }

      const { url, workerId } = message;
      console.log(`Recebido coleta: ${url}`);

      new Promise((resolve, reject) => {
        setTimeout(() => {
          this.ssr(url, workerId)
            .then(() => {
              parentPort.postMessage({ success: true, url, workerId });
            })
            .catch((e) => {
              parentPort.postMessage({
                success: false,
                url,
                workerId,
                error: e.message,
              });
            });

          resolve();
        }, 1000);
      });
    });
  }

  async ssr(url, nomePrint = "print.png") {
    this.browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await this.browser.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle0" });
      await page.screenshot({ path: nomePrint, fullPage: true });
    } catch (err) {
      throw new Error("page.goto/waitForSelector timed out.");
    } finally {
      await this.browser.close();
    }
  }
}

const subscriber = new Subscriber();
subscriber.listen();