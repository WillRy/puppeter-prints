const { Worker, isMainThread, parentPort } = require("worker_threads");
const puppeteer = require("puppeteer");
class Publisher {
  constructor() {
    this.terminateAll = false;

    this.payloads = [];
    const baseUrl = "https://google.com.br";
    for (let index = 0; index < 50; index++) {
      this.payloads.push(baseUrl);
      
    }


    this.chunkSize = 1;
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
        const date = new Date();
        return new Promise((resolve, reject) => {
          this.ssr(url, `./prints/${date.toISOString()}.png`)
            .then((retorno) => {
              resolve(retorno);
            })
            .catch((e) => {
              console.log(e);
              resolve(e);
            });
        });
      });

      await Promise.all(promises);

      // await new Promise((resolve, reject) => {
      //   setTimeout(() => {
      //     resolve();
      //   }, 2500)
      // });
    }

    await this.browser.close();
  }

  async startBrowser() {
    this.browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-session-crashed-bubble',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--noerrdialogs',
        '--disable-gpu'
      ],
    });
  }

  async ssr(url, nomePrint = "print.png") {
    try {
      console.log(`Coleta iniciada: ${url}`);
      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

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
