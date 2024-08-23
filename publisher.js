const { Worker, isMainThread, parentPort } = require("worker_threads");

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
    for (let i = 0; i < this.payloads.length; i += this.chunkSize) {
      this.chunks.push(this.payloads.slice(i, i + this.chunkSize));
    }

    for (let chunk of this.chunks) {
      if (this.terminateAll) {
        break;
      }

      const promises = chunk.map(async (url) => {
        const worker = new Worker("./subscriber.js");
        this.workers.push(worker);
        return new Promise((resolve, reject) => {
          worker.once("message", (message) => {
            if (message.success) {
              console.log(`Finalizou: ${message.url}`);
              return resolve(message);
            }

            console.error(`Erro ao processar o worker: ${message.error}`);
            resolve();
          });
          worker.on("error", () => {
            console.error(`Erro no worker:`);
            reject();
          });

          console.log(
            `Iniciando worker de ID ${worker.threadId} e enviando o payload "${url}"`
          );
          worker.postMessage({
            url: url,
            workerId: `./prints/${worker.threadId}.png`,
          });
        });
      });

      await Promise.all(promises);
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
