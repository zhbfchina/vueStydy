/**
 * Created by fxd on 2017-04-05.
 */
var tgisServer = new Object();
tgisServer.Map = new Object();
tgisServer.Event = new Object();
tgisServer.showType = "2d";
tgisServer.ServerPath = "";
//判断浏览器版本,用于判断加载哪个版本的二维地图。
var b_version = navigator.appVersion;
var version = b_version.split(";");
var trim_Version = version[1].replace(/[ ]/g, "");

tgisServer.location = [];
tgisServer.Map.centerAndZoom = function (lon, lat, level) {
    tgisServer.location[0] = lon;
    tgisServer.location[1] = lat;
    tgisServer.location[2] = level;
};
tgisServer.Map.extent = null;
tgisServer.Map.setExtent = function (extent) {
    tgisServer.Map.extent = extent
}
//平台启动完成的事件
tgisServer.Event.serverStartFinished = null;
_getScriptLocation = function () {
    if (tgisServer.ServerPath != "") return tgisServer.ServerPath;
    var scriptName = "gisServer/gisServer.js";
    try {
        var r = new RegExp("(^|(.*?\\/))(" + scriptName + ")(\\?|$)"),
            s = document.getElementsByTagName('script'),
            src, m, l = "";
        for (var i = 0, len = s.length; i < len; i++) {
            src = s[i].getAttribute('src');
            if (src) {
                m = src.match(r);
                if (m) {
                    l = m[1];
                    break;
                }
            }
        }
        tgisServer.ServerPath = l;
    } catch (e) {
        alert("请在<html>标签前加上 <!DOCTYPE html>");
    }
    if (tgisServer.ServerPath.indexOf("http") < 0) {
        var curWwwPath = window.document.location.href;
        var pathName = window.document.location.pathname;
        var pos = curWwwPath.indexOf(pathName);
        var localhostPaht = curWwwPath.substring(0, pos);
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        tgisServer.ServerPath = localhostPaht + projectName + "/";
        return tgisServer.ServerPath;
    }
    return tgisServer.ServerPath;
};
tgisServer.ServerPath = _getScriptLocation();
/*document.write("<script src='"+tgisServer.ServerPath+"gisServer/lib/jquery1.11.3.js' ><\/script>");*/

document.write('<link href=" ' + tgisServer.ServerPath + 'gisServer/lib/ol3/ol.css" rel="stylesheet" type="text/css" />');
/*document.write('<link href=" '+tgisServer.ServerPath+'gisServer/css/transformButton.css" rel="stylesheet" type="text/css" />');*/
document.write('<link href=" ' + tgisServer.ServerPath + 'gisServer/css/qiehuanstyles.css" rel="stylesheet" type="text/css" />');
document.write("<script src='" + tgisServer.ServerPath + "gisServer/lib/require.js'  data-main='" + tgisServer.ServerPath + "gisServer/main'><\/script>");
if (trim_Version == "MSIE8.0" || trim_Version == "MSIE7.0") {//20170714 fxd 上一版TGIS兼容代码
    document.write("<script src='" + tgisServer.ServerPath + "beijing/TGIS2.js' ><\/script>");
    trim_Version = "MSIE8.0";//在xp下的IE8返回的版本是IE7.0
} else {
    document.write("<script src='" + tgisServer.ServerPath + "beijing/TGIS3.js' ><\/script>");
}
//左键事件
document.write('<SCRIPT LANGUAGE="JavaScript" for="seearthEA3EA17C" event="OnLBDown(x,y)"> tgisServer.Earth.onLeftButtonDown(x,y) </SCRIPT>');
document.write('<SCRIPT LANGUAGE="JavaScript" for="seearthEA3EA17C" event="OnLBUp(x,y)"> tgisServer.Earth.onLeftButtonUp(x,y) </SCRIPT>');
document.write('<SCRIPT LANGUAGE="JavaScript" for="seearthEA3EA17C" event="OnRBDown(x,y)"> tgisServer.Earth.onRightButtonDown(x,y) </SCRIPT>');
document.write('<SCRIPT LANGUAGE="JavaScript" for="seearthEA3EA17C" event="OnPickObjectEx(pObj)"> tgisServer.Earth.OnPickObjectEx(pObj) </SCRIPT>');
document.write('<SCRIPT LANGUAGE="JavaScript" for="seearthEA3EA17C" event="OnSelectChanged(pObj)"> tgisServer.Earth.Event.onSelectEvent(pObj) </SCRIPT>');
//参数
var baseLon, baseLat, baseZoom;
tgisServer.initServer = function (divid, serverType) {
    require(['gisServer2'], function (gisServer) {
        gisServer.IEType = trim_Version;
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.showType = tgisServer.showType;
        gisServer.location = tgisServer.location;
        gisServer.getConfig = tgisServer.getConfig;
        gisServer.saveParameter = tgisServer.saveParameter;
        gisServer.ToMapButtonVisibility = tgisServer.ToMapButtonVisibility;
        gisServer.ToImageButtonVisibility = tgisServer.ToImageButtonVisibility;
        gisServer.ToEarthButtonVisibility = tgisServer.ToEarthButtonVisibility;
        gisServer.Earth.StartFinished = tgisServer.Event.serverStartFinished;
        gisServer.Map.StartFinished = tgisServer.Event.serverStartFinished;
        gisServer.Map.mapType = tgisServer.mapType;
        gisServer.Map.location = tgisServer.location;
        gisServer.Map.Width = tgisServer.Width;
        gisServer.Map.Height = tgisServer.Height;
        gisServer.Map.ServerPath = tgisServer.ServerPath;
        gisServer.Map.Extent = tgisServer.Map.extent;
        gisServer.Map.backgroundColor = tgisServer.Map.backgroundColor
        tgisServer = gisServer;
        tgisServer.showType = tgisServer.showType + "";
        if (serverType == "2") { tgisServer.showType = "3d" }
        tgisServer.initTGISServer(divid, serverType, tgisServer.showType);
        var time3 = new Date();
        //alert(time3 .getTime()- time2 .getTime())
        window.tgisServer = tgisServer;

    });
}
tgisServer.layerManagerOperate = function (type, callback, fileName) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.layerManagerOperate(type, callback, fileName);
    });
}

