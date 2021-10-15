<template>
  <div class="com-container">
    <div class="com-chart" ref="trend_ref"></div>
    <span class="iconfont arr_left" @click="toLeft" :style="comStyle">&#xe6ef;</span>
    <span class="iconfont arr_right" @click="toRight" :style="comStyle">&#xe6ed;</span>
    <span class="cat-name" :style="comStyle">{{ catName }}</span>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { getThemeValue } from '@/utils/theme_utils'

export default {
  name: 'Hot',
  data () {
    return {
      chartInstance: null,
      allData: null,
      currentIndex: 0, // 当前显示的数据索引
      titleFontSize: 0
    }
  },
  computed: {
    ...mapState(['theme']),
    catName () {
      if (!this.allData) {
        return ''
      } else {
        return this.allData[this.currentIndex].name
      }
    },
    comStyle () {
      return {
        fontSize: this.titleFontSize + 'px',
        color: getThemeValue(this.theme).titleColor
      }
    }
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
    this.$socket.registerCallBack('hotData', this.getData)
  },
  mounted () {
    this.initChart()
    // 发送数据给服务器
    this.$socket.send({
      action: 'getData',
      socketType: 'hotData',
      chartName: 'hot',
      value: ''
    })
    window.addEventListener('resize', this.screenAdapter)
    this.screenAdapter()
  },
  destroyed () {
    window.removeEventListener('resize', this.screenAdapter)
    // clearInterval(this.timerId)
  },
  methods: {
    async initChart () {
      this.chartInstance = this.$echarts.init(this.$refs.trend_ref, this.theme)
      const initOption = {
        title: {
          text: '| 热销商品销售金额占比',
          left: 20,
          top: 20
        },
        legend: {
          top: '15%',
          icon: 'circle'
        },
        tooltip: {
          show: true,
          formatter: arg => {
            const thirdCategory = arg.data.children
            let allCount = 0
            thirdCategory.forEach(item => {
              allCount += item.value
            })
            let str = ''
            thirdCategory.forEach(item => {
              str += `${item.name}: ${parseInt(item.value / allCount * 100) + '%'}
              <br/>`
            })
            return str
          }
        },
        series: [{
          type: 'pie',
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true
            },
            labelLine: {
              // 去掉label上连接文字的线
              show: false
            }
          }
        }]
      }
      this.chartInstance.setOption(initOption)
    },
    getData (ret) {
      // 此处只负责发起ajax
      // const { data: ret } = await this.$http.get('hot')
      this.allData = ret
      this.updateChart()
    },
    updateChart () {
      // 此处负责数据的更新
      const seriesData = this.allData[this.currentIndex].children.map(item => {
        return {
          name: item.name,
          value: item.value,
          children: item.children // 用于tooltip的数据
        }
      })
      const legendData = this.allData[this.currentIndex].children.map(item => {
        return item.name
      })
      const dataOption = {
        legend: {
          data: legendData
        },
        series: [{
          data: seriesData
        }]
      }
      this.chartInstance.setOption(dataOption)
    },
    screenAdapter () {
      this.titleFontSize = this.$refs.trend_ref.offsetWidth / 100 * 3.6
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: this.titleFontSize
          }
        },
        legend: {
          itemWidth: this.titleFontSize,
          itemHeight: this.titleFontSize,
          itemGap: this.titleFontSize / 2,
          textStyle: {
            fontSize: this.titleFontSize / 2
          }
        },
        series: [{
          radius: this.titleFontSize * 4.5,
          center: ['50%', '60%']
        }]
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    toLeft () {
      this.currentIndex--
      if (this.currentIndex < 0) {
        this.currentIndex = this.allData.length - 1
      }
      this.updateChart()
    },
    toRight () {
      this.currentIndex++
      if (this.currentIndex > this.allData.length - 1) {
        this.currentIndex = 0
      }
      this.updateChart()
    }

  }
}
</script>

<style lang="less" scoped>
.arr_left {
  position: absolute;
  left: 10%;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #fff;
}

.arr_right {
  position: absolute;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #fff;
}

.cat-name {
  position: absolute;
  left: 80%;
  bottom: 20px;
  color: #fff;
}
</style>
