<template>
  <div class="com-container">
    <div class="title" :style="comStyle">
      <span>{{ '| ' + showTitle }}</span>
      <span class="iconfont title-icon" @click="showChoice=!showChoice" :style="comStyle">&#xe6eb;</span>
      <div class="select-con" v-show="showChoice" :style="marginStyle">
        <div class="select-item" v-for="item in selectTypes" :key="item.key" @click="handleSelect(item.key)">
          {{ item.text }}
        </div>
      </div>
    </div>
    <div class="com-chart" ref="trend_ref"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { getThemeValue } from '@/utils/theme_utils'

export default {
  name: 'Trend',
  data () {
    return {
      chartInstance: null,
      allData: null,
      showChoice: false, // 控制下拉选项
      choiceType: 'map', // 显示的数据类型
      titleFontSize: 0
    }
  },
  created () {
    this.$socket.registerCallBack('trendData', this.getData)
  },
  mounted () {
    this.initChart()
    // this.getData()
    // 发送数据给服务器
    this.$socket.send({
      action: 'getData',
      socketType: 'trendData',
      chartName: 'trend',
      value: ''
    })
    window.addEventListener('resize', this.screenAdapter)
    this.screenAdapter()
  },
  destroyed () {
    window.removeEventListener('resize', this.screenAdapter)
    this.$socket.unRegisterCallBack('trendData')
  },
  computed: {
    ...mapState(['theme']),
    selectTypes () {
      if (!this.allData) {
        return []
      } else {
        return this.allData.type.filter(item => {
          // 通过筛选去除下拉中的当前的选项
          return item.key !== this.choiceType
        })
      }
    },
    showTitle () {
      //  设置默认显示的标题
      if (!this.allData) {
        return ''
      } else {
        return this.allData[this.choiceType].title
      }
    },
    //  设置给标题的样式
    comStyle () {
      return {
        fontSize: this.titleFontSize + 'px',
        color: getThemeValue(this.theme).titleColor
      }
    },
    marginStyle () {
      return {
        marginLeft: this.titleFontSize / 2 + 'px'
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
  methods: {
    initChart () {
      this.chartInstance = this.$echarts.init(this.$refs.trend_ref, this.theme)
      const initOption = {
        xAxis: {
          type: 'category',
          // 设置图表与坐标轴之间是否需要间隙
          boundaryGap: false
        },
        yAxis: {
          type: 'value'
        },
        grid: {
          top: '35%',
          left: '3%',
          right: '4%',
          bottom: '1%',
          containLabel: true // 是否包含边框
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          left: 20,
          top: '15%'
        }
      }
      this.chartInstance.setOption(initOption)
    },
    //  获取相关数据
    getData (ret) {
      // ret就是服务端发送过来的数据
      // const { data: ret } = await this.$http.get('trend')
      this.allData = ret
      this.updateChart()
    },
    updateChart () {
      // 处理数据
      // 类目轴数据
      const timeArr = this.allData.common.month
      const valueArr = this.allData[this.choiceType].data
      const colorArr1 = ['rgba(11,168,44,.5)', 'rgba(44,110,255,.5)', 'rgba(22,242,217,.5)', 'rgba(254,33,30,.5)', 'rgba(250,105,0,.5)']
      const colorArr2 = ['rgba(11,168,44,0)', 'rgba(44,110,255,0)', 'rgba(22,242,217,0)', 'rgba(254,33,30,0)', 'rgba(250,105,0,0)']
      const seriesArr = valueArr.map((item, index) => {
        return {
          name: item.name,
          type: 'line',
          data: item.data,
          // 是否进行图表的堆叠显示
          stack: this.choiceType,
          areaStyle: {
            color: new this.$echarts.graphic.LinearGradient(
              0, 0, 0, 1, [{
                offset: 0,
                color: colorArr1[index]
              }, {
                offset: 1,
                color: colorArr2[index]
              }]
            )
          }
        }
      })
      // 图例的数据
      const legendArr = valueArr.map(item => {
        return item.name
      })
      const dataOption = {
        xAxis: {
          data: timeArr
        },
        legend: {
          data: legendArr
        },
        series: seriesArr
      }
      this.chartInstance.setOption(dataOption)
    },
    screenAdapter () {
      // 屏幕适配
      this.titleFontSize = this.$refs.trend_ref.offsetWidth / 100 * 3.6
      const adapterOption = {
        legend: {
          // 图例提示
          itemWidth: this.titleFontSize,
          itemHeight: this.titleFontSize,
          itemGap: this.titleFontSize,
          itemStyle: {
            fontsize: this.titleFontSize / 2
          }
        }
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    handleSelect (currentType) {
      this.choiceType = currentType
      this.updateChart()
      this.showChoice = false
    }
  }
}
</script>

<style lang="less" scoped>
.title {
  position: absolute;
  left: 20px;
  top: 20px;
  z-index: 10;
  color: #fff;

  .title-icon {
    margin-left: 10px;
    cursor: pointer;
  }

  .select-con {
    background-color: #222733;
  }
}
</style>
