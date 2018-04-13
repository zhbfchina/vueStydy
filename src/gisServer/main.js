
require.config({
    baseUrl:tgisServer.ServerPath+"gisServer/",
    paths:{
        'jquery':'lib/jquery1.11.3',
        "config":"config.js?vl="+Math.random(),
        "common":"common.js?vl="+Math.random(),
        "earth":"earth.js?vl="+Math.random(),
        "earthEvent":"earthEvent.js?vl="+Math.random(),
        "mapEvent":(trim_Version=="MSIE8.0")?"mapEvent2.js?vl="+Math.random():"mapEvent3.js?vl="+Math.random(),
        "serverEvent":"serverEvent.js?vl="+Math.random(),
        "gisServer2":"gisServer2.js?vl="+Math.random(),
        "echarts":"lib/echarts.min",
        "map":(trim_Version=="MSIE8.0")?"map2.js?vl="+Math.random():"map3.js?vl="+Math.random(),
        "tgis":(trim_Version=="MSIE8.0")?"TGIS2.js?vl="+Math.random():"TGIS3.js?vl="+Math.random(),
        "ol":"lib/ol3/ol",
       /* "plot":"lib/ol3/plot",*/
        "ol2":"lib/ol2/ol",
        "ol2ShowZoom":"lib/ol2/ShowZoom",
        "xml2json":"lib/jquery.xml2json",
     /*   "layer":"lib/layerv3.0.3/layer",*/
        "ol2ArcGISCacheXiaoxie":"lib/ol2/ArcGISCacheXiaoxie"
    },shim:{
        'ol': ['lib/ol3/map_compatible','lib/ol3/polyfill.min'],
        jquery:{
            exports:'jquery'
        },ol2ShowZoom:{
            deps: ['ol2'],
            exports:'ol2ShowZoom'
        },ol2ArcGISCacheXiaoxie:{
            deps: ['ol2'],
            exports:'ol2ArcGISCacheXiaoxie'
        }
    }
});
require(["config"], function(config){
    baseLon=config.baseLon
    baseLat=config.baseLat;
    baseZoom=config.baseZoom;
});