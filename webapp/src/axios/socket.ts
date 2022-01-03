import io from 'socket.io-client'

import type { App } from 'vue'

export const websock = io("ws://127.0.0.1:3000", { forceNew: true });

const SOCKET = {
  install: (app: App) => {
    app.config.globalProperties.$websock = websock
  }
}

export default SOCKET
