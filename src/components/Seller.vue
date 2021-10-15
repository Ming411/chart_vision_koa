<!--商家销量得横向统计图-->
<template>
  <div class="com-container">
    <div class="com-chart" ref="seller_ref"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Seller',
  data () {
    return {
      chartInstance: null,
      allData: null, // 服务器返回的数据
      currentPage: 1, // 当前显示的页数
      totalPage: 0, // 一共多少页
      timerId: null // 定时器ID
    }
  },
  computed: {
    ...mapState(['theme'])
  },
  watch: {
    theme () {
      this.chartInstance.dispose()
      this.initChart()
      this.screenAdapter()
      this.updateChart()
    }
  },
  created () {
    this.$socket.registerCallBack('sellerData', this.getData)
  },
  mounted () {
    // 真实DOM挂载
    this.initChart()
    // 发送数据给服务器
    this.$socket.send({
      action: 'getData',
      socketType: 'sellerData',
      chartName: 'seller',
      value: ''
    })
    window.addEventListener('resize', this.screenAdapter)
    // 这里调用一次是为了页面一开始加载就进行自适应适配
    this.screenAdapter()
  },
  destroyed () {
    // 切记当退出当前组件时必须将定时器进行销毁，不然消耗性能
    clearInterval(this.timerId)
    window.removeEventListener('resize', this.screenAdapter)
  },
  methods: {
    // 初始化echartsInstance对象
    initChart () {
      // 第二个参数是自定义的主题
      this.chartInstance = this.$echarts.init(this.$refs.seller_ref, this.theme)
      // 将数据进行拆分
      const initOption = {
        title: {
          text: '| 商家销售统计',

          left: 20,
          top: 20
        },
        grid: {
          top: '20%',
          left: '3%',
          right: '6%',
          bottom: '3%',
          containLabel: true // 是否包含边框
        },
        tooltip: {
          // 设置鼠标经过时的提示样式
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            z: 0,
            lineStyle: {

              color: '#2D3443'

            }
          }
        },
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'category'
        },
        series: [{
          type: 'bar',
          // 设置柱状体的文字提示
          label: {
            show: true,
            position: 'right',
            textStyle: {
              color: 'white'
            }
          },
          itemStyle: {
            // 设置项目每一项的样式
            // 指明颜色渐变的方向
            // 指明不同比分比之下的颜色值
            color: new this.$echarts.graphic.LinearGradient(0, 0, 1, 0, [
              // 0010 表示渐变是从（0，0）到（1，0），几把横向渐变
              {
                offset: 0,
                color: '#5052EE'
              },
              {
                offset: 1,
                color: '#AB6EE5'
              }
            ])

          }
        }]
      }
      this.chartInstance.setOption(initOption)
      //  当鼠标经过该图表清空定时器
      this.chartInstance.on('mouseover', () => {
        clearInterval(this.timerId)
      })
      // 移开重新开启定时器
      this.chartInstance.on('mouseout', () => {
        this.startInterval()
      })
    },
    // 获取服务器得数据
    getData (data) {
      // const { data } = await this.$http.get('seller')
      this.allData = data.sort((a, b) => {
        return a.value - b.value // 从小到大升序排序
      })
      // 每五个元素显示一页
      this.totalPage = this.allData.length % 5 === 0 ? this.allData.length / 5 : this.allData.length / 5 + 1
      this.updateChart()
      // 开启自动切换当前页
      this.startInterval()
    },
    //  更新图表
    updateChart () {
      const start = (this.currentPage - 1) * 5 // 设置开始截取位置
      const end = this.currentPage * 5 // 截取结束位置
      const showData = this.allData.slice(start, end)
      // 获取商家名
      const sellerNames = showData.map(item => {
        return item.name
      })
      // 通过遍历 返回各项的值（数组）
      const sellerValue = showData.map(item => {
        return item.value
      })
      const option = {
        yAxis: {
          data:
          sellerNames
        },
        series: [{
          data:
          sellerValue
        }]
      }
      this.chartInstance.setOption(option)
    },
    // 开启定时器的方法
    startInterval () {
      if (this.timerId) {
        clearInterval(this.timerId)
      }
      this.timerId = setInterval(() => {
        this.currentPage++
        // console.log(this.currentPage)
        if (this.currentPage > this.totalPage) {
          this.currentPage = 1
        }
        // 改变里面的数据必须重新更新图表
        this.updateChart()
      }, 3000)
    },
    // 屏幕适配(根据屏幕分辨率来自适应图表文字之类的大小)
    screenAdapter () {
      const titleFontSize = this.$refs.seller_ref.offsetWidth / 100 * 3.6
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize
          }
        },
        tooltip: {
          axisPointer: {
            lineStyle: {
              width: titleFontSize
            }
          }
        },
        series: [{
          barWidth: titleFontSize,
          itemStyle: {
            barBorderRadius: [0, titleFontSize / 2, titleFontSize / 2, 0]
          }
        }]
      }
      this.chartInstance.setOption(adapterOption)
      // 当屏幕大小改变适应
      this.chartInstance.resize()
    }
  }
}
</script>

<style scoped>

</style>
