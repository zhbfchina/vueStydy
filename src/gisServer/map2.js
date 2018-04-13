define( ['ol2','ol2ShowZoom','ol2ArcGISCacheXiaoxie',"mapEvent","config","common","jquery"], function(ol2,ol2ShowZoom,ol2ArcGISCacheXiaoxie, Event, config, common, $){
    var imageType='jpg';
    var mapResolutions = [1,1,0.3515625,0.17578125,0.087890625,0.0439453125,0.02197265625,0.010986328125,0.0054931640625,0.00274658203125,0.001373291015625,0.0006866455078125,0.00034332275390625,0.000171661376953125,8.58306884765625E-05,4.291534423828125E-05,2.1457672119140625E-05,1.0728836059570312E-05,5.364418029785156E-06];
    var proj = 'EPSG:4326';
    var mapObjArr=[];//Arr是用来存放已经创建的对象
    var mouseStatic="normal";//用于记录鼠标的使用状态
    var Map=new Object();
    Map.StartFinished=null;
    Map.Event=Event;
    Map.mapDiv="yysTGisServerMapCtrDiv";//二维地图对象div
    var _map=null;
    //初始化地图数据
    Map.initMap=function(ServerType){
        var tileSize = new OpenLayers.Size(256,256);
        var mapExtent = new OpenLayers.Bounds(71.3671875,8.7890625,136.7578125,53.96484375);
        _map = new OpenLayers.Map(Map.mapDiv, {
            minResolution:"auto",
            maxExtent:mapExtent,//对ie无效
            displayProjection:proj,
            controls: [new OpenLayers.Control.Navigation()]
        });
        var agsTileOrigin = new OpenLayers.LonLat(-180,90);
        Map.roadmapLayer = new OpenLayers.Layer.ArcGISCacheXiaoxie( "电子地图", config.vectorMapPath, {
            type: imageType,
            resolutions: mapResolutions,
            isBaseLayer: true,
            tileSize: tileSize,
            sphericalMercator: true,
            useArcGISServer: false,
            tileOrigin: agsTileOrigin,
            maxExtent: mapExtent,
            projection: proj
        });
        Map.satelliteLayer = new OpenLayers.Layer.ArcGISCacheXiaoxie( "影像地图", config.satelliteMapPath, {
            type: imageType,
            resolutions: mapResolutions,
            sphericalMercator: true,
            useArcGISServer: false,
            tileSize: tileSize,
            tileOrigin: agsTileOrigin,
            maxExtent: mapExtent,
            projection: proj
        });
        //目前左键按下事件无效，未找到ol2版左键事件，此方法仅支持右键事件
        _map.events.register("mousedown", _map, function(event){
            if(((event.which) && (event.which == 1)) ||((event.button) && (event.button == 0))||((event.button) && (event.button == 1))){
                event.pixel = [event.x, event.y];
                var lonlat = _map.getLonLatFromPixel(new OpenLayers.Pixel(event.x, event.y));
                var coord = [lonlat.lon, lonlat.lat];
                event.coordinate = coord;
                setTimeout(function () {
                    if(mouseStatic=="normal"){
                        Event.MousrLeftKeyDown(event);
                    }
                },50);
            }
        },true);
        _map.events.register("mouseup", _map, function(event){
            if(((event.which) && (event.which == 3)) ||((event.button) && (event.button == 2))){
                event.pixel = [event.x, event.y];
                var lonlat = _map.getLonLatFromPixel(new OpenLayers.Pixel(event.x, event.y));
                var coord = [lonlat.lon, lonlat.lat];
                event.coordinate = coord;
                if(mouseStatic=="normal"){
                    Event.MouseRightUp(event);
                }else{
                    Map.operateRightKeyMouseStatic();
                }
            }
            if(((event.which) && (event.which == 1)) ||((event.button) && (event.button == 0))||((event.button) && (event.button == 1))){
                event.pixel = [event.x, event.y];
                var lonlat = _map.getLonLatFromPixel(new OpenLayers.Pixel(event.x, event.y));
                var coord = [lonlat.lon, lonlat.lat];
                event.coordinate = coord;
                if(mouseStatic=="normal"){
                    setTimeout(function () {
                        Event.MouseLeftUp(event);

                    },60);
                }else{
                    Map.operateLeftKeyMouseStatic();
                }
            }
        });

        var layerListeners = {
            featureclick: function(e) {
                Event.VectorLayerClickEvent(e.feature);
                return false;
            },
            nofeatureclick: function(e) {/*没有点中要素，点中图层触发*/}
        };
        var renderer = OpenLayers.Layer.Vector.prototype.renderers;
        renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
        renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;
        //标注图层处理
        Map.vectorLayer = new OpenLayers.Layer.Vector("矢量图层", {
            renderers: renderer,
            tileSize: tileSize,
            eventListeners:layerListeners
        });

        _map.addLayers([Map.roadmapLayer,Map.satelliteLayer,Map.vectorLayer]);
        _map.zoomToExtent(mapExtent);

        //添加鼠标位置控件
         Map.setMousePositionControl(true);
        //添加地图缩放等级控件
        Map.setShowZoomControl(true);


        //监听地图缩放操作事件，限制其缩放范围
        _map.events.register("zoomend", _map, function(zoom){
            if(zoom){
                if(Map.getZoom()<4){
                    Map.centerAndZoom(105, 34, 4);
                }
            }
        });
    };
    /**
    * 定位地图中心
    * @param lon   经度
    * @param lat   纬度
    * @param level 缩放等级
    */
    Map.centerAndZoom=function(lon,lat,level){
        if(proj=='EPSG:3857'){
            var point = new OpenLayers.Geometry.Point(lon,lat);
            var fromProj = new OpenLayers.Projection("EPSG:4326");
            var toProj = new OpenLayers.Projection("EPSG:900913");
            _map.setCenter(OpenLayers.Projection.transform(point,fromProj,toProj));
            _map.zoomTo(level);
        }else{
            _map.setCenter(new OpenLayers.LonLat(lon,lat),level);
        }
    };
    /**
     * 地图div大小变化时触发，刷新当前mapsize
     * @constructor
     */
    Map.MapChangeUpdate=function(){
        setTimeout(function () {
            _map.updateSize();
        }, 200);
    }
    /**
     * 初始化地图切换按钮容器
     * @constructor
     */
    Map.InitTransformButton=function(){
        if(ToImageButtonVisibility||ToEarthButtonVisibility) {
            var html="";
            html+='<div id="transform_boxDiv" class="transform_box '+TransformButtonLocation+'">';
            if(ToImageButtonVisibility)
                html+='<div class="transform_left"><div class="transform_leftg transform_asp" onClick="transform_qiehuan()">';
            else
                html+='<div class="transform_left" style="display: none"><div class="transform_leftg transform_asp" onClick="transform_qiehuan()">';
            html+=' <img src="'+getGisServerPath+'images/wx.png" id="transform_img">';
            html+=' <a id="transform_sp">卫星</a></div></div><div class="transform_right"><div class="transform_rightg transform_asp" onclick="toEarthView()">';
            html+='  <img src="'+getGisServerPath+'images/sw.png"><a>三维</a> </div></div></div>';
            $('#'+ServerDivId).append(html);
        }
    };
    /**
     * 切换矢量地图
     */
    Map.vectorMap=function(){
        _map.setBaseLayer(Map.roadmapLayer);
        Map.satelliteLayer.isBaseLayer=false;
        mousePositionControl.div.style.color="#000";
        showZoomControl.div.style.color="#000";
    };
    /**
     * 卫星地图
     */
    Map.satelliteMap=function(){
        _map.setBaseLayer(Map.satelliteLayer);
        Map.roadmapLayer.isBaseLayer = false;
        mousePositionControl.div.style.color="#fff";
        showZoomControl.div.style.color="#fff";
    };
//用于关闭地图所有测量、编辑等事件
    Map.ClearOperation=function(){
        //移除测量控件
        Map.RemoveMeasureDraw();
        //移除画图控件
        Map.RemoveDrawFeatureControl();
        //移除画圆控件
        Map.RemoveDrawCircleControl();
        //移除修改对象控件
        Map.RemoveModifyFeatureEvent();
        //移除移动事件
        Map.closeMoveEndEvent();
        //移除缩放事件
        Map.closeZoomEndEvent();
    }
//处理鼠标右击时回调函数
    Map.operateRightKeyMouseStatic=function(){
        if(mouseStatic=="measure"){
            if(Map.measureIndex==1){
                Map.FinishMeasureDraw();
                Map.measureIndex=0;
            }else if(Map.measureIndex==0){
                Map.RemoveMeasureDraw();
            }
        }else  if(mouseStatic=="drawPolyline" || mouseStatic=="drawPolygon"){
            Map.RemoveDrawFeatureControl();
        }else  if(mouseStatic=="modifyFeature" || mouseStatic=="moveFeature"){
            Map.RemoveModifyFeatureEvent();
        }else if(mouseStatic=="drawCircle"){
            Map.RemoveDrawCircleControl();
        }
    }
//处理鼠标左击时回调函数
    Map.operateLeftKeyMouseStatic=function(){
        if(mouseStatic=="drawPoint"){
            mouseStatic="normal";
        }else if(mouseStatic=="drawCircle"){
            if(Map.drawCircleClickIndex==2){
                mouseStatic="normal";
            }
        }
    }
    /**
     * 创建标注pmarker对象
     * @param obj
     */
    Map.createMarker=function(obj){
        var style_mark = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        //设置标注的大小。
        style_mark.fontSize=12;
        //设置标注的X方向的偏移距离。
        if(obj.text&&obj.text.length>0){
            style_mark.labelXOffset=0;
            style_mark.labelYOffset=0;
            //设置标注的文字
            style_mark.label = obj.text;
            style_mark.fillOpacity=0;
            style_mark.strokeOpacity=0;
            var textColor="#000000";
            if(obj.textcolor)textColor=obj.textcolor;
            style_mark.fontColor =textColor;
            var font=obj.font ? obj.font:16;
            style_mark.fontSize = font;
        }
        if(obj.mapicon&&obj.mapicon.length>0){
            style_mark.graphicWidth = obj.width;
            style_mark.graphicHeight = obj.height;
            style_mark.graphicXOffset =-style_mark.graphicWidth/2;
            style_mark.graphicYOffset = -style_mark.graphicHeight/2;
            style_mark.externalGraphic = obj.mapicon;
            style_mark.graphicOpacity=1;
            if(obj.text&&obj.text.length>0){
                style_mark.labelYOffset = -obj.height/2 - 10;
            }
        }
        var Point = new OpenLayers.Geometry.Point(obj.longitude, obj.latitude);
        var Feature = new OpenLayers.Feature.Vector(Point,null,style_mark);
        Feature.id=obj.id;
        Feature.name=obj.name;
        Feature.lon=obj.longitude;
        Feature.lat=obj.latitude;
        Feature.moveTo=function(lon, lat){
            Feature.move(new OpenLayers.LonLat(parseFloat(lon), parseFloat(lat)));
        }
        Map.vectorLayer.addFeatures([Feature]);
        return Feature;
    };

    /**
     * 添加标注数组-Marker gjj 2017-09-20
     */
    Map.createMarkers=function(objs){
        var markers=[];
        for(var i=0;i<objs.length;i++){
            var obj=objs[i];
            var point = new ol2.geom.Point([parseFloat(obj.longitude), parseFloat(obj.latitude)]);
            var Feature = new ol2.Feature({
                geometry: point,
                id: obj.id
            });
            var style_text;
            var style_icon;
            if(obj.text&&obj.text.length>0){
                var font=obj.font ? obj.font:'12';
                var offsetHeight = obj.mapicon ? obj.height:0;
                var offsetFont = obj.font ? obj.font/5-2:0;
                var offsetX=0;
                var offsetY=offsetHeight + offsetFont;
                if(obj.textBerth&&obj.textBerth=="right"){
                    offsetX=(obj.width+obj.text.length*font)/2+10;//文字在左侧
                    offsetY=offsetFont;
                }
                var textColor="#fff";
                if(obj.textcolor)textColor=obj.textcolor;
                style_text = new ol2.style.Text({
                    offsetX: offsetX,//文字在左侧
                    offsetY: offsetY,
                    /* offsetX: 0,//文字在下方
                     offsetY: offsetHeight + offsetFont,*/
                    font: ( font) + 'px SimHei',//黑体
                    text: obj.text,
                    scale: 1,   //字体倍数大小
                    stroke: new ol2.style.Stroke({
                        color:textColor,
                        width: 2
                    })
                });
            }
            if(obj.mapicon&&obj.mapicon.length>0){
                style_icon = new ol2.style.Icon({
                    opacity: 1,
                    color: '#fff',//透明色
                    src: obj.mapicon
                });
            }
            var style_marker = new ol2.style.Style({
                image: style_icon,
                text: style_text
            });
            Feature.setStyle(style_marker);
            Feature.id=obj.id;
            Feature.name=obj.name;
            Feature.lon=obj.longitude;
            Feature.lat=obj.latitude;
            Feature.moveTo=function(lon, lat){
                if(Map.markerLayerSource.getFeatureById(Feature.getId())){
                    Feature.getGeometry().setCoordinates([parseFloat(lon), parseFloat(lat)]);
                }
            };
            Feature.pType="marker";
            Feature.setId(obj.id);
            markers.push(Feature);
        }
        Map.markerLayerSource.addFeatures(markers);
        for(var i=0;i<markers.length;i++){
            mapObjArr.push(markers[i]);
        }
        return markers;
    };


    /**
     * 创建线polyline对象
     * @param obj
     */
    Map.createPolyline=function(obj){
        if(obj.opacity==null)obj.opacity=1;
        var style_mark = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        style_mark.strokeColor=obj.color;
        style_mark.strokeWidth=obj.width;
        var linearRing = new OpenLayers.Geometry.LineString(obj.mappoints);
        var Feature = new OpenLayers.Feature.Vector(linearRing,null,style_mark);
        Feature.id=obj.id;
        Feature.name=obj.name;
        Map.vectorLayer.addFeatures([Feature]);
        return Feature;
    };
    /**
     * 创建面polygon对象
     * @param obj
     */
    Map.createPolygon=function(obj){
        var style_mark = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        style_mark.strokeColor=obj.lineColor;
        style_mark.strokeWidth=obj.lineWidth;
        style_mark.fillColor=obj.fillColor;
        style_mark.strokeOpacity=obj.lineOpacity;
        style_mark.fillOpacity=obj.fillOpacity;
        var linearRing = new OpenLayers.Geometry.LinearRing(obj.mappoints);
        var Feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([linearRing]),null,style_mark);
        Feature.id=obj.id;
        Feature.name=obj.name;
        Map.vectorLayer.addFeatures([Feature]);
        return Feature;
    };
    /**
     * 创建圆Circle对象
     * @param obj
     */
    Map.createCircle=function(obj){
        var size = 112000 * Math.cos(Math.PI / 180 * createCircleEventForMapStartpt.lat);
        var radius = obj.radius / size;
        var angle = Math.PI * ((1/100) - (1/2));

        var rotatedAngle, x, y;
        var points = [];
        for(var i=0; i<100; ++i) {
            rotatedAngle = angle + (i * 2 * Math.PI / 100);
            x = obj.longitude + (radius * Math.cos(rotatedAngle));
            y = obj.latitude + (radius * Math.sin(rotatedAngle));
            points.push(new OpenLayers.Geometry.Point(x, y));
        }
        var style_mark = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        style_mark.strokeColor=obj.linecolor;
        style_mark.strokeWidth=obj.linewidth;
        style_mark.fillColor=obj.fillcolor;
        style_mark.strokeOpacity=obj.lineopacity;
        style_mark.fillOpacity=obj.fillopacity;
        var ring = new OpenLayers.Geometry.LinearRing(points);
        var oobj = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([ring]),null,style_mark);
        oobj.id=obj.id;
        oobj.name=obj.name;
        Map.vectorLayer.addFeatures([oobj]);
        return oobj;
    };
    /**
     * 画点事件
     */
    Map.DrawFeatureComtrol;
    Map.drawPointEvent=function(callback){
        Map.ClearOperation();
        var pointDraw = new OpenLayers.Control.DrawFeature(Map.vectorLayer, OpenLayers.Handler.Point, {
            drawFeature: function(geometry){
                if(geometry){
                    if(Map.DrawFeatureComtrol){
                        Map.DrawFeatureComtrol.deactivate();
                        _map.removeControl(Map.DrawFeatureComtrol);
                        Map.DrawFeatureComtrol = null;
                    }
                    var coord = {};
                    coord.lon =geometry.x;
                    coord.lat = geometry.y;
                    if(callback && typeof(callback)=="function"){
                        callback(coord);
                    }
                }
            }
        });
        _map.addControl(pointDraw);
        pointDraw.activate();
        Map.DrawFeatureComtrol = pointDraw;
    };
    /**
     * 画线事件
     */
    Map.drawPolylineEvent=function(callback){
        Map.ClearOperation();
        var polylineDraw= new OpenLayers.Control.DrawFeature(Map.vectorLayer, OpenLayers.Handler.Path, {
            drawFeature: function(geometry){
                if(geometry){
                    if(Map.DrawFeatureComtrol){
                        Map.DrawFeatureComtrol.deactivate();
                    }
                    var points = geometry.components;
                    if(points.length>0){
                        if(callback && typeof(callback)=="function"){
                            mouseStatic = "normal";
                            callback(points);
                        }
                    }
                }
            }
        });
        _map.addControl(polylineDraw);
        polylineDraw.activate();
        Map.DrawFeatureComtrol = polylineDraw;
        mouseStatic = "drawPolyline";
    };
    /**
     * 画面事件
     */
    Map.drawPolygonEvent=function(callback){
        Map.ClearOperation();
        var polygonDraw = new OpenLayers.Control.DrawFeature(Map.vectorLayer, OpenLayers.Handler.Polygon, {
            drawFeature: function(geometry){
                if(geometry){
                    if(Map.DrawFeatureComtrol){
                        Map.DrawFeatureComtrol.deactivate();
                    }
                    var points = geometry.components;
                    if(points.length>0){
                        points = points[0].components;
                        if(points.length>0){
                            if(callback && typeof(callback)=="function"){
                                mouseStatic = "normal";
                                callback(points);
                            }
                        }
                    }
                }
            }
        });
        _map.addControl(polygonDraw);
        polygonDraw.activate();
        Map.DrawFeatureComtrol = polygonDraw;
        mouseStatic = "drawPolygon";
    };