tgisServer.getConfig = function (callback) {
    require(['config'], function (config) {
        callback(config);
    });
}
tgisServer.saveParameter = function (earthip, earthindex, vectorMapPath, satelliteMapPath, noramicPath, xmlip, baseLon, baseLat, baseZoom, vectorMapType, callback) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.saveParameter(earthip, earthindex, vectorMapPath, satelliteMapPath, noramicPath, xmlip, baseLon, baseLat, baseZoom, vectorMapType, callback);
    });
}
tgisServer.getZhPointsForRoute = function (roadcode, startNum, endNum, offsetDis, cxDis, callback, layerName) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.getZhPointsForRoute(roadcode, startNum, endNum, offsetDis, cxDis, callback, layerName);
    });
};
tgisServer.getIdentify = function (layerName, lon, lat, tole, callback) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.getIdentify(layerName, lon, lat, tole, callback);
    });
};
tgisServer.getXYFormZH = function (roadCode, zh, callback, layerName) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.getXYFormZH(roadCode, zh, callback, layerName);
    });
};
tgisServer.spaceQuery = function (layerName, lon, lat, tole, callback) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.spaceQuery(layerName, lon, lat, tole, callback);
    });
};
tgisServer.keyQuery = function (layerName, roadCode, callback) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.keyQuery(layerName, roadCode, callback);
    });
};
tgisServer.getAreaFromsql = function (layerName, sql, bool, callback) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.getAreaFromsql(layerName, sql, bool, callback);
    });
};
tgisServer.pointQuery = function (layerName, x, y, tole, callback) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.pointQuery(layerName, x, y, tole, callback);
    });
};
tgisServer.polygonQuery = function (layerName, points, callback) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.polygonQuery(layerName, points, callback);
    });
};
tgisServer.circleQuery = function (layerName, x, y, tole, callback) {
    require(['gisServer2'], function (gisServer) {
        gisServer.ServerPath = tgisServer.ServerPath;
        gisServer.circleQuery(layerName, x, y, tole, callback);
    });
};
//平台启动完成的事件
tgisServer.Event.serverStartFinished = null;
tgisServer.ToMapButtonVisibility = true;
tgisServer.ToImageButtonVisibility = false;
tgisServer.ToEarthButtonVisibility = true;
tgisServer.SetMapButtonVisibility = function (value) {
    tgisServer.ToMapButtonVisibility = value;
};
tgisServer.SetImageButtonVisibility = function (value) {
    tgisServer.ToImageButtonVisibility = value;
};
tgisServer.SetEarthButtonVisibility = function (value) {
    tgisServer.ToEarthButtonVisibility = value;
};



//zhb改，将默认的地图类型设置在配置文件中
tgisServer.mapType = "gaode";

/****
 @method:设置地图类型
 @param:mType,地图类型，localMap,tianditu,gaode
 @author:zhb 2018-01-07
 *****/
tgisServer.SetMapType = function (mType) {
    tgisServer.mapType = mType;
}


tgisServer.LoadTiandituMap = function () {
    tgisServer.mapType = "tianditu";
};

/**
@method:加载高德地图
@author:zhb 2018-01-07
*/
tgisServer.LoadGaodeMap = function () {
    tgisServer.mapType = "gaode";
};


tgisServer.LoadLocalMap = function () {
    tgisServer.mapType = "localMap";
};

tgisServer.Map.backgroundColor = " #ffffff ";
tgisServer.Map.SetBackgroundColor = function (color) {
    //tgisServer.Map.backgroundColor="#08304a";
    if (color) {
        tgisServer.Map.backgroundColor = color;
    }
}

//可选代码
function getRootPath() {
    //获取当前网址，如： http://localhost:8083/uimcardprj/share/meun.jsp
    var curWwwPath = window.document.location.href;
    //获取主机地址之后的目录，如： uimcardprj/share/meun.jsp
    var pathName = window.document.location.pathname;
    var pos = curWwwPath.indexOf(pathName);
    //获取主机地址，如： http://localhost:8083
    var localhostPaht = curWwwPath.substring(0, pos);
    //获取带"/"的项目名，如：/uimcardprj
    var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
    return (localhostPaht + projectName + "/");
}


export default tgisServer;
