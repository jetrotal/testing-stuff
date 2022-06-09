var resp, reader, receivedLength = 0, contentLength = 0; 
var percentage = {old:"", current:""};

const logoURL = "https://raw.githubusercontent.com/jetrotal/OpenRTP-CheckList/gh-page/img/logo.svg"; 

const preloaderHTML = `
<div id=preloader>
  <div id=loader><img src=${logoURL} id=loaderLogo onload=""></div>
  <style id=preloaderStyle>
    :root {
      --loaderColor: #72b740;
      --loaderBGcolor: #262f23;
      --loaderVal: 0;
      --loaderStatus: "Preparing";
      --loaderDisplay: visible;
      --loaderBar: 1;
    }

    #loaderLogo {
      opacity: .3;
      width: 100px
    }

    #preloader {
      font-family: Ubuntu, Droid Sans, Trebuchet MS, sans-serif;
      display: var(--loaderDisplay);
      height: 100%;
      left: 0;
      position: fixed;
      top: 0;
      width: 100%;
      z-index:99999;
    }

    #loader {
      align-items: center;
      display: flex;
      height: 150px;
      justify-content: center;
      left: 50%;
      margin: -75px 0 0-75px;
      position: relative;
      top: 50%;
      width: 150px;
    }

    #loader:before {
      color: var(--loaderColor);
      content: var(--loaderStatus);
      font-weight: 900;
        font-size: 16px;
      position: absolute;
      text-align: center;
      white-space: pre-wrap;
    }

    #loader:after {
      border: 3px solid;

      border-image: linear-gradient(to right, var(--loaderColor) 0,
      var(--loaderColor) calc((var(--loaderVal) - 1) * 1%),
      var(--loaderBGcolor) calc(var(--loaderVal) * 1%)) 0 0 100%;

      opacity: var(--loaderBar);
      bottom: 10px;
      content: "";
      left: 15px;
      position: absolute;
      right: 15px;
    }
  </style>
</div>
`;

function initPreloader(response) {
    
  document.getElementById("status").innerHTML += preloaderHTML;
    
  resp = response;
  reader = resp.body.getReader();
  contentLength = Module.filesize ? Module.filesize : resp.headers.get("Content-Length");
    
  Watch_Uint8Array_length(reader);
    
}

function formatBytes(bytes, decimals = 2) {
  if (0 === bytes) return "0 Bytes";
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(0 > decimals ? 0 : decimals)) + " " + "Bytes KB MB GB TB PB EB ZB YB".split(" ")[i];
}

async function Watch_Uint8Array_length(obj) {
  for (var message;;) {
    const {done, value} = await obj.read();
    
      if (done){ 
       updateLoader("done");
       break;
               }
    receivedLength += value.length;
      if (percentage.old > 100) contentLength = null;
    if (contentLength) {
      percentage.current = Math.round(receivedLength / contentLength * 100);
        
      if (percentage.old === percentage.current) continue;
      else percentage.old = percentage.current;
      
      message = percentage.current;
    } else message = "Loading\n " + formatBytes(receivedLength);
    
    updateLoader(message);    
  }
}

function updateLoader(val, color = "#72b740") {
  !( "string" === typeof val || val instanceof String ) ? changeProp("Bar", 1) :
      (changeProp("Bar", 0), val = val.split("\n").join("\\a")) ;
  
  if ("done" == val || 101 == val) return changeProp("Display", "none");
  
  var status = isNaN(val) ? '"' + val + '"' : '"' + val + '%"';
  changeProp("Display", "visible");
  changeProp("Val", val);
  changeProp("Color", color);
  changeProp("Status", status);
}

function changeProp(el, val, type = "--loader") {
  document.documentElement.style.setProperty(type + el, val);
}

/* function beginFetch(){
  fetch(wasmBinaryFile, {credentials:"same-origin"}).then(response => {
  initPreloader(response);
  })
};
*///