//移除画图控件，结束绘制
    Map.RemoveDrawFeatureControl=function(){
        if(Map.DrawFeatureComtrol){
            Map.DrawFeatureComtrol.finishSketch();
            _map.removeControl(Map.DrawFeatureComtrol);
            Map.DrawFeatureComtrol = null;
            mouseStatic = "normal";
        }
    }
    /**
     * 画圆事件
     */
    var createCircleEventForMapDrawLayer=null;//画圆图层
    var createCircleEventForMapStartpt=null;//圆心点
    var createCircleEventForMapcallback=null;//回调函数
    var createCircleEventForMapdrawCtrl=null;//鼠标控制
    var createCircleEventForMapResult=null;//结果
    Map.drawCircleEvent=function(callback){
        Map.ClearOperation();
        createCircleEventForMapcallback=callback;
        createCircleEventForMapDrawLayer = new OpenLayers.Layer.Vector("drawCircleLayer",{
            styleMap: new OpenLayers.StyleMap({'default':{
                strokeColor: "#ff0000",
                strokeOpacity: 1,
                strokeWidth: 1,
                fillColor: "#ff0000",
                fillOpacity: 0.2
            }})
        });
        _map.addLayers([createCircleEventForMapDrawLayer]);
        createCircleEventForMapdrawCtrl = new OpenLayers.Control.DrawFeature(createCircleEventForMapDrawLayer, OpenLayers.Handler.Point, {
            drawFeature: function(geometry){
                if(geometry){
                    createCircleEventForMapdrawCtrl.deactivate();
                    _map.removeControl(createCircleEventForMapdrawCtrl);
                    createCircleEventForMapdrawCtrl = null;
                    createCircleEventForMapStartpt = {lon: geometry.x, lat: geometry.y};
                    createCircleEventForMapResult = createCircleEventForMapStartpt;
                    _map.events.unregister("mousemove", _map, drawCircleMouseMove);
                    _map.events.register("mousemove", _map, drawCircleMouseMove);
                }
            }
        });
        _map.addControl(createCircleEventForMapdrawCtrl);
        createCircleEventForMapdrawCtrl.activate();
        createCircleEventForMapDrawLayer.setVisibility(true);

        mouseStatic = "drawCircle";
    };
