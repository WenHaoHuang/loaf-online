import { Manager } from 'socket.io-client'

const serverAddress = 'http://localhost:3000'

export const websock = new Manager(serverAddress, {
  forceNew: true,
  reconnection: false,
});
