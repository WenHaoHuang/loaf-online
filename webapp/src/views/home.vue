<template>
  <article class="page-app">
    <aside class="app-aside">
      <div class="app-aside--avatar" @click="editUser">
        <img src="/src/assets/zcool.jpg" />
      </div>
      <div class="app-aside--name">{{ userInfo.userName }}</div>
    </aside>
    <section class="app-group-list">
      <div class="app-group-list--item is-active">
        <span class="app-group-list--icon">
          <img src="/src/assets/huanggua.webp" />
        </span>
        <div class="app-group-list--content">
          <div class="app-group-list--header">
            <span class="app-group-list--title">FN收容所</span>
            <span class="app-group-list--time">2022-01-01</span>
          </div>
          <div class="app-group-list--desc">{{ lastMsg.userName }}: {{ lastMsg.msg }}</div>
        </div>
      </div>
    </section>
    <section class="app-main">
      <section class="app-main--chat" v-scroll>
        <div
          class="app-main--chat-item"
          :class="{ 'is-ower': chat.userId === userInfo.userId }"
          v-for="chat in msgList"
          :key="chat.id"
        >
          <div class="app-main--chat-title">{{ chat.userName }} {{ chat.createTime }}</div>
          <div class="app-main--chat-content">{{ chat.msg }}</div>
        </div>
      </section>
      <section class="app-main--chat-input">
        <el-input type="textarea" v-model="chatMsg" @keyup.enter="sendMsg" />
      </section>
    </section>
    <section class="app-member">
      <div class="app-member--title">群成员[{{ userList.length }}]</div>
      <div
        class="app-member--item"
        v-for="user in userList"
        :key="user.userId"
      >{{ user.userName }}{{ user.online === 0 ? ' - 离线' : '' }}</div>
    </section>
    <teleport to="body">
      <transition name="dialog-fade">
        <div class="dialog-overlay" v-show="visibleDialog">
          <div class="dialog-main">
            <div class="form-item">
              <el-input v-model="editInfo.userId" disabled />
            </div>
            <div class="form-item">
              <el-input v-model="editInfo.userName" placeholder="请输入昵称" />
            </div>
            <div class="form-item">
              <el-input v-model="editInfo.oldPwd" placeholder="请输入原密码" />
            </div>
            <div class="form-item">
              <el-input v-model="editInfo.newPwd" placeholder="请输入新密码" />
            </div>
            <div class="form-item">
              <el-button type="primary" @click="submit">确认</el-button>
              <el-button @click="cancel">取消</el-button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </article>
</template>
<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { websock } from '@/axios/socket'
import CryptoJS from 'crypto-js'

type UserListItem = {
  userId: number
  userName: string
  online: number
  oldPwd?: string
  newPwd?: string
}

type MsgListItem = {
  id: number
  userId: number
  userName: string
  msg: string
  createTime: number | string
}

export default defineComponent({
  name: 'PageHome',
  directives: {
    scroll: {
      mounted(el) {
        el.scrollTop = el.scrollHeight;
      },
      updated(el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const chatMsg = ref<string>('')
    const userInfo = computed(() => store.getters.userInfo)
    const userList = ref<UserListItem[]>([])
    const msgList = ref<MsgListItem[]>([])
    // 数据加解密方法
    const key = CryptoJS.enc.Utf8.parse("1234123412ABCDEF");  //十六位十六进制数作为密钥
    const iv = CryptoJS.enc.Utf8.parse('ABCDEF1234123412');   //十六位十六进制数作为密钥偏移量
    //解密方法
    function Decrypt(word: string) {
        const encryptedHexStr = CryptoJS.enc.Hex.parse(word);
        const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        const decrypt = CryptoJS.AES.decrypt(srcs, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
        return decryptedStr.toString();
    }
    //加密方法
    function Encrypt(word: string) {
        const srcs = CryptoJS.enc.Utf8.parse(word);
        const encrypted = CryptoJS.AES.encrypt(srcs, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        return encrypted.ciphertext.toString().toUpperCase();
    }

    const queryUserList = () => {
      websock.emit('userList')
      websock.emit('msgList')
      websock.on('userList', (data) => {
        userList.value = data
      });
      websock.on('msgList', data => {
        const list: Array<MsgListItem> = []
        data.forEach((v: MsgListItem) => {
          v.msg = Decrypt(v.msg)
          v.createTime = format(v.createTime as number)
          list.push(v)
        })
        msgList.value = list
      })
      websock.on('userChange', data => {
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
      websock.on('sendMsg', data => {
        const { id, userId } = data
        if (!msgList.value.some(v => v.id === id)) {
          const { userName = '' } = userList.value.find(v => v.userId = userId) || {}
          data.userName = userName
          // 对数据进行解密
          data.msg = Decrypt(data.msg)
          data.createTime = format(data.createTime)
          console.log('数据解密', data.id, data.msg)
          msgList.value.push(data);
        }
      });
      // 登录异常，需要重新登录
      websock.on('logout', () => {
        router.push({ name: 'Login' })
      })
    }
    onBeforeMount(queryUserList)
    // 退出
    const logout = () => {
      websock.emit('logout')
    }
    onBeforeUnmount(logout)
    // 发送消息
    const sendMsg = () => {
      const msg = Encrypt(chatMsg.value)
      websock.emit('sendMsg', {
        msg
      });
      chatMsg.value = ''
    }
    // 获取最近一条消息
    const lastMsg = computed(() => msgList.value.slice(-1)?.[0] ?? [])
    // 格式化时间
    const format = (timestamp: number | Date, fmt: string = 'yyyy/MM/dd hh:mm:ss') => {
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
        's+': timestamp.getSeconds()
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
    // 编辑用户信息
    const visibleDialog = ref(false);
    const editInfo = ref<UserListItem>({ userId: 0, userName: '', online: 1 })
    const editUser = () => {
      editInfo.value = { ...userInfo.value, oldPwd: '', newPwd: '' };
      visibleDialog.value = true;
    }
    const submit = () => {
      websock.emit('edit', { ...editInfo.value });
      visibleDialog.value = false;
    }
    const cancel = () => {
      editInfo.value = { userId: 0, userName: '', online: 1 }
      visibleDialog.value = false;
    }

    return {
      chatMsg,
      userInfo,
      userList,
      msgList,
      lastMsg,
      visibleDialog,
      editInfo,
      sendMsg,
      editUser,
      submit,
      cancel
    }
  }
})
</script>