//鼠标移动事件
    function drawCircleMouseMove(evt){
        createCircleEventForMapDrawLayer.removeAllFeatures();
        var pt = _map.getLonLatFromPixel(evt.xy);
        var end = new OpenLayers.Geometry.Point(pt.lon, pt.lat);
        if(createCircleEventForMapStartpt==null)return;
        var start = new OpenLayers.Geometry.Point(createCircleEventForMapStartpt.lon, createCircleEventForMapStartpt.lat);
        var line = new OpenLayers.Geometry.LineString([start, end]);
        var radius = line.getLength();
        var obj={};
        obj.longitude = start.x;
        obj.latitude = start.y;
        obj.radius = radius;
        obj.layer = createCircleEventForMapDrawLayer;
        var geometry = _createCircle(obj);
        var feature = geometry;
        var size = 110000 * Math.cos(Math.PI / 180 * createCircleEventForMapStartpt.lat);
        createCircleEventForMapResult.radius = radius * size;
        createCircleEventForMapDrawLayer.removeAllFeatures();
        createCircleEventForMapDrawLayer.addFeatures(feature);
    }
//画圆事件方法
    var _createCircle=function(obj){
        var radius=obj.radius;
        var angle = Math.PI * ((1/100) - (1/2));
        var rotatedAngle, x, y;
        var points = [];
        for(var i=0; i<100; ++i) {
            rotatedAngle = angle + (i * 2 * Math.PI / 100);
            x = obj.longitude + (radius * Math.cos(rotatedAngle));
            y = obj.latitude + (radius * Math.sin(rotatedAngle));
            points.push(new OpenLayers.Geometry.Point(x, y));
        }
        var ring = new OpenLayers.Geometry.LinearRing(points);
        var oobj = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([ring]));
        obj.layer.addFeatures([oobj]);
        return oobj;
    };
