export default class SocketService {
// 单例
  static instance = null

  // 类相当于实例的原型， 所有在类中定义的方法， 都会被实例继承。 如果在一个方法前， 加上static关键字， 就表示该方法不会被实例继承， 而是直接通过类来调用， 这就称为“ 静态方法”。
  static get Instance () {
    if (!this.instance) {
      this.instance = new SocketService()
    }
    return this.instance
  }

  // 和服务器连接的socket对象
  ws = null
  // 存储回调函数
  callBackMapping = {}
  // 用来表示是否已经连接成功
  connected = false
  // 用于记录重试的次数
  sendRetryCount = 0

  // 重新连接服务器的次数
  connectRetryCount = 0

  //  定义连接服务器的方法
  connect () {
    if (!window.WebSocket) {
      return console.log('您的浏览器不支持webSocket')
    }
    this.ws = new WebSocket('ws://localhost:9998')
    //  连接成功的事件
    this.ws.onopen = () => {
      console.log('连接服务端成功')
      // console.log(this)
      this.connected = true
    }
    this.ws.onclose = () => {
      console.log('连接服务端失败')
      this.connected = false
      this.connectRetryCount++
      // 定时器×重试次数是为了防止服务端有问题而频发重试消耗性能
      setTimeout(() => {
        this.connect()
      }, 500 * this.connectRetryCount)
    }
    //  获取数据的事件
    this.ws.onmessage = msg => {
      console.log('从服务端获取到了数据')
      const recvData = JSON.parse(msg.data)
      const socketType = recvData.socketType
      //  判断回调函数是否存在
      if (this.callBackMapping[socketType]) {
        const action = recvData.action
        if (action === 'getData') {
          const realData = JSON.parse(recvData.data)
          this.callBackMapping[socketType].call(this, realData)
        } else if (action === 'fullScreen') {
          this.callBackMapping[socketType].call(this, recvData)
        } else if (action === 'themeChange') {
          this.callBackMapping[socketType].call(this, recvData)
        }
      }
    }
  }

  // 回调函数的注册
  registerCallBack (socketType, callBack) {
    this.callBackMapping[socketType] = callBack
  }

  // 取消回调函数
  unRegisterCallBack (socketType) {
    this.callBackMapping[socketType] = null
  }

  //  发送数据
  // 注意必须判断，如果websocket还没有连接成功就发起send就会报错
  send (data) {
    if (this.connected) {
      this.sendRetryCount = 0
      this.ws.send(JSON.stringify((data)))
    } else {
      this.sendRetryCount++
      // 定时器的作用是当没有连接成功时冲洗发起连接
      setTimeout(() => {
        this.send(data)
      }, 500 * this.sendRetryCount)
    }
  }
}
