const { Worker, isMainThread, parentPort } = require("worker_threads");
const puppeteer = require("puppeteer");
class Publisher {
  constructor() {
    this.terminateAll = false;

    this.payloads = [
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
      "https://google.com.br",
    ];

    this.chunkSize = 3;
    this.chunks = [];

    this.workers = [];

    this.configurarGracefulShutdown();
  }

  configurarGracefulShutdown() {
    process.on("SIGINT", async () => {
      this.terminateAll = true;
      console.log("SIGINT received, shutting down gracefully...");
      await this.gracefulShutdown();

      console.log("All workers have been shut down.");
      process.exit(0);
    });
  }

  async processar() {
    await this.startBrowser();

    for (let i = 0; i < this.payloads.length; i += this.chunkSize) {
      this.chunks.push(this.payloads.slice(i, i + this.chunkSize));
    }

    for (let chunk of this.chunks) {
      if (this.terminateAll) {
        break;
      }

      const promises = chunk.map(async (url, index) => {
        return new Promise((resolve, reject) => {
          this.ssr(url, `./prints/${index}.png`).then((retorno) => {
            resolve(retorno);
          }).catch((e) => {
            console.log(e)
            resolve(e);
          });
        });
      });

      await Promise.all(promises);
    }

    await this.browser.close();
  }

  async startBrowser() {
    this.browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  async ssr(url, nomePrint = "print.png") {
    try {
      console.log(`Coleta iniciada: ${url}`);
      const page = await this.browser.newPage();

      await page.goto(url, { waitUntil: "networkidle0" });
      await page.screenshot({ path: nomePrint, fullPage: true });

      console.log(`Coleta realizada: ${url}`);
    } catch (err) {
      throw new Error(`Exception: ${err.message}`);
    }
  }

  gracefulShutdown() {
    return Promise.all(
      this.workers.map((worker) => {
        return new Promise((resolve) => {
          worker.postMessage("shutdown");
          worker.once("exit", (code) => {
            console.log(`Worker exited with code`);
            resolve();
          });
        });
      })
    );
  }
}

const publisher = new Publisher();
publisher.processar();
