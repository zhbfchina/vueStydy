/**
 * Created by fxd on 2017-04-05.
 */
define( ['ol',"mapEvent","config","common","jquery"], function(ol, Event, config, common, $) {
    var proj = config.proj;
    var mapObjArr=[];//Arr是用来存放已经创建的对象
    var mouseStatic="normal";//用于记录鼠标的使用状态
    var mapMinZoom=4;
    var Map=new Object();
    Map.StartFinished=null;
    Map.Event=Event;
    Map.mapDiv="yysTGisServerMapCtrDiv";//二维地图对象div
    var centerDiv="olmapCenter";var zoomDiv='olmapZoom';//右下角的坐标控件和级别控件
    var map=null;
    var styleCache = {};
    var ClusterIconPath="";


    /**
     * 初始化地图状态栏DOM元素
     * @constructor
     */
    Map.InitMapTooltipDiv=function(){
        var html = '<div id="olmapCenter" style=" position:absolute;left:20px; bottom:5px;z-index: 200;font-size: 14px"></div>';
        html += '<div id="olmapNavigation" style=" position:absolute;left:50px; top:150px;z-index: 200;font-size: 14px"></div>';
        html += '<div id="olmapZoom" style=" position:absolute;left:255px; bottom:5px;z-index: 200;font-size: 14px"></div>';
        html += '<div id="ol_scaleControlDiv" style=" position:absolute;left:310px; bottom:5px;z-index: 200;font-size: 14px"></div>';
        html += '<div id="ol_overviewMapControlDiv" style=" position:absolute;right:0px; bottom:0px;z-index: 200;font-size: 14px;text-align: right;padding-right: 10px;"></div>';
        //鹰眼视图的样式，右下角
        html += '"<style>.ol-custom-overviewmap,.ol-custom-overviewmap.ol-uncollapsible {bottom: 0;left: auto;right: 0;top: auto;}.ol-custom-overviewmap:not(.ol-collapsed)  {border: 1px solid black;}.ol-custom-overviewmap .ol-overviewmap-map {border: none;width: 300px;}.ol-custom-overviewmap .ol-overviewmap-box {border: 2px solid red;}.ol-custom-overviewmap:not(.ol-collapsed) button{bottom: 1px;left: auto;right: 1px;top: auto;}.ol-rotate {bottom: 170px;right: 0;}</style>"';
        $('#'+tgisServer.ServerDivId).append(html);
        //Map.InitCenterAndZoom("olmapCenter","olmapZoom");
    };
    Map.qiehuan=function () {
        var transform=document.getElementById("transform_sp");
        if(transform.innerHTML=="卫星"){
            var img=document.getElementById("transform_img");
            img.src=Map.ServerPath+"gisServer/images/dt.png";
            transform.innerHTML="地图";
            Map.satelliteMap();
        }else{
            var img=document.getElementById("transform_img");
            img.src=Map.ServerPath+"gisServer/images/wx.png";
            transform.innerHTML="卫星";
            Map.vectorMap();
        }
    }
    /**
     * 切换矢量地图
     */
    Map.vectorMap=function(){
        Map.roadmapLayer.setVisible(true);
        Map.satelliteLayer.setVisible(false);
    };
    /**
     *卫星地图
     */
    Map.satelliteMap=function(){
        Map.roadmapLayer.setVisible(false);
        Map.satelliteLayer.setVisible(true);
    };
    Map.initMap=function(ServerType){
        ClusterIconPath=Map.ServerPath+"gisServer/images/map_icon.png";
        var  vectorLayerSource = new ol.source.Vector({wrapX: false});
        Map.vectorLayer = new ol.layer.Vector({
            source: vectorLayerSource
        });
        Map.vectorLayer.setZIndex(500);
        //2017-03-30 fxd 以下一块代码是为了标注聚合
        ClusterIconPath=common.getRootPath()+"gisServer/images/map_icon.png";
        var cluterIcon=new ol.style.Icon({
            opacity: 1,
            color: '#fff',//透明色
            src: ClusterIconPath
        });
        Map.setClusterIconPath=function (path) {
            ClusterIconPath=path;
            cluterIcon=new ol.style.Icon({
                opacity: 1,
                color: '#fff',//透明色
                src: ClusterIconPath
            });
            styleCache = {};
        }
        var clusterDistance=40;
        Map.setClusterDistance=function (value) {
            clusterDistance=parseInt(value);
            Map.clusterSource.setDistance(clusterDistance);
        }
        Map.markerLayerSource = new ol.source.Vector({ wrapX: false});
        Map.clusterSource = new ol.source.Cluster({
            distance: 40,
            source: Map.markerLayerSource
        });
        Map.clusters = new ol.layer.Vector({
            name: "markerLayer",
            source: Map.clusterSource,
            style: function(feature) {
                var features=feature.get('features');
                var size = features.length;
                if(size==1){
                    var myStyle=features[0].getStyle();
                    return myStyle;
                }else{
                    var style = styleCache[size];
                    if (!style) {
                        style = new ol.style.Style({
                            image:  cluterIcon,
                            text: new ol.style.Text({
                                text: size.toString(),
                                font:'15px sans-serif',
                                fill: new ol.style.Fill({
                                    color: '#fff'
                                })
                            })
                        });
                        styleCache[size] = style;
                    }
                    return style;
                }
            }
        });
        Map.clusters.setZIndex(501);
        Map.selectContr=new ol.interaction.Select({
            condition: function(evt) {
                if(evt.type == 'singleclick'){//evt.originalEvent.type == 'mousemove' ||
                    return true;
                }else { return false; }
            },
            layers:[Map.clusters],
            style: function(feature) {
                var styles = [];
                var originalFeatures = feature.get('features');
                var originalFeature;
                var style=null;
                for (var i = originalFeatures.length - 1; i >= 0; --i) {
                    originalFeature = originalFeatures[i];
                    style=originalFeature.getStyle();
                    var myStyle=new ol.style.Style({
                        geometry: originalFeature.getGeometry(),
                        image: style.getImage(),
                        text:style.getText()
                    })
                    styles.push(myStyle);
                }
                if(styles.length==1){
                    styles[0]=createSelectStyle(originalFeature);
                }
                return styles;
            }
        });
        var layerArr=[];
        if(Map.mapType=="localMap"){
            initLocalMap();
            layerArr=[ Map.roadmapLayer,Map.satelliteLayer ,Map.vectorLayer,Map.clusters];
        }else if(Map.mapType=="tianditu"){
            Map.roadmapLayer = getTdtLayer("vec_c");
            Map.satelliteLayer = getTdtLayer("img_c");
            Map.satelliteLayer.setVisible(false);
            Map.roadmapMarker =getTdtLayer("cva_c");
            layerArr=[ Map.roadmapLayer, Map.roadmapMarker,Map.vectorLayer,Map.clusters];
        }else if(Map.mapType=="bjMap"){
            initBJMap();
            layerArr=[Map.roadmapLayer ,Map.vectorLayer,Map.clusters];
            mapMinZoom=9;
        }else if(Map.mapType=="gaode"){
            Map.roadmapLayer = getGdLayer(config.roadMapPath);
            Map.satelliteLayer = getGdLayer(config.satelliteMapPath);
            layerArr=[ Map.roadmapLayer, Map.satelliteLayer,Map.vectorLayer,Map.clusters];
        }
        map = new ol.Map({
            target: Map.mapDiv,//Div名称
            logo:false,
            layers: layerArr,
            interactions: ol.interaction.defaults().extend([Map.selectContr]),
            view: new ol.View({
                projection: proj, //坐标系名称
                center: [config.baseLon, config.baseLat],
                zoom: 10, //缩放级别
               // extent:Map.Extent?Map.Extent:[-180,0,180,90],
                minZoom: mapMinZoom,
                maxZoom: 18
            }),
            controls: ol.control.defaults({
                zoom: true,
                rotate: false
            }).extend([])
        });
        //2017-08-16 fxd 设置地图背景颜色
        document.getElementById(Map.mapDiv).style.backgroundColor=Map.backgroundColor;
        //注册鼠标左键按下事件
        $(map.getViewport()).on("mousedown", function(event){
            if(((event.which) && (event.which == 1)) ||((event.button) && (event.button == 0))||((event.button) && (event.button == 1))) {
                var pixel;
                if(event.pageX){
                    pixel = [event.offsetX, event.offsetY];
                }else{
                    pixel = [event.x, event.y];
                }
                var coord = map.getCoordinateFromPixel(pixel);
                event.pixel = pixel;
                event.coordinate = coord;
                setTimeout(function () {
                    if(mouseStatic=="normal"){
                        Event.MousrLeftKeyDown(event);
                    }
                },50);
            }
        });
        //注册鼠标左键单击事件
        map.on("singleclick", function(event){
            setTimeout(function () {
                if(mouseStatic=="normal"){
                    var targetFeature=null;
                    var targetLayer=null;
                    if(event.pixel && event.pixel!=null){
                        var pixel = [event.pixel[0], event.pixel[1]];
                        map.forEachFeatureAtPixel(event.pixel,function(feature, layer){
                            targetFeature=feature;
                            targetLayer=layer;
                        });
                    }
                    if(targetFeature){
                        if(targetLayer.get("name")=="vectorJsonSourceLayer"){
                            var properties = targetFeature.getProperties();
                            if(vectorJsonLayerClickCallback && typeof(vectorJsonLayerClickCallback)=="function"){
                                vectorJsonLayerClickCallback(properties);
                            }
                        }else {
                            Event.VectorLayerClickEvent(targetFeature);
                        }
                    }
                    Event.MouseLeftUp(event);
                }else{
                    Map.operateLeftKeyMouseStatic();
                }

            },100);
        });
        //此功能用于标注悬停变色
        /*map.on('pointermove', function(evt) {
            if (evt.dragging) {
                return;
            }
            var pixel = map.getEventPixel(evt.originalEvent);
            map.forEachFeatureAtPixel(pixel,function(feature, layer){
                if(typeof layer.get =='function'&& layer.get("name")=="markerLayer"){ //
                    //var image = feature.get('style').getImage().getImage();
                    var originalFeatures = feature.get('features');
                    if(originalFeatures.length==1){
                        var originalFeature = originalFeatures[i];
                        var style=originalFeature.getStyle();
                        var myStyle=new ol.style.Style({
                            geometry: originalFeature.getGeometry(),
                            image: style.getImage(),
                            text:style.getText()
                        })
                    }

                }

            });
        });*/
        //注册鼠标右键单击事件
        $(map.getViewport()).on("contextmenu", function(event){
            var pixel;
            if(event.offsetX){
                pixel = [event.offsetX, event.offsetY];
            }else{
                pixel = [event.x, event.y];
            }
            var coord = map.getCoordinateFromPixel(pixel);
            event.pixel = pixel;
            event.coordinate = coord;
            if(mouseStatic=="normal"){
                Event.MouseRightUp(event);
            }else{
                Map.operateRightKeyMouseStatic();
            }
        });
        var mapView = map.getView();
        mapView.on("change:center",function(){
            var center = mapView.getCenter();
            Event.MouseMove();
            var template = '经度:{x}&nbsp;&nbsp;&nbsp;&nbsp;纬度:{y}';
            center = ol.coordinate.format(center, template, 6);
            $("#"+centerDiv).html(center);
            var callback=Map.MoveEndEventCallBack;
            if(callback&&typeof(callback)=="function"){
                callback();
            }

        });
        mapView.on("change:resolution",function(){
            //20170817 fxd 标注对象有选择控件，在地图级别变换的时候清空选择集，这样选中的对象才会消失。
            Map.selectContr.getFeatures().clear();

            var zoom=mapView.getZoom();
            $("#"+zoomDiv).html("级别:" + zoom);
            if(zoom>16){
                Map.clusterSource.setDistance(1);
            }else{
                if( Map.clusterSource.getDistance()!=clusterDistance)
                    Map.clusterSource.setDistance(clusterDistance);
            }
            var callback=Map.ZoomEndEventCallBack;
            if(callback&&typeof(callback)=="function"){
                callback();
            }
        });
        //初始化地图状态栏显示
        Map.InitMapTooltipDiv();
        if(Map.location&&Map.location.length>2){
            Map.centerAndZoom(Map.location[0],Map.location[1],Map.location[2])
        }
        if(ServerType=="1"){
            if(Map.StartFinished&&typeof(Map.StartFinished)=="function"){
                setTimeout(function () {//2017-04-28 为了不影响第一绘制
                    Map.StartFinished(true);
                },100);
            }
        }
    }
    function createSelectStyle(originalFeature) {//20170714 fxd 创建图标选中的样式
        var myStyle=originalFeature.getStyle();
        var bImage=myStyle.getImage();
        if(bImage){
            var image = bImage.getImage();
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0, image.width, image.height);
            var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            for (var i = 0, ii = data.length; i < ii; i = i + (i % 4 == 2 ? 2 : 1)) {
                data[i] =  data[i]-50;
                if(data[i]<0)data[i]=1;
            }
            context.putImageData(imageData, 0, 0);
            bImage=new ol.style.Icon(({
                // anchor: [0.5, 0.96],
                crossOrigin: 'anonymous',
                img: canvas,
                imgSize: [canvas.width, canvas.height]
            }))
        }
        var bText=null;
        var text=myStyle.getText();
        if(text){
            bText=new ol.style.Text({
                offsetX: text.getOffsetX(),//文字在左侧
                offsetY: text.getOffsetY(),
                font: ( text.getFont()) + 'px sans-serif',
                text: text.getText(),
                scale: 1,   //字体倍数大小
                stroke: new ol.style.Stroke({
                    color:"#FF0033",
                    width: 2
                })
            })
        }
        var newStyle=new ol.style.Style({
            geometry: originalFeature.getGeometry(),
            image: bImage,
            text:bText
        });
        return newStyle;
    }

    function initLocalMap() {
        Map.roadmapLayer = new ol.layer.Tile({
           // opacity:0.2,
            source: new ol.source.XYZ({
                projection:proj,
                maxZoom: 18,
                minZoom: 3,
                tileUrlFunction: function (tileCoord) {
                    var oo = "00000000";
                    var zz = tileCoord[0] + "";
                    if (zz.length < 2) zz = "0" + zz
                    var z = "L" + zz;
                    var xx = tileCoord[1].toString(16);
                    var x = "C" + oo.substring(0, 8 - xx.length) + xx;
                    var yy = (-tileCoord[2] - 1).toString(16);
                    var y = "R" + oo.substring(0, 8 - yy.length) + yy;
                    x = x.toUpperCase();
                    y = y.toUpperCase();
                    var url = config.vectorMapPath+'/' + z + '/' + y + '/' + x + '.'+config.vectorMapType;
                    return url;
                }
            })
        });
        Map.satelliteLayer = new ol.layer.Tile({
            visible: false,
            source: new ol.source.XYZ({
                projection: proj,
                maxZoom: 18,
                minZoom: 3,
                tileUrlFunction: function (tileCoord) {
                    var oo = "00000000";
                    var zz = tileCoord[0] + "";
                    if (zz.length < 2) zz = "0" + zz
                    var z = "L" + zz;
                    var xx = tileCoord[1].toString(16);
                    var x = "C" + oo.substring(0, 8 - xx.length) + xx;
                    var yy = (-tileCoord[2] - 1).toString(16);
                    var y = "R" + oo.substring(0, 8 - yy.length) + yy;
                    x = x.toUpperCase();
                    y = y.toUpperCase();
                    var url = config.satelliteMapPath+'/' + z + '/' + y + '/' + x + '.'+config.vectorMapType;
                    return url;
                }
            })
        });
    }
    function initBJMap() {
        var tileGrid = new ol.tilegrid.TileGrid({ tileSize: 256, origin: bjorigin, extent: bjfullExtent, resolutions: bjresolutions });
        var tileArcGISXYZ = new ol.source.XYZ({
            tileGrid: tileGrid,
            projection: new ol.proj.Projection(bjprojection),
            tileUrlFunction: function (tileCoord) {
                var oo = "00000000";
                var zz = tileCoord[0] + "";
                if (zz.length < 2) zz = "0" + zz
                var z = "L" + zz;
                var xx = tileCoord[1].toString(16);
                var x = "C" + oo.substring(0, 8 - xx.length) + xx;
                var yy = (-tileCoord[2] - 1).toString(16);
                var y = "R" + oo.substring(0, 8 - yy.length) + yy;
                var url = bjroadMapUrl+'/' + z + '/' + y + '/' + x + '.png';
                return url;
            }
        });
        Map.roadmapLayer =new ol.layer.Tile({
            source: tileArcGISXYZ
        })
        Map.satelliteLayer = new ol.layer.Tile({
            visible: false,
            source: new ol.source.XYZ({
                projection: proj,
                maxZoom: 18,
                minZoom: 3,
                tileUrlFunction: function (tileCoord) {
                    var oo = "00000000";
                    var zz = tileCoord[0] + "";
                    if (zz.length < 2) zz = "0" + zz
                    var z = "L" + zz;
                    var xx = tileCoord[1].toString(16);
                    var x = "C" + oo.substring(0, 8 - xx.length) + xx;
                    var yy = (-tileCoord[2] - 1).toString(16);
                    var y = "R" + oo.substring(0, 8 - yy.length) + yy;
                    x = x.toUpperCase();
                    y = y.toUpperCase();
                    var url = config.satelliteMapPath+'/' + z + '/' + y + '/' + x + '.jpg';
                    return url;
                }
            })
        });
    }
    Map.LoadTiandituMap=function(){
        if(Map.mapType=="tianditu")return;
        Map.mapType="tianditu";
        map.removeLayer(Map.satelliteLayer);
        map.removeLayer(Map.roadmapLayer);
        Map.roadmapLayer = getTdtLayer("vec_c");
        Map.satelliteLayer = getTdtLayer("img_c");
        Map.satelliteLayer.setVisible(false);
        Map.roadmapMarker =getTdtLayer("cva_c");
        map.addLayer(Map.roadmapLayer);
        map.addLayer(Map.satelliteLayer);
        map.addLayer(Map.roadmapMarker);
    };
    Map.addSatelliteLayer=function () {
        map.removeLayer(Map.satelliteLayer);
        map.addLayer(Map.satelliteLayer);
    }
    Map.removeSatelliteLayer=function () {
        map.removeLayer(Map.satelliteLayer);
    }
    Map.LoadLocalMap=function(){
        if(Map.mapType=="localMap")return;
        Map.mapType="localMap";
        map.removeLayer(Map.satelliteLayer);
        map.removeLayer(Map.roadmapLayer);
        map.removeLayer(Map.roadmapMarker);
        initLocalMap();
        map.addLayer(Map.roadmapLayer);
        map.addLayer(Map.satelliteLayer);
    };
    //2017-08-16 fxd 设置地图背景颜色
    Map.SetBackgroundColor=function(color) {
        if(color){
            document.getElementById(Map.mapDiv).style.backgroundColor=color;
            Map.backgroundColor=color;
        }
    }
    Map.zoomIn=function(){
        var view = map.getView();
        var zoom = view.getZoom();
        view.setZoom(zoom + 1);
    }
    Map.zoomOut=function(){
        var view = map.getView();
        var zoom = view.getZoom();
        view.setZoom(zoom - 1);
    };


    /**
     * 定位地图中心
     * @param lon   经度
     * @param lat   纬度
     * @param level 缩放等级
     */
    Map.centerAndZoom=function(lon,lat,level){
        if((lon!='' || lon!=null) && (lat!='' || lat!=null) && (level!='' || level!=null)) {
            if (proj == 'EPSG:3857') {
                var point = new ol.geom.Point([lon, lat]);
                var fromProj = new ol.proj.Projection("EPSG:4326");
                var toProj = new ol.proj.Projection("EPSG:900913");
                var center = ol.proj.transform(point, fromProj, toProj);
                map.getView().setCenter(center);
                map.getView().setZoom(level);
            } else {
                map.getView().setCenter([parseFloat(lon),parseFloat(lat)]);
                map.getView().setZoom(level);
            }
        }
    };
    /**
     * 定位地图中心点
     * @param lon：经度
     * @param lat：纬度
     */
    Map.setCenter=function(lon,lat){
        if((lon!='' || lon!=null) && (lat!='' || lat!=null)) {
            if (proj == 'EPSG:3857') {
                var point = new ol.geom.Point([lon, lat]);
                var fromProj = new ol.proj.Projection("EPSG:4326");
                var toProj = new ol.proj.Projection("EPSG:900913");
                var center = ol.proj.transform(point, fromProj, toProj);
                map.getView().setCenter(center);
            } else {
                map.getView().setCenter([parseFloat(lon),parseFloat(lat)]);
            }
        }
    };
    /**
     * 地图div大小变化时触发，刷新当前mapsize
     * @constructor
     */
    Map.MapChangeUpdate=function(){
        setTimeout(function () {
            map.updateSize();
        }, 200);
    }

//用于关闭地图所有测量、编辑等事件
    Map.ClearOperation=function(){
        //移除测量控件
        Map.RemoveMeasureDraw();
        //移除画图控件
        Map.RemoveInteractionDraw();
        //移除修改对象控件
        Map.RemoveModifyFeatureEvent();
        //移除移动对象控件
        Map.RemoveFeatureMoveEvent();
        //移除移动事件
        Map.closeMoveEndEvent();
        //移除缩放事件
        Map.closeZoomEndEvent();
    }
//处理鼠标右击时回调函数
    Map.operateRightKeyMouseStatic=function(){
        if(mouseStatic=="measure"){
            if(Map.measureDraw){
                if(Map.measureDrawLength>0){
                    //结束本次测量，控件处于活跃状态
                    Map.measureDraw.finishDrawing();
                }else if(Map.measureDrawLength==0){
                    //当前没有添加测量点或者添加错误（面只有两条边），结束所有测量，移除控件、图层
                    Map.RemoveMeasureDraw();
                }else if(Map.measureDrawLength==-1){
                    if(Map.measureDrawIndex==1){
                        //控制鼠标左键单击后立即右键单击触发事件
                        Map.measureDrawIndex = 0;
                    }else{
                        Map.RemoveMeasureDraw();
                    }
                }
            }
        }else  if(mouseStatic=="drawPolyline"||"drawPolygon"==mouseStatic){
            Map.RemoveInteractionDraw();
        }else  if(mouseStatic=="modifyFeature"){
            Map.RemoveModifyFeatureEvent();
        }else  if(mouseStatic=="moveFeature"){
            if(Map.FeatureMoveControlMouseKey==0){
                Map.RemoveFeatureMoveEvent();
            }else if(Map.FeatureMoveControlMouseKey==2){
                //右键拖动对象完成，将值恢复默认
                Map.FeatureMoveControlMouseKey=0;
            }
        } else if(mouseStatic=="drawPlotArrow") {
            Map.RemoveDrawPlotArrowEvent();
        }
    };
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
    Map.createPoint=function(obj){
        var point = new ol.geom.Point([parseFloat(obj.longitude), parseFloat(obj.latitude)]);
        var Feature = new ol.Feature({
            geometry: point,
            id: obj.id
        });
        if(!obj.fillcolor){
            obj.fillcolor="#030303";
        }
        if(!obj.strokewidth){
            obj.strokewidth=2;
        }
        if(!obj.strokecolor){
            obj.strokecolor="#030303";
        }
        if(!obj.strokeopacity){
            obj.strokeopacity=1;
        }
        var style_point = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                stroke: new ol.style.Stroke({
                    color: obj.strokecolor,
                    width:obj.strokewidth
                }),
                fill: new ol.style.Fill({
                    color: obj.fillcolor
                })
            })
        })
        Feature.setStyle(style_point);
        Feature.id=obj.id;
        Feature.name=obj.name;
        Feature.lon=obj.longitude;
        Feature.lat=obj.latitude;
        Feature.moveTo=function(lon, lat){
            if(Map.markerLayerSource.getFeatureById(Feature.getId())){
                Feature.getGeometry().setCoordinates([parseFloat(lon), parseFloat(lat)]);
            }
        };
        Feature.pType="point";
        Feature.setId(obj.id);
        Map.vectorLayer.getSource().addFeature(Feature);
        mapObjArr.push(Feature);
        return Feature;
    };
    /**
     * 添加标注-Marker
     */
    Map.createMarker=function(obj){
        var point = new ol.geom.Point([parseFloat(obj.longitude), parseFloat(obj.latitude)]);
        var Feature = new ol.Feature({
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
                offsetX=(obj.width+obj.text.length*font)/2+10;//文字在右侧
                offsetY=offsetFont;
            }else if(obj.textBerth&&obj.textBerth=="up"){      //gjj 2017-09-21 文字在上方
                offsetY=-(obj.height+parseInt(font)+10)/2;
            }
            var textColor="#fff";
            if(obj.textcolor)textColor=obj.textcolor;
            style_text = new ol.style.Text({
                offsetX: offsetX,//文字在左侧
                offsetY: offsetY,
               /* offsetX: 0,//文字在下方
                offsetY: offsetHeight + offsetFont,*/
                font: ( font-1) + 'px SimHei',//黑体
                text: obj.text,
                scale: 1,   //字体倍数大小
                fill: new ol.style.Fill({    //文字填充色
                    color: textColor
                }),
                stroke: new ol.style.Stroke({
                    color:'#000',
                    width: 8
                })
            });
        }
        if(obj.mapicon&&obj.mapicon.length>0){
            style_icon = new ol.style.Icon({
                opacity: 1,
                color: '#fff',//透明色
                src: obj.mapicon,
                imgSize:  [obj.width, obj.height]
        });
        }
        var style_marker = new ol.style.Style({
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
        Map.markerLayerSource.addFeature(Feature);
        mapObjArr.push(Feature);
        return Feature;
    };
    /**
     * 添加标注数组-Marker
     */
    Map.createMarkers=function(objs){
        var markers=[];
        for(var i=0;i<objs.length;i++){
            var obj=objs[i];
            var point = new ol.geom.Point([parseFloat(obj.longitude), parseFloat(obj.latitude)]);
            var Feature = new ol.Feature({
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
                // gjj 2017-09-22 朝阳路那块标注太挤，取括号里的名称
                if(obj.text.substring(0,3)=="朝阳路"){
                    var location=obj.text.toString().indexOf("（");
                    if(obj.text.substring(parseInt(location)-4,parseInt(location))=="人行天桥"){
                        obj.text=obj.text.substring(obj.text.indexOf("（")+1,obj.text.indexOf("）"));
                    }
                }
                if(obj.textBerth&&obj.textBerth=="right"){
                    offsetX=(obj.width+obj.text.length*font)/2+10;//文字在右侧
                    offsetY=offsetFont;
                } else if(obj.textBerth&&obj.textBerth=="up"){      //gjj 2017-09-21 文字在上方
                    offsetY=-(obj.height+parseInt(font)+10)/2;
                }
                var textColor="#fff";
                if(obj.textcolor)textColor=obj.textcolor;
                style_text = new ol.style.Text({
                    offsetX: offsetX,//文字在左侧
                    offsetY: offsetY,
                    /* offsetX: 0,//文字在下方
                     offsetY: offsetHeight + offsetFont,*/
                    font: ( font) + 'px SimHei',//黑体
                    text: obj.text,
                    scale: 1,   //字体倍数大小
                    stroke: new ol.style.Stroke({
                        color:textColor,
                        width: 2
                    })
                });
            }
            if(obj.mapicon&&obj.mapicon.length>0){
                style_icon = new ol.style.Icon({
                    opacity: 1,
                    color: '#fff',//透明色
                    src: obj.mapicon
                });
            }
            var style_marker = new ol.style.Style({
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
     * 添加线段-Polyline
     */
    Map.createPolyline=function(obj){
        var points = obj.points;
        var coords = [];
        for(var i=0;i<points.length;i++){
            var coord = [parseFloat(points[i].lon),parseFloat(points[i].lat)];
            coords.push(coord);
        }
        var feature = new ol.Feature({
            geometry: new ol.geom.LineString(coords)
        });
        feature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: obj.width ? obj.width:5,
                color: obj.color ? obj.color:"red"
            })
        }));
        feature.id=obj.id;
        feature.name=obj.name;
        Map.vectorLayer.getSource().addFeature(feature);
        feature.pType="polyline";
        mapObjArr.push(feature);
        return feature;
    };
    /**
     * 添加面-Polygon
     */
    Map.createPolygon=function(obj){
        var points = obj.points;
        var coords = [];
        for(var i=0;i<points.length;i++){
            var coord = [parseFloat(points[i].lon),parseFloat(points[i].lat)];
            coords.push(coord);
        }
        if(coords[0][0]!=coords[coords.length-1][0] && coords[0][1]!=coords[coords.length-1][1]){
            coords.push([coords[0][0], coords[0][1]]);
        }
        var feature = new ol.Feature({
            geometry: new ol.geom.Polygon([coords])
        });
        var color = new ol.color.asArray(obj.fillColor ? obj.fillColor:"red");
        if(obj.fillOpacity && obj.fillOpacity!=""){
            color[3] = obj.fillOpacity;
        }
        feature.setStyle(new ol.style.Style({
            fill: new ol.style.Fill({
                color: color
            }),
            stroke: new ol.style.Stroke({
                color: obj.lineColor ? obj.lineColor:"red",
                width: obj.lineWidth ? obj.lineWidth:2
            })
        }));
        feature.id=obj.id;
        feature.name=obj.name;
        Map.vectorLayer.getSource().addFeature(feature);
        feature.pType="polygon";
        mapObjArr.push(feature);
        return feature;
    };
    /**
     * 添加圆-Circle
     */
    Map.createCircle=function(obj){
        var center = [parseFloat(obj.longitude), parseFloat(obj.latitude)];
        var size = 118000 * Math.cos(Math.PI / 180 * obj.latitude);
        var radius = obj.radius / size;
        var feature = new ol.Feature({
            geometry: new ol.geom.Circle(center, radius)
        });
        var color = new ol.color.asArray(obj.fillcolor ? obj.fillcolor:"red");
        if(obj.fillopacity && obj.fillopacity!=""){
            color[3] = obj.fillopacity;
        }
        feature.setStyle(new ol.style.Style({
            fill: new ol.style.Fill({
                color: color
            }),
            stroke: new ol.style.Stroke({
                color: obj.linecolor ? obj.linecolor:"red",
                width: obj.linewidth ? obj.linewidth:2
            })
        }));
        feature.id=obj.id;
        feature.name=obj.name;
        Map.vectorLayer.getSource().addFeature(feature);
        feature.pType="circle";
        mapObjArr.push(feature);
        return feature;
    };
    /**
     * 添加标绘对象
     * @param obj
     */
    Map.createPlotArrow = function (obj) {
        var coords = [];
        for(var i=0;i<obj.points.length;i++) {
            var point = obj.points[i];
            coords.push([point.lon, point.lat]);
        }
        if(coords) {
            var geometry = null;
            var feature = P.PlotFactory.createPlot(obj.type, coords);
            var coordinates = feature.getCoordinates();
            var geometryType = feature.getType();
            if(geometryType=="LineString") {
                geometry = new ol.geom.LineString(coordinates);
            } else if(geometryType=="Polygon") {
                geometry = new ol.geom.Polygon(coordinates);
            }
            feature = new ol.Feature({
                geometry: geometry
            });
            var color = new ol.color.asArray(obj.fillColor ? obj.fillColor:"red");
            if(obj.fillOpacity){
                color[3] = obj.fillOpacity;
            }
            feature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: color
                }),
                stroke: new ol.style.Stroke({
                    color: obj.lineColor ? obj.lineColor:"red",
                    width: obj.lineWidth ? obj.lineWidth:2
                })
            }));
            feature.id=obj.id;
            feature.name=obj.name;
            Map.vectorLayer.getSource().addFeatures([feature]);
            mapObjArr.push(feature);
            feature.pType="plot";
            return feature;
        }else{
            return null;
        }
    };
    /**
     * 添加热力图数据
     */
    Map.createHeatMaps=function(points){
        var markers=[];
        for(var i=0;i<points.length;i++){
            var obj=points[i];
            var point = new ol.geom.Point([parseFloat(obj.lon), parseFloat(obj.lat)]);
            var Feature = new ol.Feature({
                geometry: point
            });
            markers.push(Feature);
        }
        if(Map.HeatMapLayer){
            Map.HeatMapLayer.getSource().addFeatures(markers);
        }else{
            var  vectorSource = new ol.source.Vector({wrapX: false});
            Map.HeatMapLayer = new ol.layer.Heatmap({
                source: vectorSource,
                blur: Map.HeatMapBlur,
                radius: Map.HeatMapRadius
            });
            Map.HeatMapLayer.setZIndex(100);
            map.addLayer(Map.HeatMapLayer);
            Map.HeatMapLayer.getSource().addFeatures(markers);
        }
    };
    Map.closeHeatMaps=function () {
        if( Map.HeatMapLayer ){
            map.removeLayer(Map.HeatMapLayer);
            Map.HeatMapLayer=null;
        }
    }
    /**
     * 设置热力图的模糊程度，范围是0到50
     * @param value
     */
    Map.HeatMapBlur =21;
    Map.setHeatMapBlur=function(value){
        try{
            value=parseInt(value, 10)
            if(value>50)value=50;
            if(value<0)value=0;
            Map.HeatMapBlur =value;
            if(Map.HeatMapLayer)
                Map.HeatMapLayer.setBlur(value);
        }catch (ex){ }
    }
    /**
     * 设置热力图的圆点半径
     * @param value
     */
    Map.HeatMapRadius =20;
    Map.setHeatMapRadius=function(value){
        try{
            value=parseInt(value, 10)
            Map.HeatMapRadius =value;
            if(Map.HeatMapLayer)
                Map.HeatMapLayer.setRadius(value);
        }catch (ex){ }
    }
    Map.getObjByPixel=function (pixel) {
        var targetFeature=null;
        map.forEachFeatureAtPixel(pixel,function(feature){
            targetFeature=feature;
        });
        return targetFeature;
    }
    /**
     * 画点事件-控件添加
     */
    Map.drawPointEvent=function(callback){
        var source = new ol.source.Vector({wrapX: false});
        var draw = new ol.interaction.Draw({
            source: source,
            type: ('Point'),
            condition: function(e){
                var coord = {};
                coord.lon = e.coordinate[0];
                coord.lat = e.coordinate[1];
                map.removeInteraction(draw);
                mouseStatic="normal";
                setTimeout(function () {
                    Map.selectContr.setActive(false);
                    callback(coord);
                    setTimeout(function () {//20170817 fxd 对selectContr的关闭和打开是为了避免点击创建标注时标注创建了就已经被选中的问题。
                        Map.selectContr.setActive(true);
                    },1000);
                },50);
            }
        });
        map.addInteraction(draw);
        mouseStatic="drawPoint";
    };
    /**
     * 画线事件-控件添加
     */
    Map.interactionDraw=null;
    Map.drawPolylineEvent=function(callback){
        var coords = [];
        var source = new ol.source.Vector({wrapX: false});
        var draw = new ol.interaction.Draw({
            source: source,
            type: ('LineString')
        });
        draw.on("drawend",function(e){
            var geometry = e.feature.getGeometry();
            var coord = geometry.getCoordinates();
            for( var i= 0,len=coord.length; i<len; i++ ){
                var point = {};
                point.x = coord[i][0]
                point.y = coord[i][1];
                coords.push(point);
            }
            map.removeInteraction(draw);
            Map.interactionDraw=null;
            mouseStatic="normal";
            callback(coords);
        });
        map.addInteraction(draw);
        Map.interactionDraw=draw;
        mouseStatic="drawPolyline";
    };
    /**
     * 画面事件-控件添加
     */
    Map.drawPolygonEvent=function(callback){
        var coords = [];
        var source = new ol.source.Vector({wrapX: false});
        var draw = new ol.interaction.Draw({
            source: source,
            type: ('Polygon')
        });
        Map.interactionDraw=draw;
        draw.on("drawend",function(e){
            var geometry = e.feature.getGeometry();
            var coord = geometry.getCoordinates()[0];
            for( var i= 0,len=coord.length; i<len; i++ ){
                var point = {};
                point.x = coord[i][0]
                point.y = coord[i][1];
                coords.push(point);
            }
            map.removeInteraction(draw);
            Map.interactionDraw=null;
            mouseStatic="normal";
            setTimeout(function () {
                callback(coords);
            },50);
        });
        map.addInteraction(draw);
        mouseStatic="drawPolygon";
    };
    Map.RemoveInteractionDraw=function(){
        if(Map.interactionDraw){
            Map.interactionDraw.finishDrawing();
            mouseStatic="normal";
        }
    };
    /**
     * 画圆事件-控件添加
     */
    Map.drawCircleClickIndex=0;//2016-12-08 fxd 此参数用于控制鼠标左键点击次数
    Map.drawCircleEvent=function(callback){
        var circle = {};
        var source = new ol.source.Vector({wrapX: false});
        var draw = new ol.interaction.Draw({
            source: source,
            type: ('Circle')
        });
        draw.on("drawend",function(e){
            var geometry = e.feature.getGeometry();
            var center = geometry.getCenter();
            var radius = geometry.getRadius();
            circle.lon = center[0];
            circle.lat = center[1];
            circle.lonlatRadius = radius;
            //将radius转换成米制单位
            var meterRadius = 120000 * Math.cos(Math.PI / 180 * circle.lat) * radius;
            circle.radius = meterRadius;
            map.removeInteraction(draw);
            Map.interactionDraw=null;
            Map.drawCircleClickIndex=2;
            setTimeout(function () {
                callback(circle);
            },10);

        });
        map.addInteraction(draw);
        Map.interactionDraw=draw;
        mouseStatic="drawCircle";
        Map.drawCircleClickIndex=0;
    };
    /**
     * 为地图添加标绘功能事件
     * @param type
     * @returns {*}
     */
    var plotDrawControl=null;
    Map.drawPlotArrowEvent=function(type, callback) {
        require(["plot"], function(P){
            var pType = Map.getPlotArrowType(type);
            if(!plotDrawControl) {
                map.on('click', function (e) {
                    if (plotDrawControl.isDrawing()) {
                        return;
                    }
                    /*var feature = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                        return feature;
                     });*/
                });
                // 初始化标绘绘制工具，添加绘制结束事件响应
                plotDrawControl = new P.PlotDraw(map);
                plotDrawControl.on(P.Event.PlotDrawEvent.DRAW_END, function(event){
                    var feature = event.feature;
                    var geometry = feature.getGeometry();
                    var coords = geometry.getPoints();
                    var points = [];
                    for( var i= 0,len=coords.length; i<len; i++ ){
                        var point = {};
                        point.lon = coords[i][0]
                        point.lat = coords[i][1];
                        points.push(point);
                    }
                    if(callback && typeof(callback)=="function") {
                        callback(points);
                    }
                }, false, this);
            }
            mouseStatic="drawPlotArrow";
            plotDrawControl.activate(pType);
        });
    };
    Map.getPlotArrowType = function (type) {
        var obj;
        switch (type) {
            case "ARC":
                obj = P.PlotTypes.ARC;
                break;
            case "CURVE":
                obj = P.PlotTypes.CURVE;
                break;
            case "ELLIPSE":
                obj = P.PlotTypes.ELLIPSE;
                break;
            case "LUNE":
                obj = P.PlotTypes.LUNE;
                break;
            case "SECTOR":
                obj = P.PlotTypes.SECTOR;
                break;
            case "CLOSED_CURVE":
                obj = P.PlotTypes.CLOSED_CURVE;
                break;
            case "GATHERING_PLACE":
                obj = P.PlotTypes.GATHERING_PLACE;
                break;
            case "STRAIGHT_ARROW":
                obj = P.PlotTypes.STRAIGHT_ARROW;
                break;
            case "FINE_ARROW":
                obj = P.PlotTypes.FINE_ARROW;
                break;
            case "ASSAULT_DIRECTION":
                obj = P.PlotTypes.ASSAULT_DIRECTION;
                break;
            case "ATTACK_ARROW":
                obj = P.PlotTypes.ATTACK_ARROW;
                break;
            case "TAILED_SQUAD_COMBAT":
                obj = P.PlotTypes.TAILED_SQUAD_COMBAT;
                break;
            case "TAILED_ATTACK_ARROW":
                obj = P.PlotTypes.TAILED_ATTACK_ARROW;
                break;
            case "SQUAD_COMBAT":
                obj = P.PlotTypes.SQUAD_COMBAT;
                break;
            case "DOUBLE_ARROW":
                obj = P.PlotTypes.DOUBLE_ARROW;
                break;
        }
        return obj;
    }
    Map.RemoveDrawPlotArrowEvent = function () {
        if(plotDrawControl){
            plotDrawControl.drawEnd();
            mouseStatic = "normal";
            plotDrawControl=null;
        }

    };
    /**
     * 用于修改vectorLayer中的feature，通过ol.interaction.Modify控件来实现
     */
    var ModifyFeatureStyle={};
    Map.ModifyFeatureSelectInteraction=null;
    Map.ModifyFeatureModifyInteraction=null;
    Map.FeatureModifyEvent=function(callback){
        var select = new ol.interaction.Select({
            wrapX: false
        });
        var modify = new ol.interaction.Modify({
            features: select.getFeatures()
        });
        map.addInteraction(select);
        map.addInteraction(modify);
        Map.ModifyFeatureSelectInteraction=select;
        Map.ModifyFeatureModifyInteraction=modify;
        select.on("select", function(feature){
            if(feature.selected.length>0){
                var lFeature=feature.selected[0];
                if(ModifyFeatureStyle.id && ModifyFeatureStyle.id!=null){
                    //当前所选择对象与上一个不同
                    if(lFeature.id!=ModifyFeatureStyle.id){
                        var features = Map.vectorLayer.getSource().getFeatures();
                        for(var i=0;i<features.length;i++){
                            var xFeature = features[i];
                            if(xFeature.id == ModifyFeatureStyle.id){
                                xFeature.setStyle( ModifyFeatureStyle.style );
                                ModifyFeatureStyle.id = lFeature.id;
                                ModifyFeatureStyle.style = lFeature.getStyle();
                                break;
                            }
                        }
                    }
                }else{
                    //初次记录
                    ModifyFeatureStyle.id = lFeature.id;
                    ModifyFeatureStyle.style = lFeature.getStyle();
                }
                var geometry = lFeature.getGeometry();
                if(geometry instanceof ol.geom.LineString){
                    lFeature.setStyle( new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: [0, 153, 255, 1],
                            width: 4
                        })
                    }));
                }else if(geometry instanceof ol.geom.Polygon){
                    lFeature.setStyle( new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: [255, 255, 255, 0.8]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0, 153, 255, 1],
                            width: 4
                        })
                    }));
                }else if(geometry instanceof ol.geom.Circle){
                    /*暂不支持对圆的修改
                     lFeature.setStyle( new ol.style.Style({
                     fill: new ol.style.Fill({
                     color: [255, 255, 255, 0.8]
                     }),
                     stroke: new ol.style.Stroke({
                     color: [0, 153, 255, 1],
                     width: 4
                     })
                     }));
                     */
                }
            }
        });
        modify.on("modifyend", function(event){
            var features = event.features.getArray();
            if(features.length>0){
                var feature = features[0];
                var obj = {};
                obj.id = feature.id;
                obj.name = feature.name;
                obj.mapObj = feature;
                var points = [];
                var geometry = feature.getGeometry();
                var coords = geometry.getCoordinates();
                if(coords.length>0){
                    if(geometry instanceof ol.geom.Polygon){
                        coords = coords[0];
                    }
                    for(var i=0;i<coords.length;i++){
                        //面对象是闭合环，因此去掉重复点
                        if((i==coords.length-1) && geometry instanceof ol.geom.Polygon){
                            break;
                        }
                        if(geometry instanceof ol.geom.Point){
                            var coord = {lon:coords[i], lat:coords[i+1]};
                            points.push(coord);
                            break;
                        }
                        var coord = {lon:coords[i][0], lat:coords[i][1]};
                        points.push(coord);
                    }
                }
                obj.points = points;
                if(callback!=null&&typeof(callback)=="function")callback(obj);
            }
        });
        modify.on("change:active", function(){
            if(ModifyFeatureStyle.id && ModifyFeatureStyle.id!=null){
                var features = Map.vectorLayer.getSource().getFeatures();
                for(var i=0;i<features.length;i++){
                    var xFeature = features[i];
                    if(xFeature.id == ModifyFeatureStyle.id){
                        xFeature.setStyle( ModifyFeatureStyle.style );
                        ModifyFeatureStyle = {};
                        break;
                    }
                }
            }
        });
        mouseStatic="modifyFeature";
    };
    /**
     * 用于移除地图对象修改控件
     */
    Map.RemoveModifyFeatureEvent=function(){
        if(Map.ModifyFeatureSelectInteraction && Map.ModifyFeatureModifyInteraction){
            Map.ModifyFeatureModifyInteraction.setActive(false);
            map.removeInteraction(Map.ModifyFeatureSelectInteraction);
            map.removeInteraction(Map.ModifyFeatureModifyInteraction);
            Map.ModifyFeatureSelectInteraction=null;
            Map.ModifyFeatureModifyInteraction=null;
            mouseStatic="normal";
        }
    };
    /**
     * 用于移动地图对象
     */
    Map.FeatureMoveControl=null;
    Map.FeatureMoveControlMouseKey=0;
    Map.FeatureMoveEvent=function(callback){
        var featureMoveControl = {};
        featureMoveControl.Drag = function(){
            ol.interaction.Pointer.call(this, {
                handleDownEvent: featureMoveControl.Drag.prototype.handleDownEvent,
                handleDragEvent: featureMoveControl.Drag.prototype.handleDragEvent,
                handleMoveEvent: featureMoveControl.Drag.prototype.handleMoveEvent,
                handleUpEvent: featureMoveControl.Drag.prototype.handleUpEvent
            });
            this.coordinate = null;
            this.cursor = "pointer";
            this.feature = null;
            this.style = null;
            this.previousCursor = undefined;
        };
        ol.inherits(featureMoveControl.Drag, ol.interaction.Pointer);
        featureMoveControl.Drag.prototype.handleDownEvent = function(evt){
            var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature){
                return feature;
            });
            if(feature){
                this.feature = feature;
                this.coordinate = evt.coordinate;
                this.style = feature.getStyle();
                var geometry = feature.getGeometry();
                if(geometry instanceof ol.geom.LineString){
                    feature.setStyle( new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: [0, 153, 255, 1],
                            width: 4
                        })
                    }));
                }else if(geometry instanceof ol.geom.Polygon){
                    feature.setStyle( new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: [255, 255, 255, 0.8]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0, 153, 255, 1],
                            width: 4
                        })
                    }));
                }
            }
            return !!feature;
        };
        featureMoveControl.Drag.prototype.handleDragEvent = function(evt){
            var button = evt.originalEvent.buttons==0?evt.originalEvent.view.event.button:evt.originalEvent.buttons;
            if(button==1){//鼠标左键拖动对象
                Map.FeatureMoveControlMouseKey = 0;
            }else if(button==2){//鼠标右键拖动对象
                Map.FeatureMoveControlMouseKey = 2;
            }
            var deltaX = evt.coordinate[0] - this.coordinate[0];
            var deltaY = evt.coordinate[1] - this.coordinate[1];
            var geometry = (this.feature.getGeometry());
            geometry.translate(deltaX, deltaY);
            this.coordinate[0] = evt.coordinate[0];
            this.coordinate[1] = evt.coordinate[1];
        };
        featureMoveControl.Drag.prototype.handleMoveEvent = function(evt) {
            if (this.cursor) {
                var map = evt.map;
                var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                    return feature;
                });
                var element = evt.map.getTargetElement();
                if (feature) {
                    if (element.style.cursor != this.cursor) {
                        this.previousCursor = element.style.cursor;
                        element.style.cursor = this.cursor;
                    }
                } else if (this.previousCursor !== undefined) {
                    element.style.cursor = this.previousCursor;
                    this.previousCursor = undefined;
                }
            }
        };
        featureMoveControl.Drag.prototype.handleUpEvent = function(evt) {
            var radius = 0;
            var points = [];
            var geometry = this.feature.getGeometry();
            if (geometry instanceof ol.geom.Circle) {
                var coord = geometry.getCenter();
                points.push(coord[0], coord[1]);
                radius = geometry.getRadius();
            } else {
                var coords = geometry.getCoordinates();
                if (coords.length > 0) {
                    if (geometry instanceof ol.geom.Polygon) {
                        coords = coords[0];
                    }
                    for (var i = 0; i < coords.length; i++) {
                        //面对象是闭合环，因此去掉重复点
                        if ((i == coords.length - 1) && geometry instanceof ol.geom.Polygon) {
                            break;
                        }
                        if (geometry instanceof ol.geom.Point) {
                            var coord = {lon: coords[i], lat: coords[i + 1]};
                            points.push(coord);
                            break;
                        }
                        var coord = {lon: coords[i][0], lat: coords[i][1]};
                        points.push(coord);
                    }
                }
            }
            var obj = {};
            obj.mapObj = this.feature;
            obj.id = this.feature.id;
            obj.name = this.feature.name;
            obj.toPoint = this.coordinate;
            obj.points = points;
            if (radius > 0) {
                obj.radius = radius;
            }
            this.feature.setStyle(this.style);
            this.coordinate = null;
            this.feature = null;
            this.style = null;
            if (callback != null && typeof(callback) == "function")callback(obj);
        };
        Map.FeatureMoveControl = new featureMoveControl.Drag();
        map.addInteraction(Map.FeatureMoveControl);
        mouseStatic="moveFeature";
    };
    /**
     * 去除移动地图点线面对象的控件
     */
    Map.RemoveFeatureMoveEvent=function(){
        if(Map.FeatureMoveControl){
            map.removeInteraction(Map.FeatureMoveControl);
            Map.FeatureMoveControl = null;
            Map.FeatureMoveControlMouseKey=0;
            map.getTargetElement().style.cursor = "";
            mouseStatic="normal";
        }
    };
    /**
     * 创建窗口对象
     */
    /*Map.openWin=function(id,lon,lat,text){
        var point=new TLngLat(lon,lat);
        //创建信息窗口对象
        var infoWin=new TInfoWindow(point,new TPixel([0,30]));
        //设置信息窗口要显示的内容
        infoWin.setLabel(text);
        infoWin.id=id;
        infoWin.enableAutoPan();
        //向地图上添加信息窗口
        map.addOverLay(infoWin);
        return infoWin;
    };*/
    /**
     * 删除对象
     */
    Map.removeObj=function(obj){
        if(obj.pType=="marker"){
            if(Map.markerLayerSource.getFeatureById(obj.getId())){
                var selectedFeatures=Map.selectContr.getFeatures();//这个选择集是图标图层的选择集
                selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
                Map.markerLayerSource.removeFeature(obj);
            }
           // map.changed();
        }else{
            Map.vectorLayer.getSource().removeFeature(obj);
        }
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
        Map.vectorLayer.getSource().clear();
        Map.markerLayerSource.clear();
        Event.ClearAllObjs();
        mapObjArr.splice(0, mapObjArr.length);
        var selectedFeatures=Map.selectContr.getFeatures();//这个选择集是图标图层的选择集
        selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
    };
    Map.setObjVisibility=function (obj,value) {
        if(obj.show){
            if(value)obj.show();
            else obj.hide();
        }else{
            if(value){
                obj.fillOpacity=1;
                obj.strokeOpacity=1;
            }else {
                obj.fillOpacity=0;
                obj.strokeOpacity=0;
            }
        }
    }
    //获取已经创建的对象
    Map.getMapObj=function(id){
        for(var i=0;i<mapObjArr.length;i++){
            if(mapObjArr[i].id==id){
                return mapObjArr[i];
            }
        }
        return null;
    }
    Map.addLayer=function(layer){
        map.addLayer(layer);
    };
    Map.removeLayer=function(layer){
        map.removeLayer(layer);
    };
    Map.DragBox=function () {
        var dragBox = new ol.interaction.DragBox({
            condition: ol.events.condition.platformModifierKeyOnly
        });
        map.addInteraction(dragBox);
        dragBox.on('boxend', function() {
            // features that intersect the box are added to the collection of
            // selected features
            /*  var extent = dragBox.getGeometry().getExtent();
              vectorSource.forEachFeatureIntersectingExtent(extent, function(feature) {
                  selectedFeatures.push(feature);
              });*/
        });

        // clear selection when drawing a new box and when clicking on the map
        dragBox.on('boxstart', function() {
            //selectedFeatures.clear();
        });
    }
    Map.TTileLayerWMS=function(name,path,config){
        var layer=new TTileLayerWMS(name,path,config);
        return layer;
    };
    /**
     * 创建Arcgis REST 图层
     */
    /*Map.REST=function(name,path,config){
        var attribution = new ol.Attribution({
            /!*html: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
            'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'*!/
            html: 'Tiles © <a href="http://192.168.0.5:6080/arcgis/rest/services/shanghaihai_2015/MapServer/export">ArcGIS</a>'
        });
        var restLayer=new ol.layer.Tile({
            source: new ol.source.XYZ({
                attributions: [attribution],
                /!*url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
                'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',*!/
                url: 'http://192.168.0.5:6080/arcgis/rest/services/shanghaihai_2015/MapServer/export/{z}/{y}/{x}'
            })
        })
        Map.addLayer(restLayer);
        return restLayer;
    };*/
    Map.REST=function(name,path,config){
        /* var attribution = new ol.Attribution({
         html: 'Tiles  <a href="https://services.arcgisonline.com/ArcGIS/

         ' +
         'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'
         });
         var restLayer=new ol.layer.Tile({
         source: new ol.source.XYZ({
         attributions: [attribution],
         url: 'http://192.168.0.5:6080/arcgis/rest/services/shanghaihai_2015/MapServer/export/{z}/{y}/{x

         }'
         })
         })*/
        var restLayer= new ol.layer.Tile({
            source: new ol.source.TileArcGISRest({
                url:path,
            }),
        })
        return restLayer;
    };

    /**
     * 创建天地图WMS图层
     */
    Map.WMS=function(name,path,config){
        var wmsLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: path==""?'https://ahocevar.com/geoserver/wms':path,
                projection: config.PROJECTION==""?"EPSG:4326":config.PROJECTION,
                params: {
                    'LAYERS': config.LAYERS==""?"topp:states":config.LAYERS,
                    'VERSION': config.VERSION==""?"1.3.0":config.VERSION,
                    'WIDTH': config.WIDTH==""?"256":config.WIDTH,
                    'HEIGHT': config.HEIGHT==""?"256":config.HEIGHT,
                    'STYLES': config.STYLES==""?"":config.STYLES
                },
                serverType: 'geoserver'
            }),
            name: name
        });
        return wmsLayer;
    };
    /**
     * 创建Arcgis WMS图层
     */
    Map.ArcServerWMS=function(name,path,config){
        var wmsLayer = new ol.layer.Tile({
            source: new ol.source.TileArcGISRest({
                url: path==""?'https://ahocevar.com/geoserver/wms':path,
                projection: config.PROJECTION==""?"EPSG:4326":config.PROJECTION,
                params: {
                    'LAYERS': config.LAYERS==""?"0,1,2":config.LAYERS,
                    'VERSION': config.VERSION==""?"1.3.0":config.VERSION,
                    'SIZE': config.SIZE==""?"256,256":config.SIZE,
                    'FORMAT': config.FORMAT==""?"png32":config.FORMAT,
                    'F': config.F==""?"image":config.F,
                    'TRANSPARENT': config.TRANSPARENT==""?"true":config.TRANSPARENT,
                    'BBOX ':config.BBOX==""?"125,42,123,43":[config.BBOX]
                }
            }),
            name: name
        });
        return wmsLayer;
    };
