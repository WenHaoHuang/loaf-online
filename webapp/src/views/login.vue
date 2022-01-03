<template>
  <article class="login">
    <section class="box-login">
      <div class="login--tbody">
        <el-form ref="elform" :model="formData" :rules="rules">
          <el-form-item prop="userName">
            <el-input
              v-model="formData.userName"
              :prefix-icon="User"
              type="text"
              clearable
              autocomplete="off"
              placeholder="账号"
            />
          </el-form-item>
          <el-form-item prop="userPwd">
            <el-input
              v-model="formData.userPwd"
              :prefix-icon="Lock"
              type="password"
              clearable
              autocomplete="off"
              placeholder="密码"
            />
          </el-form-item>
        </el-form>
      </div>
      <div class="login--footer">
        <el-button type="primary" class="btn-submit" :loading="loading" @click="submitFn">登录</el-button>
      </div>
    </section>
  </article>
</template>
<script lang="ts">
import {
  defineComponent,
  ref,
  reactive,
  unref,
  onBeforeMount
} from 'vue'
import { Lock, User } from '@element-plus/icons-vue'
import { websock } from '@/axios/socket'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default defineComponent({
  name: 'PageLogin',
  setup() {
    const store = useStore()
    const router = useRouter()

    const loading = ref(false)
    const formData = reactive({ userName: '', userPwd: '' })
    const rules = reactive({
      userName: [{ required: true, message: '账号必须填写' }],
      userPwd: [{ required: true, message: '密码必须填写' }]
    })
    const elform = ref()
    // 初始化
    const initSocket = () => {
      // websock.close()
      // websock.connect()
    }
    onBeforeMount(initSocket)

    const sendForm = async () => {
      const params = {
        userLogin: formData.userName,
        password: formData.userPwd
      }
      websock.emit('login', params);
      websock.on('login', (data) => {
        const { code, accessToken, userId, userName, msg } = data
        if (code === 0) {
          const userInfo = { accessToken, userId, userName }
          store.dispatch('setUserInfo', userInfo)
          if (msg) {
            ElMessage.warning(msg)
          }
          router.push({ name: 'Home' })
        } else {
            ElMessage.warning(msg)
        }
      })
    }

    const submitFn = () => {
      const form = unref(elform)
      if (!form) { return }
      // eslint-disable-next-line
      form.validate((valid: any) => {
        if (valid) {
          sendForm()
        }
      })
    }

    return {
      Lock,
      User,
      loading,
      formData,
      rules,
      elform,
      submitFn
    }
  }
})
</script>