//移除画圆控件，结束画圆
    Map.RemoveDrawCircleControl=function(){
        _map.events.unregister("mousemove", _map, drawCircleMouseMove);
        if(createCircleEventForMapDrawLayer){
            createCircleEventForMapDrawLayer.removeAllFeatures();
            createCircleEventForMapDrawLayer.visibility = false;
            _map.removeLayer(createCircleEventForMapDrawLayer);
            createCircleEventForMapDrawLayer = null;
        }
        if(createCircleEventForMapcallback && typeof(createCircleEventForMapcallback)=="function"){
            if(createCircleEventForMapResult){
                createCircleEventForMapcallback(createCircleEventForMapResult);
            }
        }
        mouseStatic = "normal";
    }
    /**
     * 创建窗口对象
     */
    Map.openWin=function(id,lon,lat,text){
        var point=new TLngLat(lon,lat);
        //创建信息窗口对象 
        var infoWin=new TInfoWindow(point,new TPixel([0,30]));
        //设置信息窗口要显示的内容 
        infoWin.setLabel(text);
        infoWin.id=id;
        infoWin.enableAutoPan();
        //向地图上添加信息窗口 
        _map.addOverLay(infoWin);
        return infoWin;
    };
    /**
     * 删除对象
     */
    Map.removeObj=function(obj){
        Map.vectorLayer.removeFeatures([obj]);
        Event.removeObjEventObj(obj);
        var id=obj.id;
        for(var i=0;i<mapObjArr.length;i++){
            if(id==mapObjArr[i].id){
                mapObjArr.splice(i, 1);
                break;
            }
        }
    };
    Map.ClearAllObjs=function(){
        Map.vectorLayer.removeAllFeatures();
        Event.ClearAllObjs();
        mapObjArr.splice(0, mapObjArr.length);
    };
    Map.addLayer=function(layer){
        _map.addLayer(layer);
    };
    Map.removeLayer=function(layer){
        _map.removeLayer(layer);
    };
    Map.TTileLayerWMS=function(name,path,config){
        var layer=new TTileLayerWMS(name,path,config);
        return layer;
    };
    /**
     * 创建天地图WMS图层
     */
    Map.WMS=function(name,path,config){
        var newConfig = {
            layers: config.LAYERS,
            transparent: true,
            styles: config.STYLES
        };
        var options = {
            opacity: (config.opacity)?config.opacity:1,
            singleTile: true
        };
        var pRaster = new OpenLayers.Layer.WMS(name, path, newConfig, options);
        return pRaster;
    };
    Map.ArcServerWMS=function(name,path,config){
        var newConfig = {
            layers: "show:"+ config.LAYERS,
            transparent: (config.TRANSPARENT)?config.TRANSPARENT:"true",
            srs: (config.PROJECTION)?config.PROJECTION:"EPSG:4326",
            format: (config.FORMAT)?config.FORMAT:"png"
        };
        var options = {
            opacity: (config.opacity)?config.opacity:1
        };
        var newPath = (path.indexOf("/export")>0)?path:path + "/export";
        var layer=new OpenLayers.Layer.ArcGIS93Rest(name, newPath, newConfig, options);
        return layer;
    };
