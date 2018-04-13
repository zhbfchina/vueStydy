var savedPictureContent = '';
var extendName = '';
var captureObj = null;

/*
用于初始化牛牛截图控件，此函数需要在页面加载完成后立即调用 
在此函数中，您可以设置相关的截图的UI控制，如，画笔大小、边框颜色等等 【这部分信息在niuniucapture.js中也有默认值，直接修改默认值也可 】
*/
function sceenShotInit()
{
    captureObj = new NiuniuCaptureObject();
    captureObj.NiuniuAuthKey = "niuniu";
    //此处可以设置相关参数 
    captureObj.TrackColor = rgb2value(255, 0, 0);
    captureObj.EditBorderColor = rgb2value(0, 0, 255);
    
    //设置控件加载完成以及截图完成的回调函数
    captureObj.FinishedCallback = OnCaptureFinishedCallback;
    captureObj.PluginLoadedCallback = PluginLoadedCallback;
    
    //初始化控件 
    captureObj.InitNiuniuCapture();
}

/*
当控件成功加载后回调的的函数，您可以在此控制相应的UI显示  
*/
function PluginLoadedCallback(success)
{
    if(success)
    {
        $('#imgshow').hide();
	    $('#imgshow').attr('src', "./image/loading.gif?v=1");
	    $('#btnReload').hide();
        $('#btnCapture').show();
    }
}

//根据是否是Chrome新版本来控制下载不同的控件安装包
function ShowDownLoad()
{
    if(captureObj.IsNeedCrx())
    {
        ShowChromeInstallDownload(); 
    }
    else
    {
        ShowIntallDownload();
    }
}

/*
需要下载控件安装包的提示信息，您可以根据需要进行调整 
*/
function ShowIntallDownload()
{
    alert("您需要先下载控件进行安装，请按浏览器的提示操作。");
	var date = new Date();
    var exePath= tgisServer.getGisServerPath+"lib/screenshot/CaptureInstall.exe?";
    $('#downCapture').attr('src',exePath + date.getMinutes() + date.getSeconds());
}

/*
需要下载Chrome扩展安装包的下载提示信息
*/
function ShowChromeInstallDownload()
{
    alert("您需要先下载Chrome扩展安装包进行安装，请按浏览器的提示操作。");
	var date = new Date();
	
    $('#downaddr').attr('href', "http://www.ggniu.cn/download/CaptureInstallChrome.exe");
    $('#downCapture').attr('src', "http://www.ggniu.cn/download/CaptureInstallChrome.exe?" + date.getMinutes() + date.getSeconds());
    $('#downloadNotice').show();
    $('#btnReload').show();
    $('#btnCapture').hide();
}

/*
当提示安装控件后，需要重新加载控件来使用截图；
也有部分是需要刷新浏览器的
*/
function ReloadPlugin() 
{
    //如果是Chrome42以上版本，此处需要刷新页面才能让扩展在此页面上生效 
    if(captureObj.IsNeedCrx())
	{
		 location.reload();
		 return;
	}
    captureObj.LoadPlugin();
    $('#btnReload').hide();
     $('#btnCapture').show();
     if(captureObj.pluginValid())
     {
        $('#downloadNotice').hide();
        $('#info').html("截图控件已经安装完毕，您可以进行截图了。");
     }
     else
     {
        var browserInfo = "查看控件是否被浏览器阻止";
        var brow=$.browser;
        var bInfo="";
        if(brow.msie) 
        {
            browserInfo = "通过浏览器设置中的加载项查看NiuniuCapture是否加载并正常运行";
        }
        else if(brow.mozilla) 
        {
            //about:addons
            browserInfo = "请检查浏览器地址拦下是否有询问是否启用控件的提示，如：<img src=\"./image/ffnotice.png\" border=0 />，如果有，则允许控件运行；";
            browserInfo += "或者在地址拦中键入<strong>about:addons</strong>来启用NiuniuCapture控件";
        }
        else if(brow.safari) 
        {
            //chrome://plugins
            browserInfo = "请检查浏览器地址拦下是否有询问是否启用控件的提示，如：<img src=\"./image/ffnotice.png\" border=0 />，如果有，则允许控件运行；";
            browserInfo += "或者在地址拦中键入<strong>chrome://plugins</strong>来启用NiuniuCapture控件";
        }
        //else if(brow.opera) {bInfo="Opera "+brow.version;}
        
         $('#info').html('截图控件未能识别到，请按如下步骤检查:<br/>1. 确定您已经下载控件安装包并正常安装 <br/>2. ' + browserInfo 
         + '<br/>3. 刷新页面或重新启动浏览器试下<br/>4. 如果仍旧不能截图，出大招吧：'
         + '<a target="_blank" style="color:#ff0000;" class="btn" href="http://shang.qq.com/wpa/qunwpa?idkey=a9dab7a14df03d19a2833e6b5f17a33639027d06213cf61bdb7554b04492b6e5">一键加群求助</a>');
     }
}

