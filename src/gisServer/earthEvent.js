
define(["earth"],function(Earth) {
    var Event=new Object();
    var earthRightUpArr=[];
    var earthLeftUpArr=[];
    var earthLeftDownArr=[];
    var earthGUIClickArr=[];
    var earthGUICloseArr=[];
    var earthSelectArr=[];
    /*document.write('<SCRIPT LANGUAGE="JavaScript" for="seearthEA3EA17C" event="OnMouseHover(x,y)">OnSEEarthMouseHover(x,y) </SCRIPT>');*/
//这个悬停事件要求鼠标停止两秒才会触发，暂时没有开发接口，而且调用此事件必须设置  Earth.earthObj.Environment.EnableHoverMessage = true;
    Event.addSelectEvent=function(callback){
        if(callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<earthSelectArr.length;i++){
            if(callback.toString()==(earthSelectArr[i].toString())){
                result=false;
                break;
            }
        }
        if(result){
            earthSelectArr.push(callback)
        }
    };
    Event.RemoveSelectEvent=function (callback) {
        for(var i=0;i<earthSelectArr.length;i++){
            if(callback.toString()==(earthSelectArr[i].toString())){
                earthSelectArr.splice(i,1);
                return true;
            }
        }
    };
    Event.onSelectEvent=function(){
        try {
            for(var i=0;i<earthSelectArr.length;i++){
                var callback=earthSelectArr[i];
                if(callback&&typeof(callback)=="function"){
                    Event.RemoveSelectEvent(callback);
                    callback();

                }
            }
        }catch(e) {
            alert("onSelectEvent出错:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    }
    Event.addGUICloseEvent=function(id,callback){
        if(!id||callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<earthGUICloseArr.length;i++){
            if(id==earthGUICloseArr[i].id){
                result=false;
                break;
            }
        }
        if(result){
            var obj={};
            obj.id=id;
            obj.callback=callback;
            earthGUICloseArr.push(obj)
        }
    };
    Event.RemoveGUICloseEvent=function (id) {
        for(var i=0;i<earthGUICloseArr.length;i++){
            if(id==earthGUICloseArr[i].id){
                earthGUICloseArr.splice(i,1);
                return true;
            }
        }
    };
    Event.onGUICloseEvent=function(id){
        try {
            for(var i=0;i<earthGUICloseArr.length;i++){
                var obj=earthGUICloseArr[i];
                if(obj.id==id){
                    var callback=obj.callback;
                    if(callback&&typeof(callback)=="function"){
                        callback();
                    }
                    break;
                }
            }
        }catch(e) {
            alert("onGUICloseEvent出错:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    }
    Event.addGUIClickEvent=function(id,callback){
        if(!id||callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<earthGUIClickArr.length;i++){
            if(id==earthGUIClickArr[i].id){
                result=false;
                break;
            }
        }
        if(result){
            var obj={};
            obj.id=id;
            obj.callback=callback;
            earthGUIClickArr.push(obj)
        }
    };
    Event.RemoveGUIClickEvent=function (id) {
        for(var i=0;i<earthGUIClickArr.length;i++){
            if(id==earthGUIClickArr[i].id){
                earthGUIClickArr.splice(i,1);
                return true;
            }
        }
    };
    Event.onGUIClickEvent=function(id){
        try {
            for(var i=0;i<earthGUIClickArr.length;i++){
                var obj=earthGUIClickArr[i];
                if(obj.id==id){
                    var callback=obj.callback;
                    if(callback&&typeof(callback)=="function"){
                        callback();
                    }
                    break;
                }
            }
        }catch(e) {
            alert("onGUIClickEvent出错:"+e.message+" "+e.description+" "+e.number+" "+e.name+"有可能是客户端不对");
        }
    }
    Event.onLeftButtonUp=function(obj){
        try {
            for(var i=0;i<earthLeftUpArr.length;i++){
                var callback=earthLeftUpArr[i];
                if(callback&&typeof(callback)=="function"){
                    callback(obj);
                }
            }
        }catch(e) {
            alert("onLeftButtonUp出错:"+e.message+" "+e.description+" "+e.number+" "+e.name+"有可能是客户端不对");
        }
    }
    Event.MouseLeftUpEvent=function(callback){
        if(callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<earthLeftUpArr.length;i++){
            if(callback.toString()==(earthLeftUpArr[i].toString())){
                result=false;
                break;
            }
        }
        if(result){
            earthLeftUpArr.push(callback)
        }
    };
    Event.RemoveMouseLeftUpEvent=function (callback) {
        for(var i=0;i<earthLeftUpArr.length;i++){
            if(callback.toString()==(earthLeftUpArr[i].toString())){
                earthLeftUpArr.splice(i,1);
                return true;
            }
        }
    };
    /*
     * yqc 2016.12.6 三维场景鼠标左键按下事件
     */
    Event.onLeftButtonDown=function(obj){
        try {
            for(var i=0;i<earthLeftDownArr.length;i++){
                var callback=earthLeftDownArr[i];
                if(callback&&typeof(callback)=="function"){
                    setTimeout(function () {
                        callback(obj);
                    },50);
                }
            }
        }catch(e) {
            alert("onLeftButtonUp出错:"+e.message+" "+e.description+" "+e.number+" "+e.name+"有可能是客户端不对");
        }
    }
    Event.MouseLeftKeyDownEvent=function(callback){
        if(callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<earthLeftDownArr.length;i++){
            if(callback.toString()==(earthLeftDownArr[i].toString())){
                result=false;
            }
        }
        if(result){
            earthLeftDownArr.push(callback)
        }
    };
    Event.RemoveMouseLeftKeyDownEvent=function (callback) {
        for(var i=0;i<earthLeftDownArr.length;i++){
            if(callback.toString()==(earthLeftDownArr[i].toString())){
                earthLeftDownArr.splice(i,1);
                return true;
            }
        }
    };

    Event.MouseRightUpEvent=function(callback){
        if(callback==null||callback=="")return;
        var result=true;
        for(var i=0;i<earthRightUpArr.length;i++){
            if(callback.toString()==(earthRightUpArr[i].toString())){
                result=false;
            }
        }
        if(result){
            earthRightUpArr.push(callback)
        }
    };
    Event.onRightButtonDown=function(obj) {
        try {
            for(var i=0;i<earthRightUpArr.length;i++){
                var callback=earthRightUpArr[i];
                if(callback&&typeof(callback)=="function"){
                    callback(obj);
                }
            }
        }catch(e) {
            alert("onRightButtonDown出错:"+e.message+" "+e.description+" "+e.number+" "+e.name);
        }
    }
    Event.RemoveMouseRightUpEvent=function (callback) {
        for(var i=0;i<earthRightUpArr.length;i++){
            if(callback.toString()==(earthRightUpArr[i].toString())){
                earthRightUpArr.splice(i,1);
                return true;
            }
        }
    };
   return Event;
});