//设置是否允许鼠标双击放大地图
    Map.enableDoubleClickZoom=function(){
        _map.enableDoubleClickZoom();
    };
    Map.disableDoubleClickZoom=function(){
        _map.disableDoubleClickZoom();
    };
//设置是否允许鼠标滚轮缩放地图
    Map.enableHandleMouseScroll=function(){
        _map.enableHandleMouseScroll();
    };
    Map.disableDragHandleMouseScroll=function(){
        _map.disableDragHandleMouseScroll();
    };
//设置是否允许鼠标惯性拖拽地图
    Map.enableInertia=function(){
        _map.enableInertia();
    };
    Map.disableInertia=function(){
        _map.disableInertia();
    };
//设置是否允许键盘操作地图
    Map.enableHandleKeyboard=function(){
        _map.enableHandleKeyboard();
    };
    Map.disableHandleKeyboard=function(){
        _map.disableHandleKeyboard();
    };
//设置地图显示级别范围
    Map.setZoomLevels=function(arr){
        _map.setZoomLevels(arr);
    };
//获取地图中心点坐标
    Map.getCenter=function(){
        var lnglat=_map.getCenter();
        var point={};
        point.longitude=lnglat.lon;
        point.latitude=lnglat.lat;
        return point;
    };
//设置地图中心点
    Map.setCenter=function(x, y){
        Map.centerAndZoom(x, y);
    }
//返回地图当前缩放级别
    Map.getZoom=function(){
        var level=_map.getZoom();
        return level;
    };
//设置地图当前缩放级别
    Map.setZoom=function(zoom){
        _map.zoomTo(zoom);
    };
//返回地图可视区域，以地理坐标表示
    Map.getMapExtent=function(){debugger
        var bound=_map.getExtent();
        var newBound={};
        newBound.maxX=bound.right;
        newBound.maxY=bound.top;
        newBound.minX=bound.left;
        newBound.minY=bound.bottom;
        return newBound;
    };
    Map.setMapExtent=function(points){
        var bounds = new OpenLayers.Bounds();
        for(var i=0;i<points.length;i++){
            var point = points[i];
            var lon = parseFloat(point.lon);
            var lat = parseFloat(point.lat);
            var lonLat = new OpenLayers.LonLat(lon, lat);
            bounds.extend(lonLat);
        }
        _map.zoomToExtent(bounds);
    };
    Map.getMercatorBounds=function(){
        var bound=_map.getBounds();
        var newBound={};
        newBound.SW=bound.getSouthWest();
        newBound.NE=bound.getNorthEast();
        return newBound;
    };
