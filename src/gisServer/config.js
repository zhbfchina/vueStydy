define(function() {
    var config=new Object();
    config.earthIp = "http://readearth2014.vicp.cc:8099";
    config.screenIndex = "0";
    config.vectorMapPath = "http://localhost:8080/china";
  
    config.satelliteMapPath = "http://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}";
    config.xmlIp = "192.168.0.4:1521";
    config.panoramicPath = "http://123.127.94.135:82/";
    config.baseLon = 121.38171;
    config.baseLat = 31;
    config.baseZoom = 10;
    config.vectorMapType = "jpg";
    //zhb 改
    config.roadMapPath = "http://localhost:8080/china";
    config.proj="EPSG:4326";  
    config.mapType="gaode"; 
    return config;});