//设置是否允许鼠标双击放大地图
    Map.enableDoubleClickZoom=function(){
        map.enableDoubleClickZoom();
    };
    Map.disableDoubleClickZoom=function(){
        map.disableDoubleClickZoom();
    };
//设置是否允许鼠标滚轮缩放地图
    Map.enableHandleMouseScroll=function(){
        map.enableHandleMouseScroll();
    };
    Map.disableDragHandleMouseScroll=function(){
        map.disableDragHandleMouseScroll();
    };
//设置是否允许鼠标惯性拖拽地图
    Map.enableInertia=function(){
        map.enableInertia();
    };
    Map.disableInertia=function(){
        map.disableInertia();
    };
//设置是否允许键盘操作地图
    Map.enableHandleKeyboard=function(){
        map.enableHandleKeyboard();
    };
    Map.disableHandleKeyboard=function(){
        map.disableHandleKeyboard();
    };
//设置地图显示级别范围
    Map.setZoomLevels=function(arr){
        map.getView().setZoomLevels(arr);
    };
//获取地图中心点坐标
    Map.getCenter=function(){
        var lnglat=map.getView().getCenter();
        var point={};
        point.longitude=lnglat[0];
        point.latitude=lnglat[1];
        return point;
    };
//设置地图当前缩放级别
    Map.setZoom=function(zoom){
        return map.getView().setZoom(zoom);
    };