//获取地图当前分辨率
    Map.getResolution=function(){
        return _map.getResolution();
    }
//根据分辨率设置地图缩放级别
    Map.setResolution=function(resolution){
        var zoom = _map.getZoomForResolution(resolution);
        Map.setZoom(zoom);
    }
//
    Map.getBounds=function(){
        var center = Map.getCenter();
        center.lon = center.longitude;
        center.lat = center.latitude;
        var resolution = Map.getResolution();
        var bounds = _map.calculateBounds(center, resolution);
        var newBounds = {};
        newBounds.minX = bounds.left;
        newBounds.minY = bounds.bottom;
        newBounds.maxX = bounds.right;
        newBounds.maxY = bounds.top;
        return newBounds;
    }
    Map.getWidth=function(){
        return Width;
    };
    Map.getHeight=function(){
        return Height;
    };
    Map.addObj=function(obj){
        return _map.addOverLay(obj);
    };
    Map.setMapProjectionType=function(type){
        if(_map.getCode() == type) return;
        _map.switchingMaps(type);

    };
    var _fromLngLatToContainerPixel=function(lnglat){
        return _map.fromLngLatToContainerPixel(lnglat);
    };
    Map.fromLngLatToContainerPixel=_fromLngLatToContainerPixel;
    var _LngLat=function(lon,lat){
        return new TLngLat(lon,lat);
    };
    Map.LngLat=_LngLat;
    /**
     * 添加缩放平移控件
     * @param config
     * @returns
     */
    var NavControl=null;
    var _setNavControl=function(config){
        if(NavControl)
            _map.removeControl(NavControl);
        //创建缩放平移控件对象 
        NavControl=new TNavigationControl(config);
        //添加缩放平移控件 
        _map.addControl(NavControl);
    };
    Map.setNavControl=_setNavControl;
    /**
     * 增加鼠标位置控件
     *  * @param isopen
     */
    var mousePositionControl=null;
    Map.setMousePositionControl=function(isopen){
        if(isopen==null)isopen=true;
        if(mousePositionControl!=null){
            _map.removeControl(mousePositionControl);
        }
        if(isopen) {
            mousePositionControl = new OpenLayers.Control.MousePosition();
            _map.addControl(mousePositionControl);
            mousePositionControl.div.style.bottom = "5px";
            mousePositionControl.div.style.left = "10px";
        }else{
            _map.removeControl(mousePositionControl);
        }
    }
    /**
     * 增加地图缩放等级控件
     * @param isopen
     */
    var showZoomControl=null;
    Map.setShowZoomControl=function(isopen){
        if(isopen==null)isopen=true;
        if(showZoomControl!=null){
            _map.removeControl(showZoomControl);
        }
        if(isopen) {
            showZoomControl = new OpenLayers.Control.ShowZoom();
            _map.addControl(showZoomControl);
            showZoomControl.div.style.bottom = "5px";
            showZoomControl.div.style.left = "135px";
        }else{
            _map.removeControl(showZoomControl);
        }
    }
    /**
     * 添加缩放平移控件
     * @param config
     * @returns
     */
     Map.OverviewMapControl=null;
    Map.setOverviewMapControl=function(isopen){

        if(isopen==null)isopen=true;
        if(Map.OverviewMapControl!=null){
            _map.removeControl(Map.OverviewMapControl);
        }
        if(isopen){
            Map.OverviewMapControl= new OpenLayers.Control.OverviewMap({
                size: new OpenLayers.Size(300, 170),
                maximized: true,
                minRectSize: 10,
                minRatio: 10,
                maxRatio: 10,
                autoPan: true
            });
            _map.addControl(Map.OverviewMapControl);
            Map.OverviewMapControl.div.style.right = "1px";
            Map.OverviewMapControl.div.style.bottom = "2px";
            Map.OverviewMapControl.div.style.border = "2px solid gray";
        }else{
            _map.removeControl(Map.OverviewMapControl);
        }
    };
    /**
     * 添加比例尺
     * @param config
     * @returns
     */
    Map.setScaleControl=function(value){
        if(Map.scaleControl!=null){
            _map.removeControl(Map.scaleControl);
        }
        if(value){
            Map.scaleControl= new OpenLayers.Control.Scale();
            _map.addControl(Map.scaleControl);
            Map.scaleControl.div.style.bottom = "5px";
            Map.scaleControl.div.style.left = "200px";
        }else{
            _map.removeControl(Map.scaleControl);
        }
    };

    //添加拉框控件
    Map.layerswitcher=null;
    Map.setZoomBoxControlVisibility=function(value){
        if(Map.layerswitcher!=null){
            map.removeControl(Map.layerswitcher);
        }
        if(value){
            var layerSwitcher = new ol.control.LayerSwitcher({
                tipLabel: '切换图层'
            });
            map.addControl(layerSwitcher);
        }else{
            map.removeControl(Map.layerswitcher);
            Map.layerswitcher=null;
        }
    };
    /**
     * 距离测量
     * @param config
     * @returns
     */
    Map.measureControl=null;
    Map.measureIndex=0;
    Map.openMeasure=function(type,callback){
        Map.ClearOperation();
        Map.measureIndex=0;
        var measureType=OpenLayers.Handler.Path;
        if(type=="area"){
            measureType=OpenLayers.Handler.Polygon;
        }
        var sketchSymbolizers = {
            "Point": {
                pointRadius: 5,
                fillColor: "#3366ff",
                fillOpacity: 0.8,
                strokeWidth: 1,
                strokeOpacity: 0.8,
                strokeColor: "#3366ff"
            },
            "Line": {
                strokeWidth: 2,
                strokeOpacity: 1,
                strokeColor: "#6495ed"
            },
            "Polygon": {
                strokeWidth: 2,
                strokeOpacity: 1,
                strokeColor: "#6495ed",
                fillColor: "white",
                fillOpacity: 0.5
            }
        };
        var style = new OpenLayers.Style();
        style.addRules([new OpenLayers.Rule({symbolizer: sketchSymbolizers})]);
        var styleMap = new OpenLayers.StyleMap({"default": style});
        Map.measureControl = new OpenLayers.Control.Measure(measureType, {
            persist: true,
            handlerOptions: {
                layerOptions: {
                    styleMap: styleMap
                }
            },
            eventListeners: {
                'measure':function(event){
                    if(event.units==="km")  event.units="千米";
                    if(event.units==="m")   event.units="米";
                    if(event.order>1) {
                        event.units="平方" + event.units;
                    }
                    event.measure=Math.round(event.measure * 1000) / 1000;
                    var geometry = event.geometry;
                    var allPoints = geometry.getVertices();
                    event.measure=Math.round(event.measure * 1000) / 1000;
                    var currentPoint = allPoints[allPoints.length - 1];
                    var showText = event.measure + event.units;
                    locateTextToMap(currentPoint,showText);
                },
                'measurepartial':function(event){
                    mouseStatic="measure";
                    Map.measureIndex = 1;
                    var popups = _map.popups;
                    if(popups.length>0){
                        for(var i=0;i<popups.length;i++){
                            var popup = popups[i];
                            if(popup.id.indexOf("click")>=0){
                                _map.removePopup(popup);
                            }
                        }
                    }
                }
            }
        });
        _map.addControl(Map.measureControl);
        Map.measureControl.activate();
        mouseStatic="measure";
    };
