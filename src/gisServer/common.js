/**
 * Created by fxd on 2017-04-06.
 */
define(function() {
    var common={};
    common.getRootPath=function(){
        //获取当前网址，如： http://localhost:8083/uimcardprj/share/meun.jsp
        var curWwwPath=window.document.location.href;
        //获取主机地址之后的目录，如： uimcardprj/share/meun.jsp
        var pathName=window.document.location.pathname;
        var pos=curWwwPath.indexOf(pathName);
        //获取主机地址，如： http://localhost:8083
        var localhostPaht=curWwwPath.substring(0,pos);
        //获取带"/"的项目名，如：/uimcardprj
        var projectName=pathName.substring(0,pathName.substr(1).indexOf('/')+1);
        return(localhostPaht+projectName+"/");
    }
    common.trim=function(str){ //删除左右两端的空格
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }
    /**
     * 创建Guid
     * @returns {string}
     * @private
     */
    common.createGuid=function(){
        //return tgis.Earth.earthObj.Factory.createGUID();
        var guid = "";
        for (var i=1; i<=32; i++){
            var n = Math.floor(Math.random()*16.0).toString(16);
            guid +=n;
            if((i==8)||(i==12)||(i==16)||(i==20)) {
                guid += "-";
            }
        }
        return guid;
    };
    return common;
});