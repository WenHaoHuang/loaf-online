import { io } from 'socket.io-client'

import type { App } from 'vue'

const serverAddress = 'http://localhost:3000'

export const websock = io(serverAddress, {
  forceNew: true,
  reconnection: false,
});

const SOCKET = {
  install: (app: App) => {
    app.config.globalProperties.$websock = websock
  }
}

export default SOCKET