//结束测量
    Map.FinishMeasureDraw=function(){
        Map.measureControl.handler.finishGeometry();
    }
//移除测量控件
    Map.RemoveMeasureDraw=function(){
        var popups = _map.popups;
        if(popups.length>0){
            for(var i=0;i<popups.length;i++){
                var popup = popups[i];
                if(popup.id.indexOf("click")>=0){
                    _map.removePopup(popup);
                }
            }
        }
        if(Map.measureControl){
            Map.measureControl.deactivate();
            _map.removeControl(Map.measureControl);
            Map.measureControl = null;
        }
        mouseStatic="normal";
    }
    /**
     * 地图上添加文字
     * @returns
     */
    var locateTextToMap = function(paPoint,paText){
        //写文字:
        var number = _map.popups.length + 1;
        var size = new OpenLayers.Size(100,20);
        var lonlat = new OpenLayers.LonLat(paPoint.x,paPoint.y);
        paText = "<div style='font-size:12px;color:#333333;background-color:#ffffff;-moz-border-radius: 2px;"+
            "border-radius:2px;-webkit-border-radius: 2px;border:1px solid #666666;'>"+paText+"</div>";
        var mypopup = new OpenLayers.Popup("click" + number,lonlat,size,paText,false);
        mypopup.autoSize = true;
        mypopup.contentSize = "12px";
        mypopup.panMapIfOutOfView = false;
        mypopup.setOpacity(0.7);
        mypopup.setBackgroundColor("transparent");//背景透明
        //mypopup.setBackgroundColor("#ffffff");
        //mypopup.id=jsonObj.id;
        _map.addPopup(mypopup);
        return mypopup;
    };
    /**
     * 距离面积
     * @param callback
     * @returns
     */
    Map.MeasureCallback=null;
    Map.openMeasureDistance=Map.OpenMeasureDistance=function(callback){
        Map.openMeasure("distance",callback);
    };
    Map.openMeasureArea=Map.OpenMeasureArea=function(callback){
        Map.openMeasure("area",callback);
    };
    /**
     * 对象编辑功能添加
     */
    Map.featureModifyControl=null;
    Map.FeatureModifyEvent=function(callback){
        var featureModifyControl = new OpenLayers.Control.ModifyFeature(Map.vectorLayer);
        featureModifyControl.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
        featureModifyControl.createVertices = true;
        _map.addControl(featureModifyControl);
        featureModifyControl.onModification = function(feature){
            if(feature){
                var obj = {};
                obj.id = feature.id;
                obj.name = feature.name;
                obj.mapObj = feature;
                var points = feature.geometry.getVertices();
                var coords = [];
                if(points){
                    if(points.length>0){
                        for(var i=0;i<points.length;i++){
                            var coord = [points[i].x, points[i].y];
                            coords.push(coord);
                        }
                    }
                }
                obj.points = coords;
                if(callback && typeof(callback)=="function"){
                    callback(obj);
                }
            }
        }
        mouseStatic="modifyFeature";
        featureModifyControl.activate();
        Map.featureModifyControl = featureModifyControl;
    }
    /**
     * 移除对象编辑功能
     */
    Map.RemoveModifyFeatureEvent=function(){
        if(Map.featureModifyControl){
            Map.featureModifyControl.deactivate();
            _map.removeControl(Map.featureModifyControl);
        }
    }
    /**
     * 对象移动功能添加
     */
    Map.FeatureMoveEvent=function(callback){
        var featureModifyControl = new OpenLayers.Control.ModifyFeature(Map.vectorLayer);
        featureModifyControl.mode |= OpenLayers.Control.ModifyFeature.DRAG;
        featureModifyControl.mode &= ~OpenLayers.Control.ModifyFeature.RESHAPE;
        _map.addControl(featureModifyControl);
        featureModifyControl.dragComplete = function(vertex){
            var feature = featureModifyControl.feature;
            var obj = {};
            if(feature){
                obj.mapObj = feature;
                obj.id = feature.id;
                obj.name = feature.name;
                obj.toPoint = [vertex.geometry.x, vertex.geometry.y];
                var points = feature.geometry.getVertices();
                var coords = [];
                if(points){
                    if(points.length>0){
                        for(var i=0;i<points.length;i++){
                            var coord = [points[i].x, points[i].y];
                            coords.push(coord);
                        }
                    }
                }
                obj.points = coords;
                if(callback && typeof(callback)=="function"){
                    callback(obj);
                }
            }
            mouseStatic="moveFeature";
        }
        featureModifyControl.activate();
        Map.featureModifyControl = featureModifyControl;
    }
    /**
     * 去除移动地图点线面对象的控件
     */
    Map.RemoveFeatureMoveEvent=function(){
        if(Map.featureModifyControl){
            Map.featureModifyControl.deactivate();
            _map.removeControl(Map.featureModifyControl);
        }
    }
    /**
     * 移动事件
     */
    Map.MoveEndEventCallBack=null;
    Map.MoveEndEvent=function(callback){
        Map.ClearOperation();
        Map.MoveEndEventCallBack=callback;
        _map.events.unregister("moveend", _map, _mapMoveEndCallBack);
        _map.events.register("moveend", _map, _mapMoveEndCallBack);
    };
    var _mapMoveEndCallBack=function(event){
        var callback=Map.MoveEndEventCallBack;
        if(callback&&typeof(callback)=="function"){
            callback(event);
        }
    };
    /**
     * 清除移动事件
     */
    Map.closeMoveEndEvent=function(){
        if(Map.MoveEndEventCallBack){
            _map.events.unregister("moveend", _map, _mapMoveEndCallBack);
            Map.MoveEndEventCallBack=null;
        }
    };
    /**
     * 缩放事件
     */
    Map.ZoomEndEventCallBack=null;
    Map.ZoomEndEvent=function(callback){
        Map.ClearOperation();
        Map.ZoomEndEventCallBack=callback;
        _map.events.unregister("zoomend", _map, _mapZoomEndCallBack);
        _map.events.register("zoomend", _map, _mapZoomEndCallBack);
    };
    var _mapZoomEndCallBack=function(event){
        var callback=Map.ZoomEndEventCallBack;
        if(callback&&typeof(callback)=="function"){
            callback(event);
        }
    };
    /**
     * 清除缩放事件
     */
    Map.closeZoomEndEvent=function(){
        if(Map.ZoomEndEventCallBack){
            _map.events.unregister("zoomend", _map, _mapZoomEndCallBack);
            Map.ZoomEndEventCallBack=null;
        }
    };
    Map.zoomIn=function(){
        _map.zoomIn();
    };
    Map.zoomOut=function(){
        _map.zoomOut();
    };