//返回地图当前缩放级别
    Map.getZoom=function(){
        var level=map.getView().getZoom();
        return level;
    };
//获取地图当前分辨率
    Map.getResolution=function(){
        return map.getView().getResolution();
    }
//设置地图当前分辨率
    Map.setResolution=function(value){
        map.getView().setResolution(parseFloat(value));
    }

//计算地图当前屏幕对应extent
    Map.getBounds=Map.getMaxExtent=function(){
        var extent = {};
        var mapExtent =  map.getView().calculateExtent(map.getSize());
        if(mapExtent){
            extent.minX = mapExtent[0];
            extent.maxX = mapExtent[2];
            extent.minY = mapExtent[1];
            extent.maxY = mapExtent[3];
        }
        return extent;
    };
    Map.getMaxExtent=function(){
        return Map.getBounds();
    };
    Map.setMapExtent=function(points){
        var bound=[];
        for(var i=0;i<points.length;i++){
            try {
                var coord = [parseFloat(points[i].lon), parseFloat(points[i].lat)];
                bound.push(coord);
            }catch (ex){
                continue;
            }
        }
        var extent = new ol.extent.boundingExtent(bound);
        map.getView().fit(extent, map.getSize());
    };
    Map.getMercatorBounds=function(){
        var bound=map.getBounds();
        var newBound={};
        newBound.SW=bound.getSouthWest();
        newBound.NE=bound.getNorthEast();
        return newBound;
    };
    Map.getWidth=function(){
        return Map.Width;
        //return map.getViewSize().width;
    };
    Map.getHeight=function(){
        return Map.Height;
        //return map.getViewSize().height;
    };
   /* Map.addObj=function(obj){
        return map.addOverLay(obj);
    };*/
    Map.setMapProjectionType=function(type){
        if(map.getCode() == type) return;
        map.switchingMaps(type);

    };
    /**
     * 添加缩放平移控件
     * @param config
     * @returns
     */
    Map.NavControl=null;
    Map.setNavControl=function(config){
        if(Map.NavControl)
            map.removeControl(Map.NavControl);
        //创建缩放平移控件对象
        Map.NavControl=new TNavigationControl(config);
        //添加缩放平移控件
        map.addControl(Map.NavControl);
    };
    /**
     * 添加鹰眼控件
     * @param config
     * @returns
     */
    Map.overviewMapControl=null;
    Map.setOverviewMapControl=function(value){
        if(Map.overviewMapControl!=null){
            map.removeControl(Map.overviewMapControl);
        }
        if(value){
            Map.overviewMapControl= new ol.control.OverviewMap({
                className: 'ol-overviewmap ol-custom-overviewmap',
                target: document.getElementById("ol_overviewMapControlDiv"),
                collapseLabel: '\u00BB',
                label: '\u00AB',
                view: new ol.View({
                    projection: "EPSG:4326"
                })
            });
            map.addControl(Map.overviewMapControl);
        }else{
            map.removeControl(Map.overviewMapControl);
            Map.overviewMapControl=null;
        }
    };
    /**
     * 添加比例尺
     * @param config
     * @returns
     */
    Map.scaleControl=null;
    Map.setScaleControl=function(value){
        if(Map.scaleControl!=null){
            map.removeControl(Map.scaleControl);
        }
        if(value){
            Map.scaleControl= new ol.control.ScaleLine({
                className: "ol-scale-line",
                target: document.getElementById("ol_scaleControlDiv"),
                units: "metric"
            });
            map.addControl(Map.scaleControl);
        }else{
            map.removeControl(Map.scaleControl);
            Map.scaleControl=null;
        }
    };

    /**
     * 添加缩放滑动条
     * @param config
     * @returns
     */
    Map.NavigationControl=null;
    Map.setNavigationControlVisibility=function(value){
        if(Map.NavigationControl!=null){
            map.removeControl(Map.NavigationControl);
        }
        if(value){
            zoomslider = new ol.control.ZoomSlider();
            map.addControl(zoomslider);
          /*  Map.NavigationControl=new ol.control.ZoomSlider({
                className: "ol-zoomslider",
                target: document.getElementById("olmapNavigation")
            });*/
            //map.addControl(Map.NavigationControl);
        }else{
            map.removeControl(Map.NavigationControl);
            Map.NavigationControl=null;
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
    Map.measureDrawLayer=null;
    Map.measureDraw=null;
    Map.measureTooltip=null;
    Map.measureTooltipElement=null;
    Map.measureDrawLength;
    Map.measureDrawIndex=0;
    Map.openMeasure=function(type,callback){
        Map.ClearOperation();
        var sketch;
        var measureType=(type=="area")?"Polygon":"LineString";
        createMeasureTooltip();
        var source = new ol.source.Vector();
        var vector = new ol.layer.Vector({
            source: source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(225, 255, 255, 0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#6495ed',
                    width: 2
                })
            })
        });
        vector.setMap(map);
        var measureDraw=new ol.interaction.Draw({
            source: source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(225, 255, 255, 0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#6495ed',
                    width: 3
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({
                        color: 'rgba(51, 102, 255, 0.8)'
                    })
                })
            }),
            type: (measureType)
        });
        map.addInteraction(measureDraw);
        Map.measureDraw=measureDraw;
        Map.measureDrawLayer=vector;
        var listener;
        var output;
        measureDraw.on("drawstart",function(evt){
            sketch = evt.feature;
            var tooltipCoord = evt.coordinate;
            Map.measureDrawLength = 0;
            listener = sketch.getGeometry().on('change', function(evt) {
                var geom = evt.target;
                if (geom instanceof ol.geom.Polygon) {
                    output = formatLengthOrArea(geom, "polygon");
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if (geom instanceof ol.geom.LineString) {
                    output = formatLengthOrArea(geom, "polyline");
                    tooltipCoord = geom.getLastCoordinate();
                }
                Map.measureTooltipElement.innerHTML = output.measure + " " + output.units;
                Map.measureTooltip.setPosition(tooltipCoord);
                Map.measureDrawLength = output.measure;
                mouseStatic="measure";
            });
        }, this);
        measureDraw.on('drawend', function(evt) {
            sketch = null;
            Map.measureTooltipElement=null;
            createMeasureTooltip();
            Map.measureDrawLength = -1;
            Map.measureDrawIndex = 1;
            ol.Observable.unByKey(listener);
            if(callback!=null&&typeof(callback)=="function")callback(output);
        }, this);
        mouseStatic="measure";
    };
    var formatLengthOrArea = function(geom, type) {
        var output={};
        var wgs84Sphere = new ol.Sphere(6378137);
        if (type=="polyline") {
            var coordinates = geom.getCoordinates();
            var length = 0;
            var sourceProj = map.getView().getProjection();
            for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
                var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
                length += wgs84Sphere.haversineDistance(c1, c2);
            }
            if (length > 100) {
                output.measure = (Math.round(length / 1000 * 100) / 100);
                output.units = 'km';
            } else {
                output.measure = (Math.round(length * 100) / 100);
                output.units = 'm';
            }
            output.type = 'distance';
        } else if (type=="polygon") {
            var area = 0.0;
            var sourceProj = map.getView().getProjection();
            geom = (geom.clone().transform(sourceProj, 'EPSG:4326'));
            var coordinates = geom.getLinearRing(0).getCoordinates();
            area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
            if (area > 10000) {
                output.measure = (Math.round(area / 1000000 * 100) / 100);
                output.units = 'km<sup>2</sup>';
            } else {
                output.measure = (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
                output.units = 'm<sup>2</sup>';
            }
            output.type = 'area';
        }
        return output;
    };
    /**
     * 测量时，在地图上添加状态栏，显示线长或者多边形面积
     */
    var createMeasureTooltip = function(){
        if (Map.measureTooltipElement) {
            Map.measureTooltipElement.parentNode.removeChild(Map.measureTooltipElement);
        }
        var measureTooltipElement=document.createElement("div");
        measureTooltipElement.setAttribute("style","font-size: 14px; position: relative; background: rgba(85, 147, 243, 0.8); border-radius: 2px; padding: 4px;");
        var measureTooltip=new ol.Overlay({
            element: measureTooltipElement,
            offset: [0, -5],
            positioning: 'bottom-center'
        });
        map.addOverlay(measureTooltip);
        Map.measureTooltip=measureTooltip;
        Map.measureTooltipElement=measureTooltipElement;
    };
    /**
     * 关闭距离测量控件
     */
    Map.RemoveMeasureDraw=function(){
        if(Map.measureDraw){
            map.removeInteraction(Map.measureDraw);
            Map.measureDraw = null;
            var layerSource = Map.measureDrawLayer.getSource();
            var features = layerSource.getFeatures();
            features.forEach(function(feature){
                layerSource.removeFeature(feature);
            });
            Map.measureDrawLayer.setMap(null);
            var ols = map.getOverlays();
            if(ols.getLength()>0){
                ols.clear();
            }
            Map.measureDrawLayer=null;
            Map.measureTooltip=null;
            Map.measureTooltipElement=null;
            mouseStatic="normal";
        }
    };
    /**
     * 距离面积测量
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
     * 移动事件
     */
    Map.MoveEndEventCallBack=null;
    Map.MoveEndEvent=function(callback){
        Map.MoveEndEventCallBack=callback;
    };
    /**
     * 清除移动事件
     */
    Map.closeMoveEndEvent=function(){
        Map.MoveEndEventCallBack=null;
    };
    /**
     * 缩放事件
     */
    Map.ZoomEndEventCallBack=null;
    Map.ZoomEndEvent=function(callback){
        Map.ZoomEndEventCallBack=callback;
    };
    /**
     * 展示饼图
     * @param callback
     * @constructor
     */
    Map.ShowPieCharts=function(data){
        require(["echarts"], function(echarts){
            var color=['#c23531','#2f4554', '#61a0a8', '#d48265', '#91c7ae','#749f83',  '#ca8622', '#bda29a','#6e7074', '#546570', '#c4ccd3'];
            for(var i=0;i<data.length;i++){
                var obj=data[i];
                var subColor=[];
                $.each(obj.data,function (index,pObj){
                    if(pObj.color){
                        subColor.push(pObj.color);
                    }else{subColor.push(color[index]);}
                });
                var id=common.createGuid();
                var width=obj.width;
                if(!width)width=130;
                var height=obj.height;
                if(!height)height=160;
                $("#gisServerCharts").append("<div id='"+id+"' style='width: "+width+"px;height:"+height+"px;'></div>");
                var option = {
                    title : {
                        text: obj.name,
                        x:'center',
                        bottom:-5,
                        textStyle:{
                            fontWeight:'normal'
                        }
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{b} : {c} ({d}%)"
                    },
                    color:subColor,
                    series : [
                        {
                            name: '所占比例',
                            type: 'pie',
                            radius : '55%',
                            center: ['50%', '60%'],
                            data:obj.data,
                            label: {
                                normal: {
                                    show: false,
                                    position: 'center'
                                },
                                emphasis: {
                                    show: false,
                                    textStyle: {
                                        fontSize: '30',
                                        fontWeight: 'bold'
                                    }
                                }
                            }
                        }
                    ]
                };
                var chart = echarts.init(document.getElementById(id));
                chart.setOption(option);
                var pt =[obj.lon,obj.lat];
                var pie = new ol.Overlay({
                    position: pt,
                    positioning: 'center-center',
                    element: document.getElementById(id),
                    stopEvent: false
                });
                map.addOverlay(pie);
                map.render();
            }
        });

    };
    /**
     * 展示柱状图
     * @param data
     * @constructor
     */
    Map.ShowBarCharts=function(data){
        require(["echarts"], function(echarts){
            for(var i=0;i<data.length;i++){
                var colorList = ['#C1232B','#B5C334','#FCCE10'];
                var obj=data[i];
                if(obj.colorList){
                    colorList=obj.colorList;
                }
                var id=common.createGuid();
                var width=obj.width;
                if(!width)width=200;
                var height=obj.height;
                if(!height)height=250;
                $("#gisServerCharts").append("<div id='"+id+"' style='width: "+width+"px;height:"+height+"px;'></div>");
                var   option = {
                    title : {
                        text: obj.name,
                        x:'center',
                        bottom:5,
                        textStyle:{
                            color:"#242424",
                            fontWeight:'normal'
                        }
                    },
                    tooltip : {
                        trigger: 'axis',
                        formatter: "{c}"
                    },
                    calculable : true,
                    xAxis : [
                        {
                            type : 'category',
                            data : obj.XData
                        }
                    ],
                    textStyle:{
                        color:"#242424"
                    },
                    yAxis:{
                        axisTick:{
                            show:false
                        },
                        splitLine:{
                            show:false
                        },
                        axisLabel:{
                            show:false
                        },
                        axisLine:{show:false}
                    },
                    series : [
                        {
                            /*   name:'海岛统计',*/
                            type:'bar',
                            itemStyle: {
                                normal:{
                                    color: function(params) {
                                        if(params.dataIndex>=colorList.length)
                                            return colorList[0];
                                        else
                                            return colorList[params.dataIndex];
                                    }
                                }
                            },
                            data:obj.YData,
                             barWidth:20,
                            markPoint : {
                                data : [
                                    {type : 'max', name: '最大值'},
                                    {type : 'min', name: '最小值'}
                                ]
                            },
                            markLine : {
                                data : [
                                    {type : 'average', name: '平均值'}
                                ]
                            }
                        }
                    ]
                };
                var chart = echarts.init(document.getElementById(id));
                chart.setOption(option);
                var pt =[obj.lon,obj.lat];
                var pie = new ol.Overlay({
                    position: pt,
                    positioning: 'center-center',
                    element: document.getElementById(id),
                    stopEvent: false
                });
                map.addOverlay(pie);
                map.render();
            }
        });
    };
    Map.addPopup=function (obj) {
        obj.id=common.createGuid();
        $("#gisServerCharts").append("<div id='"+obj.id+"' ></div>");
        $("#"+obj.id).append(obj.contentHTML);
        var pt =[obj.lon,obj.lat];
        var pie = new ol.Overlay({
            position: pt,
            positioning: 'center-center',
            element: document.getElementById(obj.id),
            stopEvent: false
        });
        map.addOverlay(pie);
        map.render();
    }
    Map.CloseCharts=function () {
        map.getOverlays().clear();
        $("#gisServerCharts").empty();
    }
    /**
     * 清除缩放事件
     */
    Map.closeZoomEndEvent=function(){
        Map.ZoomEndEventCallBack=null;
    };
    Map.zoomIn=function(){
        var view = map.getView();
        var zoom = view.getZoom();
        view.setZoom(zoom + 1);
    };
    Map.zoomOut=function(){
        var view = map.getView();
        var zoom = view.getZoom();
        view.setZoom(zoom - 1);
    };
