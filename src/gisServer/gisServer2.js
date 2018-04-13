/**
 * Created by fxd on 2017-04-06.
 */
define(["jquery","map","earth","serverEvent","config","common"],function($,Map,earth,Event,config,common){
    baseLon=parseFloat(config.baseLon);
    baseLat=parseFloat(config.baseLat);
    baseZoom=parseFloat(config.baseZoom);//为了兼容以前版本的参数
    var tgis=new Object();
    tgis.Version="4.1";
    tgis.Map=Map;
    tgis.Earth=earth;
    Event.serverStartFinished=tgisServer.Event.serverStartFinished;
    tgis.Event=Event;
    tgis.showType="2d";
    tgis.createGuid=common.createGuid;
    tgis.initTGISServer=function(divid, serverType,showType){
        $("#"+divid).html("");
        tgis.Earth.StartFinished=tgisServer.Event.serverStartFinished;
        tgis.Map.StartFinished=tgisServer.Event.serverStartFinished;
        tgis.showType=showType;
        tgis.ServerDivId=divid;
        tgis.ServerType=serverType+"";//0或者不指定为二三维一体；1只加载地图；2只加载三维
        $("#"+divid).css("overflow","hidden");//取消掉滚动条
        $("#"+divid).css("width","100%");//
        $("#"+divid).css("height","100%");//
        var divHeight=$("#"+divid).height();
        if(divHeight==0){
            $("#"+divid).css("height","100%");
            divHeight=$("#"+divid).height();
            if(divHeight==0){
                divHeight=$(document.body).height()-5;
                if(divHeight<$(window).height())
                    divHeight=$(window).height()-5;
                $("#"+divid).height(divHeight);
            }
        }
        $(document).bind("contextmenu",function(){return false;});
        //map控件
        var maphtml="<div id='"+ tgis.Map.mapDiv +"' style='width:100%;height:100%'></div>";
        var earthhtml="<div id='"+ earth.earthDiv +"' style='height:1px;width:1px'></div>";
        if(tgis.IEType=="MSIE8.0"){
            earthhtml="<div id='"+ earth.earthDiv +"' style='height:4px;width:4px'></div>";
        }
        //var dataProsesshtml='<object id="dataProcess" classid="clsid:DDA7E893-8EEE-4A1E-A506-867932BD0FB9" style="display:none;"></object>';
        var dialogHtml="<div id='gisServerDialogDiv' style='background-color:white;'></div>";
        if(tgis.showType=="3d"||tgis.ServerType=="2"){
            earthhtml ="<div id='"+ earth.earthDiv +"' style='width:100%;height:100%'></div>";
            maphtml="<div id='"+ tgis.Map.mapDiv +"' style='width:100%;height:100%;z-index: -9999;'></div>";
        }
        var chartsHtml="<div id='gisServerCharts' style='display: none;'></div>";
        $("#"+divid).html(earthhtml+maphtml+dialogHtml+chartsHtml);
        $("#"+divid).css("position","relative");
        //此对象用来刷新界面，让浮在三维上的div可以显示。
        $("#"+divid).append("<div id='refreshDivForEarth' style='background-color:white;position: absolute; z-index: -9999; width: 1px; height: 1px; top: 0;left: 0;'></div>");
        tgis.Width=$("#"+divid).width();
        tgis.Height=divHeight;

        if(tgis.ServerType=="1"){
            tgis.ToEarthButtonVisibility=false;
        }else if(tgis.ServerType=="2"){
            tgis.ToMapButtonVisibility=false;
        }else {
            tgis.ToEarthButtonVisibility=true;
            tgis.ToMapButtonVisibility=true;
        }
        var time2=new Date();
        //alert(time3 .getTime()- time2 .getTime())
        //初始化地图、加载三维球
        if(tgis.ServerType!="2"){
            Map.initMap(tgis.ServerType);
            //初始化地图切换按钮
            tgis.InitTransformButton();
            resizeGisServer();
        }
        var time3=new Date();
        // alert(time3 .getTime()- time2 .getTime())
        if(tgis.ServerType!="1") {
            setTimeout(function () {
                tgis.Earth.initEarth();
            },20);

        }
    };
    tgis.zoomIn=function(){
        if(tgis.showType=="2d"){
            tgis.Map.zoomIn();
        }else{
            earth.zoomIn();
        }
    };
    tgis.zoomOut=function(){
        if(tgis.showType=="2d"){
            tgis.Map.zoomOut();
        }else{
            earth.zoomOut();
        }
    };
    tgis.fromEarthToMap=function(){
        var lon=tgis.Earth.getLon();
        var lat=tgis.Earth.getLat();
        /* var wgs=transfromToWgs(lon,lat,0);*/
        var range=tgis.Earth.getRange();
        var level=_getDuibiHeight(range);
        //设置二维视角
        tgis.Map.setCenter(lon,lat);
        tgis.Map.setResolution(level);
    };
    function resizeGisServer() {
        var width=$('#'+tgis.ServerDivId).width();
        var height=$('#'+tgis.ServerDivId).height();
        if(width!=tgis.Width||height!=tgis.Height){
            if(tgis.showType=="2d"){
                tgis.Map.MapChangeUpdate();
            }
            if(tgis.showType=="3d"){
                tgis.Earth.GUIClear();
                setTimeout(function(){
                    tgis.Earth.CreateEarthToMapButton();
                },200);
            }
            tgis.Width=width;
            tgis.Height=height;
        }
        setTimeout(resizeGisServer,100);
    }
    tgis.toMapView=function(){
        if(tgis.showType=="2d" || tgis.ServerType=="2")return;
        $("#"+ tgis.Earth.earthDiv).css("height", "0%");
        $("#"+ tgis.Earth.earthDiv).css("width", "1%");
        $("#forEarthIframe").css("display","none");
        $("earthQHDiv").html("");
        tgis.showType="2d";
        if(tgis.ServerType!="1"){
            tgis.fromEarthToMap();
        }else{
            tgis.centerAndZoom(config.baseLon, config.baseLat, config.baseZoom);
        }
        tgis.Map.MapChangeUpdate();
        var callback=tgis.Event.showTypeChangedCallback;
        if(callback&&typeof(callback)=="function")callback(tgis.showType);
    };
    tgis.toEarthView=function(){
        if(tgis.showType=="3d" || tgis.ServerType=="1")return;
        $("#"+ tgis.Earth.earthDiv).css("height", "100%");
        $("#"+ tgis.Earth.earthDiv).css("width", "100%");
        tgis.showType="3d";
        if(tgis.ServerType!="2"){
            tgis.fromMapToEarth();//同步位置
        }else{
            tgis.centerAndZoom(baseLon, baseLat, baseZoom);
        }
        tgis.Earth.EarthChangeUpdate();
        var callback=tgis.Event.showTypeChangedCallback;
        if(callback&&typeof(callback)=="function")callback(tgis.showType);
    };
    tgis.centerAndZoom=tgis.CenterAndZoom=function(Lon,Lat,Zoom){
        if(tgis.showType=="2d"){
            Map.centerAndZoom(Lon,Lat,Zoom);
        }
        if(tgis.showType=="3d"){
            var range = _getDuibiHeightFromZoom(Zoom);
            if(range>0){
                tgis.Earth.goToLookAt(Lon, Lat, 0, 90, range);
            }
        }
    };
    tgis.fromMapToEarth=function(){
        //先获取地图的位置
        var point=tgis.Map.getCenter();
        var level=tgis.Map.getResolution();
        if(level>0.17578125){
            level=0.17578125;
            point.longitude=108.8;
            point.latitude=34.3;
        }
        //设置球的位置
        var range= _getduibi(level);
        tgis.Earth.goToLookAt(point.longitude,point.latitude, 0, 90,range);
    };
    function _getduibi(value){
        for(var i=0;i<duibiArr.length;i++){
            var obj=duibiArr[i];
            var level = parseFloat(obj.level);
            var newValue = parseFloat(value);
            if(level==newValue){
                return obj.height;
            }
        }
    }
    var _getDuibiHeight=function(value){
        var dValue=10000000000;
        var level=1;
        for(var i=0;i<duibiArr.length;i++){
            var obj=duibiArr[i];
            var ddValue=Math.abs(obj.height-value);
            if(dValue>=ddValue){
                dValue=ddValue;
                level=obj.level;
            }
        }
        return level;
    };
    var _getDuibiHeightFromZoom=function(zoom){
        for(var i=0;i<duibiArr.length;i++){
            var obj = duibiArr[i];
            if(zoom==obj.zoom){
                return obj.height;
            }
        }
    };
    var duibiArr=[];
    duibiArr.push({ level:0.17578125, height:18000000, zoom:3 });   //3
    duibiArr.push({ level:0.087890625, height:9000000, zoom:4 });   //4
    duibiArr.push({ level:0.0439453125, height:4500000, zoom:5 });  //5
    duibiArr.push({ level:0.02197265625, height:2350000, zoom:6 }); //6
    duibiArr.push({ level:0.010986328125, height:1160000, zoom:7 });    //7
    duibiArr.push({ level:0.0054931640625, height:580000, zoom:8 });    //8
    duibiArr.push({ level:0.00274658203125, height:300000, zoom:9 });   //9
    duibiArr.push({ level:0.001373291015625, height:150000, zoom:10 });  //10
    duibiArr.push({ level:0.0006866455078125, height:74500, zoom:11 });  //11
    duibiArr.push({ level:0.00034332275390625, height:37800, zoom:12 }); //12
    duibiArr.push({ level:0.000171661376953125, height:18500, zoom:13 });    //13
    duibiArr.push({ level:0.0000858306884765625, height:9600, zoom:14 });    //14
    duibiArr.push({ level:0.00004291534423828125, height:5000, zoom:15 });   //15
    duibiArr.push({ level:0.000021457672119140625, height:2400, zoom:16 });  //16
    duibiArr.push({ level:0.000010728836059570312, height:1200, zoom:17 });  //17
    duibiArr.push({ level:0.000005364418029785156, height:620, zoom:18 });   //18
    //用于关闭所有测量、编辑等事件
    tgis.ClearOperation=function(){
        if(tgis.ServerType!="1"){
            tgis.Earth.ClearOperation();
        }
        if(tgis.ServerType!="2"){
            tgis.Map.ClearOperation();
        }
    };
    tgis.coordPoint=function(lon,lat,alt){
        var point={};
        point.lon=lon;
        point.lat=lat;
        point.alt=alt;
        if(alt==null)point.alt=0;
        return point;
    };
    tgis.screenShot=tgis.ScreenShot=function(divName){
        if(tgisServer.showType=="2d"){
            // 加载
            require(['lib/screenshot/jquery.md5', 'lib/screenshot/niuniucapture', 'lib/screenshot/capturewrapper'], function(){
                sceenShotInit();
                StartCapture(divName);
            });

        }
        else {
            var path=tgis.SaveFileDialog("","*.jpg|*.JPG","jpg");
            if(!path){
                return;
            }
            tgis.Earth.ScreenShot(path,	tgis.Width,tgis.Height);
        }
    };
    tgis.SaveFileDialog=function(basepath,filter_string,defaut_ext){
        var fileName = tgis.Earth.SaveFileDialog(basepath, filter_string,defaut_ext);
        return fileName;
    };
    /**
     * 打开文件选择对话框
     * @param basepath
     * @param format
     * @returns
     */
    tgis.OpenFileDialog=function(basepath,format){
        var fileName = earth.OpenFileDialog(basepath, format);
        return fileName;
    };
    tgis.OpenFilePathDialog=tgis.OpenFolderPathDialog=function(basepath,title){
        var fileName = earth.OpenFolderPathDialog(basepath, title);
        return fileName;
    };
    tgis.GetCenter=function(){
        if(tgisServer.showType=="2d"){
            return Map.getCenter();
        }
        if(tgisServer.showType=="3d"){
            return earth.GetCenter();
        }
    };
    //设置地图中心点坐标状态是否可见
    tgis.SetCenterVisibility=function(value){
        Map.SetCenterVisibility(value)
    };
    //设置地图缩放级别状态是否可见
    tgis.SetZoomVisibility=function(value){
        Map.SetZoomVisibility(value);

    };


////////2017-04-06 fxd 这一块是属于右上角图标的，本来是单独一个模块，但是之前写的代码，现在不好区分了，所以直接放到gisServer的js里面
    tgis.ToMapButtonVisibility=true;
    tgis.ToImageButtonVisibility=true;
    tgis.ToEarthButtonVisibility=true;
    tgis.compassVisibility=false;
    tgis.TransformButtonOffSet=20;
    tgis.TransformButtonWidth=50;
    tgis.TransformButtonHeight=50;
    tgis.TransformButtonLocation="Coordinate_LT";
    tgis.ToMapButtonId="";
    /**
     * 初始化地图切换按钮容器
     * @constructor
     */
    tgis.InitTransformButton=function(){//tgisServer 此处为父级的对象，没有添加这个对象的依赖，而且添加上报错
        var html="";
        html+='<div id="transform_boxDiv" class="transform_box '+tgis.TransformButtonLocation+'">';
        html+='<div class="transform_left"><div class="transform_leftg transform_asp" onClick="tgisServer.Map.qiehuan()">';
        html+=' <img src="'+tgis.ServerPath+'gisServer/images/wx.png" id="transform_img">';
        html+=' <a id="transform_sp">卫星</a></div></div><div class="transform_right"><div class="transform_rightg transform_asp" onclick="tgisServer.toEarthView()">';
        html+='  <img src="'+tgis.ServerPath+'gisServer/images/sw.png"><a>三维</a> </div></div></div>';
        $('#'+tgis.ServerDivId).append(html);
        if(!tgis.ToImageButtonVisibility) $(".transform_left").hide();
        if(!tgis.ToEarthButtonVisibility) $(".transform_right").hide();
    };
    tgis.SetCompassVisibility=function(value){
        tgis.compassVisibility=value;
        earth.SetCompassVisibility(value);
    };
    tgis.SetMapButtonVisibility=function(value){
        if(tgis.ServerType=="2"){
            return false;
        }
        tgis.ToMapButtonVisibility=value;
        if(tgis.ToMapButtonVisibility){
            if(tgis.ToMapButtonId==null&&tgis.showType=="3d"){
                earth.CreateEarthToMapButton();
            }
        }else {
            if(tgis.ToMapButtonId){
                earth.removeGUIById(tgis.ToMapButtonId);
                tgis.ToMapButtonId="";
            }
        }
    };
    tgis.SetImageButtonVisibility=function(value){
        tgis.ToImageButtonVisibility=value;
        if($('#transform_boxDiv').length && $('#transform_boxDiv').length>0){
            if(tgis.ToImageButtonVisibility){
                Map.addSatelliteLayer();
                $(".transform_left").show();
            }else{
                Map.removeSatelliteLayer();
                $(".transform_left").hide();
            }
        }
    };
    tgis.SetEarthButtonVisibility=function(value){
        if(tgis.ServerType=="1")return false;
        tgis.ToEarthButtonVisibility=value;
        if($('#transform_boxDiv').length && $('#transform_boxDiv').length>0){
            if(tgis.ToEarthButtonVisibility){
                $(".transform_right").show();
                $(".transform_box").width(110);
            }else{
                $(".transform_right").hide();
                $(".transform_box").width(50);
            }
        }
    };
    tgis.SetTransformButtonLeftTop=function(){
        tgis.TransformButtonLocation="Coordinate_LT";
        if($('#transform_boxDiv').length && $('#transform_boxDiv').length>0)
        {
            $("#transform_boxDiv").attr("class","transform_box "+tgis.TransformButtonLocation);
        }
        if(tgis.ServerType=="1"){
            return false;
        }

        if(tgis.showType=="3d"&&tgis.ToMapButtonVisibility){
            /* if(tgis.ToMapButtonId){
                 earth.removeGUIById(tgis.ToMapButtonId);
                 tgis.ToMapButtonId="";
             }*/
            earth.CreateEarthToMapButton();
        }else{
            if(tgis.ToMapButtonId){
                earth.removeGUIById(tgis.ToMapButtonId);
                tgis.ToMapButtonId="";
            }
        }
    };
    tgis.SetTransformButtonLeftBottom=function(){
        tgis.TransformButtonLocation = "Coordinate_LB";
        if($('#transform_boxDiv').length && $('#transform_boxDiv').length>0){
            $("#transform_boxDiv").attr("class","transform_box "+tgis.TransformButtonLocation);
        }
        if(tgis.ServerType=="1"){
            return false;
        }

        if(tgis.showType=="3d"&&tgis.ToMapButtonVisibility){
            /*if(tgis.ToMapButtonId){
                earth.removeGUIById(tgis.ToMapButtonId);
                tgis.ToMapButtonId="";
            }*/
            earth.CreateEarthToMapButton();
        }else{
            if(tgis.ToMapButtonId){
                earth.removeGUIById(tgis.ToMapButtonId);
                tgis.ToMapButtonId="";
            }
        }
    };
    tgis.SetTransformButtonRightTop=function(){
        tgis.TransformButtonLocation="Coordinate_RT";
        if($('#transform_boxDiv').length && $('#transform_boxDiv').length>0)
            $("#transform_boxDiv").attr("class","transform_box "+tgis.TransformButtonLocation);
        if(tgis.ServerType=="1"){
            return false;
        }

        if(tgis.showType=="3d"&&tgis.ToMapButtonVisibility){
            /*if(tgis.ToMapButtonId){
                earth.removeGUIById(tgis.ToMapButtonId);
                tgis.ToMapButtonId="";
            }*/
            earth.CreateEarthToMapButton();
        }else{
            if(tgis.ToMapButtonId){
                earth.removeGUIById(tgis.ToMapButtonId);
                tgis.ToMapButtonId="";
            }
        }
    };
    tgis.SetTransformButtonRightBottom=function(){
        tgis.TransformButtonLocation="Coordinate_RB";
        if($('#transform_boxDiv').length && $('#transform_boxDiv').length>0)
            $("#transform_boxDiv").attr("class","transform_box "+tgis.TransformButtonLocation);
        if(tgis.ServerType=="1"){
            return false;
        }

        if(tgis.showType=="3d"&&tgis.ToMapButtonVisibility){
            //earth.removeGUIById(tgis.ToMapButtonId);
            earth.CreateEarthToMapButton();
        }else{
            earth.removeGUIById(tgis.ToMapButtonId);
            tgis.ToMapButtonId="";
        }
    };
    /**
     * 根据多个点的坐标确定最佳显示位置和范围
     * @param points
     */
    tgis.setMapExtent=function(points){
        tgis.Map.setMapExtent(points);
        if(tgis.showType=="3d"){
            setTimeout(function(){
                tgis.fromMapToEarth();
            },200);
        }
    };

    ///2017-04-06 fxd 从earth.js考过来的，因为这个函数是tgisServer命名空间
    tgis.StartTrackingSet=function(dynamicId, type) {
        earth.StartTrackingSet(dynamicId, type);
    };
    tgis.getExtent=function(){
        if(tgis.showType=="2d"){
            var bounds=tgis.Map.getBounds();
            var bottom=bounds.minY;
            var left=bounds.minX;
            var top=bounds.maxY;
            var right=bounds.maxX;
            var firstP=tgis.coordPoint(left,bottom);
            var secondP=tgis.coordPoint(left,top);
            var thirdP=tgis.coordPoint(right,top);
            var fourthP=tgis.coordPoint(right,bottom);
            var points=[];
            points.push(firstP);
            points.push(secondP);
            points.push(thirdP);
            points.push(fourthP);
            return points;
        }else{
            var points=earth.getEarthExtent();
            return tgis.transfromVectersToPoints(points);
        }
    };

    /**
     * 创建平台标注
     * @param obj
     * @returns
     */
    tgis.createMarker=function(obj){
        if(isNaN(obj.longitude) || isNaN(obj.latitude) || typeof(obj.longitude)=="undefined" || typeof(obj.latitude)=="undefined"
            || obj.longitude==null || obj.latitude==null || obj.longitude=="" || obj.latitude==""){
            return false;
        }
        if(tgis.ServerType!="2"){
            var mapMarker=tgis.Map.createMarker(obj);
            if(mapMarker){
                obj.mapObj=mapMarker;
            }
        }
        if(tgis.ServerType!="1") {
            if (obj.createEarthObj == null || obj.createEarthObj == true) {
                var earthObj = tgis.Earth.createMarker(obj);
                if (earthObj) {
                    obj.earthObj = earthObj;
                }
            }
        }
        obj.moveTo=function(lon,lat){
            obj.longitude=lon;
            obj.latitude=lat;
            if(obj.mapObj){
                obj.mapObj.moveTo(lon, lat);
            }
            if(obj.earthObj){
                var transform=obj.earthObj.SphericalTransform;
                var alt=earth.MeasureTerrainAltitude(lon,lat);
                transform.SetLocationEx(lon,lat,alt);
            }
        };
        return obj;
    };
    tgis.Event.AddMarkerClickEvent=function(marker,callback){//
        //处理二维
        var mapMarker=marker.mapObj;
        if(mapMarker){
            tgis.Map.Event.addMarkerClickEvent(mapMarker,callback);
        }
        var mapLabel=marker.labelObj;
        if(mapLabel){
            tgis.Map.Event.addMarkerClickEvent(mapLabel,callback);
        }
        //处理三维
        var earthMarker=marker.earthObj;
        if(earthMarker){
            tgis.Earth.addMarkerClickEvent(earthMarker,callback);
        }
    };

    tgis.Event.pointCreateEvent=function(callback){
        tgis.ClearOperation();
        if(tgis.showType=="2d" && tgis.ServerType!="2"){
            tgis.Map.drawPointEvent(callback);
        }
        if(tgis.showType=="3d" && tgis.ServerType!="1"){
            tgis.Earth.createPointEvent(function(vector3){
                if(vector3&&vector3.Longitude){
                    /* var dpoint=transfromToWgs(vector3.Longitude,vector3.Latitude,vector3.Altitude);*/
                    var point=tgis.coordPoint(vector3.Longitude,vector3.Latitude,vector3.Altitude);
                    if(callback!=null&&typeof(callback)=="function")callback(point);
                }
            });
        }
    };
    tgis.Event.polylineCreateEvent=function(callback){
        tgis.ClearOperation();
        if(tgis.showType=="2d" && tgis.ServerType!="2"){
            tgis.Map.drawPolylineEvent(function(lnglats){
                var points=tgis.transfromVerticesToPoints(lnglats);
                if(callback&&typeof(callback)=="function")callback(points);
            });
        }
        if(tgis.showType=="3d" && tgis.ServerType!="1"){
            tgis.Earth.createPolylineEvent(function(points){
                /*var pValWgs84=transfromToWgsVecs(pVal);*/
                //var points=tgis.transfromVectersToPoints(pVal);
                if(callback!=null&&typeof(callback)=="function")callback(points);
            });
        }
    };
    tgis.Event.polygonCreateEvent=function(callback){
        tgis.ClearOperation();
        if(tgis.showType=="2d" && tgis.ServerType!="2"){
            tgis.Map.drawPolygonEvent(function(lnglats){
                var points=tgis.transfromVerticesToPoints(lnglats);
                if(points.length<3)return;
                if(callback&&typeof(callback)=="function")callback(points);
            });
        }
        if(tgis.showType=="3d" && tgis.ServerType!="1"){
            tgis.Earth.createPolygonEvent(function(points){
                if(callback!=null&&typeof(callback)=="function")callback(points);
            });
        }
    };
    tgis.Event.circleCreateEvent=function(callback){
        tgis.ClearOperation();
        if(tgis.showType=="2d" && tgis.ServerType!="2"){
            tgis.Map.drawCircleEvent(function(pval){
                if(callback&&typeof(callback)=="function")callback(pval);
            });
        }
        if(tgis.showType=="3d" && tgis.ServerType!="1"){
            tgis.Earth.createCircleEvent(function(pVal){
                if(pVal==null)return;
                var pobj={};
                pobj.lon=pVal.Longitude;
                pobj.lat=pVal.Latitude;
                pobj.alt=pVal.Altitude;
                pobj.radius=pVal.Radius;
                if(callback!=null&&typeof(callback)=="function")callback(pobj);
            });
        }
    };
    tgis.Event.drawPlotArrowEvent=function(objType, callback){
        tgis.ClearOperation();
        if(tgis.showType=="2d" && tgis.ServerType!="2") {

            tgis.Map.drawPlotArrowEvent(objType, function(pval){
                if(callback&&typeof(callback)=="function")callback(pval);
            });
        }
        if(tgis.showType=="3d" && tgis.ServerType!="1"){
            tgis.Earth.createPlotArrowEvent(objType, function(points){
                if(callback!=null&&typeof(callback)=="function")callback(points);
            });
        }
    };

    tgis.createCircle=function(obj){
        if(isNaN(obj.longitude) || isNaN(obj.latitude) || typeof(obj.longitude)=="undefined" || typeof(obj.latitude)=="undefined"
            || obj.longitude==null || obj.latitude==null || obj.longitude=="" || obj.latitude==""){
            return false;
        }
        if(isNaN(obj.radius) || typeof(obj.radius)=="undefined" || obj.radius==null || obj.radius==""){
            return false;
        }
        obj.lineopacity=1;
        if(tgis.ServerType!="2"){
            var mapObj=tgis.Map.createCircle(obj);
            obj.mapObj=mapObj;
        }
        if(tgis.ServerType!="1"){
            var earthObj=tgis.Earth.createCircle(obj);
            if(earthObj){
                obj.earthObj=earthObj;
            }
        }
        return obj;
    };
    /**
     * 创建军标对象
     * @param obj
     */
    tgis.createPlotArrow=function(obj) {
        var checkIsNumber=false;
        for(var i=0;i<obj.points.length;i++){
            var point = obj.points[i];
            if(isNaN(point.lon) || isNaN(point.lat) || typeof(point.lon)=="undefined" || typeof(point.lat)=="undefined" || point.lon==null || point.lat==null || point.lon=="" || point.lat==""){
                checkIsNumber=true;
            }
        }
        if(checkIsNumber){
            return false;
        }
        if(!obj.lineOpacity)obj.lineOpacity=1;
        if(!obj.fillOpacity)obj.fillOpacity=1;
        var points = transfromPointsToTLngLats(obj.points);
        obj.mapPoints=points;

        if(tgis.ServerType!="2" && tgis.showType=="2d"){
            obj.type = _getPlotArrowType(obj.type);
            var mapObj = tgis.Map.createPlotArrow(obj);
            obj.mapObj=mapObj;
        }

        if(tgis.ServerType!="1" && tgis.showType=="3d"){
            if(obj.createEarthObj==null||obj.createEarthObj==true){
                points = earth.transfromPointsToVecs(obj.points);
                obj.earthPoints=points;
                var earthObj = tgis.Earth.createPlotArrow(obj);
                obj.earthObj=earthObj;
            }
        }
        obj.ShowHighLight=function(){
            if(tgis.showType=="3d"&&obj.earthObj){
                obj.earthObj.ShowHighLight();
            }
        };
        return obj;
    };
    /**
     * 修改地图中的线面对象
     * @param
     */
    tgis.Event.FeatureModifyEvent=function(callback){
        if(tgis.showType=="2d" && tgis.ServerType!="2"){
            tgis.ClearOperation();
            tgis.Map.FeatureModifyEvent(function(pval){
                if(callback&&typeof(callback)=="function")callback(pval);
            });
        }
    };
    /**
     * 移除修改二维地图线面对象的控件
     */
    tgis.Event.RemoveModifyFeatureEvent=function(){
        if(tgis.showType=="2d" && tgis.ServerType!="2"){
            tgis.Map.RemoveModifyFeatureEvent();
        }
    };
    /**
     * 移动二维地图中的点线面对象
     * @param
     */
    tgis.Event.FeatureMoveEvent=function(callback){
        if(tgis.showType=="2d" && tgis.ServerType!="2"){
            tgis.ClearOperation();
            tgis.Map.FeatureMoveEvent(function(pval){
                if(callback&&typeof(callback)=="function")callback(pval);
            });
        }
    };
    /**
     * 去除移动二维地图点线面对象的控件
     * @param
     */
    tgis.Event.RemoveFeatureMoveEvent=function(){
        if(tgis.showType=="2d" && tgis.ServerType!="2"){
            tgis.Map.RemoveFeatureMoveEvent();
        }
    };

    /**
     * 转化地图坐标到points
     * @param points
     * @returns {Array}
     */
    tgis.transfromVerticesToPoints= function(vertices){
        var newpoints = [];
        for(var i=0;i<vertices.length;i++){
            var lnglat=vertices[i];
            var point=tgis.coordPoint(lnglat.x,lnglat.y);
            newpoints.push(point);
        }
        return newpoints;
    }
    /**
     * 三维球坐标转换到points
     * @param vector3s
     * @returns {Array}
     */
    tgis.transfromVectersToPoints=function(vector3s){
        var newpoints = [];
        for(var i=0;i<vector3s.Count;i++){
            var point=tgis.coordPoint(vector3s.Items(i).x,vector3s.Items(i).y,vector3s.Items(i).z);
            newpoints.push(point);
        }
        return newpoints;
    }

    tgis.transfromFromPointsToStr=function(points){
        var str="";
        for(var i = 0; i < points.length; i++){//把数据加到vector中
            var point=points[i];
            if(point.alt)
                str+=point.lon+","+point.lat+","+point.alt+";";
            else
                str+=point.lon+","+point.lat+",0;";
        }
        str=str.substring(0, str.length-1);
        return str;
    };
    tgis.transfromPointToStr=function (Points) {
        var str="(";
        for(var i = 0; i < Points.length; i++){//把数据加到vector中
            var point=Points[i];
            str+=point.lon+",";
            if(point.alt){
                str+=point.lat+",";
                str+=point.alt+");(";
            }else{
                str+=point.lat+");(";
            }
        }
        if(str.length>3){
            str=str.substring(0,str.length-2);
        }
        return str;
    }
    tgis.transfromStrToPoint=function(str){
        var list=[];
        if(str==""||str==null)return list;
        try{
            var strArr=str.split(";");
            for(var i = 0; i < strArr.length; i++){//把数据加到vector中
                var subStr=strArr[i];
                var subStrArr=subStr.split(",");
                var lon=subStrArr[0];
                var lat=subStrArr[1];
                var alt;
                if(subStrArr.length>2)
                    alt=subStrArr[2];
                var point={};
                point.lon=lon;
                point.lat=lat;
                point.alt=alt;
                list.push(point);
            }
            return list;
        }catch(e){
            return list;
        }
    };
    /**
     * 创建平台矢量线
     * @param obj
     * @returns
     */
    tgis.createPolyline=function(obj){
        var checkIsNumber=false;
        for(var i=0;i<obj.points.length;i++){
            var point = obj.points[i];
            if(isNaN(point.lon) || isNaN(point.lat) || typeof(point.lon)=="undefined" || typeof(point.lat)=="undefined" || point.lon==null || point.lat==null || point.lon=="" || point.lat==""){
                checkIsNumber=true;
            }
        }
        if(checkIsNumber){
            return false;
        }
        var points = tgis.Map.transfromPointsToTLngLats(obj.points);
        obj.mappoints=points;
        if(tgis.ServerType!="2"){
            var mapObj = tgis.Map.createPolyline(obj);
            obj.mapObj=mapObj;
        }
        if(tgis.ServerType!="1"){
            if(obj.createEarthObj==null||obj.createEarthObj==true){
                points = earth.transfromPointsToVecs(obj.points);
                obj.earthpoints=points;
                var earthObj=tgis.Earth.createPolyline(obj);
                obj.earthObj=earthObj;
            }
        }
        obj.ShowHighLight=function(){
            if(tgis.showType=="3d"&&obj.earthObj){
                obj.earthObj.ShowHighLight();
            }
        };
        return obj;
    };
    /**
     * 创建平台矢量面
     * @param obj
     * @returns
     */
    tgis.createPolygon=function(obj){
        var checkIsNumber=false;
        for(var i=0;i<obj.points.length;i++){
            var point = obj.points[i];
            if(isNaN(point.lon) || isNaN(point.lat) || typeof(point.lon)=="undefined" || typeof(point.lat)=="undefined" || point.lon==null || point.lat==null || point.lon=="" || point.lat==""){
                checkIsNumber=true;
            }
        }
        if(checkIsNumber){
            return false;
        }
        if(obj.lineOpacity==null)obj.lineOpacity=1;
        if(obj.fillOpacity==null)obj.fillOpacity=1;
        var points = tgis.Map.transfromPointsToTLngLats(obj.points);
        obj.mappoints=points;
        if(tgis.ServerType!="2"){
            var mapObj = tgis.Map.createPolygon(obj);
            obj.mapObj=mapObj;
        }
        if(tgis.ServerType!="1"){
            if(obj.createEarthObj==null||obj.createEarthObj==true){
                points = earth.transfromPointsToVecs(obj.points);
                obj.earthpoints=points;
                var earthObj=tgis.Earth.createPolygon(obj);
                obj.earthObj=earthObj;
            }
        }
        obj.ShowHighLight=function(){
            if(tgis.showType=="3d"&&obj.earthObj){
                obj.earthObj.ShowHighLight();
            }
        };
        return obj;
    };
    /**
     * 创建军标对象
     * @param obj
     */
    tgis.createPlotArrow=function(obj) {
        var checkIsNumber=false;
        for(var i=0;i<obj.points.length;i++){
            var point = obj.points[i];
            if(isNaN(point.lon) || isNaN(point.lat) || typeof(point.lon)=="undefined" || typeof(point.lat)=="undefined" || point.lon==null || point.lat==null || point.lon=="" || point.lat==""){
                checkIsNumber=true;
            }
        }
        if(checkIsNumber){
            return false;
        }
        if(!obj.lineOpacity)obj.lineOpacity=1;
        if(!obj.fillOpacity)obj.fillOpacity=1;
        var points = tgis.Map.transfromPointsToTLngLats(obj.points);
        obj.mapPoints=points;

        if(tgis.ServerType!="2" && tgis.showType=="2d"){
            obj.type = _getPlotArrowType(obj.type);
            var mapObj = Map.createPlotArrow(obj);
            mapObjArr.push(mapObj);
            obj.mapObj=mapObj;
        }

        if(tgis.ServerType!="1" && tgis.showType=="3d"){
            if(obj.createEarthObj==null||obj.createEarthObj==true){
                points = earth.transfromPointsToVecs(obj.points);
                obj.earthPoints=points;
                var earthObj = earth.createPlotArrow(obj);
                obj.earthObj=earthObj;
            }
        }
        obj.ShowHighLight=function(){
            if(tgisServer.showType=="3d"&&obj.earthObj){
                obj.earthObj.ShowHighLight();
            }
        };
        return obj;
    };
//添加二维地图对象选择控件
    tgis.getObjEvent=function(callback){
        //二维的处理
        if(tgis.showType=="2d"){
            tgis.Map.getObjEvent(function (mapObj) {
                if(mapObj){
                    var ptObj={};
                    ptObj.mapObj=mapObj;
                    if(tgis.ServerType!="1"){
                        var earthObj=tgis.Earth.getEarthObj(mapObj.id);
                        ptObj.earthObj=earthObj;
                    }
                    ptObj.name=mapObj.name;
                    ptObj.id=mapObj.id;
                    callback(ptObj);
                }
            });
        }
        //三维的处理
        if(tgis.showType=="3d"){
            tgis.Earth.Event.addSelectEvent(function(){
                if(tgis.Earth.SelectSet.GetCount()>0){
                    var earthObj=tgis.Earth.SelectSet.GetObject(0);
                    var ptObj={};
                    if(tgis.ServerType!="2"){
                        var mapObj=tgis.Map.getMapObj(earthObj.Guid);
                        ptObj.mapObj=mapObj;
                    }
                    ptObj.earthObj=earthObj;
                    ptObj.name=earthObj.Name;
                    ptObj.id=earthObj.Guid;
                    tgis.Earth.SelectSet.Clear();
                    tgis.Earth.Browse();
                    callback(ptObj);
                }
            });
            tgis.Earth.select();
        }
    };
    tgis.unGetObjEvent=function(){
        if(tgis.ServerType!="2"){
            tgis.Map.unGetObjEvent();
        }
        if(tgis.ServerType!="1"){
            tgis.Earth.Browse();
        }
    };

    tgis.ClearAllObjs=function(){
        //2017-03-30 fxd
        if(tgis.ServerType!="2"){
            tgis.Map.ClearAllObjs();
        }
        if(tgis.ServerType!="1"){
            tgis.Earth.ClearAllObjs();
        }
    };
    tgis.removeObj=function(obj){
        var id=obj.id;
        if(obj.mapObj){
            tgis.Map.removeObj(obj.mapObj);
        }
        if(obj.earthObj){
            try{
                tgis.Earth.removeObj(obj.earthObj);
            }catch (e){

            }
        }
    };
    tgis.setObjVisibility=function(obj,value){
        if(obj.earthObj){
            tgis.Earth.setObjVisibility(obj.earthObj,value);
            /* obj.earthObj.Visibility=value;*/
        }

        if(obj.mapObj){
            tgis.Map.setObjVisibility(obj.earthObj,value);
        }
    };
    tgis.getObjVisibility=function(obj){
        if(obj.earthObj)
            return obj.earthObj.Visibility;
    };
    tgis.openDialog=function(config){
        if(config.width==null)config.width=400;
        if(config.height==null)config.height=200;
        if(config.title==null)config.title="对话框";
        var html='<iframe  style="position:absolute;z-index:99;background:none;border:none;width:'+config.width+'px; height: '+config.height+'px; top:'+config.top+'px;left:'+config.left+'px;scrolling: no;cursor:move;"></iframe>';
        if(config.html)
            html+='<div style="position:absolute;z-index:99999;background-color:white;width:'+config.width+'px; height: '+config.height+'px; top:'+config.top+'px;left:'+config.left+'px;cursor:move;">'+config.html+'</div>';
        else if(config.url){
            html+='<div style="position:absolute;z-index:9999;background-color:white;width:'+config.width+'px; height: '+config.height+'px; top:'+config.top+'px;left:'+config.left+'px;cursor:move;">'
                +'<iframe  style="width:100%;height:100%;scrolling:no;" src="'+config.url+'"></iframe></div>';
        }
        var id=tgis.createGuid();
        var dialogHtml="<div id="+id+" style='background-color:white;'></div>";
        $('#gisServerDialogDiv').append(dialogHtml);
        $('#'+id).html(html);
        var obj={};
        obj.id=id;
        obj.html=html;
        obj.parameter=config;//将窗体的各个参数返回
        return obj;
    };

    tgis.openDialog1=function(config){
        if(config.width==null)config.width=400;
        if(config.height==null)config.height=200;
        if(config.title==null)config.title="对话框";
        var html='<iframe  style="position:absolute;z-index:99;background:none;border:none;width:'+config.width+'px; height: '+config.height+'px; top:'+config.top+'px;left:'+config.left+'px;scrolling: no;"></iframe>';
        if(config.html) {
            html += '<div class="Popup-box" style="position:absolute;z-index:99999;width:' + config.width + 'px; height: ' + config.height + 'px; top:' + config.top + 'px;left:' + config.left + 'px;">'
                +'<div class="box-tittle" style="height:36px;">'
                +config.title+ '<div class="box-btn" id="'+id+'_1"> <div class="box-inner" > <div class="inne" ></div></div></div></div>'+config.html+'</div>';
        }else if(config.url){
            var id=tgis.createGuid();
            html+='<div class="Popup-box" style="position:absolute;z-index:9999;width:'+config.width+'px; height: '+config.height+'px; top:'+config.top+'px;left:'+config.left+'px;">'+'<div class="box-tittle" style="height:36px;">'
                +config.title+'<div class="box-btn" id="'+id+'_1"> <div class="box-inner" > <div class="inne" ></div></div></div></div>'+'<iframe  style="width:100%;height:100%;" src="'+config.url+'"></iframe>';
            /*html+='<div style="position:absolute;z-index:9999;background:none;border:none;width:'+config.width+'px; height: '+config.height+'px; top:'+config.top+'px;left:'+config.left+'px;">'
             +'<iframe  style="width:100%;height:100%;scrolling:no;" src="'+config.url+'"></iframe></div>';*/
        }
        var dialogHtml="<div id="+id+" style='background-color:white;'></div>";
        $('#gisServerDialogDiv').append(dialogHtml);
        $('#'+id).html(html);
        var obj={};
        obj.id=id;
        obj.html=html;
        $("#"+id+"_1").click(function(){
            tgis.closeDialog(obj);
        });
        return obj;
    };
    tgis.closeDialog=function(obj){
        if(obj){
            $('#'+obj.id).remove();
        }else{
            $('#gisServerDialogDiv').html("");
        }
    };
    tgis.closeDialogFor2d=function(){
        $('#gisServerDialogDiv').dialog('close');
    };

    var  EARTH_RADIUS = 6378.137;//地球半径
    function _rad( d){
        return d * Math.PI / 180.0;
    }
    /**
     * 获取两个经纬度点之间的距离
     * @param lat1
     * @param lng1
     * @param lat2
     * @param lng2
     * @returns {number}
     * @private
     */
    function _GetLonLatDistance( lat1,  lng1,  lat2,  lng2){
        var radLat1 = _rad(lat1);
        var radLat2 = _rad(lat2);
        var a = radLat1 - radLat2;
        var b = _rad(lng1) - _rad(lng2);
        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) +
            Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
        s = s * EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000;
        return s;
    }
    function _getDistanceForTwoPoints(x1,y1,x2,y2) {
        var x1 = eval(x1);   // 第一个点的横坐标
        var y1 = eval(y1);   // 第一个点的纵坐标
        var x2 = eval(x2);   // 第二个点的横坐标
        var y2 = eval(y2);   // 第二个点的纵坐标
        var xdiff = x2 - x1;            // 计算两个点的横坐标之差
        var ydiff = y2 - y1;            // 计算两个点的纵坐标之差
        return Math.pow((xdiff * xdiff + ydiff * ydiff), 0.5);   // 计算两点之间的距离，并将结果返回表单元素
    }
    /** yqc-2016.12.18
     * 根据圆心坐标和半径长度，将圆转成面坐标集合
     * center:[x,y]，x:经度，y:纬度
     * radius:半径，单位：米
     * 返回值:points{lon:经度，lat:纬度}
     */
    tgis.transformFromCircleToPoints=function(center,radius){
        var size = 111000 * Math.cos(center.lat);
        var lonlatRadius = radius / size;
        var points = [];
        for(var i = 0; i < 360; i += 6) {
            var x = Math.cos(Math.PI / 180 * i) * lonlatRadius + center.lon;
            var y = Math.sin(Math.PI / 180 * i) * lonlatRadius + center.lat;
            points.push({lon:x, lat:y});
        }
        return points;
    }




    //////////////////////////////////
//2017-04-12 fxd 从route.js移动进来的
    tgis.layerManagerOperate=function(type, callback, fileName){
        var url = "";
        if(type=="getFile"){
            url = tgis.ServerPath+ 'servlet/UploadifyServlet?requestType=getFile';
        }else if(type=="deleteFile"){
            if(!fileName){
                alert("文件名无效！");
                return false;
            }
            fileName = encodeURI(fileName);
            url = tgis.ServerPath + 'servlet/UploadifyServlet?requestType=deleteFile&fileName=' + fileName;
        }
        url = encodeURI(url);
        $.ajax({
            type: 'get',
            url: url,
            processData: false,
            dataType: 'jsonp',
            success: function(data){
                if(data.files && data.files.length>=0){
                    if(callback && typeof(callback)=="function"){
                        callback(data);
                    }
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                alert("操作失败！");
            }
        });
    };
    tgis.saveParameter=function(earthip,earthindex,vectorMapPath,satelliteMapPath,noramicPath,xmlip,baseLon,baseLat,baseZoom,vectorMapType,callback){
        var ls_url=tgis.ServerPath+"gisServer/jsp/dataServer.jsp?cmd=saveparameter&earthip="+earthip+"&earthindex="+earthindex+"&vectorMapPath="+vectorMapPath+"&satelliteMapPath="+satelliteMapPath+"&panoramicPath="+noramicPath+"&xmlip="+xmlip+"&baseLon="+baseLon+"&baseLat="+baseLat+"&baseZoom="+baseZoom+"&vectorMapType="+vectorMapType;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(data.rt=="0") {
                    alert("保存成功，确认跳转");
                    if(callback!=null&&typeof(callback)=="function")callback(true);
                } else {
                    alert("保存失败，可能文件格式不对");
                }
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    /**
     * 通过后台查询shp文件所有坐标点，可进行抽希
     * @param layerName 图层名称
     * @param callback  回调函数
     */
    tgis.getGeoJsonFromLayer=function(layerName, callback){
        var layer = layerName ? layerName : "siping";
        layer = encodeURI(layer);
        var ls_url = tgis.ServerPath+ "GeoServer?cmd=getLayerCoords&layname=" + layer;
        ls_url = encodeURI(ls_url);
        $.ajax({
            type: 'get',
            url: ls_url,
            dataType: 'jsonp',
            processData: false,
            success: function(data){
                if(data && data.path){
                    if(callback!=null&&typeof(callback)=="function")callback(data);
                }
            },
            error: function(result){
                if(callback!=null&&typeof(callback)=="function")callback("获取出错！");
            }
        });
    };
    /**
     * 通过坐标获取桩号
     * @param lon
     * @param lat
     * @param callback
     * @returns
     */
    tgis.getZhForRoute=function(lon,lat,tole,callback,layerName){
        if(!layerName)layerName="Route";
        layerName=encodeURI(layerName);
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=getzh&layname="+layerName+"&x="+lon+"&y="+lat+"&tole="+tole;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    /***
     * 分析线面相交结果
     * @param roadCode
     * @param zh
     * @param callback
     * @private
     */
    tgis.IntersectionForPolygonAndLine=function(polygonpoints,linepoints,callback){
        var layerName="test";
        layerName=encodeURI(layerName);
        //var ls_url=tgis.ServerPath+ "gisServer?cmd=intersection&layname="+layerName+"&polygonpoints="+polygonpoints+"&linepoints="+linepoints;
        var ls_url=tgis.ServerPath+ "gisServer";
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            type:'post',
            data:{"cmd":"intersection","layname":layerName,"polygonpoints":polygonpoints,"linepoints":linepoints},
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data.COORDS);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    /***
     * 分析面面相交结果
     * @param roadCode
     * @param zh
     * @param callback
     * @private
     */
    tgis.IntersectionForPolygonAndPolygon=function(polygonpoints1,polygonpoints2,callback){
        var layerName="test";
        layerName=encodeURI(layerName);
        // var ls_url=tgis.ServerPath+ "gisServer?cmd=IntersectionForPolygonAndPolygon&polygonpoints1="+polygonpoints1+"&polygonpoints2="+polygonpoints2;
        var ls_url=tgis.ServerPath+ "gisServer";
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            type:'post',
            data:{"cmd":"IntersectionForPolygonAndPolygon","polygonpoints1":polygonpoints1,"polygonpoints2":polygonpoints2},
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data.COORDS);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    /***
     * 线的点集缓冲成面的点集
     * @param roadCode
     * @param zh
     * @param callback
     * @private
     */
    tgis.lineBufferPolygon=function(distance,linepoints,callback){
        var layerName="test";
        layerName=encodeURI(layerName);
        //var ls_url=tgis.ServerPath+ "gisServer?cmd=linebufferpolygon&layname="+layerName+"&distance="+distance+"&linepoints="+linepoints;
        var ls_url=tgis.ServerPath+ "gisServer";
        ls_url=encodeURI(ls_url);

        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            //processData: false,
            type:'post',
            data: {"cmd": "linebufferpolygon", "layname": layerName,"distance":distance,"linepoints":linepoints},
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data.COORDS);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    /***
     * 线的点集缓冲成面的点集
     * @param roadCode
     * @param zh
     * @param callback
     * @private
     */
    tgis.polygonBufferPolygon=function(distance,points,callback){
        var layerName="test";
        layerName=encodeURI(layerName);
        //var ls_url=tgis.ServerPath+ "gisServer?cmd=polygonBufferPolygon&layname="+layerName+"&distance="+distance+"&points="+points;
        var ls_url=tgis.ServerPath+ "gisServer?cmd=polygonBufferPolygon&layname="+layerName+"&distance="+distance+"&points="+points;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            type:'post',
            data: {"cmd": "polygonBufferPolygon", "layname": layerName,"distance":distance,"points":points},
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data.COORDS);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    /***
     * 通过桩号获取坐标
     * @param roadCode
     * @param zh
     * @param callback
     * @private
     */
    tgis.getXYFormZH=function(roadCode,zh,callback,layerName){
        if(!layerName)layerName="Route";
        layerName=encodeURI(layerName);
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=getzhxy&layname="+layerName+"&roadcode="+roadCode+"&zh="+zh;
        ls_url=encodeURI(ls_url);

        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    //根据起止点桩号获取坐标点集。
    tgis.getZhPointsForRoute=function(roadcode,startNum,endNum,offsetDis,cxDis,callback,layerName){
        if(!layerName)layerName="Route";
        layerName=encodeURI(layerName);
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=getzhpoints&layname="+layerName+"&rodecode="+roadcode+"&start="+startNum+"&end="+endNum+"&offset="+offsetDis+"&cx="+cxDis;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data.COORDS);
            },
            error:function(XMLHttpRequest, textStatus, errorThrown) {
                if(callback!=null&&typeof(callback)=="function")callback(null);
            }});
    };
    //修改点图层的路线代码和桩号属性
    tgis.alertPointRoute=function(layerName,tole,pointLayer,callback){
        if(!layerName)layerName="Route";
        layerName=encodeURI(layerName);
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=alertPointRoute&layname="+layerName+"&tole="+tole+"&pointLayer="+pointLayer;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data.url);
            },
            error:function(XMLHttpRequest, textStatus, errorThrown) {
                if(callback!=null&&typeof(callback)=="function")callback(null);
            }});
    };
    tgis.download=function (callback) {
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=download&layname="+"Jie"+"&tole="+0.01;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error:function(XMLHttpRequest, textStatus, errorThrown) {
                if(callback!=null&&typeof(callback)=="function")callback(null);
            }});
    }
    //查询行政区图层面积
    tgis.getAreaFromsql=function(layerName,sql,bool,callback){
        if(!layerName)layerName="Route";
        layerName=encodeURI(layerName);
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=getLayerArea&layname="+layerName+"&sql="+sql+"&bool="+bool;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };

    tgis.getIdentify=function(layerName,lon,lat,tole,callback){
        if(!layerName)layerName="Route";
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=Identify&layname="+layerName+"&x="+lon+"&y="+lat+"&tole="+tole;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    tgis.getTgisIdentify=function(lon,lat,tole,callback){
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=tgisIdentify&x="+lon+"&y="+lat+"&tole="+tole;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    //空间查询（通过左上和右下两个点）
    tgis.spaceQuery=function(layerName,lon,lat,tole,callback){
        if(!layerName)layerName="Route";
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=spaceQuery&layname="+layerName+"&x="+lon+"&y="+lat+"&tole="+tole;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    //关键字查询（通过道路代码）
    tgis.keyQuery=function(layerName,roadCode,callback){
        if(!layerName)layerName="Route";
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=keyQuery&layname="+layerName+"&roadcode="+roadCode;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    //点查找
    tgis.pointQuery=function(layerName,x,y,tole,callback){
        if(!layerName)layerName="Route";
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=pointQuery&layname="+layerName+"&x="+x+"&y="+y+"&tole="+tole;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    //多边形查找
    tgis.polygonQuery=function(layerName,points,callback){
        if(!layerName)layerName="Route";
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=polygonQuery&layname="+layerName+"&points="+points;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    //圆形查询（通过道路代码）
    tgis.circleQuery=function(layerName,x,y,tole,callback){
        if(!layerName)layerName="Route";
        var ls_url=tgis.ServerPath+ "GeoServer?cmd=circleQuery&layname="+layerName+"&x="+x+"&y="+y+"&tole="+tole;
        ls_url=encodeURI(ls_url);
        $.ajax({
            url:ls_url,
            dataType:'jsonp',
            processData: false,
            type:'get',
            success:function(data){
                if(callback!=null&&typeof(callback)=="function")callback(data);
            },
            error : function(result){
                if(callback!=null&&typeof(callback)=="function")callback("无返回结果");
            }
        });
    };
    return tgis;
});