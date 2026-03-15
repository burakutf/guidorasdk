import { generateId, invariantBrowser } from "./utils";

export class GuidoraStorage {
  private readonly storagePrefix: string;

  constructor(storagePrefix = "guidora") {
    this.storagePrefix = storagePrefix;
  }

  getAnonymousId() {
    invariantBrowser();
    return this.getOrCreate(window.localStorage, "anonymous-id");
  }

  getSessionKey() {
    invariantBrowser();
    return this.getOrCreate(window.sessionStorage, "session-key");
  }

  private getOrCreate(storage: Storage, key: string) {
    const fullKey = `${this.storagePrefix}:${key}`;
    const existingValue = storage.getItem(fullKey);
    if (existingValue) {
      return existingValue;
    }

    const nextValue = generateId();
    storage.setItem(fullKey, nextValue);
    return nextValue;
  }
}