//设置地图中心点坐标状态是否可见
    Map.SetCenterVisibility=function(value){
        if(value){
            Map.setMousePositionControl(true);
        }else{
            Map.setMousePositionControl(false);
        }
    };
//设置地图缩放级别状态是否可见
    Map.SetZoomVisibility=function(value){
        if(value){
            Map.setShowZoomControl(true);
        }else{
            Map.setShowZoomControl(false);
        }
    };
//添加二维地图对象选择控件
    var singleClickInteractionSelect;
    Map.getObjEvent=function(callback){
        singleClickInteractionSelect = new OpenLayers.Control.SelectFeature(Map.vectorLayer,{
                multiple: false,
                box: true,
                onSelect: function(feature){
                    if(feature) {
                        callback(feature);
                    }
                }
            });
        _map.addControl(singleClickInteractionSelect);
        singleClickInteractionSelect.activate();
    }
//移除二维地图对象选择控件
    Map.unGetObjEvent=function(){
        if(singleClickInteractionSelect){
            singleClickInteractionSelect.deactivate();
            _map.removeControl(singleClickInteractionSelect);
            singleClickInteractionSelect=null;
        }
    }
//将当前points对象转化为经纬度坐标对象
     Map.transfromPointsToTLngLats=function(points){
        var newpoints = [];
        for(var i=0;i<points.length;i++){
            var point=points[i];
            newpoints.push(new OpenLayers.Geometry.Point(point.lon,point.lat));
        }
        return newpoints;
    }
    /**
     * 加载大数据量json对象，返回已加载该对象的图层
     * @param data
     */
    var vectorJsonSourceLayer = null;
    var vectorJsonLayerClickCallback = null;
    Map.addGeoJsonLayer=function(filePath, callback){
        vectorJsonLayerClickCallback = callback;
        if(vectorJsonSourceLayer){
            vectorJsonSourceLayer.removeAllFeatures();
            if(vectorJsonSourceLayer.map){
                Map.removeLayer(vectorJsonSourceLayer);
            }
        }
        vectorJsonSourceLayer = new OpenLayers.Layer.Vector("vectorJsonSourceLayer",{
            protocol: new OpenLayers.Protocol.HTTP({
                url: filePath,
                format: new OpenLayers.Format.GeoJSON()
            }),
            strategies: [new OpenLayers.Strategy.Fixed()],
            styleMap: new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    pointRadius: 5,
                    fillColor: "#ffff00",
                    strokeColor: "red",
                    strokeWidth: 2,
                    fillColor: "#ffff00",
                    fillOpacity: 0.5
                })
            }),
            eventListeners: {
                featureclick: function(evt){
                    var feature = evt.feature;
                    if(feature.data){
                        if(callback && typeof(callback)=="function"){
                            callback(feature.data.id);
                        }
                    }
                }
            }
        });
        return vectorJsonSourceLayer;
    };
    return Map;
});