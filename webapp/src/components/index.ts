import {
  computed,
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  ref,
} from 'vue'
import { websock } from '../axios/socket'
import { ElMessage } from 'element-plus'
import DialogLogin from './login.vue'

import CryptoJS from 'crypto-js'
// 数据加解密方法
const key = CryptoJS.enc.Utf8.parse('1234123412ABCDEF') //十六位十六进制数作为密钥
const iv = CryptoJS.enc.Utf8.parse('ABCDEF1234123412') //十六位十六进制数作为密钥偏移量
//解密方法
function Decrypt(word: string) {
  const encryptedHexStr = CryptoJS.enc.Hex.parse(word)
  const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr)
  const decrypt = CryptoJS.AES.decrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8)
  return decryptedStr.toString()
}
//加密方法
function Encrypt(word: string) {
  const srcs = CryptoJS.enc.Utf8.parse(word)
  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.ciphertext.toString().toUpperCase()
}

// 格式化时间
const format = (
  timestamp: number | Date,
  fmt: string = 'yyyy/MM/dd hh:mm:ss'
) => {
  timestamp = new Date(timestamp)
  if (/(y+)/.test(fmt)) {
    const [, $1] = fmt.match(/(y+)/) || []
    fmt = fmt.replace($1, (timestamp.getFullYear() + '').slice(4 - $1.length))
  }
  type Otype = {
    [index: string]: number
  }
  const o: Otype = {
    'M+': timestamp.getMonth() + 1,
    'd+': timestamp.getDate(),
    '[H|h]+': timestamp.getHours(),
    'm+': timestamp.getMinutes(),
    's+': timestamp.getSeconds(),
  }
  for (const k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      const str = `${o[k]}`
      const [, $1] = fmt.match(`(${k})`) || []
      fmt = fmt.replace($1, `${'00' + str}`.slice(str.length))
    }
  }
  return fmt
}

import type {
  loginParams,
  ResLogin,
  UserInfo,
  UserListItem,
  MsgListItem,
} from './type'

export default defineComponent({
  name: 'PageHome',
  components: {
    DialogLogin,
  },
  directives: {
    scroll: {
      mounted(el) {
        el.scrollTop = el.scrollHeight
      },
      updated(el) {
        el.scrollTop = el.scrollHeight
      },
    },
  },
  setup() {
    // 是否未登录
    const isLogout = ref(true)
    const userList = ref<UserListItem[]>([])
    const msgList = ref<MsgListItem[]>([])
    const chatMsg = ref<string>('')
    // 获取列表信息
    const queryList = () => {
      socket.emit('userList')
      socket.emit('msgList')
    }
    // 当前用户信息
    const userInfo = ref<UserInfo>({
      accessToken: '',
      userId: '',
      userName: '',
    })
    // 挂载前进行登录处理
    let socket: any = ''
    const initPage = () => {
      // 初始化socket连接
      socket = websock.socket('/chat')
      // 响应登录信息
      socket.on(
        'login',
        ({ code, accessToken, userId, userName, msg }: ResLogin) => {
          if (code === 0) {
            userInfo.value = { accessToken, userId, userName }
            if (msg) {
              ElMessage.warning(msg)
            }
            isLogout.value = false
            // 初始化页面信息
            queryList()
          } else {
            ElMessage.warning(msg)
          }
        }
      )
      socket.on('userList', (data: UserListItem[]) => {
        userList.value = data
      })
      socket.on('msgList', (data: MsgListItem[]) => {
        const list: Array<MsgListItem> = []
        data.forEach((v: MsgListItem) => {
          v.msg = Decrypt(v.msg)
          v.createTime = format(v.createTime as number)
          list.push(v)
        })
        msgList.value = list
      })
      
      socket.on('userChange', (data: UserListItem) => {
        const member = userList.value.find(v => v.userId === data.userId);
        if (member) {
          // 更新用户信息
          Object.assign(member, data);
        } else {
          userList.value.push(data);
        }
        // 如果是本人，修改本人信息
        if (data.userName && userInfo.value.userId === data.userId) {
          userInfo.value.userName = data.userName;
        }
      });
      socket.on('sendMsg', (data: MsgListItem) => {
        if (data.userName) { return }
        const { id, userId } = data
        if (!msgList.value.some(v => v.id === id)) {
          const { userName = '' } = userList.value.find(v => v.userId === userId) || {}
          data.userName = userName
          // 对数据进行解密
          data.msg = Decrypt(data.msg)
          data.createTime = format(data.createTime as number)
          msgList.value.push(data);
        }
      });
      // 登录异常，需要重新登录
      socket.on('logout', () => {
        isLogout.value = true
      })
    }
    onBeforeMount(initPage)
    // 登录提交
    const login = (params: loginParams) => {
      socket.emit('login', params)
    }
    // 获取最近一条消息
    const lastMsg = computed(() => msgList.value.slice(-1)?.[0] ?? [])
    // 编辑用户信息
    const visibleDialog = ref(false);
    const editInfo = ref<UserListItem>({ userId: 0, userName: '', online: 1 })
    const editUser = () => {
      editInfo.value = { ...userInfo.value, oldPwd: '', newPwd: '' };
      visibleDialog.value = true;
    }
    const submit = () => {
      socket.emit('edit', { ...editInfo.value });
      visibleDialog.value = false;
    }
    const cancel = () => {
      editInfo.value = { userId: 0, userName: '', online: 1 }
      visibleDialog.value = false;
    }
    // 退出
    const logout = () => {
      socket.emit('logout')
    }
    onBeforeUnmount(logout)
    // 发送消息
    const sendMsg = () => {
      const msg = Encrypt(chatMsg.value)
      socket.emit('sendMsg', {
        msg
      });
      chatMsg.value = ''
    }

    // return
    return {
      chatMsg,
      isLogout,
      userInfo,
      lastMsg,
      userList,
      msgList,
      editInfo,
      visibleDialog,
      sendMsg,
      login,
      editUser,
      submit,
      cancel
    }
  },
})