/*
截图入口函数，用于控制UI标签的显示 
*/
function StartCapture(divName)
{
    var captureRet = Capture(divName);
    //从返回值来解析显示  
    if(!captureRet)
    {
        ShowDownLoad();
    }
}

//获取页面元素的屏幕坐标
function getElementPos(elementId){
    var ua = navigator.userAgent.toLowerCase();
    var isOpera = (ua.indexOf('opera') != -1);
    var isIE = (ua.indexOf('msie') != -1 && !isOpera); // not opera spoof
    var el = document.getElementById(elementId);
    if (el.parentNode === null || el.style.display == 'none') {
        return false;
    }
    var parent = null;
    var pos = [];
    var box;
    if (el.getBoundingClientRect) //IE
    {
        box = el.getBoundingClientRect();
        var scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
        var scrollLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
        return {
            x: box.left + scrollLeft,
            y: box.top + scrollTop
        };
    }
    else
    if (document.getBoxObjectFor) // gecko
    {
        box = document.getBoxObjectFor(el);
        var borderLeft = (el.style.borderLeftWidth) ? parseInt(el.style.borderLeftWidth) : 0;
        var borderTop = (el.style.borderTopWidth) ? parseInt(el.style.borderTopWidth) : 0;
        pos = [box.x - borderLeft, box.y - borderTop];
    }
    else // safari & opera
    {
        pos = [el.offsetLeft, el.offsetTop];
        parent = el.offsetParent;
        if (parent != el) {
            while (parent) {
                pos[0] += parent.offsetLeft;
                pos[1] += parent.offsetTop;
                parent = parent.offsetParent;
            }
        }
        if (ua.indexOf('opera') != -1 || (ua.indexOf('safari') != -1 && el.style.position == 'absolute')) {
            pos[0] -= document.body.offsetLeft;
            pos[1] -= document.body.offsetTop;
        }
    }
    if (el.parentNode) {
        parent = el.parentNode;
    }
    else {
        parent = null;
    }
    while (parent && parent.tagName != 'BODY' && parent.tagName != 'HTML') { // account for any scrolled ancestors
        pos[0] -= parent.scrollLeft;
        pos[1] -= parent.scrollTop;
        if (parent.parentNode) {
            parent = parent.parentNode;
        }
        else {
            parent = null;
        }
    }
    return {
        x: pos[0],
        y: pos[1]
    };
}