//设置地图中心点坐标状态是否可见
    Map.SetCenterVisibility=function(value){
        if(value){
            $("#olmapCenter").show();
        }else{
            $("#olmapCenter").hide();
        }
    };
//设置地图缩放级别状态是否可见
    Map.SetZoomVisibility=function(value){
        if(value){
            $("#olmapZoom").show();
        }else{
            $("#olmapZoom").hide();
        }
    };
//添加二维地图对象选择控件
    var singleClickInteractionSelect;
    Map.getObjEvent=function(callback){
        singleClickInteractionSelect = new ol.interaction.Select();
        map.addInteraction(singleClickInteractionSelect);
        singleClickInteractionSelect.on("select",function(e){
            var features = e.selected;
            if(features.length>0){
                var feature = features[0];
                callback(feature)
            }else callback(null);
        });
    }
//移除二维地图对象选择控件
    Map.unGetObjEvent=function(){
        if(singleClickInteractionSelect){
            map.removeInteraction(singleClickInteractionSelect);
            singleClickInteractionSelect=null;
        }
    }
//将当前points对象转化为经纬度坐标对象
    Map.transfromPointsToTLngLats=function(points){
        var newpoints = [];
        for(var i=0;i<points.length;i++){
            var point=points[i];
            newpoints.push(new ol.geom.Point([point.lon,point.lat]));
        }
        return newpoints;
    }
    Map.getPixelFromCoordinate=function (coord) {
        return map.getPixelFromCoordinate(coord)
    }
    Map.getCoordinateFromPixel=function (pixel) {
        return map.getCoordinateFromPixel(pixel)
    }
    /**
     * 加载大数据量json对象，返回已加载该对象的图层
     * @param data
     */
    var vectorJsonSourceLayer = null;
    var vectorJsonLayerClickCallback = null;
    Map.addGeoJsonLayer=function(data, callback){
        vectorJsonLayerClickCallback = callback;
        if(vectorJsonSourceLayer){
            vectorJsonSourceLayer.getSource().clear();
            Map.removeLayer(vectorJsonSourceLayer);
            vectorJsonSourceLayer=null;
        }
        var styles = {
            'Point': new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({color: 'red', width: 2})
                })
            }),
            'LineString': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 3
                })
            }),
            'Polygon': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'blue',
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 0, 0.5)'
                })
            })
        };
        var styleFunction = function(feature) {
            return styles[feature.getGeometry().getType()];
        };
        var vectorJsonSource = new ol.source.Vector({ });
        vectorJsonSourceLayer = new ol.layer.Vector({
            name: "vectorJsonSourceLayer",
            source: vectorJsonSource,
            style: styleFunction
        });
        addFeaturesToLayer(vectorJsonSource, data.path, data.name, data.index, 0);
        return vectorJsonSourceLayer;
    };
    Map.newVectorLayer=function (name) {
        var vectorSource = new ol.source.Vector({ wrapX: false});
        var layer = new ol.layer.Vector({
            name: name,
            source: vectorSource
        });
        return layer;
    }
    Map.AddLayers=function (arr){
        for(var i=0;i<arr.length;i++){
            map.addLayer(arr[i]);
        }
    }
    Map.RemoveLayer=function (layer) {
        map.removeLayer(layer);
    }

    var addFeaturesToLayer = function(layerSource, dataURL, dataName, dataIndex, index){
        var fileIndex = index;
        if(dataIndex>fileIndex){
            var fileURL = dataURL + dataName[fileIndex] + ".js";
            $.getScript(fileURL, function(){
                var fileObj = eval(dataName[fileIndex]);
                layerSource.addFeatures((new ol.format.GeoJSON()).readFeatures(fileObj));
                fileObj = null;
                fileIndex ++;
                //继续添加，如果存在下一个文件的话
                addFeaturesToLayer(layerSource, dataURL, dataName, dataIndex, fileIndex);
            });
        }
    };

    /**
     * 为地图添加指定位置的切片图层，设置缩放级别范围，切片图片类型，若传递的url为单个文件夹，则使用默认三维球地址
     * @param minZoom
     * @param maxZoom
     * @param imageType
     * @param url
     * @returns {ol.layer.Tile}
     */
    Map.AddTiledLayer=function(minZoom, maxZoom, imageType, url){
        var serverUrl = url;
        if(url && url.toLowerCase().indexOf("http")!=0){
            serverUrl = config.earthIp + "/" + url + "/";
        }
        var newTiledLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                projection: 'EPSG:4326',
                maxZoom: maxZoom,
                minZoom: minZoom,
                tileUrlFunction: function (tileCoord) {
                    var oo = "00000000";
                    var zz = tileCoord[0] + "";
                    if (zz.length < 2) zz = "0" + zz
                    var z = "L" + zz;
                    var xx = tileCoord[1].toString(16);
                    var x = "C" + oo.substring(0, 8 - xx.length) + xx;
                    var yy = (-tileCoord[2] - 1).toString(16);
                    var y = "R" + oo.substring(0, 8 - yy.length) + yy;
                    var url = serverUrl + z + '/' + y + '/' + x + '.' + imageType;
                    return url;
                }
            })
        });
        return newTiledLayer;
    };
    function getTdtLayer(lyr){
        var url = "http://t0.tianditu.com/DataServer?T="+lyr+"&X={x}&Y={y}&L={z}";//在线
        var projection =proj;
        var projectionExtent = [ -180, -90, 180, 90 ];
        var maxResolution = (ol.extent.getWidth(projectionExtent) / (256 * 2));
        var resolutions = new Array(16);
        var z;
        for (z = 0; z < 16; ++z) {
            resolutions[z] = maxResolution / Math.pow(2, z);
        }
        var tileOrigin = ol.extent.getTopLeft(projectionExtent);
        var layer = new ol.layer.Tile({
            extent: [ -180, -90, 180, 90 ],
            source: new ol.source.TileImage({ tileUrlFunction: function(tileCoord) {
                var z = tileCoord[0]+1;
                var x = tileCoord[1];
                var y = -tileCoord[2]-1;
                var n = Math.pow(2, z + 1);
                x = x % n;
                if (x * n < 0) {
                    x = x + n;
                }
                return url.replace('{z}', z.toString()) .replace('{y}', y.toString()) .replace('{x}', x.toString()); }, projection: projection, tileGrid: new ol.tilegrid.TileGrid({ origin: tileOrigin, resolutions: resolutions, tileSize: 256 }) })
        });
        return layer;
    }

    /**
     @method:获得高德图层
     @param:lyUrl,图层的url
     @return：返回layer对象
     @author：zhb,2018-01-07
      ****/
      function getGdLayer(lyUrl) { 
        var projection = 'EPSG:3857'; 
        ol.source.GaodeMap = function (options) {
            var options = options ? options : {};

            var attributions;
            if (options.attributions !== undefined) {
                attributions = option.attributions;
            } else {
                attributions = [ol.source.GaodeMap.ATTRIBUTION];
            } 
            ol.source.XYZ.call(this, {
                crossOrigin: 'anonymous',   //跨域
                cacheSize: options.cacheSize,
                projection: ol.proj.get(projection), 
                url: lyUrl,
                wrapX: options.wrapX !== undefined ? options.wrapX : true

            });

        }

        ol.inherits(ol.source.GaodeMap, ol.source.XYZ); 
        ol.source.GaodeMap.ATTRIBUTION = new ol.Attribution({}); 
        var layer = new ol.layer.Tile({
            title: "高德地图",
            source: new ol.source.GaodeMap()
        });
        return layer;
    }

    return Map;
});