const WXAPI = require('../../wxapi/main')
const app = getApp();
const WxParse = require('../../wxParse/wxParse.js');
var wxCharts = require("../../utils/wxcharts.js");//相对路径
let a = Math.floor(Math.random()*10)+10*Math.floor(Math.random()*10)
let b = Math.floor(Math.random()*10)+10*Math.floor(Math.random()*10)
var pieChart = null;
var areaChart = null;
Page({

  data: {
    
    shopSubList: [],
    goodsDetail: {},
    selectSizePrice: 0,
    originalPrice: 0,
    shopNum: 0, // 商品数量
    buyNumber: 0,
    buyNumMin: 1,
    buyNumMax: 0,
    a:a,
    b:b,
    propertyChildIds: "",
    propertyChildNames: "",
    canSubmit: false, 
    shopCarInfo: {},
    currentPages: undefined

  },
  touchHandler: function (e) {
    console.log(pieChart.getCurrentDataIndex(e));
},
touchHandlerline: function (e) {
  console.log(areaChart.getCurrentDataIndex(e));
  areaChart.showToolTip(e);
},
goMap(e){ // 打开地图
  const id = e.currentTarget.dataset.id
  const item = this.data.shopSubList.find(ele => {
    return ele.id == id
  })
  wx.openLocation({
    latitude: item.latitude,
    longitude: item.longitude,
    name: item.name,
    address: item.address
  })
},
  onLoad(e) {
    var windowWidth = 320;
        try {
            var res = wx.getSystemInfoSync();
            windowWidth = res.windowWidth;
        } catch (e) {
            console.error('getSystemInfoSync failed!');
        }

        pieChart = new wxCharts({
            animation: true,
            canvasId: 'pieCanvas',
            type: 'pie',
            series: [{
                name: '值得',
                data: a,
            }, {
                name: '不值得',
                data: b,
            }],
            width: windowWidth,
            height: 300,
            dataLabel: true,
        });
        areaChart = new wxCharts({
          canvasId: 'areaCanvas',
          type: 'area',
          categories: ['1', '2', '3', '4', '5', '6','7'],
          animation: true,
          series: [{
              name: '价格走向',
              data: [Math.floor(Math.random()*10)+10*Math.floor(Math.random()*10),Math.floor(Math.random()*10)+10*Math.floor(Math.random()*10),Math.floor(Math.random()*10)+10*Math.floor(Math.random()*10),Math.floor(Math.random()*10)+10*Math.floor(Math.random()*10),Math.floor(Math.random()*10)+10*Math.floor(Math.random()*10),Math.floor(Math.random()*10)+10*Math.floor(Math.random()*10),Math.floor(Math.random()*10)+10*Math.floor(Math.random()*10)],
              format: function (val) {
                  return val.toFixed(2) ;
              }
          }],
          yAxis: {
              title: '价格',
              format: function (val) {
                  return val.toFixed(2);
              },
              min: 0,
              fontColor: '#8085e9',
              gridColor: '#8085e9',
              titleFontColor: '#f7a35c'
          },
          xAxis: {
              fontColor: '#7cb5ec',
              gridColor: '#7cb5ec'
          },
          extra: {
              legendTextColor: '#cb2431'
          },
          width: windowWidth,
          height: 300
      });
        

    console.log(e)
    this.data.goodsId = e.id
    const that = this
    this.data.kjJoinUid = e.kjJoinUid
    // 获取数据
    wx.getStorage({
      key: 'shopCarInfo',
      success: function(res) {
        that.setData({
          shopCarInfo: res.data,
          shopNum: res.data.shopNum,
          curuid: wx.getStorageSync('uid')
        });
      }
    })
    
  },

  onShow (){
    const _this = this
    WXAPI.shopSubList().then(res => {
      if (res.code === 0) {
        _this.setData({
          shopSubList: res.data
        })
      }
    })
  
    wx.setClipboardData({
      data: 'data',
      success(res) {
        wx.getClipboardData({
          success(res) {
            console.log(res.data) // data
          }
        })
      }
    })
    wx.getClipboardData({
      success(res) {
        console.log(res.data)
      }
    })
    this.getGoodsDetailAndKanjieInfo(this.data.goodsId)
    

  },
  async getGoodsDetailAndKanjieInfo(goodsId) {
    const that = this;
    const goodsDetailRes = await WXAPI.goodsDetail(goodsId)
    const goodsKanjiaSetRes = await WXAPI.kanjiaSet(goodsId)
    if (goodsDetailRes.code == 0) {
      if (goodsDetailRes.data.properties) {
        that.setData({
          selectSizePrice: goodsDetailRes.data.basicInfo.minPrice,
          originalPrice:goodsDetailRes.data.basicInfo.originalPrice,
          a:a,
          b:b
        });
      }
      if (goodsDetailRes.data.basicInfo.pingtuan) {
        that.pingtuanList(goodsId)
      }
      that.data.goodsDetail = goodsDetailRes.data;
      let _data = {
        goodsDetail: goodsDetailRes.data,
        selectSizePrice: goodsDetailRes.data.basicInfo.minPrice,
        originalPrice:goodsDetailRes.data.basicInfo.originalPrice,
        a:a,
        b:b,
        buyNumMax: goodsDetailRes.data.basicInfo.stores,
        buyNumber: (goodsDetailRes.data.basicInfo.stores > 0) ? 1 : 0,
        currentPages: getCurrentPages()
      }
      if (goodsKanjiaSetRes.code == 0) {
        _data.curGoodsKanjia = goodsKanjiaSetRes.data
        that.data.kjId = goodsKanjiaSetRes.data.id
        if (!that.data.kjJoinUid) {
          that.data.kjJoinUid = wx.getStorageSync('uid')
        }
        const curKanjiaprogress = await WXAPI.kanjiaDetail(goodsKanjiaSetRes.data.id, that.data.kjJoinUid)
        const myHelpDetail = await WXAPI.kanjiaHelpDetail(goodsKanjiaSetRes.data.id, that.data.kjJoinUid, wx.getStorageSync('token'))
        if (curKanjiaprogress.code == 0) {
          _data.curKanjiaprogress = curKanjiaprogress.data
        }
        if (myHelpDetail.code == 0) {
          _data.myHelpDetail = myHelpDetail.data
        }
      }
      if (goodsDetailRes.data.basicInfo.pingtuan) {
        const pingtuanSetRes = await WXAPI.pingtuanSet(goodsId)
        if (pingtuanSetRes.code == 0) {
          _data.pingtuanSet = pingtuanSetRes.data
        }        
      }
      that.setData(_data);
      WxParse.wxParse('article', 'html', goodsDetailRes.data.content, that, 5);
    }
  },
  gocollect: function() {
    wx.reLaunch({
      url: "/pages/collect-cart/index"
    });
  },
  zhide(options) {
    this.setData({
      a: a + 1
    });
  },
  buzhi(options) {
    this.setData({
      b: b + 1
    });
  },
  numJianTap: function() {
    if (this.data.buyNumber > this.data.buyNumMin) {
      var currentNum = this.data.buyNumber;
      currentNum--;
      this.setData({
        buyNumber: currentNum
      })
    }
  },
  numJiaTap: function() {
    if (this.data.buyNumber < this.data.buyNumMax) {
      var currentNum = this.data.buyNumber;
      currentNum++;
      this.setData({
        buyNumber: currentNum
      })
    }
  },

  labelItemTap: function(e) {
    const that = this;
    // 取消该分类下的子栏目所有的选中状态
    var childs = that.data.goodsDetail.properties[e.currentTarget.dataset.propertyindex].childsCurGoods;
    for (var i = 0; i < childs.length; i++) {
      that.data.goodsDetail.properties[e.currentTarget.dataset.propertyindex].childsCurGoods[i].active = false;
    }
    // 设置当前选中状态
    that.data.goodsDetail.properties[e.currentTarget.dataset.propertyindex].childsCurGoods[e.currentTarget.dataset.propertychildindex].active = true;
    var needSelectNum = that.data.goodsDetail.properties.length;
    var curSelectNum = 0;
    var propertyChildIds = "";
    var propertyChildNames = "";
    for (var i = 0; i < that.data.goodsDetail.properties.length; i++) {
      childs = that.data.goodsDetail.properties[i].childsCurGoods;
      for (var j = 0; j < childs.length; j++) {
        if (childs[j].active) {
          curSelectNum++;
          propertyChildIds = propertyChildIds + that.data.goodsDetail.properties[i].id + ":" + childs[j].id + ",";
          propertyChildNames = propertyChildNames + that.data.goodsDetail.properties[i].name + ":" + childs[j].name + "  ";
        }
      }
    }
    var canSubmit = false;
    if (needSelectNum == curSelectNum) {
      canSubmit = true;
    }


    this.setData({
      goodsDetail: that.data.goodsDetail,
      canSubmit: canSubmit
    })
  },
  /**
   * 加入收藏
   */
  addShopCar: function() {
    if (this.data.goodsDetail.properties && !this.data.canSubmit) {
      if (!this.data.canSubmit) {
        wx.showModal({
          content: '1',
          showCancel: false
        })
      }
      return;
    }
    var shopCarInfo = this.bulidShopCarInfo();

    this.setData({
      shopCarInfo: shopCarInfo,
      shopNum: shopCarInfo.shopNum
    });

    // 写入本地存储
    wx.setStorage({
      key: 'shopCarInfo',
      data: shopCarInfo
    })
    wx.showToast({
      title: '加入成功',
      icon: 'success'
    })
  },
  /**
   * 组建购物车信息
   */
  bulidShopCarInfo: function() {
    // 加入收藏
    var shopCarMap = {};
    shopCarMap.goodsId = this.data.goodsDetail.basicInfo.id;
    shopCarMap.pic = this.data.goodsDetail.basicInfo.pic;
    shopCarMap.name = this.data.goodsDetail.basicInfo.name;
    shopCarMap.propertyChildIds = this.data.propertyChildIds;
    shopCarMap.label = this.data.propertyChildNames;
    shopCarMap.price = this.data.selectSizePrice;
    shopCarMap.left = "";
    shopCarMap.active = true;
    shopCarMap.number = this.data.buyNumber;
    shopCarMap.logisticsType = this.data.goodsDetail.basicInfo.logisticsId;
    shopCarMap.logistics = this.data.goodsDetail.logistics;
    shopCarMap.weight = this.data.goodsDetail.basicInfo.weight;

    var shopCarInfo = this.data.shopCarInfo;
    if (!shopCarInfo.shopNum) {
      shopCarInfo.shopNum = 0;
    }
    if (!shopCarInfo.shopList) {
      shopCarInfo.shopList = [];
    }
    var hasSameGoodsIndex = -1;
    for (var i = 0; i < shopCarInfo.shopList.length; i++) {
      var tmpShopCarMap = shopCarInfo.shopList[i];
      if (tmpShopCarMap.goodsId == shopCarMap.goodsId && tmpShopCarMap.propertyChildIds == shopCarMap.propertyChildIds) {
        hasSameGoodsIndex = i;
        shopCarMap.number = shopCarMap.number + tmpShopCarMap.number;
        break;
      }
    }

    shopCarInfo.shopNum = shopCarInfo.shopNum + this.data.buyNumber;
    if (hasSameGoodsIndex > -1) {
      shopCarInfo.shopList.splice(hasSameGoodsIndex, 1, shopCarMap);
    } else {
      shopCarInfo.shopList.push(shopCarMap);
    }
    shopCarInfo.kjId = this.data.kjId;
    return shopCarInfo;
  },
  goIndex() {
    wx.switchTab({
      url: '/pages/index/index',
    });
  }
})
