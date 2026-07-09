import { EventEmitter } from 'events';

declare global {
  var chatEmitter: EventEmitter | undefined;
}

if (!globalThis.chatEmitter) {
  globalThis.chatEmitter = new EventEmitter();
  globalThis.chatEmitter.setMaxListeners(100);
}

export const chatEmitter = globalThis.chatEmitter;
