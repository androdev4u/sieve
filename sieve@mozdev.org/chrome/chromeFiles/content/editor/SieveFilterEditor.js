var sieve = null;
var gCompileTimeout = null;
var gCompile = null
var gCompileDelay = null;
var gChanged = false;

var gBackHistory = new Array();
var gForwardHistory = new Array();


var event = 
{
  onDeleteScriptResponse:  function(response)
  {
    clearInterval(gCompileTimeout);
    close();
  },
  
  onGetScriptResponse: function(response)
  {		
    document.getElementById("txtScript").value = response.getScriptBody();
  },  
	
  onPutScriptResponse: function(response)
  {    
    gChanged = false;
    // is the script renamed?
    if (window.arguments[0]["scriptName"] != document.getElementById("txtName").value)
    {
      var request = new SieveDeleteScriptRequest(
    									new String(window.arguments[0]["scriptName"]));
      request.addDeleteScriptListener(event);
      request.addErrorListener(event);
    	
      sieve.addRequest(request);
		    
      return
    }
        
    clearTimeout(gCompileTimeout);
    close();
  },
	
  onError: function(response)
  {
    alert("FATAL ERROR:"+response.getMessage());
  }
}

function onCompile()
{
  var lEvent = 
  {
    onPutScriptResponse: function(response)
    {
      document.getElementById("gbError").setAttribute('hidden','true')
       	
      // we need no handlers thus we don't care if the call succseeds
      sieve.addRequest(new SieveDeleteScriptRequest("TMP_FILE_DELETE_ME"));
    },
    	
    onError: function(response)
    {
      document.getElementById("gbError").removeAttribute('hidden');
      document.getElementById("lblError").value = response.getMessage();    		

      // the server did not accept our script therfore wa can't delete it...   		
    }
  }

  var request = new SievePutScriptRequest(
                  "TMP_FILE_DELETE_ME",
                  new String(document.getElementById("txtScript").value));
  request.addPutScriptListener(lEvent);
  request.addErrorListener(lEvent);
  
  sieve.addRequest(request);
}

function onBtnCompile()
{
    if ( document.getElementById("btnCompile").checked == false)
    {
        gCompile = true;
        document.getElementById("btnCompile")
          .setAttribute("image","chrome://sieve/content/images/syntaxCheckOn.png");
        onCompile();
        return
    }

    clearTimeout(gCompileTimeout);
    gCompileTimeout = null;
    
    gCompile = false;
    document.getElementById("btnCompile")
      .setAttribute("image","chrome://sieve/content/images/syntaxCheckOff.png");
    document.getElementById("gbError").setAttribute('hidden','true')    
}

function onInput()
{
  gChanged = true;
  
  // on every keypress we reset the timeout
  if (gCompileTimeout != null)
  {
    clearTimeout(gCompileTimeout);
    gCompileTimeout = null;
  }
            
  if (gCompile)
    gCompileTimeout = setTimeout("onCompile()",gCompileDelay);
}

/*var myListener =
{
  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },
  onStateChange:function(aProgress,aRequest,aFlag,aStatus)
  {
    if(aFlag & Components.interfaces.nsIWebProgressListener.STATE_STOP)
    {
      aRequest.QueryInterface(Components.interfaces.nsIChannel);
      alert("Wait a moment!\n"+aRequest.URI.spec);
    }
  },
  onLocationChange:function(a,b,c){},
  onProgressChange:function(a,b,c,d,e,f){},
  onStatusChange:function(a,b,c,d){},
  onSecurityChange:function(a,b,c){},
  onLinkIconAvailable:function(a){}
}*/ 

function onLoad()
{
  // script laden
  sieve = window.arguments[0]["sieve"];
  gCompile = window.arguments[0]["compile"];        
  gCompileDelay = window.arguments[0]["compileDelay"];
    
  document.getElementById("btnCompile").checked = gCompile;
    
  document.getElementById("txtName").value = window.arguments[0]["scriptName"];    
  
  if (window.arguments[0]["scriptBody"] != null)
  {
    document.getElementById("txtScript").value = window.arguments[0]["scriptBody"];    
  }
  else
  {
    var request = new SieveGetScriptRequest(window.arguments[0]["scriptName"]);
    request.addGetScriptListener(event);
    request.addErrorListener(event);

    sieve.addRequest(request);
  }        

  // hack to prevent links to be opened in the default browser window...       
  document.getElementById("sideBarBrowser").
    addEventListener("click",onSideBarBrowserClick,false);
    
/*  document.getElementById("sideBarBrowser")
    .webProgress.addProgressListener(myListener,
                                     Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);*/ 
  
  onSideBarGo();
}

function onSideBarBrowserClick(event)
{
  var href = null; 

  if (event.target.nodeName == "A")
    href = event.target.href;  
  else if (event.target.parentNode.nodeName == "A")
    href = event.target.parentNode.href;
  else
    return;
    
  event.preventDefault();
  onSideBarGo(href);
}

