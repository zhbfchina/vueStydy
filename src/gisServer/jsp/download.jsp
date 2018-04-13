<%--
  Created by IntelliJ IDEA.
  User: Administrator
  Date: 2017-04-13
  Time: 16:51
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <title>控件下载</title>
    <script src="../lib/jquery1.11.3.js"></script>
    <script src="../gisServer.js"></script>
    <script>
        function init() {
            var ieVersion=window.navigator.platform;
            if(ieVersion.indexOf('32')!=-1){
                $("#downloada").attr('href',tgisServer.ServerPath+'gisServer/setup/TGISClient32.exe');
            }else if('64'.indexOf(ieVersion)>=0){
                $("#downloada").attr('href',tgisServer.ServerPath+'gisServer/setup/TGISClient64.exe');
            }
        }
    </script>
</head>
<body onload="init()">
您没有安装多维平台客户端，请下载安装。<br>
下载后，请使用管理员权限安装。
<a id="downloada" href="" >多维平台控件下载</a>
</body>
</html>
