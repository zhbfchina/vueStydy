define(["mapEvent","earthEvent"],function(Map,Earth) {
    var Event=new Object();

//鼠标左键事件
    Event.MouseLeftKeyEvent=Event.MouseLeftKeyUpEvent=function(callback){
        Map.MouseLeftUpEvent(callback);
        Earth.MouseLeftUpEvent(callback);
    };
    Event.RemoveMouseLeftKeyEvent=Event.RemoveMouseLeftKeyUpEvent=function(callback){
        Map.RemoveMouseLeftUpEvent(callback);
        Earth.RemoveMouseLeftUpEvent(callback);
    };

//鼠标右键事件
    Event.MouseRightKeyEvent=function(callback){
        Map.MouseRightKeyEvent(callback);
        Earth.MouseRightUpEvent(callback);
    };
    Event.RemoveMouseRightKeyEvent=function(callback){
        Map.RemoveMouseRightUpEvent(callback);
        Earth.RemoveMouseRightUpEvent(callback);
    };

    /*
     * yqc 2016.12.6 鼠标左键按下事件
     */
    Event.MouseLeftKeyDownEvent=function(callback){
        Map.MouseLeftKeyDownEvent(callback);
        Earth.MouseLeftKeyDownEvent(callback);
    };
    Event.RemoveMouseLeftKeyDownEvent=function(callback){
        Map.RemoveMouseLeftKeyDownEvent(callback);
        Earth.RemoveMouseLeftKeyDownEvent(callback);
    };



//更新的上面的接口名称
    Event.RemoveMouseRightUpEvent=function(callback){
        Map.RemoveMouseRightUpEvent(callback);
        Earth.RemoveMouseRightUpEvent(callback);
    };
//对象点击事件
    Event.AddObjClickEvent=function(obj,callback){
        Map.addObjClickEvent(obj,callback);
    };

//场景移动事件
    Event.MoveEndEvent=function(callback){
        Map.MoveEndEvent(function(e){
            callback(e);
        });
    };


//////////2017-04-06 fxd 从gisServer.js移到此处
    //平台二三维切换事件
    Event.showTypeChangedCallback=null;
    Event.showTypeChanged=function(callback){
        Event.showTypeChangedCallback=callback;
    };
    Event._serverStartFinished=function(value){
        var callback=Event.serverStartFinished;
        if(callback&&typeof(callback)=="function")callback(value);
    };

    return Event;
});

