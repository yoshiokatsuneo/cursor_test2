import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { activities, candidates, clients, jobs, pipelineStages, tasks } from "../src/data.js";

function clone(value) {
  return structuredClone(value);
}

export function createSeedDatabase() {
  return {
    stages: clone(pipelineStages),
    clients: clone(clients),
    jobs: clone(jobs),
    candidates: clone(candidates),
    activities: clone(activities),
    tasks: clone(tasks)
  };
}

export class JsonDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) {
      return;
    }

    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      await this.reset();
    }

    this.initialized = true;
  }

  async read() {
    await this.init();
    const raw = await readFile(this.filePath, "utf8");
    return JSON.parse(raw);
  }

  async write(data) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.filePath);
    this.initialized = true;
  }

  async update(mutator) {
    const current = await this.read();
    const next = await mutator(current);
    await this.write(next);
    return next;
  }

  async reset() {
    const seed = createSeedDatabase();
    await this.write(seed);
    return seed;
  }
}
