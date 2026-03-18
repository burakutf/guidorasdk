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

  getBuilderSessionToken() {
    invariantBrowser();
    return (
      window.sessionStorage.getItem(this.buildKey("builder-session-token")) ??
      ""
    );
  }

  setBuilderSessionToken(sessionToken: string) {
    invariantBrowser();
    window.sessionStorage.setItem(
      this.buildKey("builder-session-token"),
      sessionToken,
    );
  }

  clearBuilderSessionToken() {
    invariantBrowser();
    window.sessionStorage.removeItem(this.buildKey("builder-session-token"));
  }

  private buildKey(key: string) {
    return `${this.storagePrefix}:${key}`;
  }

  private getOrCreate(storage: Storage, key: string) {
    const fullKey = this.buildKey(key);
    const existingValue = storage.getItem(fullKey);
    if (existingValue) {
      return existingValue;
    }

    const nextValue = generateId();
    storage.setItem(fullKey, nextValue);
    return nextValue;
  }
}