/*
此函数是根据在测试页面上的不同选项来进行截图，在实际应用中，您只需要根据您实际需要的截图模式，传入相应的参数即可 
*/
function Capture(divName)
{
    var top=window.screenTop+document.getElementById(divName).getBoundingClientRect().top;
    var left=window.screenLeft+document.getElementById(divName).getBoundingClientRect().left;
    var width=$("#"+divName).width();
    var height=$("#"+divName).height();



    return captureByPosition(left,top,width,height);


    /*if(autoFlag == 0)
    {
        return captureObj.DoCapture("1.jpg", hideFlag, 0, 0, 0, 0, 0);
    }
    else
    {
        autoFlag = $('#getimagefromclipboard').is(':checked') ? 4 : 1;
		if(autoFlag == 4)
		{
		    return captureObj.DoCapture("", 0, 4, 0, 0, 0, 0);
		}
		autoFlag = $('#showprewindow').is(':checked') ? 3 : 1;
		if(autoFlag == 3)
		{
		    //此时如果x, y, width, height全为0，则表示预截图窗口点击“开始截图”时，手工先把区域
		    //x, y, width, height全为1，则表示预截图窗口点击“开始截图”时，自动截取整个桌面
		    //其他情况，则自动截取 x, y, width, height 指定的区域  
		    return captureObj.DoCapture("1.jpg", hideFlag, 3, 0, 0, 0, 0);
		}
		autoFlag = $('#fullscreen').is(':checked') ? 2 : 1;
		if(autoFlag == 2)
		{
			return captureObj.DoCapture("1.jpg", hideFlag, 2, 0, 0, 0, 0);
		}
        else
		{
			return captureObj.DoCapture("1.jpg", hideFlag, 1, $('#xpos').val(), $('#ypos').val(), $('#width').val(), $('#height').val());
		}
    }   */
}

//根据屏幕坐标进行截图
function captureByPosition(top,left,width,height){
   var isOK= captureObj.DoCapture("1.jpg", false, 1, top, left,width,height);
   if(isOK)captureObj.SavePicture('');
   return isOK;
}


/*
此处是截图后的回调函数，用于将截图的详细信息反馈回来，你需要调整此函数，完成图像数据的传输与显示  
*/
function OnCaptureFinishedCallback(type, x, y, width, height, info, content,localpath) 
{
    if(type < 0)
    {
        //需要重新安装控件
        ShowDownLoad();
        return;
    }
    $('#show').hide();
    switch(type)
    {
        case 1:
        {
              $('#info').html('截图完成： x:' + x + ',y:' + y + ',widht:' + width + ',height:' + height);
	          UploadCaptureData(content, localpath);  
	          break;
        }
        case 2:
        {
             $('#info').html('您取消了截图');     
             break;        
        }
        case 3:
        {
             $('#info').html('您保存了截图到本地： x:' + x + ',y:' + y + ',widht:' + width + ',height:' + height);
	         UploadCaptureData(content, localpath);
	         break;
        }
        case 4:
        {
            if(info =='0')
            {
                $('#info').html('从剪贴板获取到了截图： ' + localpath);
	            UploadCaptureData(content, localpath);
            }
            else
            {
                $('#info').html('从剪贴板获取图片失败。');
            }            
	        break;
        }
    }                 
}

//控制上传
function UploadCaptureData(content, localpath)
{
    savedPictureContent = content;
    
    //获取图片的扩展名 
    var pos = localpath.lastIndexOf('.');
    extendName = localpath.substr(pos + 1);
    
	$('#show').html('截图已经完成，请点击');
	$('#show').show();
	var autoUpload = $("#autoupload").attr("checked")=="checked" ? 1 : 0;
	if(autoUpload)
	{
		UploadData();
	}
	else
	{
		$('#btnUpload').show();
	}  
}


/*
实际上传图像数据的函数，此处主要是将BASE64的图像数据，通过AJAX的方式POST到服务器保存成文件，并且显示在页面上
*/
function UploadData()
{
	$('#show').html('截图完成，正在上传，请稍后...');
    $('#btnUpload').hide();
    //上传的数据除了图片外，还可以包含自己需要传递的参数 
    var data = "userid=test111&extendname=" + extendName + "&picdata=" + encodeURIComponent(savedPictureContent);	
             
    $.ajax({
            type: "POST",
            url: "./upload.ashx",
            dataType: "json",
            data: data, 
            success: function (obj) {
                if(obj.code==0)
		        {
			        $('#show').html('上传成功，图片地址：' + obj.info);
			        $('#imgshow').show();
			        $('#imgshow').attr('src', obj.info);
		        }
		        else
		        {
			        $('#show').html('上传失败 :' + obj.info);
		        }					
            },
			error : function(){$('#show').html('由于网络原因，上传失败。'); }
        });  
}  

function TestSetWatermarkPicture()
{
    captureObj.SetWatermarkPicture("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");
}