define(function() {
    var _mapRightUpArr=[];
    var _mapLeftUpArr=[];
    var _mapLeftKeyDownArr=[];
    var vectorEventArr=[];//地图上用于存储有事件的对象
var Event=new Object();
//左键事件
    Event.MouseLeftUp=function(event){
        try {
            var pt={};
            if(event.pixel){
                var pixel = event.pixel;
                var coordinate = event.coordinate;
                pt.alt=0;
                pt.X=pixel[0];
                pt.Y=pixel[1];
                pt.xy=pixel;
                pt.lon=coordinate[0];
                pt.lat=coordinate[1];
                pt.LonLat=coordinate;
            }
            for(var i=0;i<_mapLeftUpArr.length;i++){
                var callback=_mapLeftUpArr[i];
                if(callback&&typeof(callback)=="function"){
                    callback(pt);
                }
            }
        }catch(e) {
            //alert("Event.MousrLeftUp出错:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    };
    Event.MouseLeftUpEvent=function(callback){
        if(callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<_mapLeftUpArr.length;i++){
            if(callback.toString()==(_mapLeftUpArr[i].toString())){
                result=false;
            }
        }
        if(result){
            _mapLeftUpArr.push(callback)
        }
    };
    Event.RemoveMouseLeftUpEvent=function (callback) {
        for(var i=0;i<_mapLeftUpArr.length;i++){
            if(callback.toString()==(_mapLeftUpArr[i].toString())){
                _mapLeftUpArr.splice(i,1);
                return true;
            }
        }
    };
    /*
     * yqc 2016.12.6 二维地图鼠标左键按下事件
     */
    Event.MousrLeftKeyDown=function(event){
        try {
            var pt={};
            if(event.pixel){
                var pixel = event.pixel;
                var coordinate = event.coordinate;
                pt.alt=0;
                pt.X=pixel[0];
                pt.Y=pixel[1];
                pt.xy=pixel;
                pt.lon=coordinate[0];
                pt.lat=coordinate[1];
                pt.LonLat=coordinate;
            }
            for(var i=0;i<_mapLeftKeyDownArr.length;i++){
                var callback=_mapLeftKeyDownArr[i];
                if(callback&&typeof(callback)=="function"){
                    callback(pt);
                }
            }
        }catch(e) {
            //alert("Map.Event.MousrLeftKeyDown:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    };
    Event.MouseLeftKeyDownEvent=function(callback){
        if(callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<_mapLeftKeyDownArr.length;i++){
            if(callback.toString()==(_mapLeftKeyDownArr[i].toString())){
                result=false;
            }
        }
        if(result){
            _mapLeftKeyDownArr.push(callback)
        }
    };
    Event.RemoveMouseLeftKeyDownEvent=function (callback) {
        for(var i=0;i<_mapLeftKeyDownArr.length;i++){
            if(callback.toString()==(_mapLeftKeyDownArr[i].toString())){
                _mapLeftKeyDownArr.splice(i,1);
                return true;
            }
        }
    };

//右键事件回调
    Event.MouseRightKeyEvent=function(callback){
        if(callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<_mapRightUpArr.length;i++){
            if(callback.toString()==(_mapRightUpArr[i].toString())){
                result=false;
            }
        }
        if(result){
            _mapRightUpArr.push(callback)
        }
    };
//右键触发事件
    Event.MouseRightUp=function(event){
        try {
            var pt={};
            if(event.pixel){
                var pixel = event.pixel;
                var coordinate = event.coordinate;
                pt.alt=0;
                pt.X=pixel[0];
                pt.Y=pixel[1];
                pt.xy=pixel;
                pt.lon=coordinate[0];
                pt.lat=coordinate[1];
                pt.LonLat=coordinate;
            }
            for(var i=0;i<_mapRightUpArr.length;i++){
                var callback=_mapRightUpArr[i];
                if(callback&&typeof(callback)=="function"){
                    callback(pt);
                }
            }
        }catch(e) {
           // alert("Event.MouseRightUp出错:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    };
//移除右键事件
    Event.RemoveMouseRightUpEvent=function (callback) {
        for(var i=0;i<_mapRightUpArr.length;i++){
            if(callback.toString()==(_mapRightUpArr[i].toString())){
                _mapRightUpArr.splice(i,1);
                return true;
            }
        }
    };
//以上为2016-11-18日修改 fxd 这次是对鼠标事件的清理。
    /**
     * 增加vectorlayer
     * 传入返回事件，返回当前marker
     */
    Event.VectorLayerClickEvent=function(targetFeature){
        try {
            if(targetFeature){
                var originalFeature=null;
                try{
                    originalFeature=targetFeature.get('features');
                }catch (ex){ }

                if(!originalFeature) {
                    originalFeature=targetFeature;
                }else{
                    if(originalFeature.length>1){
                        return;
                    }else{
                        originalFeature=originalFeature[0];
                    }
                }
                for(var i=0;i<vectorEventArr.length;i++){
                    var vecObj = vectorEventArr[i];
                    if(vecObj.id == originalFeature.id){
                        var callback=vecObj.callback;
                        if(callback&&typeof(callback)=="function"){
                            callback(originalFeature);
                        }
                    }
                }
            }
        }catch(e) {
            //alert("Event.VectorLayerClickEvent出错:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    };
    /**
     * 增加标注点击事件
     * 传入返回事件，返回当前marker
     */
    Event.addMarkerClickEvent=Event.AddMarkerClickEvent=function(marker,callback){
        //注册标注的点击事件
        var obj={};
        obj.id=marker.id;
        obj.name=marker.name;
        obj.lon=marker.lon;
        obj.lat=marker.lat;
        obj.pobj=marker;
        obj.callback=callback;
        vectorEventArr.push(obj);
    };
    /**
     * 对象的点击事件
     */
    Event.addObjClickEvent=Event.AddObjClickEvent=function(pobj,callback){
        var obj={};
        obj.id=pobj.id;
        obj.name=pobj.name;
        obj.callback=callback;
        vectorEventArr.push(obj);
    };
    Event.removeObjEventObj=function(obj){
        for(var i=0;i<vectorEventArr.length;i++){
            if(obj.id==vectorEventArr[i].id){
                vectorEventArr.splice(i, 1);
                break;
            }
        }
    };
    Event.ClearAllObjs=function () {
        vectorEventArr.splice(0, vectorEventArr.length);
    }
    var mouseMoveEventArr=[];
    Event.MouseMove=function(){
        try {
            for(var i=0;i<mouseMoveEventArr.length;i++){
                var callback=mouseMoveEventArr[i];
                if(callback&&typeof(callback)=="function"){
                    callback();
                }
            }
        }catch(e) {
            //alert("Map.Event.MousrLeftKeyDown:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    };
    Event.MouseMoveEvent=function(callback){
        if(callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<mouseMoveEventArr.length;i++){
            if(callback.toString()==(mouseMoveEventArr[i].toString())){
                result=false;
            }
        }
        if(result){
            mouseMoveEventArr.push(callback)
        }
    };
    Event.RemoveMouseMoveEvent=function (callback) {
        for(var i=0;i<mouseMoveEventArr.length;i++){
            if(callback.toString()==(mouseMoveEventArr[i].toString())){
                mouseMoveEventArr.splice(i,1);
                return true;
            }
        }
    };
    return Event;
});



