<template>
  <article class="wrapper-login">
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
} from 'vue'
import { Lock, User } from '@element-plus/icons-vue'

export default defineComponent({
  name: 'PageLogin',
  setup(props, context) {

    const loading = ref(false)
    const formData = reactive({ userName: '18073766', userPwd: '123456' })
    const rules = reactive({
      userName: [{ required: true, message: '账号必须填写' }],
      userPwd: [{ required: true, message: '密码必须填写' }]
    })
    const elform = ref()

    const sendForm = async () => {
      const params = {
        userLogin: formData.userName,
        password: formData.userPwd
      }
      context.emit('submit', params)
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
