<template>
  <div class="com-container">
    <div class="com-chart" ref="trend_ref"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Stock',
  data () {
    return {
      chartInstance: null,
      allData: null,
      currentIndex: 0, // 设置当前显示的页数
      timerId: null
    }
  },
  computed: { ...mapState(['theme']) },
  watch: {
    theme () {
      this.chartInstance.dispose()
      this.initChart()
      this.screenAdapter()
      this.updateChart()
    }
  },
  created () {
    this.$socket.registerCallBack('stockData', this.getData)
  },
  mounted () {
    this.initChart()
    // this.getData()
    // 发送数据给服务器
    this.$socket.send({
      action: 'getData',
      socketType: 'stockData',
      chartName: 'stock',
      value: ''
    })
    window.addEventListener('resize', this.screenAdapter)
    this.screenAdapter()
  },
  destroyed () {
    window.removeEventListener('resize', this.screenAdapter)
    clearInterval(this.timerId)
  },
  methods: {
    async initChart () {
      this.chartInstance = this.$echarts.init(this.$refs.trend_ref, this.theme)
      const initOption = {
        title: {
          text: '| 库存和销量分析',
          left: 20,
          top: 20
        }
      }
      this.chartInstance.setOption(initOption)
      this.chartInstance.on('mouseover', () => {
        // 注意这里不能使用mouseenter
        clearInterval(this.timerId)
      })
      this.chartInstance.on('mouseout', () => {
        this.startInterval()
      })
    },
    getData (ret) {
      // 此处只负责发起ajax
      // const { data: ret } = await this.$http.get('stock')
      this.allData = ret
      this.updateChart()
      this.startInterval()
    },
    updateChart () {
      // 此处负责数据的更新
      const centerArr = [['18%', '40%'], ['50%', '40%'], ['82%', '40%'], ['34%', '75%'], ['66%', '75%']]
      // slice数组截取
      const start = this.currentIndex * 5
      const end = (this.currentIndex + 1) * 5
      const showData = this.allData.slice(start, end)
      const colorArr = [['#4FF778', '#0BA82C'], ['#E5DD45', '#E8B11C'], ['#E8821C', '#E55445'], ['#5052EE', '#AB6EE5'], ['#23E5E5', '#2E72BF']]
      const seriesArr = showData.map((item, index) => {
        return {
          type: 'pie',
          // 分别控制两个圆的半径
          // radius: [110, 100],
          center: centerArr[index],
          // 关闭鼠标经过时产生的动画效果
          hoverAnimation: false,
          label: {
            position: 'center',
            color: colorArr[index][0]
          },
          labelLine: { show: false },
          // 圆环几个模块就几个对象
          data: [{
            // 库存
            name: item.name + '\n' + item.sales,
            value: item.sales,
            itemStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 1, 0, 0, [{
                offset: 0,
                color: colorArr[index][0]
              }, {
                offset: 1,
                color: colorArr[index][1]
              }])
            }
          }, {
            value: item.stock,
            // 已售
            itemStyle: {
              color: '#333843'
            }
          }]
        }
      })
      const dataOption = {
        series: seriesArr
      }
      this.chartInstance.setOption(dataOption)
    },
    screenAdapter () {
      const titleFontSize = this.$refs.trend_ref.offsetWidth / 100 * 3.6
      const innerRadius = titleFontSize * 2.8
      const outterRadius = innerRadius * 1.125
      const adapterOption = {
        title: {
          textStyle: {
            fontStyle: titleFontSize
          }
        },
        series: [{
          type: 'pie',
          radius: [outterRadius, innerRadius],
          label: {
            fontStyle: titleFontSize / 2
          }
        }, {
          type: 'pie',
          radius: [outterRadius, innerRadius],
          label: {
            fontStyle: titleFontSize / 2
          }
        }, {
          type: 'pie',
          radius: [outterRadius, innerRadius],
          label: {
            fontStyle: titleFontSize / 2
          }
        }, {
          type: 'pie',
          radius: [outterRadius, innerRadius],
          label: {
            fontStyle: titleFontSize / 2
          }
        }, {
          type: 'pie',
          radius: [outterRadius, innerRadius],
          label: {
            fontStyle: titleFontSize / 2
          }
        }]
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    startInterval () {
      if (this.timerId) {
        clearInterval(this.timerId)
      }
      this.timerId = setInterval(() => {
        this.currentIndex++
        if (this.currentIndex > 1) {
          this.currentIndex = 0
        }
        // 必须更新视图才会发生变化
        this.updateChart()
      }, 5000)
    }
  }
}
</script>

<style scoped>

</style>
