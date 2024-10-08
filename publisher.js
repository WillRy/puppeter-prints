const puppeteer = require("puppeteer");
class Publisher {
  constructor() {
    this.terminateAll = false;

    this.payloads = [];
    const baseUrl = "https://google.com.br";
    for (let index = 0; index < 50; index++) {
      this.payloads.push(baseUrl);
      
    }

    this.chunkSize = 3;

    this.chunks = [];

    this.workers = [];

    this.configurarGracefulShutdown();
    
    this.identificadorColetaAtual = 777;
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
          const completePathToSave = __dirname + `/prints/${date.toISOString()}.png`;
          this.ssr(url, `${completePathToSave}`)
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
    }

    await this.browser.close();
  }

  async startBrowser() {
    this.browser = await puppeteer.launch({
      args: [
        `--print=${this.identificadorColetaAtual}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-logging',
        '--disable-dev-shm-usage',
        '--disable-session-crashed-bubble',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--noerrdialogs',
        '--disable-gpu',
        '--disable-cache',
        '--disk-cache-size=0',
        '--disable-application-cache',
        '--silent',
      ],
    });
  }

  async ssr(url, nomePrint = "print.png") {
    let page = null;
    try {
      console.log(`Coleta iniciada: ${url}`);
      let page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(url, { waitUntil: "networkidle0" });
      await page.screenshot({ path: nomePrint, fullPage: true });

      console.log(`Coleta realizada: ${url}`);
    } catch (err) {
      throw new Error(`Exception: ${err.message}`);
    } finally {
      if(page) {
        await page.close();
      }
    }
  }

  matarProcessosPorPametroDeIdentificador() {
    const identificadorParaMatar = `--print=${this.identificadorColetaAtual}`;

    const exec = require("child_process").exec;
    
    exec(`ps aux | grep "${identificadorParaMatar}" | awk '{print $2}' | xargs kill -9`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
  }

  async gracefulShutdown() {
    this.matarProcessosPorPametroDeIdentificador();
  }
}

const publisher = new Publisher();
publisher.processar();
