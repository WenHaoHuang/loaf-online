export type loginParams = {
  userLogin: string
  password: string
}
export type UserInfo = {
  accessToken: string
  userId: number | string
  userName: string
}
export type ResLogin = UserInfo & {
  code: number
  msg: string
}

export type UserListItem = {
  userId: number | string
  userName: string
  online?: number
  oldPwd?: string
  newPwd?: string
}

export type MsgListItem = {
  id: number
  userId: number | string
  userName: string
  msg: string
  createTime: number | string
}
