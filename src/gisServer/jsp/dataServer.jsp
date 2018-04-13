<%@ page contentType="text/html;charset=UTF-8"%>
<%@page import="myUtil.*"%>
<%@page import="java.util.*"%>
<%@page import="net.sf.json.JSONArray"%>
<%@page import="net.sf.json.JSONObject"%>
<%@page import="yys.Dwr"%>
<%@page import="webgis.tools.*"%>
<%
try{
	String ptype=request.getParameter("cmd");
	if(ptype.equals("getpanoramic")){
		//String queryType=request.getParameter("querytype");
		String lon=request.getParameter("lon");
		String lat=request.getParameter("lat");
        double dlon=Double.parseDouble(lon);
		double dlat=Double.parseDouble(lat);
        myPoint  utmPoint= myPoint.WGSToUTM(dlon,dlat);
		String sql="select * from (select MDBID,MDBPATH,ID from 多媒体表 order by SQRT(power(POINTX-"+utmPoint.x+",2) + power(POINTY-"+utmPoint.y+",2))) where rownum=1";
		dataBaseOperate dao=new dataBaseOperate();
		Map data=dao.getData(sql);
		JSONObject jsonObject =JSONObject.fromObject(data);
		String callback = request.getParameter("callback");
		response.setContentType("text/html");
		response.setCharacterEncoding("utf-8");
		out.println(callback + "(" + jsonObject.toString() + ")");
	}else if(ptype.equals("getpanoramicindex")){
		String index=request.getParameter("index");
		String path=request.getParameter("path");
		String sql="select MDBID,MDBPATH,ID from 多媒体表 where ID='"+index+"' and MDBPATH='"+path+"'" ;
		//System.out.println("result:"+sql);
		dataBaseOperate dao=new dataBaseOperate();
		Map data=dao.getData(sql);
		JSONObject jsonObject =JSONObject.fromObject(data);
		String callback = request.getParameter("callback");
		response.setContentType("text/html");
		response.setCharacterEncoding("utf-8");
		out.println(callback + "(" + jsonObject.toString() + ")");
	}else if(ptype.equals("saveparameter")){
        String ls_webroot=(new StringFacs()).getWebRoot();
        ls_webroot=ls_webroot.substring(0,ls_webroot.indexOf("WEB-INF/"));
		String path=ls_webroot+"gisServer/config.js";
        String path1=ls_webroot+"WEB-INF/classes/data_config.xml";
        if(path.indexOf("/")>0)
            path=path.replaceAll("/", "\\\\");
        if(path1.indexOf("/")>0)
            path1=path1.replaceAll("/", "\\\\");
		String earthid=request.getParameter("earthip");
		String earthindex=request.getParameter("earthindex");
		String vectorMapPath=request.getParameter("vectorMapPath");
		String satelliteMapPath=request.getParameter("satelliteMapPath");
		String noramicPath=request.getParameter("panoramicPath");
        String xmlip=request.getParameter("xmlip");
        String baseLon=request.getParameter("baseLon");
        String baseLat=request.getParameter("baseLat");
        String baseZoom=request.getParameter("baseZoom");
        String vectorMapType=request.getParameter("vectorMapType");
		JSONObject jsonObject=new JSONObject();
        String fileString = "define(function() {";
		fileString += " var config={};";
		fileString += "config.earthIp=\""+ earthid +"\";\r\n";
        fileString += "config.screenIndex=\""+ earthindex +"\";\r\n";
        fileString += "config.vectorMapPath=\""+ vectorMapPath +"\";\r\n";
        fileString += "config.satelliteMapPath=\""+ satelliteMapPath +"\";\r\n";
        fileString += "config.xmlIp=\""+ xmlip +"\";\r\n";
        fileString += "config.panoramicPath=\""+ noramicPath +"\";\r\n";
        fileString += "config.baseLon=\""+ baseLon +"\";\r\n";
        fileString += "config.baseLat=\""+ baseLat +"\";\r\n";
        fileString += "config.baseZoom=\""+ baseZoom +"\";\r\n";
        fileString += "config.vectorMapType=\""+ vectorMapType +"\";\r\n";
		fileString += "return config;});";
        boolean bl1=new Util().writeFile(path,fileString);
        boolean bl2=new Util().writeXml(path1,xmlip);
		if(bl1==true&&bl2==true) {
            jsonObject.put("rt","0");
		} else {
            jsonObject.put("rt","1");
        }
        String callback=request.getParameter("callback");
		response.setContentType("text/html");
		response.setCharacterEncoding("utf-8");
		out.println(callback + "(" + jsonObject.toString() + ")");
	}else if(ptype.equals("saveImage")){
		String base64Str=request.getParameter("saveImage");
		JSONObject jsonObject=new JSONObject();
		Base64ToImage base64ToImage=new Base64ToImage();
		try{
            String ls_webroot=(new StringFacs()).getWebRoot();
            String filePath=ls_webroot+"upload/aa.png";
            if(filePath.indexOf("/")>0) filePath=filePath.replaceAll("/", "\\\\");

			Base64ToImage.convertBase64DataToImage(base64Str.split(",")[1],filePath);
			jsonObject.put("result","true");
		}catch (Exception e){
			jsonObject.put("result","false");
		}
		String callback=request.getParameter("callback");
		response.setContentType("text/html");
		response.setCharacterEncoding("utf-8");
		out.println(callback + "(" + jsonObject.toString() + ")");
	}
}catch(Exception ex){
	out.println(ex.getMessage());
}
%>
 