function onSideBarBack()
{
  // store the current location in the history...
  gForwardHistory.push(gBackHistory.pop());
  // ... and go back to the last page
  onSideBarGo(gBackHistory.pop());  
}

function onSideBarForward()
{
  onSideBarGo(gForwardHistory.pop());  
}

function onSideBarGo(uri)
{
  if (uri == null)
    uri = "http://sieve.mozdev.org/reference/en/index.html"
    
  gBackHistory.push(uri);
  
  if (gBackHistory.length > 20)
    gBackHistory.shift();
  
  
  if (gBackHistory.length == 1)
    document.getElementById("sideBarBack").setAttribute('disabled',"true");    
  else
    document.getElementById("sideBarBack").removeAttribute('disabled');
    
  if (gForwardHistory.length == 0)
    document.getElementById("sideBarForward").setAttribute('disabled',"true");
  else
    document.getElementById("sideBarForward").removeAttribute('disabled');    
     
  document.getElementById("sideBarBrowser").setAttribute('src',uri);
}



function onSave()
{
  var request = new SievePutScriptRequest(
                  new String(document.getElementById("txtName").value),
                  new String(document.getElementById("txtScript").value));
  request.addPutScriptListener(event)
  request.addErrorListener(event)

  sieve.addRequest(request)
}

function onClose()
{
  if (gChanged == false)
    return true;    

  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                          .getService(Components.interfaces.nsIPromptService);
                          
  var result = prompts.confirm(window, "Title", "Do you want to save changes?");
    
  if (result != true)
    return true;
    
  onSave();
    
  return false;
}

function onImport()
{
    var filePicker   = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);

    filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
    filePicker.init(window, "Import Sieve Script", filePicker.modeOpen);

    // If the user selected a style sheet
    if(filePicker.show() != filePicker.returnOK)
        return
        
    var inputStream      = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
    var scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);

    inputStream.init(filePicker.file, 0x01, 00444, null);
    scriptableStream.init(inputStream);

    document.getElementById("txtScript").value = scriptableStream.read(scriptableStream.available());

    scriptableStream.close();
    inputStream.close();
}

function onExport()
{
    var filePicker = Components.classes["@mozilla.org/filepicker;1"]
                            .createInstance(Components.interfaces.nsIFilePicker);

    filePicker.defaultExtension = ".sieve";
    filePicker.defaultString    = document.getElementById("txtName").value+".sieve";

    filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
    filePicker.init(window, "Export Sieve Script", filePicker.modeSave);

    var result = filePicker.show();
    
    if ((result != filePicker.returnOK) && (result != filePicker.returnReplace))
        return
        
    var file = filePicker.file;
    
    if(file.exists() == false)
        file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 00444);

    var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                            .createInstance(Components.interfaces.nsIFileOutputStream);
                            
    outputStream.init(file, 0x04 | 0x08 | 0x20, 00444, null);

    var data = document.getElementById("txtScript").value;
    outputStream.write(data, data.length);
    outputStream.close();
}

function onCut() { goDoCommand("cmd_cut"); }

function onCopy() { goDoCommand("cmd_copy"); }

function onPaste() { goDoCommand("cmd_paste"); }

function onSideBarClose()
{
  document.getElementById('splitter').setAttribute('hidden','true');
  document.getElementById('vbSidebar').setAttribute('hidden','true');
  
  document.getElementById("btnReference").checked = false; 
}

function onBtnRefernece()
{  
  if (document.getElementById("btnReference").checked == false)
  {
    document.getElementById('splitter').setAttribute('hidden','true');
    document.getElementById('vbSidebar').setAttribute('hidden','true'); 
  }
  else
  {
    document.getElementById('splitter').removeAttribute('hidden','true');
    document.getElementById('vbSidebar').removeAttribute('hidden','true');
  }

}

var gUpdateScheduled = false;

function UpdateCursorPos()
{
  var el = document.getElementById("txtScript");
  var lines = el.value.substr(0,el.selectionEnd).split("\n");
  
  document.getElementById("sbCursorPos")
          .label = lines.length +":" +(lines[lines.length-1].length +1); 
  
  gUpdateScheduled=false;
}


function onUpdateCursorPos(timeout)
{
  if (gUpdateScheduled)
    return;

  setTimeout(function () {UpdateCursorPos();gUpdateScheduled=false;},200);

  gUpdateScheduled = true; 
}

function onBtnChangeView()
{
 /* var deck = document.getElementById("dkView");
  
  if (deck.selectedIndex == 0)
    document.getElementById("dkView").selectedIndex = 1;
  else
    document.getElementById("dkView").selectedIndex = 0;*/
  
}

