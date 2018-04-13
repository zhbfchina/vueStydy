/**
 * Created by fxd on 2017-04-06.
 */
define(["earthEvent","jquery","config","common","xml2json"],function(Event,$,config,common,xml2json) {
    var cfch=1;//记录刷新界面的单双次，让浮在三维上的div可以显示。
    tgisServer.ToMapButtonId=null;
    var mouseStatic="normal";//用于记录鼠标的使用状态
    var earthObjArr=[];
    var Earth=new Object();
    Earth.Event=Event;
    Earth.earthDiv="yysTGisServerEarthCtrDiv";
    Earth.returnDataType='xml';
    Earth.SelectSet={}//三维对象的选择集
    var _earth=null;

    /**
     * 判断控件是否被阻止。
     * @returns {boolean}
     * @constructor
     */
    function DisActiveX(){
        //xmlhttp对象
        var kXmlHttp = null;
        try
        {
            //非微软IE支持的xmlhttp对象
            if (typeof XMLHttpRequest != "undefined")
            {
                kXmlHttp = new XMLHttpRequest();
                return true;
            }
        }
        catch(e)
        {  }
        //微软IE支持的xmlhttp对象
        var aVersionhs = ["MSXML2.XMLHttp.5.0",
            "MSXML2.XMLHttp.4.0",
            "MSXML2.XMLHttp.3.0",
            "MSXML2.XMLHttp",
            "Microsoft.XMLHttp"];
        //IE创建方式
        for (var i = 0; i < aVersionhs.length; i++)
        {
            try
            {
                kXmlHttp = new ActiveXObject(aVersionhs[i]);
                return true;
            }
            catch(e)
            { }
        }
        return false;
    }
    Earth.initEarth=function(){
        tgisServer.ToMapButtonId=null;
       /* var ieVersion = window.navigator.platform;
        var stampCAB = 'codebase="stamp2/stamp32.CAB#version=3,1,2,1"'; //32位cab包
        if (ieVersion == "Win64") {
            stampCAB = 'codebase="stamp2/stamp64.CAB#version=3,1,2,1"'; //64为cab包
        }*/
        $("#"+ Earth.earthDiv).html('<object id="seearthEA3EA17C" classid="clsid:EA3EA17C-5724-4104-94D8-4EECBD352964" ' +
            'data="data:application/x-oleobject;base64,Xy0TLBTXH0q8GKFyFzl3vgAIAADYEwAA2BMAAA==" ' +
         /*   stampCAB + ' ' +*/
            'width="100%" height="100%"></object><div id="profileDiv" style="display:none"></div>');
        _earth=document.getElementById("seearthEA3EA17C");
        try {
            _earth.Event.OnCreateEarth = function() {
                _earth.Event.OnCreateEarth = function() {};
                _earth.Event.OnDocumentChanged = function(type, guid) {
                    _earth.Event.OnDocumentChanged = function() {};
                    if (type == 1) {
                        _earth.Analysis.AnalysisServer =config.earthIp;
                    }
                    Earth.Setlogo(false);
                    _earth.Environment.SetLogoWindowVisibility(false);
                    _earth.Environment.SetNavigatorWindowVisibility(false);
                    _earth.Environment.Mode2DEnable = false;
                    _earth.GlobeObserver.IntersectModel =true;
                    _earth.Environment.CenterPointEnable=false;
                    createEditLayer()//创建编辑图片，用于存放线、面对象等，解决以上对象视角消失的问题。
                    // _earth.Environment.EnableHoverMessage = true;
                    Earth.layerList=_earth.LayerManager.LayerList;
                    tgisServer.UserDocument=_earth.UserDocument;
                    //保存按钮图片
                    tgisServer.UserDocument.SaveFile(tgisServer.ServerPath+"gisServer/images/dtearth.png","dtearth.png");
                    if(tgisServer.showType=="3d"&&tgisServer.ToMapButtonVisibility){// 2016-11-28 fxd 此段代码是为了一开始就是三维场景时，添加切换按钮
                        Earth.CreateEarthToMapButton();
                    }
                    //2015/11/20 fxd 新版需要设置这个才能找到搜索数据。
                    Earth.setReturnDataType();
                    //2016-12-01 fxd 为了在三维上可以显示div
                    _earth.Event.OnObserverChanged = function() {
                        if(cfch==1){
                            document.getElementById("refreshDivForEarth").style.height="1px";
                            cfch=0
                        }else{
                            document.getElementById("refreshDivForEarth").style.height="2px";
                            cfch=1
                        }
                        if(Earth.OnObserverChanged&&typeof(Earth.OnObserverChanged)=="function"){
                            Earth.OnObserverChanged();
                        }
                    };
                    if(Earth.StartFinished&&typeof(Earth.StartFinished)=="function"){//加载球完成事件
                        Earth.StartFinished(true);
                    }
                    _earth.Event.OnEditFinished=function(data){//编辑完成事件
                        var callback=Earth.editFinished;
                        if(callback&&typeof(callback)=="function")callback(data);
                    };
                    _earth.Event.OnFlyToFinished=function(type) {
                        var callback=Earth.flyToFinished;
                        if(callback&&typeof(callback)=="function")callback(type);
                    }
                    _earth.Event.OnGUIButtonClick = function(id){
                        Event.onGUIClickEvent(id);
                    };
                    _earth.Event.OnGUITipClosed = function(id){
                        Event.onGUICloseEvent(id);
                    };
                };
                _earth.Load(config.earthIp, config.screenIndex);
            };
        } catch (e) {
            if(Earth.StartFinished&&typeof(Earth.StartFinished)=="function"){
                Earth.StartFinished(false);
            }
            if(!DisActiveX()){
                alert("浏览器阻止了控件，请在Internet选项里面进行设置，取消对未知activex的禁止。")
                return;
            }
            try
            {
                var comActiveX = new ActiveXObject("lib_ax.SEEarth.1");
            }
            catch(e)
            {
                    window.open(tgisServer.ServerPath+"gisServer/jsp/download.jsp");
            }

        }
        //关闭页面时，先销毁地球
        $(window).unload(function(){
            if(_earth){
                try{
                    _earth.Suicide();
                }catch (e) {

                }
                _earth=null;
            }
        });
    };
    Earth.StartFinished=null;//加载完成事件
    Earth.OnObserverChanged=null;
    Earth.SetCenterPointEnable=function(value){
        _earth.Environment.CenterPointEnable=value;
    }

    Earth.CreateEarthToMapButton=function () {
        if(tgisServer.ToMapButtonId)
            Earth.removeGUIById(tgisServer.ToMapButtonId);
        if(!tgisServer.ToMapButtonVisibility)return;
        var objHeight=0;
        var objWidth=0;
        if(tgisServer.TransformButtonLocation=="Coordinate_LT"){
            objHeight=tgisServer.TransformButtonOffSet;
            objWidth=tgisServer.TransformButtonOffSet;
        }else if(tgisServer.TransformButtonLocation=="Coordinate_LB"){
            objHeight=tgisServer.Height-tgisServer.TransformButtonOffSet-tgisServer.TransformButtonHeight;
            objWidth=20;
        }else if(tgisServer.TransformButtonLocation=="Coordinate_RB"){
            objHeight=tgisServer.Height-tgisServer.TransformButtonOffSet-tgisServer.TransformButtonHeight;
            objWidth=tgisServer.Width-tgisServer.TransformButtonOffSet-tgisServer.TransformButtonWidth;
        }else if(tgisServer.TransformButtonLocation=="Coordinate_RT"){
            objHeight=tgisServer.TransformButtonOffSet;
            objWidth=tgisServer.Width-tgisServer.TransformButtonOffSet-tgisServer.TransformButtonWidth;
        }
        var dtimg=_earth.Environment.RootPath+"temp\\dtearth.png";
        var config={
            width:50,
            height:50,
            top:objHeight,
            left:objWidth,
            normalimg:dtimg,
            heighimg:dtimg
        };
        tgisServer.ToMapButtonId=Earth.createGUIButton(config);
        Event.addGUIClickEvent(tgisServer.ToMapButtonId,function () {
            tgisServer.toMapView();
        });
    };
//地图div容器大小变化时，刷新图标按钮
    Earth.EarthChangeUpdate=function(){
        setTimeout(function(){
            Earth.CreateEarthToMapButton();
        },400);
    }
    Earth.ClearOperation=function(){
        _earth.ShapeCreator.Clear();
        _earth.Measure.Clear();
        var res=_earth.TerrainManager.GetTempLayerRect();
        //_earth.TerrainManager.ClearTempLayer();
        _earth.Event.OnPickObjectEx = function (){};
        _earth.Query.FinishPick();
        csbjPickCallBack=null;
        if(resultRes)//通视分析的结果清除。
        {
            try{
                resultRes.ClearRes();
            }catch (ex){}
            resultRes=null;
        }
        if(ClipModelArr.length>0){
            for(var i=0;i<ClipModelArr.length;i++){
                var model=ClipModelArr[i];
                if (model) {
                    _earth.DetachObject(model);
                }
            }
            ClipModelArr.splice(0,ClipModelArr.length);
            _earth.TerrainManager.ClearTempLayer();
        }
        Earth.ClearProfileAnalysis();

        //20170712 fxd 增加测量结果右键清除事件
        Event.RemoveMouseRightUpEvent(Earth.ClearOperation);
    }
    /**
     * 设置屏幕文字
     * fxd 2016-11-25
     * @param StartXPos 屏幕X坐标
     * @param StartYPos 屏幕Y坐标
     * @param Tips  文字内容
     * @param TextColor 文字颜色
     * @param height 显示高度
     * @param width 显示宽度
     * @constructor
     */
    Earth.SetScreenInformationText=function(StartXPos,StartYPos,Tips,TextColor,width,height){
        try{
            var color=Earth.getColor(1,TextColor);
            _earth.Environment.SetScreenInformationText(StartXPos,StartYPos,Tips,color,width,height);
            return true;
        }catch (ex){
            return false;
        }
    };
    /**
     * 设置在屏幕上显示的文字
     *2016-11-28 fxd
     lon：经度
     lat：纬度
     alt：高程
     text：显示内容
     color：文字颜色
     fontHeight：字高
     fontWidth：字宽
     * @constructor
     */
    Earth.SetSphrInformationText=function(lon,lat,alt,Tips,TextColor,width,height){
        try{
            var color=Earth.getColor(1,TextColor);
            _earth.Environment.SetSphrInformationText(lon,lat,alt,Tips,color,width,height);
            return true;
        }catch (ex){
            return false;
        }
    };
    /**
     * 清除在屏幕上的文字
     * 2016-11-28 fxd
     * @constructor
     */
    Earth.ClearInformationText=function(){
        _earth.Environment.ClearInformationText();
    };
    /**
     * 设置地球控件是否显示标志
     * @param value true/false
     */
    Earth.Setlogo=function(value){
        _earth.Environment.SetLogoWindowVisibility(value);
    };
    /**
     * 浏览
     */
    Earth.Browse=function (){
        _earth.ToolManager.SphericalObjectEditTool.Browse();
        _earth.Event.OnSelectChanged=function(){};
    };
    /**
     * 选择
     */
    Earth.select=function (){
        _earth.ToolManager.SphericalObjectEditTool.Select();
    };
    /**
     * 移动
     */
    Earth.move=function (){
        _earth.ToolManager.SphericalObjectEditTool.Move(7);
    };
    /**
     * 旋转
     */
    Earth.rotate=function (){
        _earth.ToolManager.SphericalObjectEditTool.Rotate(7);
    };
    /**
     * 缩放
     */
    Earth.scale=function (){
        _earth.ToolManager.SphericalObjectEditTool.Scale(7);
    };
    /**
     * 编辑顶点
     */
    Earth.editPoint=function(){
        _earth.ToolManager.ElementEditTool.ShapeEdit();
    };
    /**
     * 添加顶点
     */
    Earth.addPoint=function(){
        _earth.ToolManager.ElementEditTool.InsertPoint();
    };
    /**
     * 删除顶点
     */
    Earth.deletePoint=function(){
        _earth.ToolManager.ElementEditTool.DeletePoint();//选择删除点
    };
//选择控制点方法
    Earth.OnControlPointSelectChanged=function(callback){
        _earth.Event.OnControlPointSelectChanged=function(){
            _earth.Event.OnControlPointSelectChanged=function(){};
            if(callback&&typeof(callback)=="function")callback();
        }
    };
//删除控制点方法
    Earth.OnControlPointDeleteChanged=function(callback){
        _earth.Event.OnGeometryDeletePoint=function(){
            _earth.ToolManager.ElementEditTool.DeleteSelectedPoint();//删除选择点
            if(callback&&typeof(callback)=="function")callback();
        }
    };
//新增控制点方法
    Earth.OnControlPointAddChanged=function(callback){
        _earth.Event.OnGeometryInsertPoint=function(){
            if(callback&&typeof(callback)=="function")callback();
        }
    };
//设置球的中文状态
    Earth.setChinaLanguage=function(){
        _earth.Environment.SetInformationLanguage(1);
    };
    /**
     * fxd
     * 贴地功能
     * 不知道怎么实现的，以前的是自己组织代码贴地。
     * @return
     */
    Earth.stickTo=function (){
        _earth.ToolManager.SphericalObjectEditTool.AlignGround();
    };


    Earth.basePath="";
//得到当前视角的值
    Earth.getLon=function (){ //经度
        return _earth.GlobeObserver.TargetPose.Longitude;
    };
    Earth.getLat=function (){//纬度
        return _earth.GlobeObserver.TargetPose.Latitude;
    };
    Earth.getAlt=function (){//高层
        return _earth.GlobeObserver.TargetPose.Altitude;
    };
    Earth.getHeading=function (){//heading
        return _earth.GlobeObserver.Pose.Heading;
    };
    Earth.getTilt=function (){//TILT
        return _earth.GlobeObserver.Pose.Tilt;
    };
    Earth.getRoll=function (){//roll
        return _earth.GlobeObserver.Pose.Roll;
    };
    Earth.getRange=function (){//RANGE
        return _earth.GlobeObserver.Pose.range;
    };
    Earth.goToLookAt=function(lon,lat,heading,tilt,range,alt){
        lon=parseFloat(lon);
        lat=parseFloat(lat);
        heading=parseFloat(heading);
        tilt=parseFloat(tilt);
        range=parseFloat(range);
        if(!alt){
            alt=_earth.Measure.MeasureTerrainAltitude(lon,lat);
        }
        _earth.GlobeObserver.GotoLookat(lon,lat,alt,heading,tilt,0,range);
    };
    Earth.flyToLookAt=function(lon,lat,heading,tilt,range,time,alt){
        lon=parseFloat(lon);
        lat=parseFloat(lat);
        heading=parseFloat(heading);
        tilt=parseFloat(tilt);
        range=parseFloat(range);
        if(!alt){
            alt=_earth.Measure.MeasureTerrainAltitude(lon,lat);
        }
        _earth.GlobeObserver.FlytoLookat(lon,lat,alt,heading,tilt,0,range,time);
    };
    Earth.createPointEvent=function(callback){
        _earth.Event.OnCreateGeometry =callback;
        _earth.ShapeCreator.CreatePoint();
    };
    Earth.createPolylineEvent=function(callback){
        _earth.Event.OnCreateGeometry =function (pVal,type) {
            _earth.ShapeCreator.Clear();
            if(pVal==null||pVal.Count<2)return;
            if(callback&&typeof(callback)=="function"){
                var points=Earth.transfromVectersToPoints(pVal);
                callback(points);
            }
        };
        _earth.ShapeCreator.CreatePolyline(2, 16711680);
        _earth.focus();//2017-03-17 fxd 解决点第一次没有反应的问题
    };
    Earth.createLineEvent=function(callback){
        _earth.Event.OnCreateGeometry =function (pVal,type) {
            _earth.ShapeCreator.Clear();
            if(callback!=null&&typeof(callback)=="function"){
                var points=Earth.transfromGeoPointsToPoints(pVal);
                callback(points);
            }
        };
        _earth.ShapeCreator.CreateLine();
        _earth.focus();//2017-03-17 fxd 解决点第一次没有反应的问题
    };
    Earth.CreateSectorEvent=function(angle,callback){
        angle=parseFloat(angle);
        Earth.onCreateGeometry(callback);
        if(angle)
            _earth.ShapeCreator.CreateSector(angle);
        else
           alert("请传入角度！");
        _earth.focus();//2017-03-17 fxd 解决点第一次没有反应的问题
    };
    Earth.createPolygonEvent=function(callback){
        _earth.Event.OnCreateGeometry =function (pVal,type) {
            if(pVal==null||pVal.Count<3)return;
            _earth.ShapeCreator.Clear();
            var points=Earth.transfromVectersToPoints(pVal);
            if(callback!=null&&typeof(callback)=="function")callback(points);
        };
        _earth.ShapeCreator.CreatePolygon();
        _earth.focus();//2017-03-17 fxd 解决点第一次没有反应的问题
    };
    Earth.createCircleEvent=function(callback){
        _earth.Event.OnCreateGeometry =function (pVal,type) {
            _earth.ShapeCreator.Clear();
            if(callback!=null&&typeof(callback)=="function")callback(pVal);
        };
        _earth.ShapeCreator.CreateCircle();
        _earth.focus();//2017-03-17 fxd 解决点第一次没有反应的问题
    };

    /**
     * yqc 标绘
     * @param callback
     */
    Earth.createPlotArrowEvent=function(type, callback){
        _earth.Event.OnCreateGeometry =function(pVal, type){
            if(pVal==null || !pVal.Count)return;
            _earth.ShapeCreator.Clear();
            var points=tgisServer.transfromVectersToPoints(pVal);
            if(callback!=null&&typeof(callback)=="function")callback(points);
        };
        if (type == "sArrow") {
            _earth.ShapeCreator.CreatePlotSArrow();
        } else if (type == "customArrow") {
            _earth.ShapeCreator.CreatePlotCustomArrow();
        } else if (type == "tailArrow") {
            _earth.ShapeCreator.CreatePlotTailSArrow();
        } else if (type == "customTailArrow") {
            _earth.ShapeCreator.CreatePlotCustomTailArrow();
        } else if (type == "equalSArrow") {
            _earth.ShapeCreator.CreatePlotEqualSArrow();
        } else if (type == "doubleArrow") {
            _earth.ShapeCreator.CreatePlotDoubleArrow();
        } else if (type == "xArrow") {
            _earth.ShapeCreator.CreatePlotXArrow();
        } else if (type == "assemblyArea") {
            _earth.ShapeCreator.CreatePlotAssemblyArea();
        } else if (type == "triangleFlag") {
            _earth.ShapeCreator.CreatePlotTriangleFlag();
        } else if (type == "rectFlag") {
            _earth.ShapeCreator.CreatePlotRectFlag();
        } else if (type == "curveFlag") {
            _earth.ShapeCreator.CreatePlotCurveFlag();
        }
        _earth.focus();
    };

    Earth.onCreateGeometry=function(callback){
        _earth.Event.OnCreateGeometry =function(pVal){
            _earth.ShapeCreator.Clear();
            //_earth.Event.OnCreateGeometry=function(){};
            if(callback&& typeof callback == "function") callback(pVal);
        };
    };
    /**
     * 创建球体
     * @param callback
     */
    Earth.createSphereEvent=function(callback){
        Earth.onCreateGeometry(callback);
        _earth.ShapeCreator.CreateSphere(16711680);
        _earth.focus();
    };
    /**
     * 创建立方体
     * @param callback
     */
    Earth.createBoxEvent=function(callback){
        Earth.onCreateGeometry(callback);
        _earth.ShapeCreator.createBox(16711680);
        _earth.focus();
    };
    /**
     * 创建圆柱
     * @param callback
     */
    Earth.createCylinderEvent=function(callback){
        Earth.onCreateGeometry(callback);
        _earth.ShapeCreator.CreateCylinder(16711680);
        _earth.focus();
    };
    /**
     * 创建圆锥
     * @param callback
     */
    Earth.createConeEvent=function(callback){
        Earth.onCreateGeometry(callback);
        _earth.ShapeCreator.CreateCone(16711680);
        _earth.focus();
    };
    /**
     * 创建简单建筑
     * @param callback
     */
    Earth.createVolumeEvent=function(callback){
        Earth.onCreateGeometry(callback);
        _earth.ShapeCreator.CreateVolume(0xffff0000);
        _earth.focus();
    };
    /**
     * 创建曲线
     * @param callback
     */
    Earth.createCurveEvent=function(callback){
        _earth.Event.OnCreateGeometry =function(pVal){
            if(pVal==null || !pVal.Count)return;
            _earth.ShapeCreator.Clear();
            var points=tgisServer.transfromVectersToPoints(pVal);
            if(callback!=null&&typeof(callback)=="function")callback(points);
        };
        _earth.ShapeCreator.CreateCurve();
        _earth.focus();
    };
    Earth.createMarker=function(obj){
        //处理图标
        var iconPath=obj.earthicon;
        if((iconPath==""||iconPath==null)&&obj.text==null)return null;
        var fileName="";
        var myicon = _earth.Factory.CreateElementIcon(obj.id,obj.name);
        //obj.altitude=_earth.Measure.MeasureTerrainAltitude(obj.longitude,obj.latitude,true);
        if(obj.altitude==null||obj.altitude==""){
            obj.altitude=_earth.Measure.MeasureTerrainAltitude(obj.longitude,obj.latitude);
            //obj.altitude=_earth.GlobeObserver.GetHeight(obj.longitude,obj.latitude);
        }
        if(obj.textcolor){
            var color=Earth.getColor(1,obj.textcolor);
            myicon.TextColor = color;
        }
        myicon.TextFormat=8;
        var text=" ";
        if(obj.text&&obj.text.length>0){text=obj.text}
        myicon.Create(obj.longitude,obj.latitude,obj.altitude,iconPath,iconPath, text);
        myicon.Visibility = true;
        myicon.Selectable = true;
        myicon.Editable = true;
        _earth.AttachObject(myicon);
        earthObjArr.push(myicon);
        return myicon;
    };
    Earth.createPolyline=function(obj){
        //obj.linecolor="ccff0000";
        if(obj.altitudetype==null)//SEAltitudeTypeAbsolute = 0, ClampToTerrain = 1,  ClampToModel = 5
            obj.altitudetype=5;
        //obj.arrow=false;
        obj.drawOrder="0";
        obj.selectable='true';
        obj.editable='true';
        var elementLine = _earth.Factory.CreateElementLine(obj.id,  obj.name);
        elementLine.BeginUpdate();
        elementLine.SetPointArray(obj.earthpoints);
        elementLine.Visibility = true;
        if(obj.opacity==null)obj.opacity=1;
        var color=Earth.getColor(obj.opacity,obj.color);
        elementLine.LineStyle.LineColor =color;
        elementLine.LineStyle.LineWidth = obj.width;
        elementLine.AltitudeType =obj.altitudetype;
        //elementLine.Visibility = true;
        //elementLine.IsAddArrow =false;
        //新增属性
        elementLine.Selectable = obj.selectable;
        elementLine.Editable = obj.editable;
        elementLine.DrawOrder = obj.drawOrder;
        elementLine.EndUpdate();
        Earth.EditLayer.AttachObject(elementLine);
        //_earth.AttachObject(elementLine);
        earthObjArr.push(elementLine);
        return elementLine;
    };
    Earth.createPolygon=function(obj){
        if(obj.altitudetype==null)//SEAltitudeTypeAbsolute = 0, ClampToTerrain = 1,  ClampToModel = 5
            obj.altitudetype=5;
        obj.linewidth='1';
        obj.linecolor="cc000000";
        obj.drawOrder="0";
        obj.selectable='true';
        obj.editable='true';
        var elementPolygon = _earth.Factory.CreateElementPolygon(obj.id, obj.name);
        if(obj.earthpoints==null){
            obj.earthpoints=Earth.transfromPointsToVecs(obj.points);
        }
        elementPolygon.BeginUpdate();
        elementPolygon.SetExteriorRing(obj.earthpoints);
        elementPolygon.LineStyle.LineWidth = obj.lineWidth;
        if(obj.lineOpacity==null)obj.lineOpacity=1;
        var linecolor=Earth.getColor(obj.lineOpacity,obj.lineColor);
        elementPolygon.LineStyle.LineColor = linecolor;
        elementPolygon.AltitudeType =obj.altitudetype;
        var fillColor=Earth.getColor(obj.fillOpacity,obj.fillColor);
        elementPolygon.FillStyle.FillColor = fillColor;
        elementPolygon.DrawOrder = obj.drawOrder;
        elementPolygon.Selectable = obj.selectable;
        elementPolygon.Editable = obj.editable;
        elementPolygon.EndUpdate();
        Earth.EditLayer.AttachObject(elementPolygon);
        //_earth.AttachObject(elementPolygon);
        earthObjArr.push(elementPolygon);
        return elementPolygon;
    };
    Earth.createCircle=function(obj){
        if(!obj.altitudetype)
            obj.altitudetype=1;
        obj.drawOrder="0";
        obj.selectable='true';
        obj.editable='true';
        var circle = _earth.Factory.CreateElementCircle(obj.id, obj.name);
        var tran = circle.SphericalTransform;
        if(obj.altitude==null||obj.altitude==""||obj.altitude==0){
            obj.altitude=_earth.Measure.MeasureTerrainAltitude(obj.longitude,obj.latitude);
        }
        tran.SetLocationEx(obj.longitude,obj.latitude,obj.altitude);
        circle.BeginUpdate();
        circle.Selectable = obj.selectable;
        circle.Editable = obj.editable;
        circle.AltitudeType =obj.altitudetype;
        circle.Radius =obj.radius;
        var linecolor=Earth.getColor(obj.lineopacity,obj.linecolor);
        var fillColor=Earth.getColor(obj.fillopacity,obj.fillcolor);
        circle.FillStyle.FillColor = fillColor;
        circle.LineStyle.LineWidth = obj.linewidth;
        circle.LineStyle.LineColor =linecolor;
        circle.EndUpdate();
        Earth.EditLayer.AttachObject(circle);
        //_earth.AttachObject(circle);
        earthObjArr.push(circle);
        return circle;
    };
    Earth.createPlotArrow=function(obj) {
        var guid = "";
        if(obj.id)
            guid=obj.id;
        else
            guid = _earth.Factory.CreateGuid();
        var sarrow;
        var objType = obj.type;
        if (objType == "sArrow") {
            sarrow = _earth.Factory.CreateElementPlotSArrow(guid, obj.name);
        } else if (objType == "customArrow") {
            sarrow = _earth.Factory.CreateElementPlotCustomArrow(guid, obj.name);
        } else if (objType == "tailArrow") {
            sarrow = _earth.Factory.CreateElementPlotTailSArrow(guid, obj.name);
        } else if (objType == "customTailArrow") {
            sarrow = _earth.Factory.CreateElementPlotCustomTailArrow(guid, obj.name);
        } else if (objType == "equalSArrow") {
            sarrow = _earth.Factory.CreateElementPlotEqualSArrow(guid, obj.name);
        } else if (objType == "doubleArrow") {
            sarrow = _earth.Factory.CreateElementPlotDoubleArrow(guid, obj.name);
        } else if (objType == "xArrow") {
            sarrow = _earth.Factory.CreateElementPlotXArrow(guid, obj.name);
        } else if (objType == "assemblyArea") {
            sarrow = _earth.Factory.CreateElementPlotAssemblyArea(guid, obj.name);
        } else if (objType == "triangleFlag") {
            sarrow = _earth.Factory.CreateElementPlotTriangleFlag(guid, obj.name);
        } else if (objType == "rectFlag") {
            sarrow = _earth.Factory.CreateElementPlotRectFlag(guid, obj.name);
        } else if (objType == "curveFlag") {
            sarrow = _earth.Factory.CreateElementPlotCurveFlag(guid, obj.name);
        }
        sarrow.BeginUpdate();
        sarrow.name = obj.name;
        obj.earthPoints=Earth.transfromPointsToVecs(obj.points);
        /*if(!obj.earthPoints){
            obj.earthPoints=Earth.transfromPointsToVecs(obj.points);
        }*/
        sarrow.SetControlPointArray(obj.earthPoints);
        var lineStyle = sarrow.LineStyle;
        lineStyle.LineWidth = obj.lineWidth;
        if (obj.lineColor) {
            var lineColor=Earth.getColor(obj.lineOpacity,obj.lineColor);
            lineStyle.LineColor = lineColor;
        }
        var fillStyle = sarrow.FillStyle;
        if (obj.fillColor) {
            var fillColor=Earth.getColor(obj.fillOpacity,obj.fillColor);
            fillStyle.FillColor = fillColor;
        }
        if (obj.altitudeType && objType != "triangleFlag" && objType != "rectFlag" && objType != "curveFlag") {
            sarrow.AltitudeType = obj.altitudeType;
        }
        sarrow.Visibility = true;
        sarrow.Selectable = true;
        sarrow.Editable = true;
        sarrow.EndUpdate();
        earthObjArr.push(sarrow);
        _earth.AttachObject(sarrow);
        return sarrow;
    };
    /**
     * 创建立方体
     * @param obj
     * @returns {*}
     */
    Earth.createBox=function(obj){
        if(!obj.altitudetype)
            obj.altitudetype=1;
        obj.drawOrder="0";
        obj.selectable='true';
        obj.editable='true';
        var box = _earth.Factory.CreateElementBox(obj.id, obj.name);
        box.BeginUpdate();
        box.SphericalTransform.SetLocationEx(obj.longitude,obj.latitude,obj.altitude);
        box.Selectable = obj.selectable;
        box.Editable = obj.editable;
        //box.AltitudeType =obj.altitudetype;
        box.Width = obj.width;
        box.Length = obj.length;
        box.Height = obj.height;

        var fillColor=Earth.getColor(obj.fillopacity,obj.fillcolor);
        box.FillColor = fillColor;
        box.EndUpdate();
        _earth.AttachObject(box);
        earthObjArr.push(box);
        return box;
    };
    /**
     * 创建球体
     * @param obj
     * @returns {*}
     */
    Earth.createSphere=function(obj){
        if(!obj.altitudetype)
            obj.altitudetype=1;
        obj.drawOrder="0";
        obj.selectable='true';
        obj.editable='true';
        var elementSphere = _earth.Factory.CreateElementSphere(obj.id, obj.name);
        elementSphere.BeginUpdate();
        elementSphere.SphericalTransform.SetLocationEx(obj.longitude,obj.latitude,obj.altitude);
        elementSphere.Selectable = obj.selectable;
        elementSphere.Editable = obj.editable;
        elementSphere.Radius = obj.radius;
        var fillColor=Earth.getColor(obj.fillopacity,obj.fillcolor);
        elementSphere.FillColor = fillColor;
        elementSphere.EndUpdate();
        _earth.AttachObject(elementSphere);
        earthObjArr.push(elementSphere);
        return elementSphere;
    };
    /**
     * 创建圆柱
     * @param obj
     * @returns {*}
     */
    Earth.createCylinder=function(obj){
        if(!obj.altitudetype)
            obj.altitudetype=1;
        obj.drawOrder="0";
        obj.selectable='true';
        obj.editable='true';
        var elementCylinder = _earth.Factory.CreateElementCylinder(obj.id, obj.name);
        elementCylinder.BeginUpdate();
        elementCylinder.SphericalTransform.SetLocationEx(obj.longitude,obj.latitude,obj.altitude);
        elementCylinder.Selectable = obj.selectable;
        elementCylinder.Editable = obj.editable;
        elementCylinder.Radius = obj.radius;
        elementCylinder.Height = obj.height;
        var fillColor=Earth.getColor(obj.fillopacity,obj.fillcolor);
        elementCylinder.FillColor = fillColor;
        elementCylinder.EndUpdate();
        _earth.AttachObject(elementCylinder);
        earthObjArr.push(elementCylinder);
        return elementCylinder;
    };
    /**
     * 创建圆锥
     * @param obj
     * @returns {*}
     */
    Earth.createCone=function(obj){
        if(!obj.altitudetype)
            obj.altitudetype=1;
        obj.drawOrder="0";
        obj.selectable='true';
        obj.editable='true';
        var elementCone = _earth.Factory.CreateElementCone(obj.id, obj.name);
        elementCone.BeginUpdate();
        elementCone.SphericalTransform.SetLocationEx(obj.longitude,obj.latitude,obj.altitude);
        elementCone.Selectable = obj.selectable;
        elementCone.Editable = obj.editable;
        elementCone.BottomRadius = obj.bottomradius;
        elementCone.TopRadius = obj.topradius;
        elementCone.Height = obj.height;
        var fillColor=Earth.getColor(obj.fillopacity,obj.fillcolor);
        elementCone.FillColor = fillColor;
        elementCone.EndUpdate();
        _earth.AttachObject(elementCone);
        earthObjArr.push(elementCone);
        return elementCone;
    };
    /**
     * 创建曲线
     * @param obj
     * @returns {*}
     */
    Earth.createCurve=function(obj){
        if(obj.altitudetype==null)//SEAltitudeTypeAbsolute = 0, ClampToTerrain = 1,  ClampToModel = 5
            obj.altitudetype=0;//fxd 20171013 如果是ClampToModel模式，遇到桥梁等多层模型，会每层都贴一个同样的对象，改为绝对高程即可
        obj.drawOrder="0";
        obj.selectable='true';
        obj.editable='true';
        var elementLine = _earth.Factory.CreateElementCurve(obj.id,  obj.name);
        elementLine.BeginUpdate();
        elementLine.SetControlPointArray(obj.points);
        elementLine.Visibility = true;
        if(obj.opacity==null)obj.opacity=1;
        var color=Earth.getColor(obj.opacity,obj.color);
        elementLine.LineStyle.LineColor =color;
        elementLine.LineStyle.LineWidth = obj.width;
        elementLine.AltitudeType =obj.altitudetype;
        //新增属性
        elementLine.Selectable = obj.selectable;
        elementLine.Editable = obj.editable;
        elementLine.DrawOrder = obj.drawOrder;
        elementLine.EndUpdate();
        _earth.AttachObject(elementLine);
        earthObjArr.push(elementLine);
        return elementLine;
    };
    /**
     * 创建简单建筑
     * @param obj
     * @returns {*}
     */
    Earth.createSimpleBuilding=function(obj){
        if(!obj.altitudetype)
            obj.altitudetype=1;
        obj.drawOrder="0";
        obj.selectable='true';
        obj.editable='true';
        var simpleBuilding = _earth.Factory.CreateSimpleBuilding(obj.id, obj.name);
        simpleBuilding.BeginUpdate();
        simpleBuilding.SphericalTransform.SetLocationEx(obj.longitude,obj.latitude,obj.altitude);
        var polygon = _earth.factory.CreatePolygon();
        polygon.AddRing(obj.vector3s);
        simpleBuilding.SetPolygon(0, polygon);
        if(!obj.floorheight){
            obj.floorheight=2.8;
        }
        var floorHeight = parseFloat(obj.floorheight);
        var floorCount = parseInt(obj.height)/floorHeight;
        simpleBuilding.SetFloorsHeight(floorHeight * floorCount);
        simpleBuilding.SetFloorHeight(floorHeight);
        if(!obj.rooftype)obj.rooftype=1
        simpleBuilding.SetRoofType(obj.rooftype);
        //颜色
     /*   if(obj.roofcolor){
            var roofcolor = Earth.getColor(1,obj.roofcolor);
            simpleBuilding.RoofColor = roofcolor;
        }else{
            simpleBuilding.RoofColor = 16711680;
        }
       if(obj.floorcolor){
           var floorcolor =Earth.getColor(1,obj.floorcolor);
           simpleBuilding.FloorsColor = floorcolor;
       }else{
           simpleBuilding.FloorsColor = 16711680;
       }*/
       //加材质
        var floorMats = simpleBuilding.GetFloorsMaterialStyles();
        floorMats.Items(0).DiffuseTexture = obj.rooftexture;
        floorMats.Items(1).DiffuseTexture = obj.rooftexture;
        for (var i = 2; i < floorMats.Count; i++) {
            floorMats.Items(i).DiffuseTexture = obj.floortexture;
        }
        var roofMats = simpleBuilding.GetRoofMaterialStyles();
        for (var i = 0; i < roofMats.Count; i++) {
            if(obj.rooftexture)
                 roofMats.Items(i).DiffuseTexture = obj.rooftexture;
            if(obj.roofcolor)
                roofMats.Items(i).DiffuseColor =Earth.getColor(1,obj.roofcolor);;
        }
        simpleBuilding.Selectable = obj.selectable;
        simpleBuilding.Editable = obj.editable;
        simpleBuilding.EndUpdate();
        _earth.AttachObject(simpleBuilding);
        earthObjArr.push(simpleBuilding);
        return simpleBuilding;
    };
    Earth.getTerrainAltitude=function(lon,lat){
        return _earth.Measure.MeasureTerrainAltitude(lon,lat);
    };

    Earth.createModel=function(obj){
        obj.name=obj.name+"";
        if(obj.name=="")obj.name="未命名";
        if(obj.longitude==null)return null;
        if(!obj.tag){
            obj.tag=3;
        }
        var model = _earth.Factory.CreateEditModelByLocal(obj.id, obj.name,obj.modelpath,obj.tag);
        var dpoint=transfromBj(obj.longitude,obj.latitude,obj.altitude);
        model.SphericalTransform.SetLocationEx(dpoint.X,dpoint.Y,obj.altitude);
        var Transform=model.SphericalTransform;
        if(obj.spiny)
            Transform.SetRotationEx(0,parseFloat(obj.spiny),0);
        if(obj.scaleX)
            Transform.SetScaleEx(parseFloat(obj.scaleX),parseFloat(obj.scaleY),parseFloat(obj.scaleZ));
        model.name = obj.name;
        model.Selectable = true;
        model.Editable = true;
        _earth.AttachObject(model);
        earthObjArr.push(model);
        obj.earthObj=model;
        obj.ShowHighLight=function(){
            obj.earthObj.ShowHighLight();
        };
        obj.StopHighLight=function(){
            obj.earthObj.StopHighLight();
        };
        return obj;
    };
    /**
     * 创建粒子对象
     * @param obj
     * @returns {*}
     */
    Earth.createParticle=function(obj){
        obj.name=obj.name+"";
        if(obj.name=="")obj.name="未命名";
        if(obj.longitude==null)return null;
        var dpoint=transfromBj(obj.longitude,obj.latitude,obj.altitude);
        var particle1 = _earth.factory.CreateElementParticle(obj.id, obj.name);
        particle1.SphericalTransform.SetLocationEx(dpoint.X,dpoint.Y,obj.altitude);
        particle1.BeginUpdate();
        particle1.Type = obj.type;   //   火 = 0,  烟 = 1,  喷泉 = 2, 直流水枪 = 3,   喷雾水枪 = 4
        particle1.Selectable = true;
        particle1.Editable = true;
        particle1.EndUpdate();
        _earth.AttachObject(particle1);
        earthObjArr.push(particle1);
        obj.earthObj=particle1;
        return obj;
    }
    Earth.htmlNavigateBalloons = null;
    /**
     * 2016-12-02 fxd create
     * 创建气泡
     * @type {Earth.CreateBalloon}
     */
    Earth.createBalloon=Earth.CreateBalloon=function(obj){
        obj.name=obj.name+"";
        if(obj.name=="")obj.name="未命名";
        if(obj.longitude==null||obj.latitude==null)return null;
        if (Earth.htmlNavigateBalloons != null) {
            Earth.htmlNavigateBalloons.DestroyObject();
            Earth.htmlNavigateBalloons = null;
        }
        Earth.htmlNavigateBalloons = _earth.Factory.CreateHtmlBalloon(_earth.Factory.CreateGuid(), "");
        Earth.htmlNavigateBalloons.SetSphericalLocation (obj.longitude, obj.latitude,obj.altitude);
        Earth.htmlNavigateBalloons.SetRectSize(obj.width, obj.height);
        Earth.htmlNavigateBalloons.SetIsAddCloseButton (true);
        Earth.htmlNavigateBalloons.SetBackgroundAlpha (255);
        Earth.htmlNavigateBalloons.ShowNavigate(obj.url);
    };
    Earth.closeBalloon=Earth.CloseBalloon=function () {
        _earth.HtmlBalloon.Hide();
    }
//添加界面按钮
    Earth.createGUIButton=function(obj){
        var robj = _earth.GUIManager.CreateButton(obj.normalimg,obj.heighimg,obj.left,obj.top,obj.width,obj.height);
        return robj.id;
    };
    Earth.OnGUIButtonClick = function(id,callback){
        Event.addGUIClickEvent(id,callback);
    };
    Earth.createGuiTip=function(obj){
        var TipObj = _earth.GUIManager.CreateTip(obj.top,obj.left);
        TipObj.Title = obj.title;
        if(!obj.titlecolor)obj.titlecolor="#262626";
        TipObj.TitleColor = Earth.getColor(1,obj.titlecolor);
        TipObj.Text =obj.text;
        if(!obj.textcolor)obj.textcolor="#262626";
        TipObj.TextColor = Earth.getColor(1,obj.textcolor);
        return TipObj.id;
    };
    Earth.OnGUITipClosed = function(id,callback){
        Event.addGUICloseEvent(id,callback);
    };
    Earth.removeGUIById = function(id){
        if(id&&id!="")
            _earth.GUIManager.SetWindowVisible(id,false);
    };
    Earth.GUIClear = function(){
        _earth.GUIManager.Clear();
    };
    Earth.createGuicaleSlider=function(obj){
        var SliderObj = earthObject.GUIManager.CreateTerrainScaleSlider(obj.left,obj.top);
        SliderObj.Title =obj.title;
        if(!obj.titlecolor)obj.titlecolor="#262626";
        SliderObj.TitleColor =Earth.getColor(1,obj.titlecolor);// parseInt(0xFFFF0000,10);
        SliderObj.Text = obj.text;
        if(!obj.textcolor)obj.textcolor="#262626";
        SliderObj.TextColor = Earth.getColor(1,obj.textcolor);
        SliderObj.Value = obj.value;
        // return robj.id;
    };
    Earth.flyTrack=function(obj){
        var trackObj=_CreateTrack(obj);
        _earth.Event.OnDocumentChanged = function(type,newGuid){
            _earth.Event.OnDocumentChanged = function(){};
            if(type == 3){
                return;
            }
            _earth.Event.OnTrackFinish =  function (tId, objId){
                //_earth.DynamicSystem.UnLoadDynamicObject(objId);
                _earth.GlobeObserver.StopTracking();
                _earth.GlobeObserver.Stop();
                //用于加载完成的事件
                var callback=tgisServer.Event.OnTrackFinished;
                if(callback&&typeof(callback)=="function")callback(objId);
            };

            trackObj.BindObject = newGuid;
            if(obj.viewtype==null||obj.viewtype=="1")
                _earth.TrackControl.SetMainTrack(obj.id,3);
            if(obj.viewtype=="2")
                _earth.TrackControl.SetMainTrack(obj.id,2);
            trackObj.Play(false);
            if(obj.viewtype=="3")
                _earth.GlobeObserver.StartTracking(obj.id,3);
        };
        _earth.DynamicSystem.LoadDynamicObject(obj.flyObjId);
    };
    var _UnLoadDynamicObject=function(objId){
        _earth.DynamicSystem.UnLoadDynamicObject(objId);
    };
    Earth.UnLoadDynamicObject=_UnLoadDynamicObject;
//飞行完成的事件
    /*tgisServer.Event.OnTrackFinished=null;*/

    var _CreateTrack=function (obj){
        var  route = _earth.Factory.CreateStationRoute(tgisServer.createGuid(), 'pass');
        route.Rate =0;
        route.Yaw = obj.heading;
        route.Pitch = obj.tilt;
        var pVal=obj.points;
        for(var i = 0; i < pVal.Count; i++){
            var pass = _earth.Factory.CreateStationPass(tgisServer.createGuid(), '');
            pass.Longitude = pVal.Items(i).x;
            pass.Latitude = pVal.Items(i).y;
            pass.Altitude = pVal.Items(i).z;
            pass.FlyHeight = obj.flyheight;
            pass.Speed =obj.speed;
            route.AddStation(pass);
        }
        var trackObj = _earth.Factory.CreateTrack(obj.id,obj.name);
        trackObj.Visibility=obj.visibility?true:false;
        trackObj.AddStation(route);
        trackObj.InitFollowTrack(180,20,5,5);
        trackObj.UpdateRate(2); //维持现状
        trackObj.CommitChanges();
        return trackObj;
    };
    Earth.GetTrack=function(trackid){
        var track = _earth.TrackControl.GetTrack(trackid);
        return track;
    };
    /**
     * 停止飞行
     * @param trackid
     * @private
     */

    Earth.flyTrackEnd =function(trackid){
        if(trackid!=""){
            var trackObj = _earth.TrackControl.GetTrack(trackid);
            if(trackObj)
            {
                trackObj.Visibility=false;
                trackObj.Stop();
            }

        }
    };
    /**
     * 暂停飞行
     * @param trackid
     * @private
     */
    Earth.PausePlay =function (trackid){
        if(trackid!=""){
            var track = _earth.TrackControl.GetTrack(trackid);
            if(track.Status == 2)
                track.Resume();
            else if(track.Status == 1)
                track.Pause();
        }
    }
    Earth.getColor =function(pTransparency,color){
        pTransparency=pTransparency*255;
        var transparency = parseInt(pTransparency).toString(16);
        if(transparency.length == 1){
            transparency = "0" + transparency;
        } else if (transparency.length === 0) {
            transparency = "00";
        }
        color = color.substring(1);
        color =  transparency + color;
        color.toLowerCase();
        return parseInt("0x"+color);
    };
    Earth.transformStrToPoint=function(str){
        var v=str.split(",");
        var v3 = _earth.Factory.CreateVector3();
        v3.X =v[0];
        v3.Y =v[1];
        v3.Z =v[2];
        return v3;
    };
    Earth.transformPointToStr=function(vector3){
        var ptString = "";
        if(vector3&&vector3.Longitude)
            ptString =  vector3.Longitude + "," + vector3.Latitude+ "," + vector3.Altitude;
        return ptString;
    };
    Earth.transfromPointsToVecs=function(points){
        var vecPoints =  _earth.Factory.CreateVector3s();//创建VECTOR
        for(var i = 0; i < points.length; i++){//把数据加到vector中
            var point=points[i];
            if(point.alt==null)
                point.alt=_earth.GlobeObserver.GetHeight(point.lon, point.lat);
            point.alt=point.alt;
            vecPoints.Add(point.lon, point.lat,point.alt);
        }
        return vecPoints;
    }
    Earth.transfromPointsToGeoPoints=function(points){
        var vecPoints =  _earth.Factory.CreateGeoPoints();//创建VECTOR
        for(var i = 0; i < points.length; i++){//把数据加到vector中
            var point=points[i];
            vecPoints.Add(point.lon, point.lat,point.alt);
        }
        return vecPoints;
    }
    /**
     * 三维球坐标转换到points
     * @param vector3s
     * @returns {Array}
     */
    Earth.transfromVectersToPoints=function(vector3s){
        var newpoints = [];
        for(var i=0;i<vector3s.Count;i++){
            var point={};
            point.lon=vector3s.Items(i).x;
            point.lat=vector3s.Items(i).y;
            point.alt=vector3s.Items(i).z;
            newpoints.push(point);
        }
        return newpoints;
    }
    Earth.transfromGeoPointsToPoints=function(vector3s){
        var newpoints = [];
        for(var i=0;i<vector3s.Count;i++){
            var point={};
            point.lon=vector3s.GetPointAt(i).Longitude;
            point.lat=vector3s.GetPointAt(i).Latitude;
            point.alt=vector3s.GetPointAt(i).Altitude;
            newpoints.push(point);
        }
        return newpoints;
    }
    /*
     * 将Vector3s转换为字符串
     */
    Earth.transformVecsToStr=function(vector3s){
        var ptString = vector3s.Items(0).x + "," + vector3s.Items(0).y + "," + vector3s.Items(0).z;
        for(var i=1;i<vector3s.Count;i++){
            ptString += ";" + vector3s.Items(i).x + "," + vector3s.Items(i).y + "," + vector3s.Items(i).z;
        }
        return ptString;
    };
    /*
     * 将字符串转化为Vector3s对象
     */
    Earth.transformStrToVecs=function(str){
        if(str==null||str=="")return null;
        str=common.trim(str);
        var vecs=str.split(";");
        var v3s = _earth.Factory.CreateVector3s();
        for(var k = 0; k<vecs.length; k++){
            var v = vecs[k].split(",");
            var v3 = _earth.Factory.CreateVector3();
            v3.X =v[0];
            v3.Y =v[1];
            v3.Z =v[2];
            v3s.AddVector(v3);
        }
        return v3s;
    };
    Earth.flyToObj=function(lon,lat,alt,time){
        if(lon==null||lon=="")return;
        if(time==null)time=5;
        _earth.GlobeObserver.FlytoLookat(lon,lat,alt, 0, 90, 0, 200, time);
    };
    Earth.goToObj=function(lon,lat,alt,range){
        if(lon==null||lon=="")return;
        if(range==null)range=200;
        _earth.GlobeObserver.GotoLookat(lon,lat,alt, 0, 50, 0, range);
    };
    Earth.createPolygonFromPolylineAndWidth=function(pVal,width){
        var lobj_GeoPoints = _transformVecsToGeoPoints(pVal);
        var lobj_PolygonFrom = _earth.GeometryAlgorithm.CreatePolygonFromPolylineAndWidth(lobj_GeoPoints, width,width);
        return _transformGeoPointsToVecs(lobj_PolygonFrom);
    };
    Earth.transformVecsToGeoPoints=function(coords){
        var lobj_GeoPoints = _earth.Factory.CreateGeoPoints();//创建GEO点对象
        for(var i=0;i<coords.Count;i++){
            //把画好的点加到GEO点对象中
            lobj_GeoPoints.Add(coords.Items(i).x,coords.Items(i).y,coords.Items(i).z);
        }
        return lobj_GeoPoints;
    }

    Earth.getLengthFromVecs=function(coords){
        var lobj_GeoPoints = _earth.Factory.CreateGeoPoints();//创建GEO点对象
        for(var i=0;i<coords.Count;i++){
            //把画好的点加到GEO点对象中
            lobj_GeoPoints.Add(coords.Items(i).x,coords.Items(i).y,coords.Items(i).z);
        }
        var length=_earth.GeometryAlgorithm.CalculatePolylineLength(lobj_GeoPoints);
        return length;
    };
    Earth.transformGeoPointsToVecs=function (coords){
        var vecPoints =  _earth.Factory.CreateVector3s();//创建VECTOR
        for(var i = 0; i < coords.Count; i++){//把数据加到vector中
            vecPoints.Add(coords.GetPointAt(i).Longitude, coords.GetPointAt(i).Latitude, coords.GetPointAt(i).Altitude);
        }
        return vecPoints;
    }
    /**
     * 将经纬度坐标转换为笛卡尔坐标
     * @param v3s
     * @return
     */
    Earth.TransformSphrericalToCartesion=function(v3s){
        var elementPolygon = _earth.factory.CreateElementPolygon(Earth.createGuid(),"");
        elementPolygon.BeginUpdate();
        elementPolygon.SetExteriorRing(v3s);
        elementPolygon.EndUpdate();

        var newV3s = _earth.Factory.CreateVector3s();
        for(var k = 0; k<v3s.Count; k++){
            var CartPoint= elementPolygon.SphericalTransform.TransformSphrericalToCartesion(v3s.Items(k));
            var v3 = _earth.Factory.CreateVector3();
            v3.X =CartPoint.x;
            v3.Y =CartPoint.y;
            v3.Z =CartPoint.z;
            newV3s.AddVector(v3);
        }
        return newV3s;
    }
    /**
     * 将笛卡尔坐标转换为经纬度坐标
     * @param v3s
     * @return
     */
    Earth.TransformCartesionToSphrerical=function (v3s){
        var elementPolygon = _earth.factory.CreateElementPolygon(Earth.createGuid(),"");
        elementPolygon.BeginUpdate();
        elementPolygon.SetExteriorRing(v3s);
        elementPolygon.EndUpdate();

        var newV3s = _earth.Factory.CreateVector3s();
        for(var k = 0; k<v3s.Count; k++){
            var CartPoint= elementPolygon.SphericalTransform.TransformCartesionToSphrerical(v3s.Items(k));
            var v3 = _earth.Factory.CreateVector3();
            v3.X =CartPoint.x;
            v3.Y =CartPoint.y;
            v3.Z =CartPoint.z;
            newV3s.AddVector(v3);
        }
        return newV3s;
    }
    /**
     * 将经纬度坐标集转换成volume需要的参数
     */
    Earth.getVolumeParameter=function (pVal){
        var elementPolygon = _earth.factory.CreateElementPolygon(Earth.createGuid(),"");
        elementPolygon.BeginUpdate();
        elementPolygon.SetExteriorRing(pVal);
        elementPolygon.AltitudeType = 1;
        elementPolygon.EndUpdate();
        var centerPoint= elementPolygon.SphericalTransform.GetLocation();
        var CartPoints=Earth.TransformSphrericalToCartesion(pVal);
        var obj={};
        obj.center=centerPoint;
        obj.CartPoints=CartPoints;
        return obj;
    }
    /**
     * 获得动态对象，将动态物体和飞行对象分别传入对应的回调函数处理
     * @param cbDynamicObject 动态物体回调函数
     * @param cbFlyObject 飞行对象回调函数
     */
    Earth.getDynamicObject= function (cbDynamicObject, cbFlyObject){
        _earth.Event.OnDynamicListLoaded = function (list){
            for(var i=0;i<list.Count;i++){
                var dynamic = list.Items(i);
                var type = dynamic.Type;
                if((type == "DynamicObject")||(type == "DynamicPeople")){
                    if(cbDynamicObject && typeof cbDynamicObject == "function"){
                        cbDynamicObject(dynamic);
                    }
                }else{
                    if(cbFlyObject && typeof cbFlyObject == "function"){
                        cbFlyObject(dynamic);
                    }
                }
            }
        };
        _earth.DynamicSystem.ApplyDynamicList();
    };
    /**
     * 开始动态物体漫游
     * @param dynamicId 动态物体GUID
     * @param callback
     */
    Earth.DynamicEnter= function (dynamicId, callback){
        _earth.Event.OnCreateGeometry = function(position){
            if(position != null){
                _loadDynamicModel(dynamicId, position);
                if(callback && typeof callback == "function"){
                    callback();
                }
            }
        };
        _earth.ShapeCreator.CreatePoint();
    };
    /**
     * 加载动态物体到对应位置
     * @param dynamicId 动态物体GUID
     * @param position 球体上的三维位置
     */
    var _loadDynamicModel = function(dynamicId,position){
        _earth.Event.OnDocumentChanged = function(type){
            var dynamicObj = _earth.DynamicSystem.GetSphericalObject(dynamicId);
            if(dynamicObj == null || position == null){
                return;
            }
            var heading = _earth.GlobeObserver.Pose.Heading;
            dynamicObj.SphericalTransform.SetPose(position.Longitude, position.Latitude, position.Altitude, heading, 0, 0);
            _earth.GlobeObserver.InitThirdTrack(180,15);
            _startTracking(dynamicId, 2);
            _earth.Event.OnDocumentChanged = function(){};
        };
        _earth.DynamicSystem.LoadDynamicObject(dynamicId);
    };
    /**
     * 切换动态物体角色
     * @param dynamicId 动态物体GUID
     * @param type 1.第一人称; 2.第三人称; 3.自由
     */
    Earth.startTracking= function (dynamicId, type){
        _earth.GlobeObserver.StartTracking(dynamicId, type);
    };
    /**
     * 退出动态物体漫游
     * @param dynamicId 动态物体GUID
     */
    Earth.dynamicOut=function (dynamicId){
        _earth.GlobeObserver.StopTracking();   //摄像机停止跟随
        _earth.GlobeObserver.Stop();           //摄像机停止动作
        _earth.DynamicSystem.UnLoadDynamicObject(dynamicId);   //卸载运动物体对象
    };
    /**
     *环绕
     */
    Earth.SurroundControl=function(speed){
        var numSpeed=parseFloat(speed);
        if(numSpeed)
            _earth.GlobeObserver.SurroundControlEx(numSpeed);
    };
    /**
     * 给地标加点击事件
     */
    var markerClickArr=[];
    var isaddEvenIsFirst=true;
    Earth.addMarkerClickEvent=function(obj,callback){
        var ppObj={};
        ppObj.obj=obj;
        if(obj==null)return;
        if(callback!=null&&typeof(callback)=="function"){
            ppObj.callBack=callback;
            markerClickArr.push(ppObj);
        }
        if(isaddEvenIsFirst){
            _earth.Event.OnPoiClicked=function(pVal){
                if(pVal==null)return ;
                var startindex=pVal.indexOf("<guid>");
                var endindex=pVal.indexOf("</guid>");
                var guid=pVal.substring(startindex+6,endindex);
                for(var i=0;i<markerClickArr.length;i++){
                    var pobj=markerClickArr[i];
                    if(pobj.obj.Guid==guid){
                        var tobj={};
                        tobj.id=guid;
                        tobj.name=pobj.obj.Name;
                        var point=pobj.obj.SphericalTransform;
                        tobj.lon=point.Longitude;
                        tobj.lat=point.Latitude;
                        tobj.alt=point.Altitude;
                        pobj.callBack(tobj);
                        return ;
                    }
                }
            };
            isaddEvenIsFirst=false;
        }
    }
    /**
     * 设置地面透明度
     * @param value 0-100
     * @returns
     */
    var _setEarthOpacity=function(value){
        value=parseInt(value);
        if(value<0||value>100)return;
        value=parseInt(value/100*255);
        _earth.Environment.TerrainTransparency=value;
    };
    Earth.setEarthOpacity=_setEarthOpacity;
    /**
     * 设置球的地下浏览模式
     * @param value 布尔类型
     * @returns
     */
    Earth.setEarthUndergroundMode=function(value){
        _earth.GlobeObserver.UndergroundMode = value;
    };
    /**
     * 设置球的碰撞模式
     * @param value 布尔类型
     * @returns
     */
    Earth.setEarthCollisionMode=function(value){
        _earth.GlobeObserver.IntersectModel = value;
    };
    /**
     * 设置球的隧道模式
     * fxd
     * 2016-11-18
     * @param value 布尔类型
     * @returns
     */
    Earth.setEarthTunnelMode=function(value){
        _earth.GlobeObserver.TunnelMode = value;
    };
    /**
     * 设置指北针是否显示
     * @param value
     * @constructor
     */
    Earth.SetCompassVisibility=function(value){
        _earth.Environment.SetNavigatorWindowVisibility(value);
    };
    /**
     * 设置球的雾天效果
     * @param value 0,1,2,3,4
     * @returns
     */
    Earth.setEarthWeatherFog=function(value){
        value=parseInt(value);
        if(value!=0&&value!=1&&value!=2&&value!=3&&value!=4)return;
        if(value==0){
            _earth.WeatherEffect.SetFogEnable(false);
            return;
        }
        _earth.WeatherEffect.SetFogEnable(true);
        _earth.WeatherEffect.SetFogType(value);
    };
    Earth.setEarthWeatherRain=function(value){
        value=parseInt(value);
        if(value!=0&&value!=1&&value!=2&&value!=3&&value!=4)return;
        if(value==0){
            _earth.WeatherEffect.SetRainEnable(false);
            return;
        }
        _earth.WeatherEffect.SetRainEnable(true);
        _earth.WeatherEffect.SetRainType(value);
    };
    Earth.setEarthWeatherSnow=function(value){
        value=parseInt(value);
        if(value!=0&&value!=1&&value!=2&&value!=3&&value!=4)return;
        if(value==0){
            _earth.WeatherEffect.SetSnowEnable(false);
            return;
        }
        _earth.WeatherEffect.SetSnowEnable(true);
        _earth.WeatherEffect.SetSnowType(value);
    };
    Earth.setEarthWeatherSunStart=function(config){
        // 根据日期和时间、地点计算太阳高度角和方位角
        var vector2 = _earth.GeometryAlgorithm.CalculateSunElevationAndAzimuthAngle(8,
            config.year,
            config.month,
            config.day,
            config.hour,
            config.minute,
            config.second,
            config.longitude,
            config.latitude);
        var elevationAngle = vector2.X;
        var azimuthAngle = vector2.Y;
        if (elevationAngle && azimuthAngle){
            if(elevationAngle >= 0 && elevationAngle <= 180){
                _earth.Analysis.BeginShinLightAnaLysis(elevationAngle, azimuthAngle);
            }else{
                _earth.Analysis.EndShinLightAnaLysis();
            }
        }
    };
    Earth.zoomIn=function(){
        _earth.GlobeObserver.ZoomIn();
    };
    Earth.zoomOut=function(){
        _earth.GlobeObserver.ZoomOut();
    };
    Earth.setEarthWeatherSunEnd=function(){
        _earth.Analysis.EndShinLightAnaLysis();
    };
    Earth.getLayerByGUID=function(guid){
        return _earth.LayerManager.GetLayerByGUID(guid);
    };
    function measureRightDown(){
        mouseStatic=0;
        _earth.Measure.Clear();

    }
    /**
     * 三维测量功能
     * @param measuretype
     * @param callback
     * @returns
     */
//点击测量的时候右击状态mouseStatic=2；执行完面积测量，再将右击状态设置成默认状态mouseStatic=0
    Earth.Measure=function(measureType,callback){
        mouseStatic="measure";
        tgisServer.Map.measureIndex=1;
        if(measureType=="SurfaceArea"){
            _earth.Event.OnCreateGeometry = function (polygon) {
                _earth.Event.OnCreateGeometry = function () {
                };
                _earth.Event.OnAnalysisFinished = function (result) {alert(result)
                    _earth.ShapeCreator.Clear();
                    _earth.Measure.Clear();
                    if (callback) {
                        callback(result.TerrainSurfaceArea.toFixed(2));
                    }
                };
                _earth.Analysis.SurfaceArea(polygon);
            };
            setTimeout(function () { //延迟否则与OnHtmlBalloonFinished冲突
                _earth.ShapeCreator.CreatePolygon();
            }, 100);
            return;
        }
        _earth.Event.OnMeasureFinish = function (result, type) {
            mouseStatic="normal";
            try{
                result=result.toFixed(2);
            }catch (ex){}
            callback(result, type);
            Event.MouseRightUpEvent(Earth.ClearOperation);
            //_earth.Event.OnMeasureFinish = function () {};
            //Earth.Measure(measureType,callback);
        };
        switch (measureType) {
            case "HorizontalDistance"://水平距离
                _earth.Measure.MeasureHorizontalDistance();
                break;
            case "Height":
                _earth.Measure.MeasureHeight();
                break;
            case "Area":
                _earth.Measure.MeasureArea();//水平面积
                break;
            case "SpatialArea":
                _earth.Measure.MeasureSpatialArea();//空间面积
                break;
            case "VerticalArea":
                _earth.Measure.MeasureVerticalArea();
                break;
            case "PathLength":
                _earth.Measure.MeasurePathLength();  // 球面距离
                break;
            case "LineLength":
                _earth.Measure.MeasureLineLength();  // 直线距离
                break;
            case "PlaneAngle":
                _earth.Measure.MeasurePlaneAngle();  // 平面角度
                break;
        }
        _earth.focus();//2017-03-17 fxd 解决点第一次没有反应的问题
    };
    /**
     * 水平距离测量
     * @param callback
     * @returns
     */
    Earth.measureHorizontalDistance=function(callback){
        _earth.ShapeCreator.Clear();
        if(callback && typeof callback == "function"){
            Earth.Measure("HorizontalDistance",function(result, type){
                callback(result);
            });
        }
    };
    Earth.measureSurfaceDistance=function(callback){
        _earth.ShapeCreator.Clear();
        if(callback && typeof callback == "function"){
            Earth.Measure("PathLength",function(result, type){
                callback(result);
            });
        }
    };
    Earth.measureVerticalDistance=function(callback){
        _earth.ShapeCreator.Clear();
        if(callback && typeof callback == "function"){
            Earth.Measure("Height",function(result, type){
                callback(result);
            });
        }
    };
    Earth.measureSpaceDistance=function(callback){
        _earth.ShapeCreator.Clear();
        if(callback && typeof callback == "function"){
            Earth.Measure("LineLength",function(result, type){
                callback(result);
            });
        }
    };
    Earth.measureHorizontalArea=function(callback){
        _earth.ShapeCreator.Clear();
        if(callback && typeof callback == "function"){
            Earth.Measure("Area",function(result, type){
                callback(result);
            });
        }
    };
    Earth.measureSpatialArea=function(callback){
        _earth.ShapeCreator.Clear();
        if(callback && typeof callback == "function"){
            Earth.Measure("SpatialArea",function(result, type){
                callback(result);
            });
        }
    };
  /*  Earth.measureVerticalArea=function(callback){
        _earth.ShapeCreator.Clear();
        if(callback && typeof callback == "function"){
            Earth.Measure("VerticalArea",function(result, type){
                callback(result);
            });
        }
    };*/
    Earth.measureSurfaceArea=function(callback){
        _earth.ShapeCreator.Clear();
        if(callback && typeof callback == "function"){
            Earth.Measure("SurfaceArea",function(result, type){
                callback(result);
            });
        }
    };
    /**
     * 拾取模型对象
     * @param callback
     * @returns
     */
    Earth.pickModelObjExEventCallBack=null;
    Earth.pickModelObj=function(callback){
        if(callback && typeof callback == "function"){
            Earth.pickModelObjExEventCallBack=callback;
            _earth.Query.PickObjectEx(383);  // SEPickObjectType.PickAllObject/如果需要查询树对象，改为383
            _earth.focus();
            Earth.pickMode="pickobjectEx";
        }else{
            Earth.pickModelObjExEventCallBack=null;
        }
    };
    Earth.pickMode="pickobject";
    Earth.pickModelObjEventCallBack=null;// 此事件服务浏览状态下的pick方法
    Earth.pickModelObjEvent=function(callback){
        if(callback && typeof callback == "function"){
            Earth.pickModelObjEventCallBack=callback;
        }else{
            Earth.pickModelObjEventCallBack=null;
        }
    };

    Earth.setReturnDataType=function(layer){
        if (!layer) {
            layer = _earth.LayerManager.LayerList;
        }
        var f = (Earth.returnDataType != undefined && Earth.returnDataType == 'json');
        var childCount = layer.GetChildCount();
        for (var i = 0; i < childCount; i++) {
            var childLayer = layer.GetChildAt(i);
            if(childLayer.LocalSearchParameter != null){
                if(childLayer.LayerType == 'POI'){
                    childLayer.LocalSearchParameter.ReturnDataType = f ? 5 : 1;
                }else {
                    childLayer.LocalSearchParameter.ReturnDataType = f ? 6 : 4;
                }
            }
            if (childLayer.GetChildCount() > 0) {
                Earth.setReturnDataType(childLayer);
            }
        }
    }
    Earth.dynamicObjectRightDown=function(){
        var lookatObj = _earth.DynamicSystem.GetSphericalObject(_currobjectId);
        if(lookatObj == null){
            return;
        }
        _earth.GlobeObserver.StopTracking();
        _earth.GlobeObserver.Stop();
        _earth.DynamicSystem.UnLoadDynamicObject(_currobjectId);
        _currobjectId=null;

    };
//加载浏览模型
    var _currobjectId=null;
    Earth.loadDynamicObject=function(objectId,lon,lat,alt){
        if(_currobjectId&&_currobjectId!=objectId){
            var lookatObj = _earth.DynamicSystem.GetSphericalObject(_currobjectId);
            if(lookatObj == null){
                return;
            }
            //_earth.GlobeObserver.StopTracking();
            //_earth.GlobeObserver.Stop();
            _earth.DynamicSystem.UnLoadDynamicObject(_currobjectId);
            var index=rightDownArr.indexOf(dynamicObjectRightDown);
            if(index>-1){
                rightDownArr.splice(index,1);
            }
        }
      /*  var point=transfromBj(lon,lat,alt);*/
        _earth.Event.OnDocumentChanged = function(){
            var lookatObj = _earth.DynamicSystem.GetSphericalObject(objectId);
            if(lookatObj == null){
                return;
            }
            var heading = _earth.GlobeObserver.Pose.Heading;
            lookatObj.SphericalTransform.SetPose(lon,lat,alt, heading, 0, 0);
            _earth.GlobeObserver.StartTracking(objectId, 2);
            _earth.Event.OnDocumentChanged = function(){};
        };
        mouseStatic="dynamic";
        _currobjectId=objectId;
        _earth.DynamicSystem.LoadDynamicObject(objectId);
    };

    Earth.getEarthObjByKey=function(layer,key){
        var searchResult = Earth.getEarthObjByKeyForPage(layer, key,50,0);
        return searchResult.Records;
    }
    Earth.getEarthObjByKeyForPage=function(layer,key,pageCount,pageIndex){
        var searchResult = localSearch(layer, key, null,pageCount,pageIndex);
        return searchResult;
    }
    Earth.getEarthObjBySpatial=function(layer,points){
        var searchResult = Earth.getEarthObjBySpatialForPage(layer, points,50,0);
        return searchResult.Records;
    }
    Earth.getEarthObjBySpatialForPage=function(layer,points,pageCount,pageIndex){
        var earthPoints=Earth.transfromPointsToVecs(points);
        var searchResult = localSearch(layer, "", earthPoints,pageCount,pageIndex);
        return searchResult;
    }
    var localSearch = function(layerObj, keyword, spatialObj,pageCount,pageIndex) {
        if(layerObj==null)return [];
       /* var layerObj = _earth.LayerManager.GetLayerByGUID(guid);*/
        if (spatialObj == null) {
            var rect = layerObj.LonLatRect;
            var vec3s = _earth.Factory.CreateVector3s();
            vec3s.Add(rect.West,rect.North,0);
            vec3s.Add(rect.East,rect.North,0);
            vec3s.Add(rect.East,rect.South,0);
            vec3s.Add(rect.West,rect.South,0);
            spatialObj = vec3s;
        }
        var searchParam = layerObj.LocalSearchParameter;
        if (searchParam == null) {
            return;
        }
        searchParam.ClearSpatialFilter();
        if (searchParam == null) {
            return null;
        }
        if (spatialObj != null) {
            searchParam.SetFilter("", "");
            searchParam.SetSpatialFilter(spatialObj);
        }
        if (keyword != "") {
            searchParam.SetFilter(keyword, "");
        }
        searchParam.PageRecordCount = pageCount;
        searchParam.HasDetail = true;
        searchParam.HasMesh = true;
        // searchParam.ReturnDataType = 1; //0 返回所有数据，1 返回xml数据，2 返回渲染数据
        var tmptype = searchParam.ReturnDataType;
        if(Earth.returnDataType == 'json'){
            searchParam.ReturnDataType = (layerObj.LayerType == 'POI' ? 5 : 5);
        }else{
            searchParam.ReturnDataType = 4;
        }
        var result = layerObj.SearchFromLocal();
        if (result==null||result.RecordCount === 0){
            return [];
        }
        var dataArr=result.GotoPage(pageIndex);
        var jsonObj= $.xml2json(dataArr);
        var records = jsonObj.SearchResult.ModelResult.ModelData;
        var objArr = [];
        var count= result.RecordCount;
        for (var i = 0; i < records.length; i++){
            var pObj = result.GetLocalObject(i);
            var key=records[i].SE_NAME
            pObj.SetKey(key);
            objArr.push(pObj);
        }
        searchParam.ClearDisplayFields();
        searchParam.ClearSpatialFilter();
        searchParam.ReturnDataType = tmptype;
        var resultObj={
            Records:objArr,
            totalCount:count
        }
        return resultObj;
    }



//编辑结束事件。
    Earth.editFinished=null;
//飞行结束事件
    Earth.flyToFinished = null;
//选择事件。
    Earth.selectFinishedEvent=function(callback){
        _earth.Event.OnSelectChanged=function(data){
            _earth.Event.OnSelectChanged=function(){};
            if(callback&&typeof(callback)=="function")callback();
        }
    };
//获取选择集
    Earth.SelectSet.GetCount=function(){
        return _earth.SelectSet.GetCount();
    };
//获取选择集里的对象
    Earth.SelectSet.GetObject=function(i){
        if(_earth.SelectSet.GetCount()>i&&i>-1)
            return _earth.SelectSet.GetObject(i);
        else
            return null;
    };
//获取选择集里的对象
    Earth.SelectSet.Clear=function(){
        _earth.SelectSet.Clear();
    };
//通过经纬度获取高程
    Earth.GetHeight=function(lon,lat){
        try{
            lon=parseFloat(lon);
            lat=parseFloat(lat);
            return _earth.GlobeObserver.GetHeight(lon,lat);
        }catch (e){
            return 0;
        }
    };
    Earth.GetCenter=function(){
        var point={};
        point.longitude=Earth.getLon();
        point.latitude=Earth.getLat();
        return point;
    };
    function removeVectorObj(obj) {
        if(obj.Rtti==220||obj.Rtti==211||obj.Rtti==227){
            Earth.EditLayer.DetachWithDeleteObject(obj);
            return true;
        }else {
            return false;
        }
    }
    Earth.removeObj=function(obj){
        if(obj.Rtti){
            if(removeVectorObj(obj)==false){
                _earth.SelectSet.Remove(obj.Guid);
                _earth.DetachObject(obj);
            }
            for(var i=0;i<earthObjArr.length;i++){
                if(obj.Guid==earthObjArr[i].Guid){
                    earthObjArr.splice(i, 1);
                    break;
                }
            }
        }
    };

    Earth.getEarthExtent=function()
    {
        var width=tgisServer.Width;
        var height=tgisServer.Height;
        var point0=_getpoint0(0,0,width,height);
        var point1=_getpoint0(width,0,width,height);
        var point2=_earth.GlobeObserver.Pick(width,height,1);
        var point3=_earth.GlobeObserver.Pick(0,height,1);
        var vec0=_geopointToVector3(point0);
        var vec1=_geopointToVector3(point1);
        var vec2=_geopointToVector3(point2);
        var vec3=_geopointToVector3(point3);
        var v3s = _earth.Factory.CreateVector3s();
        v3s.AddVector(vec0);
        v3s.AddVector(vec1);
        v3s.AddVector(vec2);
        v3s.AddVector(vec3);
        return v3s;
    }
    Earth.getEarthObj=function(id){
        for(var i=0;i<earthObjArr.length;i++){
            if(earthObjArr[i].Guid==id){
                return earthObjArr[i];
            }
        }
        return null;
    }
    Earth.ClearAllObjs=function(){
        for(var i=0;i<earthObjArr.length;i++){
            var obj=earthObjArr[i];
            if(obj.Guid){
                try{
                    if(removeVectorObj(obj)==false){
                        _earth.SelectSet.Remove(obj.Guid);
                        _earth.DetachObject(obj);
                    }
                }catch (e){
                    //错误事件还没有写
                }
            }
        }
        earthObjArr.splice(0, earthObjArr.length);
    }
    Earth.setObjVisibility=function (obj,value) {
        if(obj.Visibility){
            obj.Visibility=value;
        }
    }
    var MouseX=0;
    var MouseY=0; //2017-03-17 fxd 此代码是为浏览状态下pick对象的事件服务。
    Earth.OnPickObjectEx=function(pObj) {
        if(!pObj)return;
        pObj.Underground = true;
        /*var key=pObj.getKey();
        if(key.length>4){
            key=key.substring(5);
            key=key.substring(0,key.length-4);
        }
        var obj={};
        obj.Key=key;
        obj.pobj=pObj;
        obj.GetKey=function () {
            return obj.pobj.getKey();
        }
        obj.Guid=pObj.Guid;
        obj.ShowHighLight=function () {
            obj.pobj.ShowHighLight();
        }
        obj.StopHighLight=function () {
            obj.pobj.StopHighLight();
        }*/
        if(Earth.pickMode=="pickobjectEx"){
            _earth.Query.FinishPick();
            Earth.pickModelObjExEventCallBack(pObj);
            return;
        }else if(Earth.pickMode=="pickobject"&&Earth.pickModelObjEventCallBack){
            Earth.pickModelObjEventCallBack(pObj);
        }
    }
    Earth.onLeftButtonUp=function(x,y){
        try {
            //2017-03-17 fxd 此代码是为浏览状态下pick对象的事件服务。
            if(MouseX==x&&MouseY==y&&Earth.pickModelObjEventCallBack&&mouseStatic=="normal"){//判断不是拖动的mouseUp才触发pick方法
                _earth.Query.PickObject(511,x,y);
            }
            var obj=null;
            var point=_earth.GlobeObserver.Pick(x, y,511);
            var obj={};
            obj.lon=point.Longitude;
            obj.lat=point.Latitude;
            obj.alt=point.Altitude;
            obj.X= x;
            obj.Y= y;
            if(mouseStatic=="normal"){
                Event.onLeftButtonUp(obj);
            }else if(mouseStatic=="measure"){}
        }catch(e) {
            alert("onLeftButtonUp出错:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    }
    Earth.onLeftButtonDown=function(x,y){
        try {
            MouseX=x;
            MouseY=y;
            var obj=null;
            var point=_earth.GlobeObserver.Pick(x, y,511);
            var obj={};
            obj.lon=point.Longitude;
            obj.lat=point.Latitude;
            obj.alt=point.Altitude;
            obj.X= x;
            obj.Y= y;
            if(mouseStatic=="normal"){
                Event.onLeftButtonDown(obj);
            }
        }catch(e) {
            alert("onLeftButtonUp出错:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    }
    Earth.onRightButtonDown=function(x,y) {
        try {
            var obj=null;
            var point=_earth.GlobeObserver.Pick(x, y,511);
            var obj={};
            obj.lon=point.Longitude;
            obj.lat=point.Latitude;
            obj.alt=point.Altitude;
            obj.X= x;
            obj.Y= y;
            if(mouseStatic=="normal"){
                Event.onRightButtonDown(obj);
            }else if(mouseStatic=="measure"){
                /*if(tgisServer.Map.measureIndex==1){/!*alert(1)*!/
                    tgisServer.Map.measureIndex=2;
                }else if(tgisServer.Map.measureIndex==2){
                    mouseStatic="normal";
                    _earth.Measure.Clear();
                }*/
            }else if(mouseStatic=="dynamic"){
                Earth.dynamicObjectRightDown();
                mouseStatic="normal";
            }
            pickMode="pickobject";
        }catch(e) {
            alert("onRightButtonDown出错:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    }
    Earth.SaveFileDialog=function(basepath,filter_string,defaut_ext){
        var fileName = _earth.UserDocument.SaveFileDialog(basepath, filter_string,defaut_ext);
        return fileName;
    };
    Earth.OpenFileDialog=function(basepath,filter_string){
        var fileName = _earth.UserDocument.OpenFileDialog(basepath, filter_string);
        return fileName;
    };
    Earth.OpenFilePathDialog=Earth.OpenFolderPathDialog=function(basepath,title){
        var fileName = _earth.UserDocument.OpenFilePathDialog(basepath, title);
        return fileName;
    };
    Earth.ScreenShot=function(path,Width,Height){
        _earth.ScreenShot(path,	Width,Height,1,false);
    };
    Earth.MeasureTerrainAltitude=function(lon,lat){
        return _earth.Measure.MeasureTerrainAltitude(lon,lat);
    }

    Earth.StartTrackingSet=function(dynamicId, type) {
        if(type==2){
            _earth.GlobeObserver.InitThirdTrack(180,15);
        }
        _earth.GlobeObserver.StartTracking(dynamicId, type);
    };
    var resultRes=null;
    Earth.LineSight=function (startHeight,endHeight,points) {
        if(resultRes)
        {
            try{
                resultRes.ClearRes();
            }catch (ex){}
            resultRes=null;
        }
        _earth.Event.OnAnalysisFinished = function (res) {
            resultRes=res;
        };
        points = Earth.transfromPointsToGeoPoints(points);
        _earth.Analysis.LineSight(3, parseFloat(startHeight), parseFloat(endHeight), points, 3); //最后参数：1代表只进行服务端分析，2代表只进行本地分析，3代表二者都参与
    }
    Earth.ViewShed=function (type, angle, height, points) {
        Earth.ClearOperation();
        if(resultRes)
        {
            try{
                resultRes.ClearRes();
            }catch (ex){}
            resultRes=null;
        }
        _earth.Event.OnAnalysisFinished = function (res) {
            resultRes=res;
        };
        type=parseInt(type);
        angle=parseFloat(angle);
        height=parseFloat(height);
        _earth.Analysis.ViewShed(type, angle, height, points, 3);//type :1代表分析的只是地形，2代表的是模型，3是地形+模型
    }
    Earth.ExcavationAndFill=function (deep, points,callback) {
        if(points.length<3){
            return;
        }
        var pval = Earth.transfromPointsToVecs(points);
        var altitudeGround = 0;
        var alt = 0;
        for (var i = 0; i < pval.Count; i++) {
            var argsItem = pval.Items(0);
            var a = _earth.Measure.MeasureTerrainAltitude(argsItem.X, argsItem.Y)
            altitudeGround = a.toFixed(3);
        }
        deep=parseFloat(deep);
        alt = altitudeGround - deep;
        _earth.Event.OnAnalysisFinished = function (result, alt) {
            if(callback!=null&&typeof(callback)=="function")callback(result);
            _earth.ShapeCreator.Clear();
        };
        _createEcavAndFillLayer(pval, alt);
        _earth.Analysis.SurfaceExcavationAndFill(alt, pval);
    }
    Earth.ProfileAnalysis=function (space, points,callback) {
        Earth.ClearOperation();
        if(points.length<2){
            return;
        }
        var gPoint=Earth.transfromPointsToGeoPoints(points);
        space = parseInt(space);
        var length=_earth.GeometryAlgorithm.CalculatePolylineLength(gPoint);
        if (space > length) {
            var slength = parseInt(length) / 3 - 1;
            space = parseInt(slength);
        }
        _earth.Event.OnAnalysisFinished = function(result){
            _earth.Event.OnAnalysisFinished = function(){};
            var resXml = result.BriefDescription;
            if (resXml) {
                var xmlDoc = $.parseXML(resXml);
                xmlDoc = $(xmlDoc);
                var pointCount =xmlDoc.find("point_number");
                if(pointCount.length==1)
                    pointCount=parseInt(pointCount[0].textContent);
                else{
                    return ;
                }
                var pointStr =xmlDoc.find("point_array")[0].textContent;
                var pointArr = pointStr.split(",");
                var ppointArr = [];
                var sublength=length/pointCount;
                for (var i = 0; i < pointCount; i++) {
                    var index = i * 4;
                    /*lineData.push(parseFloat(pointArr[index + 2]));*/
                    var y=(parseFloat(pointArr[index + 2])).toFixed(3);
                    var x=(i*sublength).toFixed(3);
                    var point=[x,y];
                    ppointArr.push(point);
                }
                require(["echarts"], function(echarts){
                    $("#seearthEA3EA17C").css("height", "60%");
                    $("#profileDiv").css("height", "40%");
                    $("#profileDiv").css("width", "100%");
                    $("#profileDiv").css("display","block");
                    $("#profileDiv").append("<div id='profileCharts' style='width:100%;height:300px;'></div>");
                    var option = {
                        title : {
                            text: '地形剖面图',
                            left: 'center',
                            subtext: ''
                        },
                        tooltip : {
                            trigger: 'axis',
                            axisPointer:{
                                show: true,
                                type : 'cross',
                                lineStyle: {
                                    type : 'dashed',
                                    width : 1
                                }
                            },
                            formatter : function (params) {
                                return params.seriesName + ' : [ '
                                    + params.value[0] + ', '
                                    + params.value[1] + ' ]';
                            }
                        },
                        legend: {
                            data:['']
                        },
                        toolbox: {
                            show : true,
                            feature : {
                                mark : {show: true},
                                dataZoom : {show: true},
                                dataView : {show: true, readOnly: false},
                                magicType : {show: true, type: ['line', 'bar']},
                                restore : {show: true},
                                saveAsImage : {show: true}
                            }
                        },
                        calculable : true,
                        xAxis : [
                            {
                                type: 'value',
                                name :'距离（米）'
                            }
                        ],
                        yAxis : [
                            {
                                type: 'value',
                                name :'高程（米）',
                                axisLine: {
                                    lineStyle: {
                                        color: '#dc143c'
                                    }
                                }
                            }
                        ],
                        series : [
                            {
                                name:'地形高程值',
                                type:'line',
                                itemStyle: {normal: {areaStyle: {type: 'default'}}},
                                data:ppointArr
                            }
                        ]
                    };
                    var chart = echarts.init(document.getElementById("profileCharts"));
                    chart.setOption(option);
                });
            }
        };
        _earth.Analysis.Profile(1, space, gPoint);
    }
    Earth.ClearProfileAnalysis=function () {
        $("#seearthEA3EA17C").css("height", "100%");
        $("#profileDiv").css("display","none");
        $("#profileDiv").html("");
    }
    Earth.ShinningAnalysis=function (time,circle) {
        Earth.ClearOperation();
        _earth.Event.OnAnalysisFinished = function (res) {
            _earth.Event.OnAnalysisFinished = function () { };
            resultRes=res;
        };
        var vector2 = _earth.GeometryAlgorithm.CalculateSunElevationAndAzimuthAngle(8,
            time.year, time.month, time.day,
            time.hour, time.minute, 00,
            circle.Longitude, circle.Latitude);
        var elevationAngle = vector2.X;
        var azimuthAngle = vector2.Y;
        if (elevationAngle && azimuthAngle)
            _earth.Analysis.Shinning(elevationAngle, azimuthAngle, circle, 3);
    }
    Earth.PointSourceInundation=function (height,circle) {//点源淹没
        Earth.ClearOperation();
        _earth.Event.OnAnalysisFinished = function (res) {
            _earth.Event.OnAnalysisFinished = function () { };
            resultRes=res;
        };
        _earth.Analysis.Submerge(height, circle);
    }
    Earth.ValleyAnalysis=function (height,radius,points) {//流域淹没
        Earth.ClearOperation();
        _earth.Event.OnAnalysisFinished = function (res) {
            _earth.Event.OnAnalysisFinished = function () { };
            resultRes=res;
        };
        var ves=Earth.transfromPointsToVecs(points);
        _earth.Analysis.Valley(height, radius,ves);
    }
    var _createEcavAndFillLayer = function (args, alt) {
        var terrainArgs = _earth.Factory.CreateVector3s();
        for (var i = 0; i < args.Count; i++) {
            var argsItem = args.Items(i);
            terrainArgs.Add(argsItem.X, argsItem.Y, alt);
        }
        _earth.TerrainManager.SetMinClipLevel(11);
        /*_earth.TerrainManager.ClipTerrainByPolygon(terrainArgs, true);
        _createNewLayer();*/
        var _terrGuid = _earth.Factory.CreateGUID();
        _earth.TerrainManager.ClipTerrainByPolygonEx(_terrGuid, terrainArgs);
        _createClipModel(terrainArgs);
    };
    /**
     * 创建临时地形图层
     */
   /* var _createNewLayer = function () {
        var tempDemPath = _earth.Environment.RootPath + "\\temp\\terrain\\";
        var rect = _earth.TerrainManager.GetTempLayerRect();
        var levelMin = _earth.TerrainManager.GetTempLayerMinLevel();
        var levelMax = _earth.TerrainManager.GetTempLayerMaxLevel();
        var guid = _earth.Factory.CreateGUID();
        _tempLayer = _earth.Factory.CreateDemLayer(guid, "TempTerrainLayer", tempDemPath, rect, levelMin, levelMax, 1000);
    };*/
    /**
     * 生成边缘模型
     */
    var ClipModelArr=[];
    var _createClipModel = function (args) {
        var modelGuid = _earth.Factory.CreateGUID();
        var sideTexturePath = "";//_earth.Environment.RootPath + "res\\wall.png";
        var sampArgs = _earth.TerrainManager.GenerateSampledCoordinates(args);
        var _tempModel = _earth.TerrainManager.GenerateClipModel(modelGuid, "ClipModel", args, sampArgs, sideTexturePath, sideTexturePath);
        _earth.AttachObject(_tempModel);
        ClipModelArr.push(_tempModel);
    };
    function _geopointToVector3(gpoint)
    {
        var v3 = _earth.Factory.CreateVector3();
        v3.x =gpoint.Longitude;
        v3.y =gpoint.Latitude;
        v3.z =gpoint.Altitude;
        return v3;
    }
    function _getpoint0(initx,inity,totalx,totaly)
    {
        var point0=_earth.GlobeObserver.Pick(initx,inity,1);
        if(point0.Longitude==0)
        {	var dc=totaly-inity;
            if(dc>20)
            {
                point0=_getpoint0(initx,inity+10,totalx,totaly);
            }
        }
        return point0;
    }

    //wgs84坐标偏移量
    var offsetXForbj54=0;
    var offsetYForbj54=0;
    function transfromBj(x,y,z){
        /*var point=_datumSpatial.des_BLH_to_src_xy(x,y,z);
         var point2=_datumSpatial2.src_xy_to_des_BLH(point.X,point.Y,point.Z);
         return point2;*/
        var point={};
        point.X = x - offsetXForbj54;
        point.Y = y - offsetYForbj54;
        point.Z=z;
        return point;
    }
    function createEditLayer() {
        var edit_layer_guid = _earth.Factory.CreateGuid();
        var edit_layer = _earth.Factory.CreateEditLayer(edit_layer_guid, "", _earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 4.5), 0, 10, "");
        _earth.AttachObject(edit_layer);
        edit_layer.BeginUpdate();
        edit_layer.MaxHeight=10000000;
        edit_layer.LayerIsClipEnable = false;
        edit_layer.EndUpdate();
        Earth.EditLayer=edit_layer;
    }
    return Earth;
});
