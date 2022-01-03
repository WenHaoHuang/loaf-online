import { createStore } from 'vuex'

type UserInfo = {
  accessToken?: string
  userId?: string
  userName?: string
  orgId?: string
}

export default createStore({
  state: {
    userInfo: <UserInfo | null>null
  },
  getters: {
    userInfo: (state) => {
      let userInfo = state.userInfo
      if (!userInfo) {
        const data = localStorage.getItem('userInfo') ?? '{}'
        try {
          userInfo = JSON.parse(data) || {}
        } catch (err) {
          userInfo = {}
        }
      }
      state.userInfo = userInfo
      return userInfo
    }
  },
  mutations: {
    SET_USER_INFO(state, data) {
      state.userInfo = data
    }
  },
  actions: {
    setUserInfo({ commit }, data) {
      if (data) {
        localStorage.setItem('userInfo', JSON.stringify(data))
      } else {
        localStorage.removeItem('userInfo')
      }
      commit('SET_USER_INFO', data)
    }
  },
  modules: {
  }
})
