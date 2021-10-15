<template>
  <div class="com-container" @dblclick="revertMap">
    <div class="com-chart" ref="trend_ref"></div>
  </div>
</template>

<script>
import axios from 'axios'
import { getProvinceMapInfo } from '@/utils/map_utils'
import { mapState } from 'vuex'

export default {
  name: 'map',
  data () {
    return {
      chartInstance: null,
      allData: null,
      mapData: {} // 用于缓存点击过的地图数据
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
    this.$socket.registerCallBack('mapData', this.getData)
  },
  mounted () {
    this.initChart()
    // 发送数据给服务器
    this.$socket.send({
      action: 'getData',
      socketType: 'mapData',
      chartName: 'map',
      value: ''
    })
    window.addEventListener('resize', this.screenAdapter)
    this.screenAdapter()
  },
  destroyed () {
    window.removeEventListener('resize', this.screenAdapter)
  },
  methods: {
    async initChart () {
      this.chartInstance = this.$echarts.init(this.$refs.trend_ref, this.theme)
      // 获取地图数据
      // 由于地图数据并不是处于koa2后台，所以此处不能使用封装好的$http
      const ret = await axios.get('http://localhost:8999/static/map/china.json')
      // 注册地图
      this.$echarts.registerMap('china', ret.data)
      const initOption = {
        title: {
          text: '| 商家分布',
          left: 20,
          top: 20
        },
        geo: {
          type: 'map',
          map: 'china',
          top: '5%',
          bottom: '5%',
          itemStyle: {
            // 设置整个地图的背景颜色
            areaColor: '#2E72BF',
            // 设置接壤处的边框颜色
            borderColor: '#333'
          }
        },
        legend: {
          left: '5%',
          bottom: '5%',
          // 让图例垂直排列
          orient: 'vertical'
        }
      }
      // 注册地图点击事件
      this.chartInstance.on('click', async (arg) => {
        const provinceInfo = getProvinceMapInfo(arg.name)
        if (!this.mapData[provinceInfo.key]) {
          // 由此可以得到每个省份的拼音和路径
          const ret = await axios.get('http://localhost:8999' + provinceInfo.path)
          this.mapData[provinceInfo.key] = ret.data
          this.$echarts.registerMap(provinceInfo.key, ret.data)
        }
        const changeOption = {
          geo: {
            map: provinceInfo.key
          }
        }
        this.chartInstance.setOption(changeOption)
      })
      this.chartInstance.setOption(initOption)
    },
    getData (ret) {
      // 获取后台的散点数据，然后在更新视图
      // const { data: ret } = await this.$http.get('map')
      this.allData = ret
      this.updateChart()
    },
    updateChart () {
      const legendArr = this.allData.map(item => item.name)
      const seriesArr = this.allData.map(item => {
        // 注意：在地图中使用使用散点图，必须增加一个配置 coordinateSystem
        return {
          type: 'effectScatter',
          rippleEffect: {
            // 设置涟漪效果相关样式
            scale: 5,
            brushType: 'stroke'
          },
          name: item.name,
          data: item.children,
          // 让散点适配地图坐标
          coordinateSystem: 'geo'
        }
      })
      const dataOption = {
        legend: {
          data: legendArr
        },
        series: seriesArr
      }
      this.chartInstance.setOption(dataOption)
    },
    screenAdapter () {
      const titleFontSize = this.$refs.trend_ref.offsetWidth / 100 * 3.6
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize
          }
        },
        legend: {
          itemWidth: titleFontSize / 2,
          itemHeight: titleFontSize / 2,
          // 设置图例之间的间隔
          itemGap: titleFontSize / 2,
          textStyle: {
            fontSize: titleFontSize / 2
          }
        }
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    revertMap () {
      const revertOption = {
        geo: {
          map: 'china'
        }
      }
      this.chartInstance.setOption(revertOption)
    }
  }
}
</script>

<style scoped>

</style>
