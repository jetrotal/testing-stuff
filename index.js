var Module = typeof Module !== "undefined" ? Module : {};
Module = {
    EASYRPG_GAME: "",
    preRun: [],
    postRun: [],
    print: (...args)=>{
        console.log(...args)
    }
    ,
    printErr: (...args)=>{
        console.error(...args)
    }
    ,
    canvas: (()=>{
        const canvas = document.getElementById("canvas");
        canvas.addEventListener("webglcontextlost", event=>{
            alert("WebGL context lost. You will need to reload the page.");
            event.preventDefault()
        }
        , false);
        return canvas
    }
    )(),
    setStatus: text=>{
        if (!Module.setStatus.last)
            Module.setStatus.last = {
                time: Date.now(),
                text: ""
            };
        if (text !== Module.setStatus.text) {
            document.getElementById("status").innerHTML = text
        }
    }
    ,
    totalDependencies: 0,
    monitorRunDependencies: left=>{
        Module.totalDependencies = Math.max(Module.totalDependencies, left);
        Module.setStatus(left ? `Preparing... (${Module.totalDependencies - left}/${Module.totalDependencies})` : "Downloading game data...");
        initPreloader(resp);
    }
};
function parseArgs() {
    const items = window.location.search.substr(1).split("&");
    let result = [];
    result.push("--save-path");
    result.push("Save");
    for (let i = 0; i < items.length; i++) {
        const tmp = items[i].split("=");
        if (tmp[0] === "project-path" || tmp[0] === "save-path") {
            continue
        }
        if (tmp[0] === "game" && tmp.length > 1) {
            Module.EASYRPG_GAME = tmp[1].toLowerCase()
        }
        result.push("--" + tmp[0]);
        if (tmp.length > 1) {
            const arg = decodeURI(tmp[1]);
            if (arg.length > 0) {
                if (arg.startsWith('"') && arg.endsWith('"')) {
                    result.push(arg.slice(1, -1))
                } else {
                    result = [...result, ...arg.split(" ")]
                }
            }
        }
    }
    return result
}
Module.setStatus("Downloading...");
Module.arguments = ["easyrpg-player", ...parseArgs()];
window.addEventListener("error", ()=>{
    Module.setStatus("Exception thrown, see JavaScript console…");
    Module.setStatus = (text=>{
        if (text)
            Module.printErr(`[post-exception status] ${text}`)
    }
    )
}
);
var moduleOverrides = {};
var key;
for (key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key]
    }
}
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function(status, toThrow) {
    throw toThrow
};
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === "object";
ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var scriptDirectory = "";
function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
}
var read_, readAsync, readBinary, setWindowTitle;
var nodeFS;
var nodePath;
if (ENVIRONMENT_IS_NODE) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = require("path").dirname(scriptDirectory) + "/"
    } else {
        scriptDirectory = __dirname + "/"
    }
    read_ = function shell_read(filename, binary) {
        if (!nodeFS)
            nodeFS = require("fs");
        if (!nodePath)
            nodePath = require("path");
        filename = nodePath["normalize"](filename);
        return nodeFS["readFileSync"](filename, binary ? null : "utf8")
    }
    ;
    readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        assert(ret.buffer);
        return ret
    }
    ;
    if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/")
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module
    }
    process["on"]("uncaughtException", function(ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex
        }
    });
    process["on"]("unhandledRejection", abort);
    quit_ = function(status) {
        process["exit"](status)
    }
    ;
    Module["inspect"] = function() {
        return "[Emscripten Module object]"
    }
} else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != "undefined") {
        read_ = function shell_read(f) {
            return read(f)
        }
    }
    readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f))
        }
        data = read(f, "binary");
        assert(typeof data === "object");
        return data
    }
    ;
    if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs
    } else if (typeof arguments != "undefined") {
        arguments_ = arguments
    }
    if (typeof quit === "function") {
        quit_ = function(status) {
            quit(status)
        }
    }
    if (typeof print !== "undefined") {
        if (typeof console === "undefined")
            console = {};
        console.log = print;
        console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
    } else if (typeof document !== "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
    } else {
        scriptDirectory = ""
    }
    {
        read_ = function(url) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText
        }
        ;
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = function(url) {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response)
            }
        }
        readAsync = function(url, onload, onerror) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function() {
                if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return
                }
                onerror()
            }
            ;
            xhr.onerror = onerror;
            xhr.send(null)
        }
    }
    setWindowTitle = function(title) {
        document.title = title
    }
} else {}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key]
    }
}
moduleOverrides = null;
if (Module["arguments"])
    arguments_ = Module["arguments"];
if (Module["thisProgram"])
    thisProgram = Module["thisProgram"];
if (Module["quit"])
    quit_ = Module["quit"];
var STACK_ALIGN = 16;
function alignMemory(size, factor) {
    if (!factor)
        factor = STACK_ALIGN;
    return Math.ceil(size / factor) * factor
}
function warnOnce(text) {
    if (!warnOnce.shown)
        warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text)
    }
}
var tempRet0 = 0;
var setTempRet0 = function(value) {
    tempRet0 = value
};
var getTempRet0 = function() {
    return tempRet0
};
var wasmBinary;
if (Module["wasmBinary"])
    wasmBinary = Module["wasmBinary"];
var noExitRuntime = Module["noExitRuntime"] || true;
if (typeof WebAssembly !== "object") {
    abort("no native wasm support detected")
}
function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*")
        type = "i32";
    switch (type) {
    case "i1":
        HEAP8[ptr >> 0] = value;
        break;
    case "i8":
        HEAP8[ptr >> 0] = value;
        break;
    case "i16":
        HEAP16[ptr >> 1] = value;
        break;
    case "i32":
        HEAP32[ptr >> 2] = value;
        break;
    case "i64":
        tempI64 = [value >>> 0, (tempDouble = value,
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[ptr >> 2] = tempI64[0],
        HEAP32[ptr + 4 >> 2] = tempI64[1];
        break;
    case "float":
        HEAPF32[ptr >> 2] = value;
        break;
    case "double":
        HEAPF64[ptr >> 3] = value;
        break;
    default:
        abort("invalid type for setValue: " + type)
    }
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text)
    }
}
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
function allocate(slab, allocator) {
    var ret;
    if (allocator == ALLOC_STACK) {
        ret = stackAlloc(slab.length)
    } else {
        ret = _malloc(slab.length)
    }
    if (slab.subarray || slab.slice) {
        HEAPU8.set(slab, ret)
    } else {
        HEAPU8.set(new Uint8Array(slab), ret)
    }
    return ret
}
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heap[endPtr] && !(endPtr >= endIdx))
        ++endPtr;
    if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr))
    } else {
        var str = "";
        while (idx < endPtr) {
            var u0 = heap[idx++];
            if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue
            }
            var u1 = heap[idx++] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue
            }
            var u2 = heap[idx++] & 63;
            if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2
            } else {
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0)
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
            }
        }
    }
    return str
}
function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
}
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0))
        return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx)
                break;
            heap[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx)
                break;
            heap[outIdx++] = 192 | u >> 6;
            heap[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx)
                break;
            heap[outIdx++] = 224 | u >> 12;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx)
                break;
            heap[outIdx++] = 240 | u >> 18;
            heap[outIdx++] = 128 | u >> 12 & 63;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}
function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343)
            u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127)
            ++len;
        else if (u <= 2047)
            len += 2;
        else if (u <= 65535)
            len += 3;
        else
            len += 4
    }
    return len
}
function AsciiToString(ptr) {
    var str = "";
    while (1) {
        var ch = HEAPU8[ptr++ >> 0];
        if (!ch)
            return str;
        str += String.fromCharCode(ch)
    }
}
function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret)
        stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}
function allocateUTF8OnStack(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}
function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer)
}
function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull)
        HEAP8[buffer >> 0] = 0
}
function alignUp(x, multiple) {
    if (x % multiple > 0) {
        x += multiple - x % multiple
    }
    return x
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
}
var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function")
            Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}
function initRuntime() {
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized)
        FS.init();
    TTY.init();
    callRuntimeCallbacks(__ATINIT__)
}
function preMain() {
    FS.ignorePermissions = false;
    callRuntimeCallbacks(__ATMAIN__)
}
function exitRuntime() {
    runtimeExited = true
}
function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function")
            Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}
function addOnInit(cb) {
    __ATINIT__.unshift(cb)
}
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
    return id
}
function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
}
function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
function abort(what) {
    if (Module["onAbort"]) {
        Module["onAbort"](what)
    }
    what += "";
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e
}
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
    return filename.startsWith(dataURIPrefix)
}
function isFileURI(filename) {
    return filename.startsWith("file://")
}
var wasmBinaryFile = "index.wasm";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile)
}
function getBinary(file) {
    try {
        if (file == wasmBinaryFile && wasmBinary) {
            return new Uint8Array(wasmBinary)
        }
        if (readBinary) {
            return readBinary(file)
        } else {
            throw "both async and sync fetching of the wasm failed"
        }
    } catch (err) {
        abort(err)
    }
}
function getBinaryPromise() {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
        if (typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
            return fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function(response) {
                if (!response["ok"]) {
                    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                }
                return response["arrayBuffer"]()
            }).catch(function() {
                return getBinary(wasmBinaryFile)
            })
        } else {
            if (readAsync) {
                return new Promise(function(resolve, reject) {
                    readAsync(wasmBinaryFile, function(response) {
                        resolve(new Uint8Array(response))
                    }, reject)
                }
                )
            }
        }
    }
    return Promise.resolve().then(function() {
        return getBinary(wasmBinaryFile)
    })
}
function createWasm() {
    var info = {
        "a": asmLibraryArg
    };
    function receiveInstance(instance, module) {
        var exports = instance.exports;
        exports = Asyncify.instrumentWasmExports(exports);
        Module["asm"] = exports;
        wasmMemory = Module["asm"]["fe"];
        updateGlobalBufferAndViews(wasmMemory.buffer);
        wasmTable = Module["asm"]["ie"];
        addOnInit(Module["asm"]["ge"]);
        removeRunDependency("wasm-instantiate")
    }
    addRunDependency("wasm-instantiate");
    function receiveInstantiationResult(result) {
        receiveInstance(result["instance"])
    }
    function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
            var result = WebAssembly.instantiate(binary, info);
            return result
        }).then(receiver, function(reason) {
            err("failed to asynchronously prepare wasm: " + reason);
            abort(reason)
        })
    }
    function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
            return fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function(response) {
              resp = response;
                var result = WebAssembly.instantiateStreaming(response, info);
                return result.then(receiveInstantiationResult, function(reason) {
                    err("wasm streaming compile failed: " + reason);
                    err("falling back to ArrayBuffer instantiation");
                    return instantiateArrayBuffer(receiveInstantiationResult)
                })
            })
        } else {
            return instantiateArrayBuffer(receiveInstantiationResult)
        }
    }
    if (Module["instantiateWasm"]) {
        try {
            var exports = Module["instantiateWasm"](info, receiveInstance);
            exports = Asyncify.instrumentWasmExports(exports);
            return exports
        } catch (e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            return false
        }
    }
    instantiateAsync();
    return {}
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {
    2562624: function($0, $1) {
        lvl = $0;
        msg = UTF8ToString($1);
        switch (lvl) {
        case 0:
            console.error(msg);
            break;
        case 1:
            console.warn(msg);
            break;
        case 2:
            console.info(msg);
            break;
        case 3:
            console.debug(msg);
            break;
        default:
            console.log(msg);
            break
        }
    },
    2562851: function() {
        FS.mkdir("Save");
        FS.mount(Module.EASYRPG_FS, {}, "Save");
        FS.syncfs(true, function(err) {})
    },
    2562952: function() {
        FS.syncfs(function(err) {})
    },
    2562986: function() {
        var context;
        try {
            context = new AudioContext
        } catch (e) {
            context = new webkitAudioContext
        }
        return context.sampleRate
    },
    2563118: function($0) {
        var str = UTF8ToString($0) + "\n\n" + "Abort/Retry/Ignore/AlwaysIgnore? [ariA] :";
        var reply = window.prompt(str, "i");
        if (reply === null) {
            reply = "i"
        }
        return allocate(intArrayFromString(reply), "i8", ALLOC_NORMAL)
    },
    2563343: function($0, $1, $2) {
        var w = $0;
        var h = $1;
        var pixels = $2;
        if (!Module["SDL2"])
            Module["SDL2"] = {};
        var SDL2 = Module["SDL2"];
        if (SDL2.ctxCanvas !== Module["canvas"]) {
            SDL2.ctx = Module["createContext"](Module["canvas"], false, true);
            SDL2.ctxCanvas = Module["canvas"]
        }
        if (SDL2.w !== w || SDL2.h !== h || SDL2.imageCtx !== SDL2.ctx) {
            SDL2.image = SDL2.ctx.createImageData(w, h);
            SDL2.w = w;
            SDL2.h = h;
            SDL2.imageCtx = SDL2.ctx
        }
        var data = SDL2.image.data;
        var src = pixels >> 2;
        var dst = 0;
        var num;
        if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
            num = data.length;
            while (dst < num) {
                var val = HEAP32[src];
                data[dst] = val & 255;
                data[dst + 1] = val >> 8 & 255;
                data[dst + 2] = val >> 16 & 255;
                data[dst + 3] = 255;
                src++;
                dst += 4
            }
        } else {
            if (SDL2.data32Data !== data) {
                SDL2.data32 = new Int32Array(data.buffer);
                SDL2.data8 = new Uint8Array(data.buffer);
                SDL2.data32Data = data
            }
            var data32 = SDL2.data32;
            num = data32.length;
            data32.set(HEAP32.subarray(src, src + num));
            var data8 = SDL2.data8;
            var i = 3;
            var j = i + 4 * num;
            if (num % 8 == 0) {
                while (i < j) {
                    data8[i] = 255;
                    i = i + 4 | 0;
                    data8[i] = 255;
                    i = i + 4 | 0;
                    data8[i] = 255;
                    i = i + 4 | 0;
                    data8[i] = 255;
                    i = i + 4 | 0;
                    data8[i] = 255;
                    i = i + 4 | 0;
                    data8[i] = 255;
                    i = i + 4 | 0;
                    data8[i] = 255;
                    i = i + 4 | 0;
                    data8[i] = 255;
                    i = i + 4 | 0
                }
            } else {
                while (i < j) {
                    data8[i] = 255;
                    i = i + 4 | 0
                }
            }
        }
        SDL2.ctx.putImageData(SDL2.image, 0, 0);
        return 0
    },
    2564822: function($0, $1, $2, $3, $4) {
        var w = $0;
        var h = $1;
        var hot_x = $2;
        var hot_y = $3;
        var pixels = $4;
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        var image = ctx.createImageData(w, h);
        var data = image.data;
        var src = pixels >> 2;
        var dst = 0;
        var num;
        if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
            num = data.length;
            while (dst < num) {
                var val = HEAP32[src];
                data[dst] = val & 255;
                data[dst + 1] = val >> 8 & 255;
                data[dst + 2] = val >> 16 & 255;
                data[dst + 3] = val >> 24 & 255;
                src++;
                dst += 4
            }
        } else {
            var data32 = new Int32Array(data.buffer);
            num = data32.length;
            data32.set(HEAP32.subarray(src, src + num))
        }
        ctx.putImageData(image, 0, 0);
        var url = hot_x === 0 && hot_y === 0 ? "url(" + canvas.toDataURL() + "), auto" : "url(" + canvas.toDataURL() + ") " + hot_x + " " + hot_y + ", auto";
        var urlBuf = _malloc(url.length + 1);
        stringToUTF8(url, urlBuf, url.length + 1);
        return urlBuf
    },
    2565811: function($0) {
        if (Module["canvas"]) {
            Module["canvas"].style["cursor"] = UTF8ToString($0)
        }
        return 0
    },
    2565904: function() {
        if (Module["canvas"]) {
            Module["canvas"].style["cursor"] = "none"
        }
    },
    2565973: function() {
        return window.innerWidth
    },
    2566003: function() {
        return window.innerHeight
    },
    2566034: function() {
        if (typeof AudioContext !== "undefined") {
            return 1
        } else if (typeof webkitAudioContext !== "undefined") {
            return 1
        }
        return 0
    },
    2566171: function() {
        if (typeof navigator.mediaDevices !== "undefined" && typeof navigator.mediaDevices.getUserMedia !== "undefined") {
            return 1
        } else if (typeof navigator.webkitGetUserMedia !== "undefined") {
            return 1
        }
        return 0
    },
    2566395: function($0) {
        if (typeof Module["SDL2"] === "undefined") {
            Module["SDL2"] = {}
        }
        var SDL2 = Module["SDL2"];
        if (!$0) {
            SDL2.audio = {}
        } else {
            SDL2.capture = {}
        }
        if (!SDL2.audioContext) {
            if (typeof AudioContext !== "undefined") {
                SDL2.audioContext = new AudioContext
            } else if (typeof webkitAudioContext !== "undefined") {
                SDL2.audioContext = new webkitAudioContext
            }
            if (SDL2.audioContext) {
                autoResumeAudioContext(SDL2.audioContext)
            }
        }
        return SDL2.audioContext === undefined ? -1 : 0
    },
    2566888: function() {
        var SDL2 = Module["SDL2"];
        return SDL2.audioContext.sampleRate
    },
    2566956: function($0, $1, $2, $3) {
        var SDL2 = Module["SDL2"];
        var have_microphone = function(stream) {
            if (SDL2.capture.silenceTimer !== undefined) {
                clearTimeout(SDL2.capture.silenceTimer);
                SDL2.capture.silenceTimer = undefined
            }
            SDL2.capture.mediaStreamNode = SDL2.audioContext.createMediaStreamSource(stream);
            SDL2.capture.scriptProcessorNode = SDL2.audioContext.createScriptProcessor($1, $0, 1);
            SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {
                if (SDL2 === undefined || SDL2.capture === undefined) {
                    return
                }
                audioProcessingEvent.outputBuffer.getChannelData(0).fill(0);
                SDL2.capture.currentCaptureBuffer = audioProcessingEvent.inputBuffer;
                dynCall("vi", $2, [$3])
            }
            ;
            SDL2.capture.mediaStreamNode.connect(SDL2.capture.scriptProcessorNode);
            SDL2.capture.scriptProcessorNode.connect(SDL2.audioContext.destination);
            SDL2.capture.stream = stream
        };
        var no_microphone = function(error) {};
        SDL2.capture.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate);
        SDL2.capture.silenceBuffer.getChannelData(0).fill(0);
        var silence_callback = function() {
            SDL2.capture.currentCaptureBuffer = SDL2.capture.silenceBuffer;
            dynCall("vi", $2, [$3])
        };
        SDL2.capture.silenceTimer = setTimeout(silence_callback, $1 / SDL2.audioContext.sampleRate * 1e3);
        if (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined) {
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            }).then(have_microphone).catch(no_microphone)
        } else if (navigator.webkitGetUserMedia !== undefined) {
            navigator.webkitGetUserMedia({
                audio: true,
                video: false
            }, have_microphone, no_microphone)
        }
    },
    2568608: function($0, $1, $2, $3) {
        var SDL2 = Module["SDL2"];
        SDL2.audio.scriptProcessorNode = SDL2.audioContext["createScriptProcessor"]($1, 0, $0);
        SDL2.audio.scriptProcessorNode["onaudioprocess"] = function(e) {
            if (SDL2 === undefined || SDL2.audio === undefined) {
                return
            }
            SDL2.audio.currentOutputBuffer = e["outputBuffer"];
            dynCall("vi", $2, [$3])
        }
        ;
        SDL2.audio.scriptProcessorNode["connect"](SDL2.audioContext["destination"])
    },
    2569018: function($0, $1) {
        var SDL2 = Module["SDL2"];
        var numChannels = SDL2.capture.currentCaptureBuffer.numberOfChannels;
        for (var c = 0; c < numChannels; ++c) {
            var channelData = SDL2.capture.currentCaptureBuffer.getChannelData(c);
            if (channelData.length != $1) {
                throw "Web Audio capture buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!"
            }
            if (numChannels == 1) {
                for (var j = 0; j < $1; ++j) {
                    setValue($0 + j * 4, channelData[j], "float")
                }
            } else {
                for (var j = 0; j < $1; ++j) {
                    setValue($0 + (j * numChannels + c) * 4, channelData[j], "float")
                }
            }
        }
    },
    2569623: function($0, $1) {
        var SDL2 = Module["SDL2"];
        var numChannels = SDL2.audio.currentOutputBuffer["numberOfChannels"];
        for (var c = 0; c < numChannels; ++c) {
            var channelData = SDL2.audio.currentOutputBuffer["getChannelData"](c);
            if (channelData.length != $1) {
                throw "Web Audio output buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!"
            }
            for (var j = 0; j < $1; ++j) {
                channelData[j] = HEAPF32[$0 + (j * numChannels + c << 2) >> 2]
            }
        }
    },
    2570103: function($0) {
        var SDL2 = Module["SDL2"];
        if ($0) {
            if (SDL2.capture.silenceTimer !== undefined) {
                clearTimeout(SDL2.capture.silenceTimer)
            }
            if (SDL2.capture.stream !== undefined) {
                var tracks = SDL2.capture.stream.getAudioTracks();
                for (var i = 0; i < tracks.length; i++) {
                    SDL2.capture.stream.removeTrack(tracks[i])
                }
                SDL2.capture.stream = undefined
            }
            if (SDL2.capture.scriptProcessorNode !== undefined) {
                SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {}
                ;
                SDL2.capture.scriptProcessorNode.disconnect();
                SDL2.capture.scriptProcessorNode = undefined
            }
            if (SDL2.capture.mediaStreamNode !== undefined) {
                SDL2.capture.mediaStreamNode.disconnect();
                SDL2.capture.mediaStreamNode = undefined
            }
            if (SDL2.capture.silenceBuffer !== undefined) {
                SDL2.capture.silenceBuffer = undefined
            }
            SDL2.capture = undefined
        } else {
            if (SDL2.audio.scriptProcessorNode != undefined) {
                SDL2.audio.scriptProcessorNode.disconnect();
                SDL2.audio.scriptProcessorNode = undefined
            }
            SDL2.audio = undefined
        }
        if (SDL2.audioContext !== undefined && SDL2.audio === undefined && SDL2.capture === undefined) {
            SDL2.audioContext.close();
            SDL2.audioContext = undefined
        }
    }
};
function listenOnce(object, event, func) {
    object.addEventListener(event, func, {
        "once": true
    })
}
function autoResumeAudioContext(ctx, elements) {
    if (!elements) {
        elements = [document, document.getElementById("canvas")]
    }
    ["keydown", "mousedown", "touchstart"].forEach(function(event) {
        elements.forEach(function(element) {
            if (element) {
                listenOnce(element, event, function() {
                    if (ctx.state === "suspended")
                        ctx.resume()
                })
            }
        })
    })
}
function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback(Module);
            continue
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                (function() {
                    dynCall_v.call(null, func)
                }
                )()
            } else {
                (function(a1) {
                    dynCall_vi.apply(null, [func, a1])
                }
                )(callback.arg)
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg)
        }
    }
}
function dynCallLegacy(sig, ptr, args) {
    var f = Module["dynCall_" + sig];
    return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr)
}
function dynCall(sig, ptr, args) {
    return dynCallLegacy(sig, ptr, args)
}
var runtimeKeepaliveCounter = 0;
function keepRuntimeAlive() {
    return noExitRuntime || runtimeKeepaliveCounter > 0
}
function ___assert_fail(condition, filename, line, func) {
    abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
}
var ExceptionInfoAttrs = {
    DESTRUCTOR_OFFSET: 0,
    REFCOUNT_OFFSET: 4,
    TYPE_OFFSET: 8,
    CAUGHT_OFFSET: 12,
    RETHROWN_OFFSET: 13,
    SIZE: 16
};
function ___cxa_allocate_exception(size) {
    return _malloc(size + ExceptionInfoAttrs.SIZE) + ExceptionInfoAttrs.SIZE
}
function ExceptionInfo(excPtr) {
    this.excPtr = excPtr;
    this.ptr = excPtr - ExceptionInfoAttrs.SIZE;
    this.set_type = function(type) {
        HEAP32[this.ptr + ExceptionInfoAttrs.TYPE_OFFSET >> 2] = type
    }
    ;
    this.get_type = function() {
        return HEAP32[this.ptr + ExceptionInfoAttrs.TYPE_OFFSET >> 2]
    }
    ;
    this.set_destructor = function(destructor) {
        HEAP32[this.ptr + ExceptionInfoAttrs.DESTRUCTOR_OFFSET >> 2] = destructor
    }
    ;
    this.get_destructor = function() {
        return HEAP32[this.ptr + ExceptionInfoAttrs.DESTRUCTOR_OFFSET >> 2]
    }
    ;
    this.set_refcount = function(refcount) {
        HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2] = refcount
    }
    ;
    this.set_caught = function(caught) {
        caught = caught ? 1 : 0;
        HEAP8[this.ptr + ExceptionInfoAttrs.CAUGHT_OFFSET >> 0] = caught
    }
    ;
    this.get_caught = function() {
        return HEAP8[this.ptr + ExceptionInfoAttrs.CAUGHT_OFFSET >> 0] != 0
    }
    ;
    this.set_rethrown = function(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[this.ptr + ExceptionInfoAttrs.RETHROWN_OFFSET >> 0] = rethrown
    }
    ;
    this.get_rethrown = function() {
        return HEAP8[this.ptr + ExceptionInfoAttrs.RETHROWN_OFFSET >> 0] != 0
    }
    ;
    this.init = function(type, destructor) {
        this.set_type(type);
        this.set_destructor(destructor);
        this.set_refcount(0);
        this.set_caught(false);
        this.set_rethrown(false)
    }
    ;
    this.add_ref = function() {
        var value = HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2];
        HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2] = value + 1
    }
    ;
    this.release_ref = function() {
        var prev = HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2];
        HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2] = prev - 1;
        return prev === 1
    }
}
var exceptionLast = 0;
var uncaughtExceptionCount = 0;
function ___cxa_throw(ptr, type, destructor) {
    var info = new ExceptionInfo(ptr);
    info.init(type, destructor);
    exceptionLast = ptr;
    uncaughtExceptionCount++;
    throw ptr
}
function _gmtime_r(time, tmPtr) {
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getUTCSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
    HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
    HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
    HEAP32[tmPtr + 36 >> 2] = 0;
    HEAP32[tmPtr + 32 >> 2] = 0;
    var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    if (!_gmtime_r.GMTString)
        _gmtime_r.GMTString = allocateUTF8("GMT");
    HEAP32[tmPtr + 40 >> 2] = _gmtime_r.GMTString;
    return tmPtr
}
function ___gmtime_r(a0, a1) {
    return _gmtime_r(a0, a1)
}
function _tzset() {
    if (_tzset.called)
        return;
    _tzset.called = true;
    var currentYear = (new Date).getFullYear();
    var winter = new Date(currentYear,0,1);
    var summer = new Date(currentYear,6,1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAP32[__get_timezone() >> 2] = stdTimezoneOffset * 60;
    HEAP32[__get_daylight() >> 2] = Number(winterOffset != summerOffset);
    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT"
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = allocateUTF8(winterName);
    var summerNamePtr = allocateUTF8(summerName);
    if (summerOffset < winterOffset) {
        HEAP32[__get_tzname() >> 2] = winterNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr
    } else {
        HEAP32[__get_tzname() >> 2] = summerNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr
    }
}
function _localtime_r(time, tmPtr) {
    _tzset();
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var start = new Date(date.getFullYear(),0,1);
    var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
    var summerOffset = new Date(date.getFullYear(),6,1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[tmPtr + 32 >> 2] = dst;
    var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
    HEAP32[tmPtr + 40 >> 2] = zonePtr;
    return tmPtr
}
function ___localtime_r(a0, a1) {
    return _localtime_r(a0, a1)
}
var PATH = {
    splitPath: function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    },
    normalizeArray: function(parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    },
    normalize: function(path) {
        var isAbsolute = path.charAt(0) === "/"
          , trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !!p
        }), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    },
    dirname: function(path) {
        var result = PATH.splitPath(path)
          , root = result[0]
          , dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    },
    basename: function(path) {
        if (path === "/")
            return "/";
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1)
            return path;
        return path.substr(lastSlash + 1)
    },
    extname: function(path) {
        return PATH.splitPath(path)[3]
    },
    join: function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    },
    join2: function(l, r) {
        return PATH.normalize(l + "/" + r)
    }
};
function getRandomDevice() {
    if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
        var randomBuffer = new Uint8Array(1);
        return function() {
            crypto.getRandomValues(randomBuffer);
            return randomBuffer[0]
        }
    } else if (ENVIRONMENT_IS_NODE) {
        try {
            var crypto_module = require("crypto");
            return function() {
                return crypto_module["randomBytes"](1)[0]
            }
        } catch (e) {}
    }
    return function() {
        abort("randomDevice")
    }
}
var PATH_FS = {
    resolve: function() {
        var resolvedPath = ""
          , resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/"
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
            return !!p
        }), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    },
    relative: function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "")
                    break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "")
                    break
            }
            if (start > end)
                return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    }
};
var TTY = {
    ttys: [],
    init: function() {},
    shutdown: function() {},
    register: function(dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    },
    stream_ops: {
        open: function(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43)
            }
            stream.tty = tty;
            stream.seekable = false
        },
        close: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        flush: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        read: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(29)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6)
                }
                if (result === null || result === undefined)
                    break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        },
        write: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60)
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                }
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        }
    },
    default_tty_ops: {
        get_char: function(tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    try {
                        bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null)
                    } catch (e) {
                        if (e.toString().includes("EOF"))
                            bytesRead = 0;
                        else
                            throw e
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8")
                    } else {
                        result = null
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n"
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n"
                    }
                }
                if (!result) {
                    return null
                }
                tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
        },
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0)
                    tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    },
    default_tty1_ops: {
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0)
                    tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    }
};
function mmapAlloc(size) {
    var alignedSize = alignMemory(size, 65536);
    var ptr = _malloc(alignedSize);
    while (size < alignedSize)
        HEAP8[ptr + size++] = 0;
    return ptr
}
var MEMFS = {
    ops_table: null,
    mount: function(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    },
    createNode: function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63)
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            }
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node;
            parent.timestamp = node.timestamp
        }
        return node
    },
    getFileDataAsTypedArray: function(node) {
        if (!node.contents)
            return new Uint8Array(0);
        if (node.contents.subarray)
            return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    },
    expandFileStorage: function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity)
            return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0)
            newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0)
            node.contents.set(oldContents.subarray(0, node.usedBytes), 0)
    },
    resizeFileStorage: function(node, newSize) {
        if (node.usedBytes == newSize)
            return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0
        } else {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize
        }
    },
    node_ops: {
        getattr: function(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        },
        setattr: function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        },
        lookup: function(parent, name) {
            throw FS.genericErrors[44]
        },
        mknod: function(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        },
        rename: function(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.parent.timestamp = Date.now();
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            new_dir.timestamp = old_node.parent.timestamp;
            old_node.parent = new_dir
        },
        unlink: function(parent, name) {
            delete parent.contents[name];
            parent.timestamp = Date.now()
        },
        rmdir: function(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55)
            }
            delete parent.contents[name];
            parent.timestamp = Date.now()
        },
        readdir: function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        },
        symlink: function(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        },
        readlink: function(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28)
            }
            return node.link
        }
    },
    stream_ops: {
        read: function(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes)
                return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++)
                    buffer[offset + i] = contents[position + i]
            }
            return size
        },
        write: function(stream, buffer, offset, length, position, canOwn) {
            if (buffer.buffer === HEAP8.buffer) {
                canOwn = false
            }
            if (!length)
                return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                node.contents.set(buffer.subarray(offset, offset + length), position)
            } else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        },
        llseek: function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28)
            }
            return position
        },
        allocate: function(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        },
        mmap: function(stream, address, length, position, prot, flags) {
            if (address !== 0) {
                throw new FS.ErrnoError(28)
            }
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents.buffer === buffer) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < contents.length) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48)
                }
                HEAP8.set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        },
        msync: function(stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            if (mmapFlags & 2) {
                return 0
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        }
    }
};
var IDBFS = {
    dbs: {},
    indexedDB: function() {
        if (typeof indexedDB !== "undefined")
            return indexedDB;
        var ret = null;
        if (typeof window === "object")
            ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret
    },
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: function(mount) {
        return MEMFS.mount.apply(null, arguments)
    },
    syncfs: function(mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
            if (err)
                return callback(err);
            IDBFS.getRemoteSet(mount, function(err, remote) {
                if (err)
                    return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback)
            })
        })
    },
    getDB: function(name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db)
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
        } catch (e) {
            return callback(e)
        }
        if (!req) {
            return callback("Unable to connect to IndexedDB")
        }
        req.onupgradeneeded = function(e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", {
                    unique: false
                })
            }
        }
        ;
        req.onsuccess = function() {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db)
        }
        ;
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    getLocalSet: function(mount, callback) {
        var entries = {};
        function isRealDir(p) {
            return p !== "." && p !== ".."
        }
        function toAbsolute(root) {
            return function(p) {
                return PATH.join2(root, p)
            }
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
            }
            entries[path] = {
                "timestamp": stat.mtime
            }
        }
        return callback(null, {
            type: "local",
            entries: entries
        })
    },
    getRemoteSet: function(mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
            if (err)
                return callback(err);
            try {
                var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                transaction.onerror = function(e) {
                    callback(this.error);
                    e.preventDefault()
                }
                ;
                var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                var index = store.index("timestamp");
                index.openKeyCursor().onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (!cursor) {
                        return callback(null, {
                            type: "remote",
                            db: db,
                            entries: entries
                        })
                    }
                    entries[cursor.primaryKey] = {
                        "timestamp": cursor.key
                    };
                    cursor.continue()
                }
            } catch (e) {
                return callback(e)
            }
        })
    },
    loadLocalEntry: function(path, callback) {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path)
        } catch (e) {
            return callback(e)
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                "timestamp": stat.mtime,
                "mode": stat.mode
            })
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                "timestamp": stat.mtime,
                "mode": stat.mode,
                "contents": node.contents
            })
        } else {
            return callback(new Error("node type not supported"))
        }
    },
    storeLocalEntry: function(path, entry, callback) {
        try {
            if (FS.isDir(entry["mode"])) {
                FS.mkdirTree(path, entry["mode"])
            } else if (FS.isFile(entry["mode"])) {
                FS.writeFile(path, entry["contents"], {
                    canOwn: true
                })
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry["mode"]);
            FS.utime(path, entry["timestamp"], entry["timestamp"])
        } catch (e) {
            return callback(e)
        }
        callback(null)
    },
    removeLocalEntry: function(path, callback) {
        try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path)
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path)
            }
        } catch (e) {
            return callback(e)
        }
        callback(null)
    },
    loadRemoteEntry: function(store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) {
            callback(null, event.target.result)
        }
        ;
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    storeRemoteEntry: function(store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() {
            callback(null)
        }
        ;
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    removeRemoteEntry: function(store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() {
            callback(null)
        }
        ;
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    reconcile: function(src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach(function(key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e["timestamp"].getTime() != e2["timestamp"].getTime()) {
                create.push(key);
                total++
            }
        });
        var remove = [];
        Object.keys(dst.entries).forEach(function(key) {
            if (!src.entries[key]) {
                remove.push(key);
                total++
            }
        });
        if (!total) {
            return callback(null)
        }
        var errored = false;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        function done(err) {
            if (err && !errored) {
                errored = true;
                return callback(err)
            }
        }
        transaction.onerror = function(e) {
            done(this.error);
            e.preventDefault()
        }
        ;
        transaction.oncomplete = function(e) {
            if (!errored) {
                callback(null)
            }
        }
        ;
        create.sort().forEach(function(path) {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, function(err, entry) {
                    if (err)
                        return done(err);
                    IDBFS.storeLocalEntry(path, entry, done)
                })
            } else {
                IDBFS.loadLocalEntry(path, function(err, entry) {
                    if (err)
                        return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done)
                })
            }
        });
        remove.sort().reverse().forEach(function(path) {
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done)
            } else {
                IDBFS.removeRemoteEntry(store, path, done)
            }
        })
    }
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    lookupPath: function(path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path)
            return {
                path: "",
                node: null
            };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key]
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32)
        }
        var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !!p
        }), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count
                    });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(32)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    },
    getPath: function(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path)
                    return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent
        }
    },
    hashName: function(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    },
    hashAddNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    },
    hashRemoveNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    },
    lookupNode: function(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode,parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    },
    createNode: function(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent,name,mode,rdev);
        FS.hashAddNode(node);
        return node
    },
    destroyNode: function(node) {
        FS.hashRemoveNode(node)
    },
    isRoot: function(node) {
        return node === node.parent
    },
    isMountpoint: function(node) {
        return !!node.mounted
    },
    isFile: function(mode) {
        return (mode & 61440) === 32768
    },
    isDir: function(mode) {
        return (mode & 61440) === 16384
    },
    isLink: function(mode) {
        return (mode & 61440) === 40960
    },
    isChrdev: function(mode) {
        return (mode & 61440) === 8192
    },
    isBlkdev: function(mode) {
        return (mode & 61440) === 24576
    },
    isFIFO: function(mode) {
        return (mode & 61440) === 4096
    },
    isSocket: function(mode) {
        return (mode & 49152) === 49152
    },
    flagModes: {
        "r": 0,
        "r+": 2,
        "w": 577,
        "w+": 578,
        "a": 1089,
        "a+": 1090
    },
    modeStringToFlags: function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str)
        }
        return flags
    },
    flagsToPermissionString: function(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    },
    nodePermissions: function(node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.includes("r") && !(node.mode & 292)) {
            return 2
        } else if (perms.includes("w") && !(node.mode & 146)) {
            return 2
        } else if (perms.includes("x") && !(node.mode & 73)) {
            return 2
        }
        return 0
    },
    mayLookup: function(dir) {
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode)
            return errCode;
        if (!dir.node_ops.lookup)
            return 2;
        return 0
    },
    mayCreate: function(dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 20
        } catch (e) {}
        return FS.nodePermissions(dir, "wx")
    },
    mayDelete: function(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
            return errCode
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31
            }
        }
        return 0
    },
    mayOpen: function(node, flags) {
        if (!node) {
            return 44
        }
        if (FS.isLink(node.mode)) {
            return 32
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 31
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    },
    MAX_OPEN_FDS: 4096,
    nextfd: function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(33)
    },
    getStream: function(fd) {
        return FS.streams[fd]
    },
    createStream: function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = function() {}
            ;
            FS.FSStream.prototype = {
                object: {
                    get: function() {
                        return this.node
                    },
                    set: function(val) {
                        this.node = val
                    }
                },
                isRead: {
                    get: function() {
                        return (this.flags & 2097155) !== 1
                    }
                },
                isWrite: {
                    get: function() {
                        return (this.flags & 2097155) !== 0
                    }
                },
                isAppend: {
                    get: function() {
                        return this.flags & 1024
                    }
                }
            }
        }
        var newStream = new FS.FSStream;
        for (var p in stream) {
            newStream[p] = stream[p]
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    },
    closeStream: function(fd) {
        FS.streams[fd] = null
    },
    chrdev_stream_ops: {
        open: function(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
        },
        llseek: function() {
            throw new FS.ErrnoError(70)
        }
    },
    major: function(dev) {
        return dev >> 8
    },
    minor: function(dev) {
        return dev & 255
    },
    makedev: function(ma, mi) {
        return ma << 8 | mi
    },
    registerDevice: function(dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    },
    getDevice: function(dev) {
        return FS.devices[dev]
    },
    getMounts: function(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    },
    syncfs: function(populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode)
        }
        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach(function(mount) {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        })
    },
    mount: function(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    },
    unmount: function(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function(hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.includes(current.mount)) {
                    FS.destroyNode(current)
                }
                current = next
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1)
    },
    lookup: function(parent, name) {
        return parent.node_ops.lookup(parent, name)
    },
    mknod: function(path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    },
    create: function(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    },
    mkdir: function(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    },
    mkdirTree: function(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i])
                continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode)
            } catch (e) {
                if (e.errno != 20)
                    throw e
            }
        }
    },
    mkdev: function(path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    },
    symlink: function(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44)
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    },
    rename: function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, {
            parent: true
        });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, {
            parent: true
        });
        new_dir = lookup.node;
        if (!old_dir || !new_dir)
            throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28)
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(10)
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
        try {
            if (FS.trackingDelegate["onMovePath"])
                FS.trackingDelegate["onMovePath"](old_path, new_path)
        } catch (e) {
            err("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
    },
    rmdir: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"])
                FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54)
        }
        return node.node_ops.readdir(node)
    },
    unlink: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"])
                FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readlink: function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28)
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    },
    stat: function(path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63)
        }
        return node.node_ops.getattr(node)
    },
    lstat: function(path) {
        return FS.stat(path, true)
    },
    chmod: function(path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    },
    lchmod: function(path, mode) {
        FS.chmod(path, mode, true)
    },
    fchmod: function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chmod(stream.node, mode)
    },
    chown: function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    },
    lchown: function(path, uid, gid) {
        FS.chown(path, uid, gid, true)
    },
    fchown: function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chown(stream.node, uid, gid)
    },
    truncate: function(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28)
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    },
    ftruncate: function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28)
        }
        FS.truncate(stream.node, len)
    },
    utime: function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    },
    open: function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(44)
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path === "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54)
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles)
                FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                err("FS.trackingDelegate error on read file: " + path)
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags)
            }
        } catch (e) {
            err("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
        }
        return stream
    },
    close: function(stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (stream.getdents)
            stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
        stream.fd = null
    },
    isClosed: function(stream) {
        return stream.fd === null
    },
    llseek: function(stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70)
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    },
    read: function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking)
            stream.position += bytesRead;
        return bytesRead
    },
    write: function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28)
        }
        if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking)
            stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"])
                FS.trackingDelegate["onWriteToFile"](stream.path)
        } catch (e) {
            err("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
        }
        return bytesWritten
    },
    allocate: function(stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138)
        }
        stream.stream_ops.allocate(stream, offset, length)
    },
    mmap: function(stream, address, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43)
        }
        return stream.stream_ops.mmap(stream, address, length, position, prot, flags)
    },
    msync: function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    },
    munmap: function(stream) {
        return 0
    },
    ioctl: function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    },
    readFile: function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    },
    writeFile: function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
        } else {
            throw new Error("Unsupported data type")
        }
        FS.close(stream)
    },
    cwd: function() {
        return FS.currentPath
    },
    chdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54)
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        FS.currentPath = lookup.path
    },
    createDefaultDirectories: function() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    },
    createDefaultDevices: function() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: function() {
                return 0
            },
            write: function(stream, buffer, offset, length, pos) {
                return length
            }
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device = getRandomDevice();
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    },
    createSpecialDirectories: function() {
        FS.mkdir("/proc");
        var proc_self = FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount: function() {
                var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup: function(parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream)
                            throw new FS.ErrnoError(8);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: function() {
                                    return stream.path
                                }
                            }
                        };
                        ret.parent = ret;
                        return ret
                    }
                };
                return node
            }
        }, {}, "/proc/self/fd")
    },
    createStandardStreams: function() {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1)
    },
    ensureErrnoError: function() {
        if (FS.ErrnoError)
            return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function(errno) {
                this.errno = errno
            }
            ;
            this.setErrno(errno);
            this.message = "FS error"
        }
        ;
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach(function(code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        })
    },
    staticInit: function() {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS,
            "IDBFS": IDBFS
        }
    },
    init: function(input, output, error) {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    },
    quit: function() {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush)
            fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    },
    getMode: function(canRead, canWrite) {
        var mode = 0;
        if (canRead)
            mode |= 292 | 73;
        if (canWrite)
            mode |= 146;
        return mode
    },
    findObject: function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object
        } else {
            return null
        }
    },
    analyzePath: function(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    },
    createPath: function(parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part)
                continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) {}
            parent = current
        }
        return current
    },
    createFile: function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode)
    },
    createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i)
                    arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
        return node
    },
    createDevice: function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major)
            FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: function(stream) {
                stream.seekable = false
            },
            close: function(stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10)
                }
            },
            read: function(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6)
                    }
                    if (result === null || result === undefined)
                        break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            },
            write: function(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            }
        });
        return FS.mkdev(path, mode, dev)
    },
    forceLoadFile: function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
            return true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (read_) {
            try {
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
    },
    createLazyFile: function(parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        }
        ;
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        }
        ;
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing)
                chunkSize = datalength;
            var doXHR = function(from, to) {
                if (from > to)
                    throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1)
                    throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize)
                    xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined")
                    xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                    throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                } else {
                    return intArrayFromString(xhr.responseText || "", true)
                }
            };
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined")
                    throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            });
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        }
        ;
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER)
                throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
                length: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._length
                    }
                },
                chunkSize: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._chunkSize
                    }
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function() {
                    return this.contents.length
                }
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                FS.forceLoadFile(node);
                return fn.apply(null, arguments)
            }
        });
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            FS.forceLoadFile(node);
            var contents = stream.node.contents;
            if (position >= contents.length)
                return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        }
        ;
        node.stream_ops = stream_ops;
        return node
    },
    createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);
        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish)
                    preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                }
                if (onload)
                    onload();
                removeRunDependency(dep)
            }
            var handled = false;
            Module["preloadPlugins"].forEach(function(plugin) {
                if (handled)
                    return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, function() {
                        if (onerror)
                            onerror();
                        removeRunDependency(dep)
                    });
                    handled = true
                }
            });
            if (!handled)
                finish(byteArray)
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url, function(byteArray) {
                processData(byteArray)
            }, onerror)
        } else {
            processData(url)
        }
    },
    indexedDB: function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    },
    DB_NAME: function() {
        return "EM_FS_" + window.location.pathname
    },
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: function(paths, onload, onerror) {
        onload = onload || function() {}
        ;
        onerror = onerror || function() {}
        ;
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            out("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
        }
        ;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0
              , fail = 0
              , total = paths.length;
            function finish() {
                if (fail == 0)
                    onload();
                else
                    onerror()
            }
            paths.forEach(function(path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total)
                        finish()
                }
                ;
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total)
                        finish()
                }
            });
            transaction.onerror = onerror
        }
        ;
        openRequest.onerror = onerror
    },
    loadFilesFromDB: function(paths, onload, onerror) {
        onload = onload || function() {}
        ;
        onerror = onerror || function() {}
        ;
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch (e) {
                onerror(e);
                return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0
              , fail = 0
              , total = paths.length;
            function finish() {
                if (fail == 0)
                    onload();
                else
                    onerror()
            }
            paths.forEach(function(path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path)
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total)
                        finish()
                }
                ;
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total)
                        finish()
                }
            });
            transaction.onerror = onerror
        }
        ;
        openRequest.onerror = onerror
    }
};
var SYSCALLS = {
    mappings: {},
    DEFAULT_POLLMASK: 5,
    umask: 511,
    calculateAt: function(dirfd, path, allowEmpty) {
        if (path[0] === "/") {
            return path
        }
        var dir;
        if (dirfd === -100) {
            dir = FS.cwd()
        } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream)
                throw new FS.ErrnoError(8);
            dir = dirstream.path
        }
        if (path.length == 0) {
            if (!allowEmpty) {
                throw new FS.ErrnoError(44)
            }
            return dir
        }
        return PATH.join2(dir, path)
    },
    doStat: function(func, path, buf) {
        try {
            var stat = func(path)
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -54
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        tempI64 = [stat.size >>> 0, (tempDouble = stat.size,
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[buf + 40 >> 2] = tempI64[0],
        HEAP32[buf + 44 >> 2] = tempI64[1];
        HEAP32[buf + 48 >> 2] = 4096;
        HEAP32[buf + 52 >> 2] = stat.blocks;
        HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 76 >> 2] = 0;
        tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino,
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[buf + 80 >> 2] = tempI64[0],
        HEAP32[buf + 84 >> 2] = tempI64[1];
        return 0
    },
    doMsync: function(addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags)
    },
    doMkdir: function(path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/")
            path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    },
    doMknod: function(path, mode, dev) {
        switch (mode & 61440) {
        case 32768:
        case 8192:
        case 24576:
        case 4096:
        case 49152:
            break;
        default:
            return -28
        }
        FS.mknod(path, mode, dev);
        return 0
    },
    doReadlink: function(path, buf, bufsize) {
        if (bufsize <= 0)
            return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len
    },
    doAccess: function(path, amode) {
        if (amode & ~7) {
            return -28
        }
        var node;
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        node = lookup.node;
        if (!node) {
            return -44
        }
        var perms = "";
        if (amode & 4)
            perms += "r";
        if (amode & 2)
            perms += "w";
        if (amode & 1)
            perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -2
        }
        return 0
    },
    doDup: function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest)
            FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd
    },
    doReadv: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0)
                return -1;
            ret += curr;
            if (curr < len)
                break
        }
        return ret
    },
    doWritev: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0)
                return -1;
            ret += curr
        }
        return ret
    },
    varargs: undefined,
    get: function() {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    },
    getStr: function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret
    },
    getStreamFromFD: function(fd) {
        var stream = FS.getStream(fd);
        if (!stream)
            throw new FS.ErrnoError(8);
        return stream
    },
    get64: function(low, high) {
        return low
    }
};
function ___sys_access(path, amode) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doAccess(path, amode)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function setErrNo(value) {
    HEAP32[___errno_location() >> 2] = value;
    return value
}
function ___sys_fcntl64(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
        case 0:
            {
                var arg = SYSCALLS.get();
                if (arg < 0) {
                    return -28
                }
                var newStream;
                newStream = FS.open(stream.path, stream.flags, 0, arg);
                return newStream.fd
            }
        case 1:
        case 2:
            return 0;
        case 3:
            return stream.flags;
        case 4:
            {
                var arg = SYSCALLS.get();
                stream.flags |= arg;
                return 0
            }
        case 12:
            {
                var arg = SYSCALLS.get();
                var offset = 0;
                HEAP16[arg + offset >> 1] = 2;
                return 0
            }
        case 13:
        case 14:
            return 0;
        case 16:
        case 8:
            return -28;
        case 9:
            setErrNo(28);
            return -1;
        default:
            {
                return -28
            }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_fstat64(fd, buf) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        return SYSCALLS.doStat(FS.stat, stream.path, buf)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_ftruncate64(fd, zero, low, high) {
    try {
        var length = SYSCALLS.get64(low, high);
        FS.ftruncate(fd, length);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_getdents64(fd, dirp, count) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        if (!stream.getdents) {
            stream.getdents = FS.readdir(stream.path)
        }
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var idx = Math.floor(off / struct_size);
        while (idx < stream.getdents.length && pos + struct_size <= count) {
            var id;
            var type;
            var name = stream.getdents[idx];
            if (name[0] === ".") {
                id = 1;
                type = 4
            } else {
                var child = FS.lookupNode(stream.node, name);
                id = child.id;
                type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8
            }
            tempI64 = [id >>> 0, (tempDouble = id,
            +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[dirp + pos >> 2] = tempI64[0],
            HEAP32[dirp + pos + 4 >> 2] = tempI64[1];
            tempI64 = [(idx + 1) * struct_size >>> 0, (tempDouble = (idx + 1) * struct_size,
            +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[dirp + pos + 8 >> 2] = tempI64[0],
            HEAP32[dirp + pos + 12 >> 2] = tempI64[1];
            HEAP16[dirp + pos + 16 >> 1] = 280;
            HEAP8[dirp + pos + 18 >> 0] = type;
            stringToUTF8(name, dirp + pos + 19, 256);
            pos += struct_size;
            idx += 1
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_getpid() {
    return 42
}
function ___sys_ioctl(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
        case 21509:
        case 21505:
            {
                if (!stream.tty)
                    return -59;
                return 0
            }
        case 21510:
        case 21511:
        case 21512:
        case 21506:
        case 21507:
        case 21508:
            {
                if (!stream.tty)
                    return -59;
                return 0
            }
        case 21519:
            {
                if (!stream.tty)
                    return -59;
                var argp = SYSCALLS.get();
                HEAP32[argp >> 2] = 0;
                return 0
            }
        case 21520:
            {
                if (!stream.tty)
                    return -59;
                return -28
            }
        case 21531:
            {
                var argp = SYSCALLS.get();
                return FS.ioctl(stream, op, argp)
            }
        case 21523:
            {
                if (!stream.tty)
                    return -59;
                return 0
            }
        case 21524:
            {
                if (!stream.tty)
                    return -59;
                return 0
            }
        default:
            abort("bad ioctl syscall " + op)
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_lstat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.lstat, path, buf)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_mkdir(path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doMkdir(path, mode)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_mlock(addr, len) {
    return 0
}
function syscallMmap2(addr, len, prot, flags, fd, off) {
    off <<= 12;
    var ptr;
    var allocated = false;
    if ((flags & 16) !== 0 && addr % 65536 !== 0) {
        return -28
    }
    if ((flags & 32) !== 0) {
        ptr = _memalign(65536, len);
        if (!ptr)
            return -48;
        _memset(ptr, 0, len);
        allocated = true
    } else {
        var info = FS.getStream(fd);
        if (!info)
            return -8;
        var res = FS.mmap(info, addr, len, off, prot, flags);
        ptr = res.ptr;
        allocated = res.allocated
    }
    SYSCALLS.mappings[ptr] = {
        malloc: ptr,
        len: len,
        allocated: allocated,
        fd: fd,
        prot: prot,
        flags: flags,
        offset: off
    };
    return ptr
}
function ___sys_mmap2(addr, len, prot, flags, fd, off) {
    try {
        return syscallMmap2(addr, len, prot, flags, fd, off)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_munlock(addr, len) {
    return 0
}
function syscallMunmap(addr, len) {
    if ((addr | 0) === -1 || len === 0) {
        return -28
    }
    var info = SYSCALLS.mappings[addr];
    if (!info)
        return 0;
    if (len === info.len) {
        var stream = FS.getStream(info.fd);
        if (stream) {
            if (info.prot & 2) {
                SYSCALLS.doMsync(addr, stream, len, info.flags, info.offset)
            }
            FS.munmap(stream)
        }
        SYSCALLS.mappings[addr] = null;
        if (info.allocated) {
            _free(info.malloc)
        }
    }
    return 0
}
function ___sys_munmap(addr, len) {
    try {
        return syscallMunmap(addr, len)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_open(path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(path);
        var mode = varargs ? SYSCALLS.get() : 0;
        var stream = FS.open(pathname, flags, mode);
        return stream.fd
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_rmdir(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.rmdir(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_stat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.stat, path, buf)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function ___sys_unlink(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.unlink(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno
    }
}
function _abort() {
    abort()
}
var _emscripten_get_now;
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function() {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6
    }
} else if (typeof dateNow !== "undefined") {
    _emscripten_get_now = dateNow
} else
    _emscripten_get_now = function() {
        return performance.now()
    }
    ;
var _emscripten_get_now_is_monotonic = true;
function _clock_gettime(clk_id, tp) {
    var now;
    if (clk_id === 0) {
        now = Date.now()
    } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
        now = _emscripten_get_now()
    } else {
        setErrNo(28);
        return -1
    }
    HEAP32[tp >> 2] = now / 1e3 | 0;
    HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
    return 0
}
function _dlclose(handle) {
    abort("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking")
}
function _emscripten_set_main_loop_timing(mode, value) {
    Browser.mainLoop.timingMode = mode;
    Browser.mainLoop.timingValue = value;
    if (!Browser.mainLoop.func) {
        return 1
    }
    if (!Browser.mainLoop.running) {
        Browser.mainLoop.running = true
    }
    if (mode == 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
            var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
            setTimeout(Browser.mainLoop.runner, timeUntilNextTick)
        }
        ;
        Browser.mainLoop.method = "timeout"
    } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
            Browser.requestAnimationFrame(Browser.mainLoop.runner)
        }
        ;
        Browser.mainLoop.method = "rAF"
    } else if (mode == 2) {
        if (typeof setImmediate === "undefined") {
            var setImmediates = [];
            var emscriptenMainLoopMessageId = "setimmediate";
            var Browser_setImmediate_messageHandler = function(event) {
                if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                    event.stopPropagation();
                    setImmediates.shift()()
                }
            };
            addEventListener("message", Browser_setImmediate_messageHandler, true);
            setImmediate = function Browser_emulated_setImmediate(func) {
                setImmediates.push(func);
                if (ENVIRONMENT_IS_WORKER) {
                    if (Module["setImmediates"] === undefined)
                        Module["setImmediates"] = [];
                    Module["setImmediates"].push(func);
                    postMessage({
                        target: emscriptenMainLoopMessageId
                    })
                } else
                    postMessage(emscriptenMainLoopMessageId, "*")
            }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
            setImmediate(Browser.mainLoop.runner)
        }
        ;
        Browser.mainLoop.method = "immediate"
    }
    return 0
}
function _exit(status) {
    exit(status)
}
function maybeExit() {
    if (!keepRuntimeAlive()) {
        try {
            _exit(EXITSTATUS)
        } catch (e) {
            if (e instanceof ExitStatus) {
                return
            }
            throw e
        }
    }
}
function setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) {
    assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
    Browser.mainLoop.func = browserIterationFunc;
    Browser.mainLoop.arg = arg;
    var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
    function checkIsRunning() {
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
            maybeExit();
            return false
        }
        return true
    }
    Browser.mainLoop.running = false;
    Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT)
            return;
        if (Browser.mainLoop.queue.length > 0) {
            var start = Date.now();
            var blocker = Browser.mainLoop.queue.shift();
            blocker.func(blocker.arg);
            if (Browser.mainLoop.remainingBlockers) {
                var remaining = Browser.mainLoop.remainingBlockers;
                var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                if (blocker.counted) {
                    Browser.mainLoop.remainingBlockers = next
                } else {
                    next = next + .5;
                    Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9
                }
            }
            console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
            Browser.mainLoop.updateStatus();
            if (!checkIsRunning())
                return;
            setTimeout(Browser.mainLoop.runner, 0);
            return
        }
        if (!checkIsRunning())
            return;
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
            Browser.mainLoop.scheduler();
            return
        } else if (Browser.mainLoop.timingMode == 0) {
            Browser.mainLoop.tickStartTime = _emscripten_get_now()
        }
        Browser.mainLoop.runIter(browserIterationFunc);
        if (!checkIsRunning())
            return;
        if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData)
            SDL.audio.queueNewAudioData();
        Browser.mainLoop.scheduler()
    }
    ;
    if (!noSetTiming) {
        if (fps && fps > 0)
            _emscripten_set_main_loop_timing(0, 1e3 / fps);
        else
            _emscripten_set_main_loop_timing(1, 1);
        Browser.mainLoop.scheduler()
    }
    if (simulateInfiniteLoop) {
        throw "unwind"
    }
}
function callUserCallback(func, synchronous) {
    if (ABORT) {
        return
    }
    if (synchronous) {
        func();
        return
    }
    try {
        func()
    } catch (e) {
        if (e instanceof ExitStatus) {
            return
        } else if (e !== "unwind") {
            if (e && typeof e === "object" && e.stack)
                err("exception thrown: " + [e, e.stack]);
            throw e
        }
    }
}
var Browser = {
    mainLoop: {
        running: false,
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause: function() {
            Browser.mainLoop.scheduler = null;
            Browser.mainLoop.currentlyRunningMainloop++
        },
        resume: function() {
            Browser.mainLoop.currentlyRunningMainloop++;
            var timingMode = Browser.mainLoop.timingMode;
            var timingValue = Browser.mainLoop.timingValue;
            var func = Browser.mainLoop.func;
            Browser.mainLoop.func = null;
            setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
            _emscripten_set_main_loop_timing(timingMode, timingValue);
            Browser.mainLoop.scheduler()
        },
        updateStatus: function() {
            if (Module["setStatus"]) {
                var message = Module["statusMessage"] || "Please wait...";
                var remaining = Browser.mainLoop.remainingBlockers;
                var expected = Browser.mainLoop.expectedBlockers;
                if (remaining) {
                    if (remaining < expected) {
                        Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")")
                    } else {
                        Module["setStatus"](message)
                    }
                } else {
                    Module["setStatus"]("")
                }
            }
        },
        runIter: function(func) {
            if (ABORT)
                return;
            if (Module["preMainLoop"]) {
                var preRet = Module["preMainLoop"]();
                if (preRet === false) {
                    return
                }
            }
            callUserCallback(func);
            if (Module["postMainLoop"])
                Module["postMainLoop"]()
        }
    },
    isFullscreen: false,
    pointerLock: false,
    moduleContextCreatedCallbacks: [],
    workers: [],
    init: function() {
        if (!Module["preloadPlugins"])
            Module["preloadPlugins"] = [];
        if (Browser.initted)
            return;
        Browser.initted = true;
        try {
            new Blob;
            Browser.hasBlobConstructor = true
        } catch (e) {
            Browser.hasBlobConstructor = false;
            console.log("warning: no blob constructor, cannot create blobs with mimetypes")
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
        Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
            console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
            Module.noImageDecoding = true
        }
        var imagePlugin = {};
        imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
            return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name)
        }
        ;
        imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
            var b = null;
            if (Browser.hasBlobConstructor) {
                try {
                    b = new Blob([byteArray],{
                        type: Browser.getMimetype(name)
                    });
                    if (b.size !== byteArray.length) {
                        b = new Blob([new Uint8Array(byteArray).buffer],{
                            type: Browser.getMimetype(name)
                        })
                    }
                } catch (e) {
                    warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder")
                }
            }
            if (!b) {
                var bb = new Browser.BlobBuilder;
                bb.append(new Uint8Array(byteArray).buffer);
                b = bb.getBlob()
            }
            var url = Browser.URLObject.createObjectURL(b);
            var img = new Image;
            img.onload = function img_onload() {
                assert(img.complete, "Image " + name + " could not be decoded");
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                Module["preloadedImages"][name] = canvas;
                Browser.URLObject.revokeObjectURL(url);
                if (onload)
                    onload(byteArray)
            }
            ;
            img.onerror = function img_onerror(event) {
                console.log("Image " + url + " could not be decoded");
                if (onerror)
                    onerror()
            }
            ;
            img.src = url
        }
        ;
        Module["preloadPlugins"].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
            return !Module.noAudioDecoding && name.substr(-4)in {
                ".ogg": 1,
                ".wav": 1,
                ".mp3": 1
            }
        }
        ;
        audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
            var done = false;
            function finish(audio) {
                if (done)
                    return;
                done = true;
                Module["preloadedAudios"][name] = audio;
                if (onload)
                    onload(byteArray)
            }
            function fail() {
                if (done)
                    return;
                done = true;
                Module["preloadedAudios"][name] = new Audio;
                if (onerror)
                    onerror()
            }
            if (Browser.hasBlobConstructor) {
                try {
                    var b = new Blob([byteArray],{
                        type: Browser.getMimetype(name)
                    })
                } catch (e) {
                    return fail()
                }
                var url = Browser.URLObject.createObjectURL(b);
                var audio = new Audio;
                audio.addEventListener("canplaythrough", function() {
                    finish(audio)
                }, false);
                audio.onerror = function audio_onerror(event) {
                    if (done)
                        return;
                    console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
                    function encode64(data) {
                        var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                        var PAD = "=";
                        var ret = "";
                        var leftchar = 0;
                        var leftbits = 0;
                        for (var i = 0; i < data.length; i++) {
                            leftchar = leftchar << 8 | data[i];
                            leftbits += 8;
                            while (leftbits >= 6) {
                                var curr = leftchar >> leftbits - 6 & 63;
                                leftbits -= 6;
                                ret += BASE[curr]
                            }
                        }
                        if (leftbits == 2) {
                            ret += BASE[(leftchar & 3) << 4];
                            ret += PAD + PAD
                        } else if (leftbits == 4) {
                            ret += BASE[(leftchar & 15) << 2];
                            ret += PAD
                        }
                        return ret
                    }
                    audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
                    finish(audio)
                }
                ;
                audio.src = url;
                Browser.safeSetTimeout(function() {
                    finish(audio)
                }, 1e4)
            } else {
                return fail()
            }
        }
        ;
        Module["preloadPlugins"].push(audioPlugin);
        function pointerLockChange() {
            Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"]
        }
        var canvas = Module["canvas"];
        if (canvas) {
            canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function() {}
            ;
            canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function() {}
            ;
            canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
            document.addEventListener("pointerlockchange", pointerLockChange, false);
            document.addEventListener("mozpointerlockchange", pointerLockChange, false);
            document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
            document.addEventListener("mspointerlockchange", pointerLockChange, false);
            if (Module["elementPointerLock"]) {
                canvas.addEventListener("click", function(ev) {
                    if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
                        Module["canvas"].requestPointerLock();
                        ev.preventDefault()
                    }
                }, false)
            }
        }
    },
    createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas)
            return Module.ctx;
        var ctx;
        var contextHandle;
        if (useWebGL) {
            var contextAttributes = {
                antialias: false,
                alpha: false,
                majorVersion: 1
            };
            if (webGLContextAttributes) {
                for (var attribute in webGLContextAttributes) {
                    contextAttributes[attribute] = webGLContextAttributes[attribute]
                }
            }
            if (typeof GL !== "undefined") {
                contextHandle = GL.createContext(canvas, contextAttributes);
                if (contextHandle) {
                    ctx = GL.getContext(contextHandle).GLctx
                }
            }
        } else {
            ctx = canvas.getContext("2d")
        }
        if (!ctx)
            return null;
        if (setInModule) {
            if (!useWebGL)
                assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
            Module.ctx = ctx;
            if (useWebGL)
                GL.makeContextCurrent(contextHandle);
            Module.useWebGL = useWebGL;
            Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
                callback()
            });
            Browser.init()
        }
        return ctx
    },
    destroyContext: function(canvas, useWebGL, setInModule) {},
    fullscreenHandlersInstalled: false,
    lockPointer: undefined,
    resizeCanvas: undefined,
    requestFullscreen: function(lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === "undefined")
            Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === "undefined")
            Browser.resizeCanvas = false;
        var canvas = Module["canvas"];
        function fullscreenChange() {
            Browser.isFullscreen = false;
            var canvasContainer = canvas.parentNode;
            if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                canvas.exitFullscreen = Browser.exitFullscreen;
                if (Browser.lockPointer)
                    canvas.requestPointerLock();
                Browser.isFullscreen = true;
                if (Browser.resizeCanvas) {
                    Browser.setFullscreenCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas)
                }
            } else {
                canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                canvasContainer.parentNode.removeChild(canvasContainer);
                if (Browser.resizeCanvas) {
                    Browser.setWindowedCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas)
                }
            }
            if (Module["onFullScreen"])
                Module["onFullScreen"](Browser.isFullscreen);
            if (Module["onFullscreen"])
                Module["onFullscreen"](Browser.isFullscreen)
        }
        if (!Browser.fullscreenHandlersInstalled) {
            Browser.fullscreenHandlersInstalled = true;
            document.addEventListener("fullscreenchange", fullscreenChange, false);
            document.addEventListener("mozfullscreenchange", fullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
            document.addEventListener("MSFullscreenChange", fullscreenChange, false)
        }
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? function() {
            canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"])
        }
        : null) || (canvasContainer["webkitRequestFullScreen"] ? function() {
            canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"])
        }
        : null);
        canvasContainer.requestFullscreen()
    },
    exitFullscreen: function() {
        if (!Browser.isFullscreen) {
            return false
        }
        var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {}
        ;
        CFS.apply(document, []);
        return true
    },
    nextRAF: 0,
    fakeRequestAnimationFrame: function(func) {
        var now = Date.now();
        if (Browser.nextRAF === 0) {
            Browser.nextRAF = now + 1e3 / 60
        } else {
            while (now + 2 >= Browser.nextRAF) {
                Browser.nextRAF += 1e3 / 60
            }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay)
    },
    requestAnimationFrame: function(func) {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(func);
            return
        }
        var RAF = Browser.fakeRequestAnimationFrame;
        RAF(func)
    },
    safeRequestAnimationFrame: function(func) {
        return Browser.requestAnimationFrame(function() {
            callUserCallback(func)
        })
    },
    safeSetTimeout: function(func, timeout) {
        return setTimeout(function() {
            callUserCallback(func)
        }, timeout)
    },
    getMimetype: function(name) {
        return {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "bmp": "image/bmp",
            "ogg": "audio/ogg",
            "wav": "audio/wav",
            "mp3": "audio/mpeg"
        }[name.substr(name.lastIndexOf(".") + 1)]
    },
    getUserMedia: function(func) {
        if (!window.getUserMedia) {
            window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"]
        }
        window.getUserMedia(func)
    },
    getMovementX: function(event) {
        return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0
    },
    getMovementY: function(event) {
        return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0
    },
    getMouseWheelDelta: function(event) {
        var delta = 0;
        switch (event.type) {
        case "DOMMouseScroll":
            delta = event.detail / 3;
            break;
        case "mousewheel":
            delta = event.wheelDelta / 120;
            break;
        case "wheel":
            delta = event.deltaY;
            switch (event.deltaMode) {
            case 0:
                delta /= 100;
                break;
            case 1:
                delta /= 3;
                break;
            case 2:
                delta *= 80;
                break;
            default:
                throw "unrecognized mouse wheel delta mode: " + event.deltaMode
            }
            break;
        default:
            throw "unrecognized mouse wheel event: " + event.type
        }
        return delta
    },
    mouseX: 0,
    mouseY: 0,
    mouseMovementX: 0,
    mouseMovementY: 0,
    touches: {},
    lastTouches: {},
    calculateMouseEvent: function(event) {
        if (Browser.pointerLock) {
            if (event.type != "mousemove" && "mozMovementX"in event) {
                Browser.mouseMovementX = Browser.mouseMovementY = 0
            } else {
                Browser.mouseMovementX = Browser.getMovementX(event);
                Browser.mouseMovementY = Browser.getMovementY(event)
            }
            if (typeof SDL != "undefined") {
                Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                Browser.mouseY = SDL.mouseY + Browser.mouseMovementY
            } else {
                Browser.mouseX += Browser.mouseMovementX;
                Browser.mouseY += Browser.mouseMovementY
            }
        } else {
            var rect = Module["canvas"].getBoundingClientRect();
            var cw = Module["canvas"].width;
            var ch = Module["canvas"].height;
            var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
            var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
            if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
                var touch = event.touch;
                if (touch === undefined) {
                    return
                }
                var adjustedX = touch.pageX - (scrollX + rect.left);
                var adjustedY = touch.pageY - (scrollY + rect.top);
                adjustedX = adjustedX * (cw / rect.width);
                adjustedY = adjustedY * (ch / rect.height);
                var coords = {
                    x: adjustedX,
                    y: adjustedY
                };
                if (event.type === "touchstart") {
                    Browser.lastTouches[touch.identifier] = coords;
                    Browser.touches[touch.identifier] = coords
                } else if (event.type === "touchend" || event.type === "touchmove") {
                    var last = Browser.touches[touch.identifier];
                    if (!last)
                        last = coords;
                    Browser.lastTouches[touch.identifier] = last;
                    Browser.touches[touch.identifier] = coords
                }
                return
            }
            var x = event.pageX - (scrollX + rect.left);
            var y = event.pageY - (scrollY + rect.top);
            x = x * (cw / rect.width);
            y = y * (ch / rect.height);
            Browser.mouseMovementX = x - Browser.mouseX;
            Browser.mouseMovementY = y - Browser.mouseY;
            Browser.mouseX = x;
            Browser.mouseY = y
        }
    },
    asyncLoad: function(url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
        readAsync(url, function(arrayBuffer) {
            assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
            onload(new Uint8Array(arrayBuffer));
            if (dep)
                removeRunDependency(dep)
        }, function(event) {
            if (onerror) {
                onerror()
            } else {
                throw 'Loading data file "' + url + '" failed.'
            }
        });
        if (dep)
            addRunDependency(dep)
    },
    resizeListeners: [],
    updateResizeListeners: function() {
        var canvas = Module["canvas"];
        Browser.resizeListeners.forEach(function(listener) {
            listener(canvas.width, canvas.height)
        })
    },
    setCanvasSize: function(width, height, noUpdates) {
        var canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates)
            Browser.updateResizeListeners()
    },
    windowedWidth: 0,
    windowedHeight: 0,
    setFullscreenCanvasSize: function() {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags | 8388608;
            HEAP32[SDL.screen >> 2] = flags
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners()
    },
    setWindowedCanvasSize: function() {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags & ~8388608;
            HEAP32[SDL.screen >> 2] = flags
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners()
    },
    updateCanvasDimensions: function(canvas, wNative, hNative) {
        if (wNative && hNative) {
            canvas.widthNative = wNative;
            canvas.heightNative = hNative
        } else {
            wNative = canvas.widthNative;
            hNative = canvas.heightNative
        }
        var w = wNative;
        var h = hNative;
        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
            if (w / h < Module["forcedAspectRatio"]) {
                w = Math.round(h * Module["forcedAspectRatio"])
            } else {
                h = Math.round(w / Module["forcedAspectRatio"])
            }
        }
        if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
            var factor = Math.min(screen.width / w, screen.height / h);
            w = Math.round(w * factor);
            h = Math.round(h * factor)
        }
        if (Browser.resizeCanvas) {
            if (canvas.width != w)
                canvas.width = w;
            if (canvas.height != h)
                canvas.height = h;
            if (typeof canvas.style != "undefined") {
                canvas.style.removeProperty("width");
                canvas.style.removeProperty("height")
            }
        } else {
            if (canvas.width != wNative)
                canvas.width = wNative;
            if (canvas.height != hNative)
                canvas.height = hNative;
            if (typeof canvas.style != "undefined") {
                if (w != wNative || h != hNative) {
                    canvas.style.setProperty("width", w + "px", "important");
                    canvas.style.setProperty("height", h + "px", "important")
                } else {
                    canvas.style.removeProperty("width");
                    canvas.style.removeProperty("height")
                }
            }
        }
    },
    wgetRequests: {},
    nextWgetRequestHandle: 0,
    getNextWgetRequestHandle: function() {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle
    }
};
var EGL = {
    errorCode: 12288,
    defaultDisplayInitialized: false,
    currentContext: 0,
    currentReadSurface: 0,
    currentDrawSurface: 0,
    contextAttributes: {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false
    },
    stringCache: {},
    setErrorCode: function(code) {
        EGL.errorCode = code
    },
    chooseConfig: function(display, attribList, config, config_size, numConfigs) {
        if (display != 62e3) {
            EGL.setErrorCode(12296);
            return 0
        }
        if (attribList) {
            for (; ; ) {
                var param = HEAP32[attribList >> 2];
                if (param == 12321) {
                    var alphaSize = HEAP32[attribList + 4 >> 2];
                    EGL.contextAttributes.alpha = alphaSize > 0
                } else if (param == 12325) {
                    var depthSize = HEAP32[attribList + 4 >> 2];
                    EGL.contextAttributes.depth = depthSize > 0
                } else if (param == 12326) {
                    var stencilSize = HEAP32[attribList + 4 >> 2];
                    EGL.contextAttributes.stencil = stencilSize > 0
                } else if (param == 12337) {
                    var samples = HEAP32[attribList + 4 >> 2];
                    EGL.contextAttributes.antialias = samples > 0
                } else if (param == 12338) {
                    var samples = HEAP32[attribList + 4 >> 2];
                    EGL.contextAttributes.antialias = samples == 1
                } else if (param == 12544) {
                    var requestedPriority = HEAP32[attribList + 4 >> 2];
                    EGL.contextAttributes.lowLatency = requestedPriority != 12547
                } else if (param == 12344) {
                    break
                }
                attribList += 8
            }
        }
        if ((!config || !config_size) && !numConfigs) {
            EGL.setErrorCode(12300);
            return 0
        }
        if (numConfigs) {
            HEAP32[numConfigs >> 2] = 1
        }
        if (config && config_size > 0) {
            HEAP32[config >> 2] = 62002
        }
        EGL.setErrorCode(12288);
        return 1
    }
};
function _eglBindAPI(api) {
    if (api == 12448) {
        EGL.setErrorCode(12288);
        return 1
    } else {
        EGL.setErrorCode(12300);
        return 0
    }
}
function _eglChooseConfig(display, attrib_list, configs, config_size, numConfigs) {
    return EGL.chooseConfig(display, attrib_list, configs, config_size, numConfigs)
}
function __webgl_enable_ANGLE_instanced_arrays(ctx) {
    var ext = ctx.getExtension("ANGLE_instanced_arrays");
    if (ext) {
        ctx["vertexAttribDivisor"] = function(index, divisor) {
            ext["vertexAttribDivisorANGLE"](index, divisor)
        }
        ;
        ctx["drawArraysInstanced"] = function(mode, first, count, primcount) {
            ext["drawArraysInstancedANGLE"](mode, first, count, primcount)
        }
        ;
        ctx["drawElementsInstanced"] = function(mode, count, type, indices, primcount) {
            ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount)
        }
        ;
        return 1
    }
}
function __webgl_enable_OES_vertex_array_object(ctx) {
    var ext = ctx.getExtension("OES_vertex_array_object");
    if (ext) {
        ctx["createVertexArray"] = function() {
            return ext["createVertexArrayOES"]()
        }
        ;
        ctx["deleteVertexArray"] = function(vao) {
            ext["deleteVertexArrayOES"](vao)
        }
        ;
        ctx["bindVertexArray"] = function(vao) {
            ext["bindVertexArrayOES"](vao)
        }
        ;
        ctx["isVertexArray"] = function(vao) {
            return ext["isVertexArrayOES"](vao)
        }
        ;
        return 1
    }
}
function __webgl_enable_WEBGL_draw_buffers(ctx) {
    var ext = ctx.getExtension("WEBGL_draw_buffers");
    if (ext) {
        ctx["drawBuffers"] = function(n, bufs) {
            ext["drawBuffersWEBGL"](n, bufs)
        }
        ;
        return 1
    }
}
function __webgl_enable_WEBGL_multi_draw(ctx) {
    return !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"))
}
var GL = {
    counter: 1,
    buffers: [],
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    shaders: [],
    vaos: [],
    contexts: [],
    offscreenCanvases: {},
    queries: [],
    stringCache: {},
    unpackAlignment: 4,
    recordError: function recordError(errorCode) {
        if (!GL.lastError) {
            GL.lastError = errorCode
        }
    },
    getNewId: function(table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null
        }
        return ret
    },
    getSource: function(shader, count, string, length) {
        var source = "";
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAP32[length + i * 4 >> 2] : -1;
            source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len)
        }
        return source
    },
    createContext: function(canvas, webGLContextAttributes) {
        if (!canvas.getContextSafariWebGL2Fixed) {
            canvas.getContextSafariWebGL2Fixed = canvas.getContext;
            canvas.getContext = function(ver, attrs) {
                var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
                return ver == "webgl" == gl instanceof WebGLRenderingContext ? gl : null
            }
        }
        var ctx = canvas.getContext("webgl", webGLContextAttributes);
        if (!ctx)
            return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle
    },
    registerContext: function(ctx, webGLContextAttributes) {
        var handle = GL.getNewId(GL.contexts);
        var context = {
            handle: handle,
            attributes: webGLContextAttributes,
            version: webGLContextAttributes.majorVersion,
            GLctx: ctx
        };
        if (ctx.canvas)
            ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
            GL.initExtensions(context)
        }
        return handle
    },
    makeContextCurrent: function(contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return !(contextHandle && !GLctx)
    },
    getContext: function(contextHandle) {
        return GL.contexts[contextHandle]
    },
    deleteContext: function(contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle])
            GL.currentContext = null;
        if (typeof JSEvents === "object")
            JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas)
            GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        GL.contexts[contextHandle] = null
    },
    initExtensions: function(context) {
        if (!context)
            context = GL.currentContext;
        if (context.initExtensionsDone)
            return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        __webgl_enable_ANGLE_instanced_arrays(GLctx);
        __webgl_enable_OES_vertex_array_object(GLctx);
        __webgl_enable_WEBGL_draw_buffers(GLctx);
        {
            GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query")
        }
        __webgl_enable_WEBGL_multi_draw(GLctx);
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function(ext) {
            if (!ext.includes("lose_context") && !ext.includes("debug")) {
                GLctx.getExtension(ext)
            }
        })
    }
};
function _eglCreateContext(display, config, hmm, contextAttribs) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0
    }
    var glesContextVersion = 1;
    for (; ; ) {
        var param = HEAP32[contextAttribs >> 2];
        if (param == 12440) {
            glesContextVersion = HEAP32[contextAttribs + 4 >> 2]
        } else if (param == 12344) {
            break
        } else {
            EGL.setErrorCode(12292);
            return 0
        }
        contextAttribs += 8
    }
    if (glesContextVersion != 2) {
        EGL.setErrorCode(12293);
        return 0
    }
    EGL.contextAttributes.majorVersion = glesContextVersion - 1;
    EGL.contextAttributes.minorVersion = 0;
    EGL.context = GL.createContext(Module["canvas"], EGL.contextAttributes);
    if (EGL.context != 0) {
        EGL.setErrorCode(12288);
        GL.makeContextCurrent(EGL.context);
        Module.useWebGL = true;
        Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
            callback()
        });
        GL.makeContextCurrent(null);
        return 62004
    } else {
        EGL.setErrorCode(12297);
        return 0
    }
}
function _eglCreateWindowSurface(display, config, win, attrib_list) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0
    }
    if (config != 62002) {
        EGL.setErrorCode(12293);
        return 0
    }
    EGL.setErrorCode(12288);
    return 62006
}
function _eglDestroyContext(display, context) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0
    }
    if (context != 62004) {
        EGL.setErrorCode(12294);
        return 0
    }
    GL.deleteContext(EGL.context);
    EGL.setErrorCode(12288);
    if (EGL.currentContext == context) {
        EGL.currentContext = 0
    }
    return 1
}
function _eglDestroySurface(display, surface) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0
    }
    if (surface != 62006) {
        EGL.setErrorCode(12301);
        return 1
    }
    if (EGL.currentReadSurface == surface) {
        EGL.currentReadSurface = 0
    }
    if (EGL.currentDrawSurface == surface) {
        EGL.currentDrawSurface = 0
    }
    EGL.setErrorCode(12288);
    return 1
}
function _eglGetConfigAttrib(display, config, attribute, value) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0
    }
    if (config != 62002) {
        EGL.setErrorCode(12293);
        return 0
    }
    if (!value) {
        EGL.setErrorCode(12300);
        return 0
    }
    EGL.setErrorCode(12288);
    switch (attribute) {
    case 12320:
        HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 32 : 24;
        return 1;
    case 12321:
        HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 8 : 0;
        return 1;
    case 12322:
        HEAP32[value >> 2] = 8;
        return 1;
    case 12323:
        HEAP32[value >> 2] = 8;
        return 1;
    case 12324:
        HEAP32[value >> 2] = 8;
        return 1;
    case 12325:
        HEAP32[value >> 2] = EGL.contextAttributes.depth ? 24 : 0;
        return 1;
    case 12326:
        HEAP32[value >> 2] = EGL.contextAttributes.stencil ? 8 : 0;
        return 1;
    case 12327:
        HEAP32[value >> 2] = 12344;
        return 1;
    case 12328:
        HEAP32[value >> 2] = 62002;
        return 1;
    case 12329:
        HEAP32[value >> 2] = 0;
        return 1;
    case 12330:
        HEAP32[value >> 2] = 4096;
        return 1;
    case 12331:
        HEAP32[value >> 2] = 16777216;
        return 1;
    case 12332:
        HEAP32[value >> 2] = 4096;
        return 1;
    case 12333:
        HEAP32[value >> 2] = 0;
        return 1;
    case 12334:
        HEAP32[value >> 2] = 0;
        return 1;
    case 12335:
        HEAP32[value >> 2] = 12344;
        return 1;
    case 12337:
        HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 4 : 0;
        return 1;
    case 12338:
        HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 1 : 0;
        return 1;
    case 12339:
        HEAP32[value >> 2] = 4;
        return 1;
    case 12340:
        HEAP32[value >> 2] = 12344;
        return 1;
    case 12341:
    case 12342:
    case 12343:
        HEAP32[value >> 2] = -1;
        return 1;
    case 12345:
    case 12346:
        HEAP32[value >> 2] = 0;
        return 1;
    case 12347:
        HEAP32[value >> 2] = 0;
        return 1;
    case 12348:
        HEAP32[value >> 2] = 1;
        return 1;
    case 12349:
    case 12350:
        HEAP32[value >> 2] = 0;
        return 1;
    case 12351:
        HEAP32[value >> 2] = 12430;
        return 1;
    case 12352:
        HEAP32[value >> 2] = 4;
        return 1;
    case 12354:
        HEAP32[value >> 2] = 0;
        return 1;
    default:
        EGL.setErrorCode(12292);
        return 0
    }
}
function _eglGetDisplay(nativeDisplayType) {
    EGL.setErrorCode(12288);
    return 62e3
}
function _eglGetError() {
    return EGL.errorCode
}
function _eglInitialize(display, majorVersion, minorVersion) {
    if (display == 62e3) {
        if (majorVersion) {
            HEAP32[majorVersion >> 2] = 1
        }
        if (minorVersion) {
            HEAP32[minorVersion >> 2] = 4
        }
        EGL.defaultDisplayInitialized = true;
        EGL.setErrorCode(12288);
        return 1
    } else {
        EGL.setErrorCode(12296);
        return 0
    }
}
function _eglMakeCurrent(display, draw, read, context) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0
    }
    if (context != 0 && context != 62004) {
        EGL.setErrorCode(12294);
        return 0
    }
    if (read != 0 && read != 62006 || draw != 0 && draw != 62006) {
        EGL.setErrorCode(12301);
        return 0
    }
    GL.makeContextCurrent(context ? EGL.context : null);
    EGL.currentContext = context;
    EGL.currentDrawSurface = draw;
    EGL.currentReadSurface = read;
    EGL.setErrorCode(12288);
    return 1
}
function _eglQueryString(display, name) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0
    }
    EGL.setErrorCode(12288);
    if (EGL.stringCache[name])
        return EGL.stringCache[name];
    var ret;
    switch (name) {
    case 12371:
        ret = allocateUTF8("Emscripten");
        break;
    case 12372:
        ret = allocateUTF8("1.4 Emscripten EGL");
        break;
    case 12373:
        ret = allocateUTF8("");
        break;
    case 12429:
        ret = allocateUTF8("OpenGL_ES");
        break;
    default:
        EGL.setErrorCode(12300);
        return 0
    }
    EGL.stringCache[name] = ret;
    return ret
}
function _eglSwapBuffers() {
    if (!EGL.defaultDisplayInitialized) {
        EGL.setErrorCode(12289)
    } else if (!Module.ctx) {
        EGL.setErrorCode(12290)
    } else if (Module.ctx.isContextLost()) {
        EGL.setErrorCode(12302)
    } else {
        EGL.setErrorCode(12288);
        return 1
    }
    return 0
}
function _eglSwapInterval(display, interval) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0
    }
    if (interval == 0)
        _emscripten_set_main_loop_timing(0, 0);
    else
        _emscripten_set_main_loop_timing(1, interval);
    EGL.setErrorCode(12288);
    return 1
}
function _eglTerminate(display) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0
    }
    EGL.currentContext = 0;
    EGL.currentReadSurface = 0;
    EGL.currentDrawSurface = 0;
    EGL.defaultDisplayInitialized = false;
    EGL.setErrorCode(12288);
    return 1
}
function _eglWaitClient() {
    EGL.setErrorCode(12288);
    return 1
}
function _eglWaitGL() {
    return _eglWaitClient()
}
function _eglWaitNative(nativeEngineId) {
    EGL.setErrorCode(12288);
    return 1
}
var readAsmConstArgsArray = [];
function readAsmConstArgs(sigPtr, buf) {
    readAsmConstArgsArray.length = 0;
    var ch;
    buf >>= 2;
    while (ch = HEAPU8[sigPtr++]) {
        var double = ch < 105;
        if (double && buf & 1)
            buf++;
        readAsmConstArgsArray.push(double ? HEAPF64[buf++ >> 1] : HEAP32[buf]);
        ++buf
    }
    return readAsmConstArgsArray
}
function _emscripten_asm_const_int(code, sigPtr, argbuf) {
    var args = readAsmConstArgs(sigPtr, argbuf);
    return ASM_CONSTS[code].apply(null, args)
}
function _emscripten_async_wget2(url, file, request, param, arg, onload, onerror, onprogress) {
    var _url = UTF8ToString(url);
    var _file = UTF8ToString(file);
    _file = PATH_FS.resolve(_file);
    var _request = UTF8ToString(request);
    var _param = UTF8ToString(param);
    var index = _file.lastIndexOf("/");
    var http = new XMLHttpRequest;
    http.open(_request, _url, true);
    http.responseType = "arraybuffer";
    var handle = Browser.getNextWgetRequestHandle();
    var destinationDirectory = PATH.dirname(_file);
    http.onload = function http_onload(e) {
        if (http.status >= 200 && http.status < 300) {
            try {
                FS.unlink(_file)
            } catch (e) {}
            FS.mkdirTree(destinationDirectory);
            FS.createDataFile(_file.substr(0, index), _file.substr(index + 1), new Uint8Array(http.response), true, true, false);
            if (onload) {
                var stack = stackSave();
                (function(a1, a2, a3) {
                    dynCall_viii.apply(null, [onload, a1, a2, a3])
                }
                )(handle, arg, allocate(intArrayFromString(_file), ALLOC_STACK));
                stackRestore(stack)
            }
        } else {
            if (onerror)
                (function(a1, a2, a3) {
                    dynCall_viii.apply(null, [onerror, a1, a2, a3])
                }
                )(handle, arg, http.status)
        }
        delete Browser.wgetRequests[handle]
    }
    ;
    http.onerror = function http_onerror(e) {
        if (onerror)
            (function(a1, a2, a3) {
                dynCall_viii.apply(null, [onerror, a1, a2, a3])
            }
            )(handle, arg, http.status);
        delete Browser.wgetRequests[handle]
    }
    ;
    http.onprogress = function http_onprogress(e) {
        if (e.lengthComputable || e.lengthComputable === undefined && e.total != 0) {
            var percentComplete = e.loaded / e.total * 100;
            if (onprogress)
                (function(a1, a2, a3) {
                    dynCall_viii.apply(null, [onprogress, a1, a2, a3])
                }
                )(handle, arg, percentComplete)
        }
    }
    ;
    http.onabort = function http_onabort(e) {
        delete Browser.wgetRequests[handle]
    }
    ;
    if (_request == "POST") {
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.send(_param)
    } else {
        http.send(null)
    }
    Browser.wgetRequests[handle] = http;
    return handle
}
var JSEvents = {
    inEventHandler: 0,
    removeAllEventListeners: function() {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
            JSEvents._removeHandler(i)
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = []
    },
    registerRemoveEventListeners: function() {
        if (!JSEvents.removeEventListenersRegistered) {
            __ATEXIT__.push(JSEvents.removeAllEventListeners);
            JSEvents.removeEventListenersRegistered = true
        }
    },
    deferredCalls: [],
    deferCall: function(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length)
                return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i])
                    return false
            }
            return true
        }
        for (var i in JSEvents.deferredCalls) {
            var call = JSEvents.deferredCalls[i];
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return
            }
        }
        JSEvents.deferredCalls.push({
            targetFunction: targetFunction,
            precedence: precedence,
            argsList: argsList
        });
        JSEvents.deferredCalls.sort(function(x, y) {
            return x.precedence < y.precedence
        })
    },
    removeDeferredCalls: function(targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                JSEvents.deferredCalls.splice(i, 1);
                --i
            }
        }
    },
    canPerformEventHandlerRequests: function() {
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
    },
    runDeferredCalls: function() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            var call = JSEvents.deferredCalls[i];
            JSEvents.deferredCalls.splice(i, 1);
            --i;
            call.targetFunction.apply(null, call.argsList)
        }
    },
    eventHandlers: [],
    removeAllHandlersOnTarget: function(target, eventTypeString) {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                JSEvents._removeHandler(i--)
            }
        }
    },
    _removeHandler: function(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1)
    },
    registerOrRemoveHandler: function(eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            JSEvents.runDeferredCalls();
            eventHandler.handlerFunc(event);
            JSEvents.runDeferredCalls();
            --JSEvents.inEventHandler
        };
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = jsEventHandler;
            eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
            JSEvents.eventHandlers.push(eventHandler);
            JSEvents.registerRemoveEventListeners()
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                    JSEvents._removeHandler(i--)
                }
            }
        }
    },
    getNodeNameForTarget: function(target) {
        if (!target)
            return "";
        if (target == window)
            return "#window";
        if (target == screen)
            return "#screen";
        return target && target.nodeName ? target.nodeName : ""
    },
    fullscreenEnabled: function() {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled
    }
};
var currentFullscreenStrategy = {};
function maybeCStringToJsString(cString) {
    return cString > 2 ? UTF8ToString(cString) : cString
}
var specialHTMLTargets = [0, typeof document !== "undefined" ? document : 0, typeof window !== "undefined" ? window : 0];
function findEventTarget(target) {
    target = maybeCStringToJsString(target);
    var domElement = specialHTMLTargets[target] || (typeof document !== "undefined" ? document.querySelector(target) : undefined);
    return domElement
}
function findCanvasEventTarget(target) {
    return findEventTarget(target)
}
function _emscripten_get_canvas_element_size(target, width, height) {
    var canvas = findCanvasEventTarget(target);
    if (!canvas)
        return -4;
    HEAP32[width >> 2] = canvas.width;
    HEAP32[height >> 2] = canvas.height
}
function getCanvasElementSize(target) {
    var stackTop = stackSave();
    var w = stackAlloc(8);
    var h = w + 4;
    var targetInt = stackAlloc(target.id.length + 1);
    stringToUTF8(target.id, targetInt, target.id.length + 1);
    var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
    var size = [HEAP32[w >> 2], HEAP32[h >> 2]];
    stackRestore(stackTop);
    return size
}
function _emscripten_set_canvas_element_size(target, width, height) {
    var canvas = findCanvasEventTarget(target);
    if (!canvas)
        return -4;
    canvas.width = width;
    canvas.height = height;
    return 0
}
function setCanvasElementSize(target, width, height) {
    if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height
    } else {
        var stackTop = stackSave();
        var targetInt = stackAlloc(target.id.length + 1);
        stringToUTF8(target.id, targetInt, target.id.length + 1);
        _emscripten_set_canvas_element_size(targetInt, width, height);
        stackRestore(stackTop)
    }
}
function registerRestoreOldStyle(canvas) {
    var canvasSize = getCanvasElementSize(canvas);
    var oldWidth = canvasSize[0];
    var oldHeight = canvasSize[1];
    var oldCssWidth = canvas.style.width;
    var oldCssHeight = canvas.style.height;
    var oldBackgroundColor = canvas.style.backgroundColor;
    var oldDocumentBackgroundColor = document.body.style.backgroundColor;
    var oldPaddingLeft = canvas.style.paddingLeft;
    var oldPaddingRight = canvas.style.paddingRight;
    var oldPaddingTop = canvas.style.paddingTop;
    var oldPaddingBottom = canvas.style.paddingBottom;
    var oldMarginLeft = canvas.style.marginLeft;
    var oldMarginRight = canvas.style.marginRight;
    var oldMarginTop = canvas.style.marginTop;
    var oldMarginBottom = canvas.style.marginBottom;
    var oldDocumentBodyMargin = document.body.style.margin;
    var oldDocumentOverflow = document.documentElement.style.overflow;
    var oldDocumentScroll = document.body.scroll;
    var oldImageRendering = canvas.style.imageRendering;
    function restoreOldStyle() {
        var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        if (!fullscreenElement) {
            document.removeEventListener("fullscreenchange", restoreOldStyle);
            document.removeEventListener("webkitfullscreenchange", restoreOldStyle);
            setCanvasElementSize(canvas, oldWidth, oldHeight);
            canvas.style.width = oldCssWidth;
            canvas.style.height = oldCssHeight;
            canvas.style.backgroundColor = oldBackgroundColor;
            if (!oldDocumentBackgroundColor)
                document.body.style.backgroundColor = "white";
            document.body.style.backgroundColor = oldDocumentBackgroundColor;
            canvas.style.paddingLeft = oldPaddingLeft;
            canvas.style.paddingRight = oldPaddingRight;
            canvas.style.paddingTop = oldPaddingTop;
            canvas.style.paddingBottom = oldPaddingBottom;
            canvas.style.marginLeft = oldMarginLeft;
            canvas.style.marginRight = oldMarginRight;
            canvas.style.marginTop = oldMarginTop;
            canvas.style.marginBottom = oldMarginBottom;
            document.body.style.margin = oldDocumentBodyMargin;
            document.documentElement.style.overflow = oldDocumentOverflow;
            document.body.scroll = oldDocumentScroll;
            canvas.style.imageRendering = oldImageRendering;
            if (canvas.GLctxObject)
                canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
            if (currentFullscreenStrategy.canvasResizedCallback) {
                (function(a1, a2, a3) {
                    return dynCall_iiii.apply(null, [currentFullscreenStrategy.canvasResizedCallback, a1, a2, a3])
                }
                )(37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData)
            }
        }
    }
    document.addEventListener("fullscreenchange", restoreOldStyle);
    document.addEventListener("webkitfullscreenchange", restoreOldStyle);
    return restoreOldStyle
}
function setLetterbox(element, topBottom, leftRight) {
    element.style.paddingLeft = element.style.paddingRight = leftRight + "px";
    element.style.paddingTop = element.style.paddingBottom = topBottom + "px"
}
function getBoundingClientRect(e) {
    return specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {
        "left": 0,
        "top": 0
    }
}
function _JSEvents_resizeCanvasForFullscreen(target, strategy) {
    var restoreOldStyle = registerRestoreOldStyle(target);
    var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
    var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
    var rect = getBoundingClientRect(target);
    var windowedCssWidth = rect.width;
    var windowedCssHeight = rect.height;
    var canvasSize = getCanvasElementSize(target);
    var windowedRttWidth = canvasSize[0];
    var windowedRttHeight = canvasSize[1];
    if (strategy.scaleMode == 3) {
        setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
        cssWidth = windowedCssWidth;
        cssHeight = windowedCssHeight
    } else if (strategy.scaleMode == 2) {
        if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
            var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
            setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
            cssHeight = desiredCssHeight
        } else {
            var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
            setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
            cssWidth = desiredCssWidth
        }
    }
    if (!target.style.backgroundColor)
        target.style.backgroundColor = "black";
    if (!document.body.style.backgroundColor)
        document.body.style.backgroundColor = "black";
    target.style.width = cssWidth + "px";
    target.style.height = cssHeight + "px";
    if (strategy.filteringMode == 1) {
        target.style.imageRendering = "optimizeSpeed";
        target.style.imageRendering = "-moz-crisp-edges";
        target.style.imageRendering = "-o-crisp-edges";
        target.style.imageRendering = "-webkit-optimize-contrast";
        target.style.imageRendering = "optimize-contrast";
        target.style.imageRendering = "crisp-edges";
        target.style.imageRendering = "pixelated"
    }
    var dpiScale = strategy.canvasResolutionScaleMode == 2 ? devicePixelRatio : 1;
    if (strategy.canvasResolutionScaleMode != 0) {
        var newWidth = cssWidth * dpiScale | 0;
        var newHeight = cssHeight * dpiScale | 0;
        setCanvasElementSize(target, newWidth, newHeight);
        if (target.GLctxObject)
            target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight)
    }
    return restoreOldStyle
}
function _JSEvents_requestFullscreen(target, strategy) {
    if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
        _JSEvents_resizeCanvasForFullscreen(target, strategy)
    }
    if (target.requestFullscreen) {
        target.requestFullscreen()
    } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
    } else {
        return JSEvents.fullscreenEnabled() ? -3 : -1
    }
    currentFullscreenStrategy = strategy;
    if (strategy.canvasResizedCallback) {
        (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [strategy.canvasResizedCallback, a1, a2, a3])
        }
        )(37, 0, strategy.canvasResizedCallbackUserData)
    }
    return 0
}
function _emscripten_exit_fullscreen() {
    if (!JSEvents.fullscreenEnabled())
        return -1;
    JSEvents.removeDeferredCalls(_JSEvents_requestFullscreen);
    var d = specialHTMLTargets[1];
    if (d.exitFullscreen) {
        d.fullscreenElement && d.exitFullscreen()
    } else if (d.webkitExitFullscreen) {
        d.webkitFullscreenElement && d.webkitExitFullscreen()
    } else {
        return -1
    }
    return 0
}
function requestPointerLock(target) {
    if (target.requestPointerLock) {
        target.requestPointerLock()
    } else if (target.msRequestPointerLock) {
        target.msRequestPointerLock()
    } else {
        if (document.body.requestPointerLock || document.body.msRequestPointerLock) {
            return -3
        } else {
            return -1
        }
    }
    return 0
}
function _emscripten_exit_pointerlock() {
    JSEvents.removeDeferredCalls(requestPointerLock);
    if (document.exitPointerLock) {
        document.exitPointerLock()
    } else if (document.msExitPointerLock) {
        document.msExitPointerLock()
    } else {
        return -1
    }
    return 0
}
function _emscripten_get_device_pixel_ratio() {
    return typeof devicePixelRatio === "number" && devicePixelRatio || 1
}
function _emscripten_get_element_css_size(target, width, height) {
    target = findEventTarget(target);
    if (!target)
        return -4;
    var rect = getBoundingClientRect(target);
    HEAPF64[width >> 3] = rect.width;
    HEAPF64[height >> 3] = rect.height;
    return 0
}
function fillGamepadEventData(eventStruct, e) {
    HEAPF64[eventStruct >> 3] = e.timestamp;
    for (var i = 0; i < e.axes.length; ++i) {
        HEAPF64[eventStruct + i * 8 + 16 >> 3] = e.axes[i]
    }
    for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] === "object") {
            HEAPF64[eventStruct + i * 8 + 528 >> 3] = e.buttons[i].value
        } else {
            HEAPF64[eventStruct + i * 8 + 528 >> 3] = e.buttons[i]
        }
    }
    for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] === "object") {
            HEAP32[eventStruct + i * 4 + 1040 >> 2] = e.buttons[i].pressed
        } else {
            HEAP32[eventStruct + i * 4 + 1040 >> 2] = e.buttons[i] == 1
        }
    }
    HEAP32[eventStruct + 1296 >> 2] = e.connected;
    HEAP32[eventStruct + 1300 >> 2] = e.index;
    HEAP32[eventStruct + 8 >> 2] = e.axes.length;
    HEAP32[eventStruct + 12 >> 2] = e.buttons.length;
    stringToUTF8(e.id, eventStruct + 1304, 64);
    stringToUTF8(e.mapping, eventStruct + 1368, 64)
}
function _emscripten_get_gamepad_status(index, gamepadState) {
    if (index < 0 || index >= JSEvents.lastGamepadState.length)
        return -5;
    if (!JSEvents.lastGamepadState[index])
        return -7;
    fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
    return 0
}
function _emscripten_get_num_gamepads() {
    return JSEvents.lastGamepadState.length
}
function _emscripten_get_screen_size(width, height) {
    HEAP32[width >> 2] = screen.width;
    HEAP32[height >> 2] = screen.height
}
function _emscripten_glActiveTexture(x0) {
    GLctx["activeTexture"](x0)
}
function _emscripten_glAttachShader(program, shader) {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader])
}
function _emscripten_glBeginQueryEXT(target, id) {
    GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.queries[id])
}
function _emscripten_glBindAttribLocation(program, index, name) {
    GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name))
}
function _emscripten_glBindBuffer(target, buffer) {
    GLctx.bindBuffer(target, GL.buffers[buffer])
}
function _emscripten_glBindFramebuffer(target, framebuffer) {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
}
function _emscripten_glBindRenderbuffer(target, renderbuffer) {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
}
function _emscripten_glBindTexture(target, texture) {
    GLctx.bindTexture(target, GL.textures[texture])
}
function _emscripten_glBindVertexArrayOES(vao) {
    GLctx["bindVertexArray"](GL.vaos[vao])
}
function _emscripten_glBlendColor(x0, x1, x2, x3) {
    GLctx["blendColor"](x0, x1, x2, x3)
}
function _emscripten_glBlendEquation(x0) {
    GLctx["blendEquation"](x0)
}
function _emscripten_glBlendEquationSeparate(x0, x1) {
    GLctx["blendEquationSeparate"](x0, x1)
}
function _emscripten_glBlendFunc(x0, x1) {
    GLctx["blendFunc"](x0, x1)
}
function _emscripten_glBlendFuncSeparate(x0, x1, x2, x3) {
    GLctx["blendFuncSeparate"](x0, x1, x2, x3)
}
function _emscripten_glBufferData(target, size, data, usage) {
    GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
}
function _emscripten_glBufferSubData(target, offset, size, data) {
    GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size))
}
function _emscripten_glCheckFramebufferStatus(x0) {
    return GLctx["checkFramebufferStatus"](x0)
}
function _emscripten_glClear(x0) {
    GLctx["clear"](x0)
}
function _emscripten_glClearColor(x0, x1, x2, x3) {
    GLctx["clearColor"](x0, x1, x2, x3)
}
function _emscripten_glClearDepthf(x0) {
    GLctx["clearDepth"](x0)
}
function _emscripten_glClearStencil(x0) {
    GLctx["clearStencil"](x0)
}
function _emscripten_glColorMask(red, green, blue, alpha) {
    GLctx.colorMask(!!red, !!green, !!blue, !!alpha)
}
function _emscripten_glCompileShader(shader) {
    GLctx.compileShader(GL.shaders[shader])
}
function _emscripten_glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
    GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null)
}
function _emscripten_glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
    GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null)
}
function _emscripten_glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
    GLctx["copyTexImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
}
function _emscripten_glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
    GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
}
function _emscripten_glCreateProgram() {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
    program.uniformIdCounter = 1;
    GL.programs[id] = program;
    return id
}
function _emscripten_glCreateShader(shaderType) {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id
}
function _emscripten_glCullFace(x0) {
    GLctx["cullFace"](x0)
}
function _emscripten_glDeleteBuffers(n, buffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[buffers + i * 4 >> 2];
        var buffer = GL.buffers[id];
        if (!buffer)
            continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null
    }
}
function _emscripten_glDeleteFramebuffers(n, framebuffers) {
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[framebuffers + i * 4 >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer)
            continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null
    }
}
function _emscripten_glDeleteProgram(id) {
    if (!id)
        return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null
}
function _emscripten_glDeleteQueriesEXT(n, ids) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[ids + i * 4 >> 2];
        var query = GL.queries[id];
        if (!query)
            continue;
        GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
        GL.queries[id] = null
    }
}
function _emscripten_glDeleteRenderbuffers(n, renderbuffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[renderbuffers + i * 4 >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer)
            continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null
    }
}
function _emscripten_glDeleteShader(id) {
    if (!id)
        return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null
}
function _emscripten_glDeleteTextures(n, textures) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[textures + i * 4 >> 2];
        var texture = GL.textures[id];
        if (!texture)
            continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null
    }
}
function _emscripten_glDeleteVertexArraysOES(n, vaos) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[vaos + i * 4 >> 2];
        GLctx["deleteVertexArray"](GL.vaos[id]);
        GL.vaos[id] = null
    }
}
function _emscripten_glDepthFunc(x0) {
    GLctx["depthFunc"](x0)
}
function _emscripten_glDepthMask(flag) {
    GLctx.depthMask(!!flag)
}
function _emscripten_glDepthRangef(x0, x1) {
    GLctx["depthRange"](x0, x1)
}
function _emscripten_glDetachShader(program, shader) {
    GLctx.detachShader(GL.programs[program], GL.shaders[shader])
}
function _emscripten_glDisable(x0) {
    GLctx["disable"](x0)
}
function _emscripten_glDisableVertexAttribArray(index) {
    GLctx.disableVertexAttribArray(index)
}
function _emscripten_glDrawArrays(mode, first, count) {
    GLctx.drawArrays(mode, first, count)
}
function _emscripten_glDrawArraysInstancedANGLE(mode, first, count, primcount) {
    GLctx["drawArraysInstanced"](mode, first, count, primcount)
}
var tempFixedLengthArray = [];
function _emscripten_glDrawBuffersWEBGL(n, bufs) {
    var bufArray = tempFixedLengthArray[n];
    for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[bufs + i * 4 >> 2]
    }
    GLctx["drawBuffers"](bufArray)
}
function _emscripten_glDrawElements(mode, count, type, indices) {
    GLctx.drawElements(mode, count, type, indices)
}
function _emscripten_glDrawElementsInstancedANGLE(mode, count, type, indices, primcount) {
    GLctx["drawElementsInstanced"](mode, count, type, indices, primcount)
}
function _emscripten_glEnable(x0) {
    GLctx["enable"](x0)
}
function _emscripten_glEnableVertexAttribArray(index) {
    GLctx.enableVertexAttribArray(index)
}
function _emscripten_glEndQueryEXT(target) {
    GLctx.disjointTimerQueryExt["endQueryEXT"](target)
}
function _emscripten_glFinish() {
    GLctx["finish"]()
}
function _emscripten_glFlush() {
    GLctx["flush"]()
}
function _emscripten_glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
}
function _emscripten_glFramebufferTexture2D(target, attachment, textarget, texture, level) {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
}
function _emscripten_glFrontFace(x0) {
    GLctx["frontFace"](x0)
}
function __glGenObject(n, buffers, createFunction, objectTable) {
    for (var i = 0; i < n; i++) {
        var buffer = GLctx[createFunction]();
        var id = buffer && GL.getNewId(objectTable);
        if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer
        } else {
            GL.recordError(1282)
        }
        HEAP32[buffers + i * 4 >> 2] = id
    }
}
function _emscripten_glGenBuffers(n, buffers) {
    __glGenObject(n, buffers, "createBuffer", GL.buffers)
}
function _emscripten_glGenFramebuffers(n, ids) {
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
}
function _emscripten_glGenQueriesEXT(n, ids) {
    for (var i = 0; i < n; i++) {
        var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
        if (!query) {
            GL.recordError(1282);
            while (i < n)
                HEAP32[ids + i++ * 4 >> 2] = 0;
            return
        }
        var id = GL.getNewId(GL.queries);
        query.name = id;
        GL.queries[id] = query;
        HEAP32[ids + i * 4 >> 2] = id
    }
}
function _emscripten_glGenRenderbuffers(n, renderbuffers) {
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
}
function _emscripten_glGenTextures(n, textures) {
    __glGenObject(n, textures, "createTexture", GL.textures)
}
function _emscripten_glGenVertexArraysOES(n, arrays) {
    __glGenObject(n, arrays, "createVertexArray", GL.vaos)
}
function _emscripten_glGenerateMipmap(x0) {
    GLctx["generateMipmap"](x0)
}
function __glGetActiveAttribOrUniform(funcName, program, index, bufSize, length, size, type, name) {
    program = GL.programs[program];
    var info = GLctx[funcName](program, index);
    if (info) {
        var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
        if (length)
            HEAP32[length >> 2] = numBytesWrittenExclNull;
        if (size)
            HEAP32[size >> 2] = info.size;
        if (type)
            HEAP32[type >> 2] = info.type
    }
}
function _emscripten_glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
    __glGetActiveAttribOrUniform("getActiveAttrib", program, index, bufSize, length, size, type, name)
}
function _emscripten_glGetActiveUniform(program, index, bufSize, length, size, type, name) {
    __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name)
}
function _emscripten_glGetAttachedShaders(program, maxCount, count, shaders) {
    var result = GLctx.getAttachedShaders(GL.programs[program]);
    var len = result.length;
    if (len > maxCount) {
        len = maxCount
    }
    HEAP32[count >> 2] = len;
    for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[shaders + i * 4 >> 2] = id
    }
}
function _emscripten_glGetAttribLocation(program, name) {
    return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name))
}
function writeI53ToI64(ptr, num) {
    HEAPU32[ptr >> 2] = num;
    HEAPU32[ptr + 4 >> 2] = (num - HEAPU32[ptr >> 2]) / 4294967296
}
function emscriptenWebGLGet(name_, p, type) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    var ret = undefined;
    switch (name_) {
    case 36346:
        ret = 1;
        break;
    case 36344:
        if (type != 0 && type != 1) {
            GL.recordError(1280)
        }
        return;
    case 36345:
        ret = 0;
        break;
    case 34466:
        var formats = GLctx.getParameter(34467);
        ret = formats ? formats.length : 0;
        break
    }
    if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
        case "number":
            ret = result;
            break;
        case "boolean":
            ret = result ? 1 : 0;
            break;
        case "string":
            GL.recordError(1280);
            return;
        case "object":
            if (result === null) {
                switch (name_) {
                case 34964:
                case 35725:
                case 34965:
                case 36006:
                case 36007:
                case 32873:
                case 34229:
                case 34068:
                    {
                        ret = 0;
                        break
                    }
                default:
                    {
                        GL.recordError(1280);
                        return
                    }
                }
            } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                for (var i = 0; i < result.length; ++i) {
                    switch (type) {
                    case 0:
                        HEAP32[p + i * 4 >> 2] = result[i];
                        break;
                    case 2:
                        HEAPF32[p + i * 4 >> 2] = result[i];
                        break;
                    case 4:
                        HEAP8[p + i >> 0] = result[i] ? 1 : 0;
                        break
                    }
                }
                return
            } else {
                try {
                    ret = result.name | 0
                } catch (e) {
                    GL.recordError(1280);
                    err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
                    return
                }
            }
            break;
        default:
            GL.recordError(1280);
            err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
            return
        }
    }
    switch (type) {
    case 1:
        writeI53ToI64(p, ret);
        break;
    case 0:
        HEAP32[p >> 2] = ret;
        break;
    case 2:
        HEAPF32[p >> 2] = ret;
        break;
    case 4:
        HEAP8[p >> 0] = ret ? 1 : 0;
        break
    }
}
function _emscripten_glGetBooleanv(name_, p) {
    emscriptenWebGLGet(name_, p, 4)
}
function _emscripten_glGetBufferParameteriv(target, value, data) {
    if (!data) {
        GL.recordError(1281);
        return
    }
    HEAP32[data >> 2] = GLctx.getBufferParameter(target, value)
}
function _emscripten_glGetError() {
    var error = GLctx.getError() || GL.lastError;
    GL.lastError = 0;
    return error
}
function _emscripten_glGetFloatv(name_, p) {
    emscriptenWebGLGet(name_, p, 2)
}
function _emscripten_glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
    var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
    if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
        result = result.name | 0
    }
    HEAP32[params >> 2] = result
}
function _emscripten_glGetIntegerv(name_, p) {
    emscriptenWebGLGet(name_, p, 0)
}
function _emscripten_glGetProgramInfoLog(program, maxLength, length, infoLog) {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null)
        log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length)
        HEAP32[length >> 2] = numBytesWrittenExclNull
}
function _emscripten_glGetProgramiv(program, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return
    }
    program = GL.programs[program];
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(program);
        if (log === null)
            log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35719) {
        if (!program.maxUniformLength) {
            for (var i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
                program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1)
            }
        }
        HEAP32[p >> 2] = program.maxUniformLength
    } else if (pname == 35722) {
        if (!program.maxAttributeLength) {
            for (var i = 0; i < GLctx.getProgramParameter(program, 35721); ++i) {
                program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1)
            }
        }
        HEAP32[p >> 2] = program.maxAttributeLength
    } else if (pname == 35381) {
        if (!program.maxUniformBlockNameLength) {
            for (var i = 0; i < GLctx.getProgramParameter(program, 35382); ++i) {
                program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1)
            }
        }
        HEAP32[p >> 2] = program.maxUniformBlockNameLength
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname)
    }
}
function _emscripten_glGetQueryObjecti64vEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.queries[id];
    var param;
    {
        param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname)
    }
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    writeI53ToI64(params, ret)
}
function _emscripten_glGetQueryObjectivEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.queries[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    HEAP32[params >> 2] = ret
}
function _emscripten_glGetQueryObjectui64vEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.queries[id];
    var param;
    {
        param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname)
    }
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    writeI53ToI64(params, ret)
}
function _emscripten_glGetQueryObjectuivEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.queries[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    HEAP32[params >> 2] = ret
}
function _emscripten_glGetQueryivEXT(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname)
}
function _emscripten_glGetRenderbufferParameteriv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname)
}
function _emscripten_glGetShaderInfoLog(shader, maxLength, length, infoLog) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null)
        log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length)
        HEAP32[length >> 2] = numBytesWrittenExclNull
}
function _emscripten_glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
    var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
    HEAP32[range >> 2] = result.rangeMin;
    HEAP32[range + 4 >> 2] = result.rangeMax;
    HEAP32[precision >> 2] = result.precision
}
function _emscripten_glGetShaderSource(shader, bufSize, length, source) {
    var result = GLctx.getShaderSource(GL.shaders[shader]);
    if (!result)
        return;
    var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
    if (length)
        HEAP32[length >> 2] = numBytesWrittenExclNull
}
function _emscripten_glGetShaderiv(shader, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null)
            log = "(unknown error)";
        var logLength = log ? log.length + 1 : 0;
        HEAP32[p >> 2] = logLength
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[p >> 2] = sourceLength
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
    }
}
function stringToNewUTF8(jsString) {
    var length = lengthBytesUTF8(jsString) + 1;
    var cString = _malloc(length);
    stringToUTF8(jsString, cString, length);
    return cString
}
function _emscripten_glGetString(name_) {
    var ret = GL.stringCache[name_];
    if (!ret) {
        switch (name_) {
        case 7939:
            var exts = GLctx.getSupportedExtensions() || [];
            exts = exts.concat(exts.map(function(e) {
                return "GL_" + e
            }));
            ret = stringToNewUTF8(exts.join(" "));
            break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
            var s = GLctx.getParameter(name_);
            if (!s) {
                GL.recordError(1280)
            }
            ret = s && stringToNewUTF8(s);
            break;
        case 7938:
            var glVersion = GLctx.getParameter(7938);
            {
                glVersion = "OpenGL ES 2.0 (" + glVersion + ")"
            }
            ret = stringToNewUTF8(glVersion);
            break;
        case 35724:
            var glslVersion = GLctx.getParameter(35724);
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
                if (ver_num[1].length == 3)
                    ver_num[1] = ver_num[1] + "0";
                glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")"
            }
            ret = stringToNewUTF8(glslVersion);
            break;
        default:
            GL.recordError(1280)
        }
        GL.stringCache[name_] = ret
    }
    return ret
}
function _emscripten_glGetTexParameterfv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname)
}
function _emscripten_glGetTexParameteriv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx.getTexParameter(target, pname)
}
function jstoi_q(str) {
    return parseInt(str)
}
function _emscripten_glGetUniformLocation(program, name) {
    function getLeftBracePos(name) {
        return name.slice(-1) == "]" && name.lastIndexOf("[")
    }
    name = UTF8ToString(name);
    program = GL.programs[program];
    var uniformLocsById = program.uniformLocsById;
    var uniformSizeAndIdsByName = program.uniformSizeAndIdsByName;
    var i, j;
    var arrayIndex = 0;
    var uniformBaseName = name;
    var leftBrace = getLeftBracePos(name);
    if (!uniformLocsById) {
        program.uniformLocsById = uniformLocsById = {};
        program.uniformArrayNamesById = {};
        for (i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
            var u = GLctx.getActiveUniform(program, i);
            var nm = u.name;
            var sz = u.size;
            var lb = getLeftBracePos(nm);
            var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
            var id = program.uniformIdCounter;
            program.uniformIdCounter += sz;
            uniformSizeAndIdsByName[arrayName] = [sz, id];
            for (j = 0; j < sz; ++j) {
                uniformLocsById[id] = j;
                program.uniformArrayNamesById[id++] = arrayName
            }
        }
    }
    if (leftBrace > 0) {
        arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
        uniformBaseName = name.slice(0, leftBrace)
    }
    var sizeAndId = uniformSizeAndIdsByName[uniformBaseName];
    if (sizeAndId && arrayIndex < sizeAndId[0]) {
        arrayIndex += sizeAndId[1];
        if (uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name)) {
            return arrayIndex
        }
    }
    return -1
}
function emscriptenWebGLGetUniform(program, location, params, type) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    program = GL.programs[program];
    var data = GLctx.getUniform(program, program.uniformLocsById[location]);
    if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
        case 0:
            HEAP32[params >> 2] = data;
            break;
        case 2:
            HEAPF32[params >> 2] = data;
            break
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
            case 0:
                HEAP32[params + i * 4 >> 2] = data[i];
                break;
            case 2:
                HEAPF32[params + i * 4 >> 2] = data[i];
                break
            }
        }
    }
}
function _emscripten_glGetUniformfv(program, location, params) {
    emscriptenWebGLGetUniform(program, location, params, 2)
}
function _emscripten_glGetUniformiv(program, location, params) {
    emscriptenWebGLGetUniform(program, location, params, 0)
}
function _emscripten_glGetVertexAttribPointerv(index, pname, pointer) {
    if (!pointer) {
        GL.recordError(1281);
        return
    }
    HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname)
}
function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var data = GLctx.getVertexAttrib(index, pname);
    if (pname == 34975) {
        HEAP32[params >> 2] = data && data["name"]
    } else if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
        case 0:
            HEAP32[params >> 2] = data;
            break;
        case 2:
            HEAPF32[params >> 2] = data;
            break;
        case 5:
            HEAP32[params >> 2] = Math.fround(data);
            break
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
            case 0:
                HEAP32[params + i * 4 >> 2] = data[i];
                break;
            case 2:
                HEAPF32[params + i * 4 >> 2] = data[i];
                break;
            case 5:
                HEAP32[params + i * 4 >> 2] = Math.fround(data[i]);
                break
            }
        }
    }
}
function _emscripten_glGetVertexAttribfv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 2)
}
function _emscripten_glGetVertexAttribiv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 5)
}
function _emscripten_glHint(x0, x1) {
    GLctx["hint"](x0, x1)
}
function _emscripten_glIsBuffer(buffer) {
    var b = GL.buffers[buffer];
    if (!b)
        return 0;
    return GLctx.isBuffer(b)
}
function _emscripten_glIsEnabled(x0) {
    return GLctx["isEnabled"](x0)
}
function _emscripten_glIsFramebuffer(framebuffer) {
    var fb = GL.framebuffers[framebuffer];
    if (!fb)
        return 0;
    return GLctx.isFramebuffer(fb)
}
function _emscripten_glIsProgram(program) {
    program = GL.programs[program];
    if (!program)
        return 0;
    return GLctx.isProgram(program)
}
function _emscripten_glIsQueryEXT(id) {
    var query = GL.queries[id];
    if (!query)
        return 0;
    return GLctx.disjointTimerQueryExt["isQueryEXT"](query)
}
function _emscripten_glIsRenderbuffer(renderbuffer) {
    var rb = GL.renderbuffers[renderbuffer];
    if (!rb)
        return 0;
    return GLctx.isRenderbuffer(rb)
}
function _emscripten_glIsShader(shader) {
    var s = GL.shaders[shader];
    if (!s)
        return 0;
    return GLctx.isShader(s)
}
function _emscripten_glIsTexture(id) {
    var texture = GL.textures[id];
    if (!texture)
        return 0;
    return GLctx.isTexture(texture)
}
function _emscripten_glIsVertexArrayOES(array) {
    var vao = GL.vaos[array];
    if (!vao)
        return 0;
    return GLctx["isVertexArray"](vao)
}
function _emscripten_glLineWidth(x0) {
    GLctx["lineWidth"](x0)
}
function _emscripten_glLinkProgram(program) {
    program = GL.programs[program];
    GLctx.linkProgram(program);
    program.uniformLocsById = 0;
    program.uniformSizeAndIdsByName = {}
}
function _emscripten_glPixelStorei(pname, param) {
    if (pname == 3317) {
        GL.unpackAlignment = param
    }
    GLctx.pixelStorei(pname, param)
}
function _emscripten_glPolygonOffset(x0, x1) {
    GLctx["polygonOffset"](x0, x1)
}
function _emscripten_glQueryCounterEXT(id, target) {
    GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.queries[id], target)
}
function computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
    function roundedToNextMultipleOf(x, y) {
        return x + y - 1 & -y
    }
    var plainRowSize = width * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
    return height * alignedRowSize
}
function __colorChannelsInGlTextureFormat(format) {
    var colorChannels = {
        5: 3,
        6: 4,
        8: 2,
        29502: 3,
        29504: 4
    };
    return colorChannels[format - 6402] || 1
}
function heapObjectForWebGLType(type) {
    type -= 5120;
    if (type == 1)
        return HEAPU8;
    if (type == 4)
        return HEAP32;
    if (type == 6)
        return HEAPF32;
    if (type == 5 || type == 28922)
        return HEAPU32;
    return HEAPU16
}
function heapAccessShiftForWebGLHeap(heap) {
    return 31 - Math.clz32(heap.BYTES_PER_ELEMENT)
}
function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
    var heap = heapObjectForWebGLType(type);
    var shift = heapAccessShiftForWebGLHeap(heap);
    var byteSize = 1 << shift;
    var sizePerPixel = __colorChannelsInGlTextureFormat(format) * byteSize;
    var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
    return heap.subarray(pixels >> shift, pixels + bytes >> shift)
}
function _emscripten_glReadPixels(x, y, width, height, format, type, pixels) {
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData)
}
function _emscripten_glReleaseShaderCompiler() {}
function _emscripten_glRenderbufferStorage(x0, x1, x2, x3) {
    GLctx["renderbufferStorage"](x0, x1, x2, x3)
}
function _emscripten_glSampleCoverage(value, invert) {
    GLctx.sampleCoverage(value, !!invert)
}
function _emscripten_glScissor(x0, x1, x2, x3) {
    GLctx["scissor"](x0, x1, x2, x3)
}
function _emscripten_glShaderBinary() {
    GL.recordError(1280)
}
function _emscripten_glShaderSource(shader, count, string, length) {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source)
}
function _emscripten_glStencilFunc(x0, x1, x2) {
    GLctx["stencilFunc"](x0, x1, x2)
}
function _emscripten_glStencilFuncSeparate(x0, x1, x2, x3) {
    GLctx["stencilFuncSeparate"](x0, x1, x2, x3)
}
function _emscripten_glStencilMask(x0) {
    GLctx["stencilMask"](x0)
}
function _emscripten_glStencilMaskSeparate(x0, x1) {
    GLctx["stencilMaskSeparate"](x0, x1)
}
function _emscripten_glStencilOp(x0, x1, x2) {
    GLctx["stencilOp"](x0, x1, x2)
}
function _emscripten_glStencilOpSeparate(x0, x1, x2, x3) {
    GLctx["stencilOpSeparate"](x0, x1, x2, x3)
}
function _emscripten_glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
}
function _emscripten_glTexParameterf(x0, x1, x2) {
    GLctx["texParameterf"](x0, x1, x2)
}
function _emscripten_glTexParameterfv(target, pname, params) {
    var param = HEAPF32[params >> 2];
    GLctx.texParameterf(target, pname, param)
}
function _emscripten_glTexParameteri(x0, x1, x2) {
    GLctx["texParameteri"](x0, x1, x2)
}
function _emscripten_glTexParameteriv(target, pname, params) {
    var param = HEAP32[params >> 2];
    GLctx.texParameteri(target, pname, param)
}
function _emscripten_glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
    var pixelData = null;
    if (pixels)
        pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
}
function webglGetUniformLocation(location) {
    var p = GLctx.currentProgram;
    var webglLoc = p.uniformLocsById[location];
    if (webglLoc >= 0) {
        p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? "[" + webglLoc + "]" : ""))
    }
    return webglLoc
}
function _emscripten_glUniform1f(location, v0) {
    GLctx.uniform1f(webglGetUniformLocation(location), v0)
}
var miniTempWebGLFloatBuffers = [];
function _emscripten_glUniform1fv(location, count, value) {
    if (count <= 288) {
        var view = miniTempWebGLFloatBuffers[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAPF32[value + 4 * i >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2)
    }
    GLctx.uniform1fv(webglGetUniformLocation(location), view)
}
function _emscripten_glUniform1i(location, v0) {
    GLctx.uniform1i(webglGetUniformLocation(location), v0)
}
var __miniTempWebGLIntBuffers = [];
function _emscripten_glUniform1iv(location, count, value) {
    if (count <= 288) {
        var view = __miniTempWebGLIntBuffers[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAP32[value + 4 * i >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 4 >> 2)
    }
    GLctx.uniform1iv(webglGetUniformLocation(location), view)
}
function _emscripten_glUniform2f(location, v0, v1) {
    GLctx.uniform2f(webglGetUniformLocation(location), v0, v1)
}
function _emscripten_glUniform2fv(location, count, value) {
    if (count <= 144) {
        var view = miniTempWebGLFloatBuffers[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2)
    }
    GLctx.uniform2fv(webglGetUniformLocation(location), view)
}
function _emscripten_glUniform2i(location, v0, v1) {
    GLctx.uniform2i(webglGetUniformLocation(location), v0, v1)
}
function _emscripten_glUniform2iv(location, count, value) {
    if (count <= 144) {
        var view = __miniTempWebGLIntBuffers[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
            view[i] = HEAP32[value + 4 * i >> 2];
            view[i + 1] = HEAP32[value + (4 * i + 4) >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 8 >> 2)
    }
    GLctx.uniform2iv(webglGetUniformLocation(location), view)
}
function _emscripten_glUniform3f(location, v0, v1, v2) {
    GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2)
}
function _emscripten_glUniform3fv(location, count, value) {
    if (count <= 96) {
        var view = miniTempWebGLFloatBuffers[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2)
    }
    GLctx.uniform3fv(webglGetUniformLocation(location), view)
}
function _emscripten_glUniform3i(location, v0, v1, v2) {
    GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2)
}
function _emscripten_glUniform3iv(location, count, value) {
    if (count <= 96) {
        var view = __miniTempWebGLIntBuffers[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAP32[value + 4 * i >> 2];
            view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAP32[value + (4 * i + 8) >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 12 >> 2)
    }
    GLctx.uniform3iv(webglGetUniformLocation(location), view)
}
function _emscripten_glUniform4f(location, v0, v1, v2, v3) {
    GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3)
}
function _emscripten_glUniform4fv(location, count, value) {
    if (count <= 72) {
        var view = miniTempWebGLFloatBuffers[4 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i = 0; i < 4 * count; i += 4) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniform4fv(webglGetUniformLocation(location), view)
}
function _emscripten_glUniform4i(location, v0, v1, v2, v3) {
    GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3)
}
function _emscripten_glUniform4iv(location, count, value) {
    if (count <= 72) {
        var view = __miniTempWebGLIntBuffers[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAP32[value + 4 * i >> 2];
            view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAP32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAP32[value + (4 * i + 12) >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniform4iv(webglGetUniformLocation(location), view)
}
function _emscripten_glUniformMatrix2fv(location, count, transpose, value) {
    if (count <= 72) {
        var view = miniTempWebGLFloatBuffers[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, view)
}
function _emscripten_glUniformMatrix3fv(location, count, transpose, value) {
    if (count <= 32) {
        var view = miniTempWebGLFloatBuffers[9 * count - 1];
        for (var i = 0; i < 9 * count; i += 9) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
            view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
            view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
            view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
            view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
            view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2)
    }
    GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view)
}
function _emscripten_glUniformMatrix4fv(location, count, transpose, value) {
    if (count <= 18) {
        var view = miniTempWebGLFloatBuffers[16 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i = 0; i < 16 * count; i += 16) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3];
            view[i + 4] = heap[dst + 4];
            view[i + 5] = heap[dst + 5];
            view[i + 6] = heap[dst + 6];
            view[i + 7] = heap[dst + 7];
            view[i + 8] = heap[dst + 8];
            view[i + 9] = heap[dst + 9];
            view[i + 10] = heap[dst + 10];
            view[i + 11] = heap[dst + 11];
            view[i + 12] = heap[dst + 12];
            view[i + 13] = heap[dst + 13];
            view[i + 14] = heap[dst + 14];
            view[i + 15] = heap[dst + 15]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2)
    }
    GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view)
}
function _emscripten_glUseProgram(program) {
    program = GL.programs[program];
    GLctx.useProgram(program);
    GLctx.currentProgram = program
}
function _emscripten_glValidateProgram(program) {
    GLctx.validateProgram(GL.programs[program])
}
function _emscripten_glVertexAttrib1f(x0, x1) {
    GLctx["vertexAttrib1f"](x0, x1)
}
function _emscripten_glVertexAttrib1fv(index, v) {
    GLctx.vertexAttrib1f(index, HEAPF32[v >> 2])
}
function _emscripten_glVertexAttrib2f(x0, x1, x2) {
    GLctx["vertexAttrib2f"](x0, x1, x2)
}
function _emscripten_glVertexAttrib2fv(index, v) {
    GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2])
}
function _emscripten_glVertexAttrib3f(x0, x1, x2, x3) {
    GLctx["vertexAttrib3f"](x0, x1, x2, x3)
}
function _emscripten_glVertexAttrib3fv(index, v) {
    GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2])
}
function _emscripten_glVertexAttrib4f(x0, x1, x2, x3, x4) {
    GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4)
}
function _emscripten_glVertexAttrib4fv(index, v) {
    GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2], HEAPF32[v + 12 >> 2])
}
function _emscripten_glVertexAttribDivisorANGLE(index, divisor) {
    GLctx["vertexAttribDivisor"](index, divisor)
}
function _emscripten_glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
}
function _emscripten_glViewport(x0, x1, x2, x3) {
    GLctx["viewport"](x0, x1, x2, x3)
}
function _emscripten_has_asyncify() {
    return 1
}
function _longjmp(env, value) {
    _setThrew(env, value || 1);
    throw "longjmp"
}
function _emscripten_longjmp(a0, a1) {
    return _longjmp(a0, a1)
}
function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num)
}
function doRequestFullscreen(target, strategy) {
    if (!JSEvents.fullscreenEnabled())
        return -1;
    target = findEventTarget(target);
    if (!target)
        return -4;
    if (!target.requestFullscreen && !target.webkitRequestFullscreen) {
        return -3
    }
    var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
    if (!canPerformRequests) {
        if (strategy.deferUntilInEventHandler) {
            JSEvents.deferCall(_JSEvents_requestFullscreen, 1, [target, strategy]);
            return 1
        } else {
            return -2
        }
    }
    return _JSEvents_requestFullscreen(target, strategy)
}
function _emscripten_request_fullscreen_strategy(target, deferUntilInEventHandler, fullscreenStrategy) {
    var strategy = {
        scaleMode: HEAP32[fullscreenStrategy >> 2],
        canvasResolutionScaleMode: HEAP32[fullscreenStrategy + 4 >> 2],
        filteringMode: HEAP32[fullscreenStrategy + 8 >> 2],
        deferUntilInEventHandler: deferUntilInEventHandler,
        canvasResizedCallback: HEAP32[fullscreenStrategy + 12 >> 2],
        canvasResizedCallbackUserData: HEAP32[fullscreenStrategy + 16 >> 2]
    };
    return doRequestFullscreen(target, strategy)
}
function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
    target = findEventTarget(target);
    if (!target)
        return -4;
    if (!target.requestPointerLock && !target.msRequestPointerLock) {
        return -1
    }
    var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
    if (!canPerformRequests) {
        if (deferUntilInEventHandler) {
            JSEvents.deferCall(requestPointerLock, 2, [target]);
            return 1
        } else {
            return -2
        }
    }
    return requestPointerLock(target)
}
function emscripten_realloc_buffer(size) {
    try {
        wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1
    } catch (e) {}
}
function _emscripten_resize_heap(requestedSize) {
    var oldSize = HEAPU8.length;
    requestedSize = requestedSize >>> 0;
    var maxHeapSize = 2147483648;
    if (requestedSize > maxHeapSize) {
        return false
    }
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
            return true
        }
    }
    return false
}
function _emscripten_sample_gamepad_data() {
    return (JSEvents.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : null) ? 0 : -1
}
function registerBeforeUnloadEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) {
    var beforeUnloadEventHandlerFunc = function(ev) {
        var e = ev || event;
        var confirmationMessage = function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, 0, userData);
        if (confirmationMessage) {
            confirmationMessage = UTF8ToString(confirmationMessage)
        }
        if (confirmationMessage) {
            e.preventDefault();
            e.returnValue = confirmationMessage;
            return confirmationMessage
        }
    };
    var eventHandler = {
        target: findEventTarget(target),
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: beforeUnloadEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_beforeunload_callback_on_thread(userData, callbackfunc, targetThread) {
    if (typeof onbeforeunload === "undefined")
        return -1;
    if (targetThread !== 1)
        return -5;
    registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, "beforeunload");
    return 0
}
function registerFocusEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.focusEvent)
        JSEvents.focusEvent = _malloc(256);
    var focusEventHandlerFunc = function(ev) {
        var e = ev || event;
        var nodeName = JSEvents.getNodeNameForTarget(e.target);
        var id = e.target.id ? e.target.id : "";
        var focusEvent = JSEvents.focusEvent;
        stringToUTF8(nodeName, focusEvent + 0, 128);
        stringToUTF8(id, focusEvent + 128, 128);
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, focusEvent, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: findEventTarget(target),
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: focusEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_blur_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, "blur", targetThread);
    return 0
}
function _emscripten_set_element_css_size(target, width, height) {
    target = findEventTarget(target);
    if (!target)
        return -4;
    target.style.width = width + "px";
    target.style.height = height + "px";
    return 0
}
function _emscripten_set_focus_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, "focus", targetThread);
    return 0
}
function fillFullscreenChangeEventData(eventStruct) {
    var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    var isFullscreen = !!fullscreenElement;
    HEAP32[eventStruct >> 2] = isFullscreen;
    HEAP32[eventStruct + 4 >> 2] = JSEvents.fullscreenEnabled();
    var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
    var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
    var id = reportedElement && reportedElement.id ? reportedElement.id : "";
    stringToUTF8(nodeName, eventStruct + 8, 128);
    stringToUTF8(id, eventStruct + 136, 128);
    HEAP32[eventStruct + 264 >> 2] = reportedElement ? reportedElement.clientWidth : 0;
    HEAP32[eventStruct + 268 >> 2] = reportedElement ? reportedElement.clientHeight : 0;
    HEAP32[eventStruct + 272 >> 2] = screen.width;
    HEAP32[eventStruct + 276 >> 2] = screen.height;
    if (isFullscreen) {
        JSEvents.previousFullscreenElement = fullscreenElement
    }
}
function registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.fullscreenChangeEvent)
        JSEvents.fullscreenChangeEvent = _malloc(280);
    var fullscreenChangeEventhandlerFunc = function(ev) {
        var e = ev || event;
        var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
        fillFullscreenChangeEventData(fullscreenChangeEvent);
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, fullscreenChangeEvent, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: target,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: fullscreenChangeEventhandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    if (!JSEvents.fullscreenEnabled())
        return -1;
    target = findEventTarget(target);
    if (!target)
        return -4;
    registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
    registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
    return 0
}
function registerGamepadEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.gamepadEvent)
        JSEvents.gamepadEvent = _malloc(1432);
    var gamepadEventHandlerFunc = function(ev) {
        var e = ev || event;
        var gamepadEvent = JSEvents.gamepadEvent;
        fillGamepadEventData(gamepadEvent, e["gamepad"]);
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, gamepadEvent, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: findEventTarget(target),
        allowsDeferredCalls: true,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: gamepadEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_gamepadconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    if (!navigator.getGamepads && !navigator.webkitGetGamepads)
        return -1;
    registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, "gamepadconnected", targetThread);
    return 0
}
function _emscripten_set_gamepaddisconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    if (!navigator.getGamepads && !navigator.webkitGetGamepads)
        return -1;
    registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, "gamepaddisconnected", targetThread);
    return 0
}
function registerKeyEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.keyEvent)
        JSEvents.keyEvent = _malloc(164);
    var keyEventHandlerFunc = function(e) {
        var keyEventData = JSEvents.keyEvent;
        var idx = keyEventData >> 2;
        HEAP32[idx + 0] = e.location;
        HEAP32[idx + 1] = e.ctrlKey;
        HEAP32[idx + 2] = e.shiftKey;
        HEAP32[idx + 3] = e.altKey;
        HEAP32[idx + 4] = e.metaKey;
        HEAP32[idx + 5] = e.repeat;
        HEAP32[idx + 6] = e.charCode;
        HEAP32[idx + 7] = e.keyCode;
        HEAP32[idx + 8] = e.which;
        stringToUTF8(e.key || "", keyEventData + 36, 32);
        stringToUTF8(e.code || "", keyEventData + 68, 32);
        stringToUTF8(e.char || "", keyEventData + 100, 32);
        stringToUTF8(e.locale || "", keyEventData + 132, 32);
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, keyEventData, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: findEventTarget(target),
        allowsDeferredCalls: true,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: keyEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
    return 0
}
function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
    return 0
}
function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
    return 0
}
function fillMouseEventData(eventStruct, e, target) {
    var idx = eventStruct >> 2;
    HEAP32[idx + 0] = e.screenX;
    HEAP32[idx + 1] = e.screenY;
    HEAP32[idx + 2] = e.clientX;
    HEAP32[idx + 3] = e.clientY;
    HEAP32[idx + 4] = e.ctrlKey;
    HEAP32[idx + 5] = e.shiftKey;
    HEAP32[idx + 6] = e.altKey;
    HEAP32[idx + 7] = e.metaKey;
    HEAP16[idx * 2 + 16] = e.button;
    HEAP16[idx * 2 + 17] = e.buttons;
    HEAP32[idx + 9] = e["movementX"];
    HEAP32[idx + 10] = e["movementY"];
    var rect = getBoundingClientRect(target);
    HEAP32[idx + 11] = e.clientX - rect.left;
    HEAP32[idx + 12] = e.clientY - rect.top
}
function registerMouseEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.mouseEvent)
        JSEvents.mouseEvent = _malloc(64);
    target = findEventTarget(target);
    var mouseEventHandlerFunc = function(ev) {
        var e = ev || event;
        fillMouseEventData(JSEvents.mouseEvent, e, target);
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, JSEvents.mouseEvent, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
    return 0
}
function _emscripten_set_mouseenter_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 33, "mouseenter", targetThread);
    return 0
}
function _emscripten_set_mouseleave_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, "mouseleave", targetThread);
    return 0
}
function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
    return 0
}
function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
    return 0
}
function fillPointerlockChangeEventData(eventStruct) {
    var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
    var isPointerlocked = !!pointerLockElement;
    HEAP32[eventStruct >> 2] = isPointerlocked;
    var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
    var id = pointerLockElement && pointerLockElement.id ? pointerLockElement.id : "";
    stringToUTF8(nodeName, eventStruct + 4, 128);
    stringToUTF8(id, eventStruct + 132, 128)
}
function registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.pointerlockChangeEvent)
        JSEvents.pointerlockChangeEvent = _malloc(260);
    var pointerlockChangeEventHandlerFunc = function(ev) {
        var e = ev || event;
        var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
        fillPointerlockChangeEventData(pointerlockChangeEvent);
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, pointerlockChangeEvent, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: target,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: pointerlockChangeEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_pointerlockchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    if (!document || !document.body || !document.body.requestPointerLock && !document.body.mozRequestPointerLock && !document.body.webkitRequestPointerLock && !document.body.msRequestPointerLock) {
        return -1
    }
    target = findEventTarget(target);
    if (!target)
        return -4;
    registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "pointerlockchange", targetThread);
    registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mozpointerlockchange", targetThread);
    registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "webkitpointerlockchange", targetThread);
    registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mspointerlockchange", targetThread);
    return 0
}
function registerUiEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.uiEvent)
        JSEvents.uiEvent = _malloc(36);
    target = findEventTarget(target);
    var uiEventHandlerFunc = function(ev) {
        var e = ev || event;
        if (e.target != target) {
            return
        }
        var b = document.body;
        if (!b) {
            return
        }
        var uiEvent = JSEvents.uiEvent;
        HEAP32[uiEvent >> 2] = e.detail;
        HEAP32[uiEvent + 4 >> 2] = b.clientWidth;
        HEAP32[uiEvent + 8 >> 2] = b.clientHeight;
        HEAP32[uiEvent + 12 >> 2] = innerWidth;
        HEAP32[uiEvent + 16 >> 2] = innerHeight;
        HEAP32[uiEvent + 20 >> 2] = outerWidth;
        HEAP32[uiEvent + 24 >> 2] = outerHeight;
        HEAP32[uiEvent + 28 >> 2] = pageXOffset;
        HEAP32[uiEvent + 32 >> 2] = pageYOffset;
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, uiEvent, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: target,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: uiEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, "resize", targetThread);
    return 0
}
function registerTouchEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.touchEvent)
        JSEvents.touchEvent = _malloc(1684);
    target = findEventTarget(target);
    var touchEventHandlerFunc = function(e) {
        var touches = {};
        var et = e.touches;
        for (var i = 0; i < et.length; ++i) {
            var touch = et[i];
            touches[touch.identifier] = touch
        }
        et = e.changedTouches;
        for (var i = 0; i < et.length; ++i) {
            var touch = et[i];
            touch.isChanged = 1;
            touches[touch.identifier] = touch
        }
        et = e.targetTouches;
        for (var i = 0; i < et.length; ++i) {
            touches[et[i].identifier].onTarget = 1
        }
        var touchEvent = JSEvents.touchEvent;
        var idx = touchEvent >> 2;
        HEAP32[idx + 1] = e.ctrlKey;
        HEAP32[idx + 2] = e.shiftKey;
        HEAP32[idx + 3] = e.altKey;
        HEAP32[idx + 4] = e.metaKey;
        idx += 5;
        var targetRect = getBoundingClientRect(target);
        var numTouches = 0;
        for (var i in touches) {
            var t = touches[i];
            HEAP32[idx + 0] = t.identifier;
            HEAP32[idx + 1] = t.screenX;
            HEAP32[idx + 2] = t.screenY;
            HEAP32[idx + 3] = t.clientX;
            HEAP32[idx + 4] = t.clientY;
            HEAP32[idx + 5] = t.pageX;
            HEAP32[idx + 6] = t.pageY;
            HEAP32[idx + 7] = t.isChanged;
            HEAP32[idx + 8] = t.onTarget;
            HEAP32[idx + 9] = t.clientX - targetRect.left;
            HEAP32[idx + 10] = t.clientY - targetRect.top;
            idx += 13;
            if (++numTouches > 31) {
                break
            }
        }
        HEAP32[touchEvent >> 2] = numTouches;
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, touchEvent, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: touchEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
    return 0
}
function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
    return 0
}
function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
    return 0
}
function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
    return 0
}
function fillVisibilityChangeEventData(eventStruct) {
    var visibilityStates = ["hidden", "visible", "prerender", "unloaded"];
    var visibilityState = visibilityStates.indexOf(document.visibilityState);
    HEAP32[eventStruct >> 2] = document.hidden;
    HEAP32[eventStruct + 4 >> 2] = visibilityState
}
function registerVisibilityChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.visibilityChangeEvent)
        JSEvents.visibilityChangeEvent = _malloc(8);
    var visibilityChangeEventHandlerFunc = function(ev) {
        var e = ev || event;
        var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
        fillVisibilityChangeEventData(visibilityChangeEvent);
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, visibilityChangeEvent, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: target,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: visibilityChangeEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_visibilitychange_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    if (!specialHTMLTargets[1]) {
        return -4
    }
    registerVisibilityChangeEventCallback(specialHTMLTargets[1], userData, useCapture, callbackfunc, 21, "visibilitychange", targetThread);
    return 0
}
function registerWheelEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.wheelEvent)
        JSEvents.wheelEvent = _malloc(96);
    var wheelHandlerFunc = function(ev) {
        var e = ev || event;
        var wheelEvent = JSEvents.wheelEvent;
        fillMouseEventData(wheelEvent, e, target);
        HEAPF64[wheelEvent + 64 >> 3] = e["deltaX"];
        HEAPF64[wheelEvent + 72 >> 3] = e["deltaY"];
        HEAPF64[wheelEvent + 80 >> 3] = e["deltaZ"];
        HEAP32[wheelEvent + 88 >> 2] = e["deltaMode"];
        if (function(a1, a2, a3) {
            return dynCall_iiii.apply(null, [callbackfunc, a1, a2, a3])
        }(eventTypeId, wheelEvent, userData))
            e.preventDefault()
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: true,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: wheelHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = findEventTarget(target);
    if (typeof target.onwheel !== "undefined") {
        registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
        return 0
    } else {
        return -1
    }
}
function _emscripten_set_window_title(title) {
    setWindowTitle(AsciiToString(title))
}
function _emscripten_sleep(ms) {
    Asyncify.handleSleep(function(wakeUp) {
        Browser.safeSetTimeout(wakeUp, ms)
    })
}
function _emscripten_thread_sleep(msecs) {
    var start = _emscripten_get_now();
    while (_emscripten_get_now() - start < msecs) {}
}
var ENV = {};
function getExecutableName() {
    return thisProgram || "./this.program"
}
function getEnvStrings() {
    if (!getEnvStrings.strings) {
        var lang = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
        var env = {
            "USER": "web_user",
            "LOGNAME": "web_user",
            "PATH": "/",
            "PWD": "/",
            "HOME": "/home/web_user",
            "LANG": lang,
            "_": getExecutableName()
        };
        for (var x in ENV) {
            env[x] = ENV[x]
        }
        var strings = [];
        for (var x in env) {
            strings.push(x + "=" + env[x])
        }
        getEnvStrings.strings = strings
    }
    return getEnvStrings.strings
}
function _environ_get(__environ, environ_buf) {
    try {
        var bufSize = 0;
        getEnvStrings().forEach(function(string, i) {
            var ptr = environ_buf + bufSize;
            HEAP32[__environ + i * 4 >> 2] = ptr;
            writeAsciiToMemory(string, ptr);
            bufSize += string.length + 1
        });
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno
    }
}
function _environ_sizes_get(penviron_count, penviron_buf_size) {
    try {
        var strings = getEnvStrings();
        HEAP32[penviron_count >> 2] = strings.length;
        var bufSize = 0;
        strings.forEach(function(string) {
            bufSize += string.length + 1
        });
        HEAP32[penviron_buf_size >> 2] = bufSize;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno
    }
}
function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno
    }
}
function _fd_fdstat_get(fd, pbuf) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
        HEAP8[pbuf >> 0] = type;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno
    }
}
function _fd_read(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doReadv(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno
    }
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return -61
        }
        FS.llseek(stream, offset, whence);
        tempI64 = [stream.position >>> 0, (tempDouble = stream.position,
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[newOffset >> 2] = tempI64[0],
        HEAP32[newOffset + 4 >> 2] = tempI64[1];
        if (stream.getdents && offset === 0 && whence === 0)
            stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno
    }
}
function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno
    }
}
function _getTempRet0() {
    return getTempRet0()
}
function _gettimeofday(ptr) {
    var now = Date.now();
    HEAP32[ptr >> 2] = now / 1e3 | 0;
    HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
    return 0
}
function _setTempRet0(val) {
    setTempRet0(val)
}
function _sigaction(signum, act, oldact) {
    return 0
}
var __sigalrm_handler = 0;
function _signal(sig, func) {
    if (sig == 14) {
        __sigalrm_handler = func
    } else {}
    return 0
}
function __isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}
function __arraySum(array, index) {
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]) {}
    return sum
}
var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function __addDays(date, days) {
    var newDate = new Date(date.getTime());
    while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1)
            } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1)
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate
        }
    }
    return newDate
}
function _strftime(s, maxsize, format, tm) {
    var tm_zone = HEAP32[tm + 40 >> 2];
    var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[tm + 4 >> 2],
        tm_hour: HEAP32[tm + 8 >> 2],
        tm_mday: HEAP32[tm + 12 >> 2],
        tm_mon: HEAP32[tm + 16 >> 2],
        tm_year: HEAP32[tm + 20 >> 2],
        tm_wday: HEAP32[tm + 24 >> 2],
        tm_yday: HEAP32[tm + 28 >> 2],
        tm_isdst: HEAP32[tm + 32 >> 2],
        tm_gmtoff: HEAP32[tm + 36 >> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
    };
    var pattern = UTF8ToString(format);
    var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y"
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule,"g"), EXPANSION_RULES_1[rule])
    }
    var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function leadingSomething(value, digits, character) {
        var str = typeof value === "number" ? value.toString() : value || "";
        while (str.length < digits) {
            str = character[0] + str
        }
        return str
    }
    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0")
    }
    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                compare = sgn(date1.getDate() - date2.getDate())
            }
        }
        return compare
    }
    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
        case 0:
            return new Date(janFourth.getFullYear() - 1,11,29);
        case 1:
            return janFourth;
        case 2:
            return new Date(janFourth.getFullYear(),0,3);
        case 3:
            return new Date(janFourth.getFullYear(),0,2);
        case 4:
            return new Date(janFourth.getFullYear(),0,1);
        case 5:
            return new Date(janFourth.getFullYear() - 1,11,31);
        case 6:
            return new Date(janFourth.getFullYear() - 1,11,30)
        }
    }
    function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900,0,1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(),0,4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1,0,4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1
            } else {
                return thisDate.getFullYear()
            }
        } else {
            return thisDate.getFullYear() - 1
        }
    }
    var EXPANSION_RULES_2 = {
        "%a": function(date) {
            return WEEKDAYS[date.tm_wday].substring(0, 3)
        },
        "%A": function(date) {
            return WEEKDAYS[date.tm_wday]
        },
        "%b": function(date) {
            return MONTHS[date.tm_mon].substring(0, 3)
        },
        "%B": function(date) {
            return MONTHS[date.tm_mon]
        },
        "%C": function(date) {
            var year = date.tm_year + 1900;
            return leadingNulls(year / 100 | 0, 2)
        },
        "%d": function(date) {
            return leadingNulls(date.tm_mday, 2)
        },
        "%e": function(date) {
            return leadingSomething(date.tm_mday, 2, " ")
        },
        "%g": function(date) {
            return getWeekBasedYear(date).toString().substring(2)
        },
        "%G": function(date) {
            return getWeekBasedYear(date)
        },
        "%H": function(date) {
            return leadingNulls(date.tm_hour, 2)
        },
        "%I": function(date) {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0)
                twelveHour = 12;
            else if (twelveHour > 12)
                twelveHour -= 12;
            return leadingNulls(twelveHour, 2)
        },
        "%j": function(date) {
            return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
        },
        "%m": function(date) {
            return leadingNulls(date.tm_mon + 1, 2)
        },
        "%M": function(date) {
            return leadingNulls(date.tm_min, 2)
        },
        "%n": function() {
            return "\n"
        },
        "%p": function(date) {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return "AM"
            } else {
                return "PM"
            }
        },
        "%S": function(date) {
            return leadingNulls(date.tm_sec, 2)
        },
        "%t": function() {
            return "\t"
        },
        "%u": function(date) {
            return date.tm_wday || 7
        },
        "%U": function(date) {
            var janFirst = new Date(date.tm_year + 1900,0,1);
            var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
            var endDate = new Date(date.tm_year + 1900,date.tm_mon,date.tm_mday);
            if (compareByDay(firstSunday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00"
        },
        "%V": function(date) {
            var janFourthThisYear = new Date(date.tm_year + 1900,0,4);
            var janFourthNextYear = new Date(date.tm_year + 1901,0,4);
            var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
            var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
            var endDate = __addDays(new Date(date.tm_year + 1900,0,1), date.tm_yday);
            if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                return "53"
            }
            if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                return "01"
            }
            var daysDifference;
            if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
            } else {
                daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
            }
            return leadingNulls(Math.ceil(daysDifference / 7), 2)
        },
        "%w": function(date) {
            return date.tm_wday
        },
        "%W": function(date) {
            var janFirst = new Date(date.tm_year,0,1);
            var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
            var endDate = new Date(date.tm_year + 1900,date.tm_mon,date.tm_mday);
            if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00"
        },
        "%y": function(date) {
            return (date.tm_year + 1900).toString().substring(2)
        },
        "%Y": function(date) {
            return date.tm_year + 1900
        },
        "%z": function(date) {
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = off / 60 * 100 + off % 60;
            return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
        },
        "%Z": function(date) {
            return date.tm_zone
        },
        "%%": function() {
            return "%"
        }
    };
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.includes(rule)) {
            pattern = pattern.replace(new RegExp(rule,"g"), EXPANSION_RULES_2[rule](date))
        }
    }
    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
        return 0
    }
    writeArrayToMemory(bytes, s);
    return bytes.length - 1
}
function _strftime_l(s, maxsize, format, tm) {
    return _strftime(s, maxsize, format, tm)
}
function _time(ptr) {
    var ret = Date.now() / 1e3 | 0;
    if (ptr) {
        HEAP32[ptr >> 2] = ret
    }
    return ret
}
function runAndAbortIfError(func) {
    try {
        return func()
    } catch (e) {
        abort(e)
    }
}
var Asyncify = {
    State: {
        Normal: 0,
        Unwinding: 1,
        Rewinding: 2
    },
    state: 0,
    StackSize: 4096,
    currData: null,
    handleSleepReturnValue: 0,
    exportCallStack: [],
    callStackNameToId: {},
    callStackIdToName: {},
    callStackId: 0,
    afterUnwind: null,
    asyncFinalizers: [],
    sleepCallbacks: [],
    getCallStackId: function(funcName) {
        var id = Asyncify.callStackNameToId[funcName];
        if (id === undefined) {
            id = Asyncify.callStackId++;
            Asyncify.callStackNameToId[funcName] = id;
            Asyncify.callStackIdToName[id] = funcName
        }
        return id
    },
    instrumentWasmExports: function(exports) {
        var ret = {};
        for (var x in exports) {
            (function(x) {
                var original = exports[x];
                if (typeof original === "function") {
                    ret[x] = function() {
                        Asyncify.exportCallStack.push(x);
                        try {
                            return original.apply(null, arguments)
                        } finally {
                            if (ABORT)
                                return;
                            var y = Asyncify.exportCallStack.pop();
                            assert(y === x);
                            Asyncify.maybeStopUnwind()
                        }
                    }
                } else {
                    ret[x] = original
                }
            }
            )(x)
        }
        return ret
    },
    maybeStopUnwind: function() {
        if (Asyncify.currData && Asyncify.state === Asyncify.State.Unwinding && Asyncify.exportCallStack.length === 0) {
            Asyncify.state = Asyncify.State.Normal;
            runAndAbortIfError(Module["_asyncify_stop_unwind"]);
            if (typeof Fibers !== "undefined") {
                Fibers.trampoline()
            }
            if (Asyncify.afterUnwind) {
                Asyncify.afterUnwind();
                Asyncify.afterUnwind = null
            }
        }
    },
    allocateData: function() {
        var ptr = _malloc(12 + Asyncify.StackSize);
        Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
        Asyncify.setDataRewindFunc(ptr);
        return ptr
    },
    setDataHeader: function(ptr, stack, stackSize) {
        HEAP32[ptr >> 2] = stack;
        HEAP32[ptr + 4 >> 2] = stack + stackSize
    },
    setDataRewindFunc: function(ptr) {
        var bottomOfCallStack = Asyncify.exportCallStack[0];
        var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
        HEAP32[ptr + 8 >> 2] = rewindId
    },
    getDataRewindFunc: function(ptr) {
        var id = HEAP32[ptr + 8 >> 2];
        var name = Asyncify.callStackIdToName[id];
        var func = Module["asm"][name];
        return func
    },
    handleSleep: function(startAsync) {
        if (ABORT)
            return;
        noExitRuntime = true;
        if (Asyncify.state === Asyncify.State.Normal) {
            var reachedCallback = false;
            var reachedAfterCallback = false;
            startAsync(function(handleSleepReturnValue) {
                if (ABORT)
                    return;
                Asyncify.handleSleepReturnValue = handleSleepReturnValue || 0;
                reachedCallback = true;
                if (!reachedAfterCallback) {
                    return
                }
                Asyncify.state = Asyncify.State.Rewinding;
                runAndAbortIfError(function() {
                    Module["_asyncify_start_rewind"](Asyncify.currData)
                });
                if (typeof Browser !== "undefined" && Browser.mainLoop.func) {
                    Browser.mainLoop.resume()
                }
                var start = Asyncify.getDataRewindFunc(Asyncify.currData);
                var asyncWasmReturnValue = start();
                if (!Asyncify.currData) {
                    var asyncFinalizers = Asyncify.asyncFinalizers;
                    Asyncify.asyncFinalizers = [];
                    asyncFinalizers.forEach(function(func) {
                        func(asyncWasmReturnValue)
                    })
                }
            });
            reachedAfterCallback = true;
            if (!reachedCallback) {
                Asyncify.state = Asyncify.State.Unwinding;
                Asyncify.currData = Asyncify.allocateData();
                runAndAbortIfError(function() {
                    Module["_asyncify_start_unwind"](Asyncify.currData)
                });
                if (typeof Browser !== "undefined" && Browser.mainLoop.func) {
                    Browser.mainLoop.pause()
                }
            }
        } else if (Asyncify.state === Asyncify.State.Rewinding) {
            Asyncify.state = Asyncify.State.Normal;
            runAndAbortIfError(Module["_asyncify_stop_rewind"]);
            _free(Asyncify.currData);
            Asyncify.currData = null;
            Asyncify.sleepCallbacks.forEach(function(func) {
                func()
            })
        } else {
            abort("invalid state: " + Asyncify.state)
        }
        return Asyncify.handleSleepReturnValue
    },
    handleAsync: function(startAsync) {
        return Asyncify.handleSleep(function(wakeUp) {
            startAsync().then(wakeUp)
        })
    }
};
var FSNode = function(parent, name, mode, rdev) {
    if (!parent) {
        parent = this
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
    read: {
        get: function() {
            return (this.mode & readMode) === readMode
        },
        set: function(val) {
            val ? this.mode |= readMode : this.mode &= ~readMode
        }
    },
    write: {
        get: function() {
            return (this.mode & writeMode) === writeMode
        },
        set: function(val) {
            val ? this.mode |= writeMode : this.mode &= ~writeMode
        }
    },
    isFolder: {
        get: function() {
            return FS.isDir(this.mode)
        }
    },
    isDevice: {
        get: function() {
            return FS.isChrdev(this.mode)
        }
    }
});
FS.FSNode = FSNode;
FS.staticInit();
Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
    Browser.requestFullscreen(lockPointer, resizeCanvas)
}
;
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
    Browser.requestAnimationFrame(func)
}
;
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
    Browser.setCanvasSize(width, height, noUpdates)
}
;
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
    Browser.mainLoop.pause()
}
;
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
    Browser.mainLoop.resume()
}
;
Module["getUserMedia"] = function Module_getUserMedia() {
    Browser.getUserMedia()
}
;
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
    return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes)
}
;
var GLctx;
for (var i = 0; i < 32; ++i)
    tempFixedLengthArray.push(new Array(i));
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i < 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1)
}
var __miniTempWebGLIntBuffersStorage = new Int32Array(288);
for (var i = 0; i < 288; ++i) {
    __miniTempWebGLIntBuffers[i] = __miniTempWebGLIntBuffersStorage.subarray(0, i + 1)
}
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull)
        u8array.length = numBytesWritten;
    return u8array
}
var asmLibraryArg = {
    "a": ___assert_fail,
    "f": ___cxa_allocate_exception,
    "h": ___cxa_throw,
    "ab": ___gmtime_r,
    "$a": ___localtime_r,
    "lb": ___sys_access,
    "ba": ___sys_fcntl64,
    "ob": ___sys_fstat64,
    "jb": ___sys_ftruncate64,
    "mb": ___sys_getdents64,
    "kb": ___sys_getpid,
    "db": ___sys_ioctl,
    "pb": ___sys_lstat64,
    "qb": ___sys_mkdir,
    "gb": ___sys_mlock,
    "eb": ___sys_mmap2,
    "hb": ___sys_munlock,
    "ib": ___sys_munmap,
    "ea": ___sys_open,
    "bb": ___sys_rmdir,
    "da": ___sys_stat64,
    "cb": ___sys_unlink,
    "g": _abort,
    "s": _clock_gettime,
    "za": _dlclose,
    "Ha": _eglBindAPI,
    "Xa": _eglChooseConfig,
    "Ra": _eglCreateContext,
    "Oa": _eglCreateWindowSurface,
    "Pa": _eglDestroyContext,
    "Na": _eglDestroySurface,
    "Sa": _eglGetConfigAttrib,
    "wb": _eglGetDisplay,
    "Fa": _eglGetError,
    "nb": _eglInitialize,
    "Ma": _eglMakeCurrent,
    "Ga": _eglQueryString,
    "La": _eglSwapBuffers,
    "Ka": _eglSwapInterval,
    "fb": _eglTerminate,
    "Ia": _eglWaitGL,
    "Ja": _eglWaitNative,
    "d": _emscripten_asm_const_int,
    "Qa": _emscripten_async_wget2,
    "Aa": _emscripten_exit_fullscreen,
    "Da": _emscripten_exit_pointerlock,
    "u": _emscripten_get_device_pixel_ratio,
    "n": _emscripten_get_element_css_size,
    "E": _emscripten_get_gamepad_status,
    "ya": _emscripten_get_num_gamepads,
    "Ea": _emscripten_get_screen_size,
    "be": _emscripten_glActiveTexture,
    "ae": _emscripten_glAttachShader,
    "ta": _emscripten_glBeginQueryEXT,
    "$d": _emscripten_glBindAttribLocation,
    "_d": _emscripten_glBindBuffer,
    "Zd": _emscripten_glBindFramebuffer,
    "Yd": _emscripten_glBindRenderbuffer,
    "Xd": _emscripten_glBindTexture,
    "la": _emscripten_glBindVertexArrayOES,
    "Wd": _emscripten_glBlendColor,
    "Vd": _emscripten_glBlendEquation,
    "Ud": _emscripten_glBlendEquationSeparate,
    "Td": _emscripten_glBlendFunc,
    "Sd": _emscripten_glBlendFuncSeparate,
    "Rd": _emscripten_glBufferData,
    "Qd": _emscripten_glBufferSubData,
    "Pd": _emscripten_glCheckFramebufferStatus,
    "Od": _emscripten_glClear,
    "Nd": _emscripten_glClearColor,
    "Md": _emscripten_glClearDepthf,
    "Ld": _emscripten_glClearStencil,
    "Kd": _emscripten_glColorMask,
    "Jd": _emscripten_glCompileShader,
    "Id": _emscripten_glCompressedTexImage2D,
    "Hd": _emscripten_glCompressedTexSubImage2D,
    "Gd": _emscripten_glCopyTexImage2D,
    "Fd": _emscripten_glCopyTexSubImage2D,
    "Ed": _emscripten_glCreateProgram,
    "Dd": _emscripten_glCreateShader,
    "Cd": _emscripten_glCullFace,
    "Bd": _emscripten_glDeleteBuffers,
    "Ad": _emscripten_glDeleteFramebuffers,
    "zd": _emscripten_glDeleteProgram,
    "va": _emscripten_glDeleteQueriesEXT,
    "yd": _emscripten_glDeleteRenderbuffers,
    "xd": _emscripten_glDeleteShader,
    "wd": _emscripten_glDeleteTextures,
    "ka": _emscripten_glDeleteVertexArraysOES,
    "vd": _emscripten_glDepthFunc,
    "ud": _emscripten_glDepthMask,
    "td": _emscripten_glDepthRangef,
    "sd": _emscripten_glDetachShader,
    "rd": _emscripten_glDisable,
    "qd": _emscripten_glDisableVertexAttribArray,
    "pd": _emscripten_glDrawArrays,
    "ee": _emscripten_glDrawArraysInstancedANGLE,
    "ha": _emscripten_glDrawBuffersWEBGL,
    "od": _emscripten_glDrawElements,
    "de": _emscripten_glDrawElementsInstancedANGLE,
    "nd": _emscripten_glEnable,
    "md": _emscripten_glEnableVertexAttribArray,
    "sa": _emscripten_glEndQueryEXT,
    "ld": _emscripten_glFinish,
    "kd": _emscripten_glFlush,
    "jd": _emscripten_glFramebufferRenderbuffer,
    "id": _emscripten_glFramebufferTexture2D,
    "hd": _emscripten_glFrontFace,
    "gd": _emscripten_glGenBuffers,
    "ed": _emscripten_glGenFramebuffers,
    "wa": _emscripten_glGenQueriesEXT,
    "dd": _emscripten_glGenRenderbuffers,
    "cd": _emscripten_glGenTextures,
    "ja": _emscripten_glGenVertexArraysOES,
    "fd": _emscripten_glGenerateMipmap,
    "bd": _emscripten_glGetActiveAttrib,
    "ad": _emscripten_glGetActiveUniform,
    "$c": _emscripten_glGetAttachedShaders,
    "Zc": _emscripten_glGetAttribLocation,
    "Yc": _emscripten_glGetBooleanv,
    "Xc": _emscripten_glGetBufferParameteriv,
    "Wc": _emscripten_glGetError,
    "Vc": _emscripten_glGetFloatv,
    "Uc": _emscripten_glGetFramebufferAttachmentParameteriv,
    "Tc": _emscripten_glGetIntegerv,
    "Rc": _emscripten_glGetProgramInfoLog,
    "Sc": _emscripten_glGetProgramiv,
    "na": _emscripten_glGetQueryObjecti64vEXT,
    "pa": _emscripten_glGetQueryObjectivEXT,
    "ma": _emscripten_glGetQueryObjectui64vEXT,
    "oa": _emscripten_glGetQueryObjectuivEXT,
    "qa": _emscripten_glGetQueryivEXT,
    "Qc": _emscripten_glGetRenderbufferParameteriv,
    "Oc": _emscripten_glGetShaderInfoLog,
    "Nc": _emscripten_glGetShaderPrecisionFormat,
    "Mc": _emscripten_glGetShaderSource,
    "Pc": _emscripten_glGetShaderiv,
    "Lc": _emscripten_glGetString,
    "Kc": _emscripten_glGetTexParameterfv,
    "Jc": _emscripten_glGetTexParameteriv,
    "Gc": _emscripten_glGetUniformLocation,
    "Ic": _emscripten_glGetUniformfv,
    "Hc": _emscripten_glGetUniformiv,
    "Dc": _emscripten_glGetVertexAttribPointerv,
    "Fc": _emscripten_glGetVertexAttribfv,
    "Ec": _emscripten_glGetVertexAttribiv,
    "Cc": _emscripten_glHint,
    "Bc": _emscripten_glIsBuffer,
    "Ac": _emscripten_glIsEnabled,
    "zc": _emscripten_glIsFramebuffer,
    "yc": _emscripten_glIsProgram,
    "ua": _emscripten_glIsQueryEXT,
    "xc": _emscripten_glIsRenderbuffer,
    "wc": _emscripten_glIsShader,
    "uc": _emscripten_glIsTexture,
    "ia": _emscripten_glIsVertexArrayOES,
    "tc": _emscripten_glLineWidth,
    "sc": _emscripten_glLinkProgram,
    "rc": _emscripten_glPixelStorei,
    "qc": _emscripten_glPolygonOffset,
    "ra": _emscripten_glQueryCounterEXT,
    "pc": _emscripten_glReadPixels,
    "oc": _emscripten_glReleaseShaderCompiler,
    "nc": _emscripten_glRenderbufferStorage,
    "mc": _emscripten_glSampleCoverage,
    "lc": _emscripten_glScissor,
    "jc": _emscripten_glShaderBinary,
    "ic": _emscripten_glShaderSource,
    "hc": _emscripten_glStencilFunc,
    "gc": _emscripten_glStencilFuncSeparate,
    "fc": _emscripten_glStencilMask,
    "ec": _emscripten_glStencilMaskSeparate,
    "dc": _emscripten_glStencilOp,
    "cc": _emscripten_glStencilOpSeparate,
    "bc": _emscripten_glTexImage2D,
    "ac": _emscripten_glTexParameterf,
    "$b": _emscripten_glTexParameterfv,
    "_b": _emscripten_glTexParameteri,
    "Zb": _emscripten_glTexParameteriv,
    "Yb": _emscripten_glTexSubImage2D,
    "Xb": _emscripten_glUniform1f,
    "Wb": _emscripten_glUniform1fv,
    "Vb": _emscripten_glUniform1i,
    "Ub": _emscripten_glUniform1iv,
    "Tb": _emscripten_glUniform2f,
    "Sb": _emscripten_glUniform2fv,
    "Rb": _emscripten_glUniform2i,
    "Qb": _emscripten_glUniform2iv,
    "Pb": _emscripten_glUniform3f,
    "Ob": _emscripten_glUniform3fv,
    "Nb": _emscripten_glUniform3i,
    "Mb": _emscripten_glUniform3iv,
    "Lb": _emscripten_glUniform4f,
    "Kb": _emscripten_glUniform4fv,
    "Jb": _emscripten_glUniform4i,
    "Ib": _emscripten_glUniform4iv,
    "Gb": _emscripten_glUniformMatrix2fv,
    "Fb": _emscripten_glUniformMatrix3fv,
    "Eb": _emscripten_glUniformMatrix4fv,
    "Db": _emscripten_glUseProgram,
    "Cb": _emscripten_glValidateProgram,
    "Bb": _emscripten_glVertexAttrib1f,
    "Ab": _emscripten_glVertexAttrib1fv,
    "zb": _emscripten_glVertexAttrib2f,
    "yb": _emscripten_glVertexAttrib2fv,
    "xb": _emscripten_glVertexAttrib3f,
    "vb": _emscripten_glVertexAttrib3fv,
    "ub": _emscripten_glVertexAttrib4f,
    "tb": _emscripten_glVertexAttrib4fv,
    "ce": _emscripten_glVertexAttribDivisorANGLE,
    "sb": _emscripten_glVertexAttribPointer,
    "rb": _emscripten_glViewport,
    "x": _emscripten_has_asyncify,
    "i": _emscripten_longjmp,
    "Ua": _emscripten_memcpy_big,
    "Ba": _emscripten_request_fullscreen_strategy,
    "aa": _emscripten_request_pointerlock,
    "Va": _emscripten_resize_heap,
    "F": _emscripten_sample_gamepad_data,
    "H": _emscripten_set_beforeunload_callback_on_thread,
    "T": _emscripten_set_blur_callback_on_thread,
    "q": _emscripten_set_canvas_element_size,
    "w": _emscripten_set_element_css_size,
    "U": _emscripten_set_focus_callback_on_thread,
    "K": _emscripten_set_fullscreenchange_callback_on_thread,
    "D": _emscripten_set_gamepadconnected_callback_on_thread,
    "C": _emscripten_set_gamepaddisconnected_callback_on_thread,
    "N": _emscripten_set_keydown_callback_on_thread,
    "L": _emscripten_set_keypress_callback_on_thread,
    "M": _emscripten_set_keyup_callback_on_thread,
    "Z": _emscripten_set_mousedown_callback_on_thread,
    "X": _emscripten_set_mouseenter_callback_on_thread,
    "W": _emscripten_set_mouseleave_callback_on_thread,
    "$": _emscripten_set_mousemove_callback_on_thread,
    "Y": _emscripten_set_mouseup_callback_on_thread,
    "O": _emscripten_set_pointerlockchange_callback_on_thread,
    "J": _emscripten_set_resize_callback_on_thread,
    "P": _emscripten_set_touchcancel_callback_on_thread,
    "R": _emscripten_set_touchend_callback_on_thread,
    "Q": _emscripten_set_touchmove_callback_on_thread,
    "S": _emscripten_set_touchstart_callback_on_thread,
    "I": _emscripten_set_visibilitychange_callback_on_thread,
    "V": _emscripten_set_wheel_callback_on_thread,
    "Ca": _emscripten_set_window_title,
    "r": _emscripten_sleep,
    "_a": _emscripten_thread_sleep,
    "Ya": _environ_get,
    "Za": _environ_sizes_get,
    "t": _exit,
    "v": _fd_close,
    "Wa": _fd_fdstat_get,
    "ca": _fd_read,
    "Ta": _fd_seek,
    "y": _fd_write,
    "c": _getTempRet0,
    "p": _gettimeofday,
    "xa": _gmtime_r,
    "A": invoke_ii,
    "B": invoke_iii,
    "ga": invoke_iiii,
    "G": invoke_iiiii,
    "_c": invoke_iiiiiiiiii,
    "o": invoke_vi,
    "k": invoke_vii,
    "l": invoke_viii,
    "vc": invoke_viiii,
    "z": invoke_viiiii,
    "fa": invoke_viiiiii,
    "kc": invoke_viiiiiiiii,
    "b": _setTempRet0,
    "m": _sigaction,
    "Hb": _signal,
    "_": _strftime,
    "e": _strftime_l,
    "j": _time
};
var asm = createWasm();
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
    return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["ge"]).apply(null, arguments)
}
;
var _main = Module["_main"] = function() {
    return (_main = Module["_main"] = Module["asm"]["he"]).apply(null, arguments)
}
;
var _memset = Module["_memset"] = function() {
    return (_memset = Module["_memset"] = Module["asm"]["je"]).apply(null, arguments)
}
;
var ___errno_location = Module["___errno_location"] = function() {
    return (___errno_location = Module["___errno_location"] = Module["asm"]["ke"]).apply(null, arguments)
}
;
var _malloc = Module["_malloc"] = function() {
    return (_malloc = Module["_malloc"] = Module["asm"]["le"]).apply(null, arguments)
}
;
var _free = Module["_free"] = function() {
    return (_free = Module["_free"] = Module["asm"]["me"]).apply(null, arguments)
}
;
var _xmp_create_context = Module["_xmp_create_context"] = function() {
    return (_xmp_create_context = Module["_xmp_create_context"] = Module["asm"]["ne"]).apply(null, arguments)
}
;
var _xmp_end_player = Module["_xmp_end_player"] = function() {
    return (_xmp_end_player = Module["_xmp_end_player"] = Module["asm"]["oe"]).apply(null, arguments)
}
;
var _xmp_release_module = Module["_xmp_release_module"] = function() {
    return (_xmp_release_module = Module["_xmp_release_module"] = Module["asm"]["pe"]).apply(null, arguments)
}
;
var _xmp_free_context = Module["_xmp_free_context"] = function() {
    return (_xmp_free_context = Module["_xmp_free_context"] = Module["asm"]["qe"]).apply(null, arguments)
}
;
var _xmp_load_module_from_callbacks = Module["_xmp_load_module_from_callbacks"] = function() {
    return (_xmp_load_module_from_callbacks = Module["_xmp_load_module_from_callbacks"] = Module["asm"]["re"]).apply(null, arguments)
}
;
var _xmp_start_player = Module["_xmp_start_player"] = function() {
    return (_xmp_start_player = Module["_xmp_start_player"] = Module["asm"]["se"]).apply(null, arguments)
}
;
var _xmp_set_player = Module["_xmp_set_player"] = function() {
    return (_xmp_set_player = Module["_xmp_set_player"] = Module["asm"]["te"]).apply(null, arguments)
}
;
var _xmp_restart_module = Module["_xmp_restart_module"] = function() {
    return (_xmp_restart_module = Module["_xmp_restart_module"] = Module["asm"]["ue"]).apply(null, arguments)
}
;
var _xmp_get_frame_info = Module["_xmp_get_frame_info"] = function() {
    return (_xmp_get_frame_info = Module["_xmp_get_frame_info"] = Module["asm"]["ve"]).apply(null, arguments)
}
;
var _xmp_test_module_from_callbacks = Module["_xmp_test_module_from_callbacks"] = function() {
    return (_xmp_test_module_from_callbacks = Module["_xmp_test_module_from_callbacks"] = Module["asm"]["we"]).apply(null, arguments)
}
;
var _xmp_play_buffer = Module["_xmp_play_buffer"] = function() {
    return (_xmp_play_buffer = Module["_xmp_play_buffer"] = Module["asm"]["xe"]).apply(null, arguments)
}
;
var _xmp_play_frame = Module["_xmp_play_frame"] = function() {
    return (_xmp_play_frame = Module["_xmp_play_frame"] = Module["asm"]["ye"]).apply(null, arguments)
}
;
var _xmp_get_module_info = Module["_xmp_get_module_info"] = function() {
    return (_xmp_get_module_info = Module["_xmp_get_module_info"] = Module["asm"]["ze"]).apply(null, arguments)
}
;
var _xmp_next_position = Module["_xmp_next_position"] = function() {
    return (_xmp_next_position = Module["_xmp_next_position"] = Module["asm"]["Ae"]).apply(null, arguments)
}
;
var _xmp_prev_position = Module["_xmp_prev_position"] = function() {
    return (_xmp_prev_position = Module["_xmp_prev_position"] = Module["asm"]["Be"]).apply(null, arguments)
}
;
var _xmp_set_position = Module["_xmp_set_position"] = function() {
    return (_xmp_set_position = Module["_xmp_set_position"] = Module["asm"]["Ce"]).apply(null, arguments)
}
;
var _xmp_set_row = Module["_xmp_set_row"] = function() {
    return (_xmp_set_row = Module["_xmp_set_row"] = Module["asm"]["De"]).apply(null, arguments)
}
;
var _xmp_stop_module = Module["_xmp_stop_module"] = function() {
    return (_xmp_stop_module = Module["_xmp_stop_module"] = Module["asm"]["Ee"]).apply(null, arguments)
}
;
var _xmp_seek_time = Module["_xmp_seek_time"] = function() {
    return (_xmp_seek_time = Module["_xmp_seek_time"] = Module["asm"]["Fe"]).apply(null, arguments)
}
;
var _xmp_channel_mute = Module["_xmp_channel_mute"] = function() {
    return (_xmp_channel_mute = Module["_xmp_channel_mute"] = Module["asm"]["Ge"]).apply(null, arguments)
}
;
var _xmp_channel_vol = Module["_xmp_channel_vol"] = function() {
    return (_xmp_channel_vol = Module["_xmp_channel_vol"] = Module["asm"]["He"]).apply(null, arguments)
}
;
var _xmp_get_player = Module["_xmp_get_player"] = function() {
    return (_xmp_get_player = Module["_xmp_get_player"] = Module["asm"]["Ie"]).apply(null, arguments)
}
;
var _xmp_get_format_list = Module["_xmp_get_format_list"] = function() {
    return (_xmp_get_format_list = Module["_xmp_get_format_list"] = Module["asm"]["Je"]).apply(null, arguments)
}
;
var _xmp_inject_event = Module["_xmp_inject_event"] = function() {
    return (_xmp_inject_event = Module["_xmp_inject_event"] = Module["asm"]["Ke"]).apply(null, arguments)
}
;
var _xmp_set_instrument_path = Module["_xmp_set_instrument_path"] = function() {
    return (_xmp_set_instrument_path = Module["_xmp_set_instrument_path"] = Module["asm"]["Le"]).apply(null, arguments)
}
;
var _xmp_set_tempo_factor = Module["_xmp_set_tempo_factor"] = function() {
    return (_xmp_set_tempo_factor = Module["_xmp_set_tempo_factor"] = Module["asm"]["Me"]).apply(null, arguments)
}
;
var _xmp_test_module = Module["_xmp_test_module"] = function() {
    return (_xmp_test_module = Module["_xmp_test_module"] = Module["asm"]["Ne"]).apply(null, arguments)
}
;
var _xmp_test_module_from_memory = Module["_xmp_test_module_from_memory"] = function() {
    return (_xmp_test_module_from_memory = Module["_xmp_test_module_from_memory"] = Module["asm"]["Oe"]).apply(null, arguments)
}
;
var _xmp_test_module_from_file = Module["_xmp_test_module_from_file"] = function() {
    return (_xmp_test_module_from_file = Module["_xmp_test_module_from_file"] = Module["asm"]["Pe"]).apply(null, arguments)
}
;
var _xmp_load_module = Module["_xmp_load_module"] = function() {
    return (_xmp_load_module = Module["_xmp_load_module"] = Module["asm"]["Qe"]).apply(null, arguments)
}
;
var _xmp_load_module_from_memory = Module["_xmp_load_module_from_memory"] = function() {
    return (_xmp_load_module_from_memory = Module["_xmp_load_module_from_memory"] = Module["asm"]["Re"]).apply(null, arguments)
}
;
var _xmp_load_module_from_file = Module["_xmp_load_module_from_file"] = function() {
    return (_xmp_load_module_from_file = Module["_xmp_load_module_from_file"] = Module["asm"]["Se"]).apply(null, arguments)
}
;
var _xmp_scan_module = Module["_xmp_scan_module"] = function() {
    return (_xmp_scan_module = Module["_xmp_scan_module"] = Module["asm"]["Te"]).apply(null, arguments)
}
;
var _xmp_start_smix = Module["_xmp_start_smix"] = function() {
    return (_xmp_start_smix = Module["_xmp_start_smix"] = Module["asm"]["Ue"]).apply(null, arguments)
}
;
var _xmp_smix_play_instrument = Module["_xmp_smix_play_instrument"] = function() {
    return (_xmp_smix_play_instrument = Module["_xmp_smix_play_instrument"] = Module["asm"]["Ve"]).apply(null, arguments)
}
;
var _xmp_smix_play_sample = Module["_xmp_smix_play_sample"] = function() {
    return (_xmp_smix_play_sample = Module["_xmp_smix_play_sample"] = Module["asm"]["We"]).apply(null, arguments)
}
;
var _xmp_smix_channel_pan = Module["_xmp_smix_channel_pan"] = function() {
    return (_xmp_smix_channel_pan = Module["_xmp_smix_channel_pan"] = Module["asm"]["Xe"]).apply(null, arguments)
}
;
var _xmp_smix_load_sample = Module["_xmp_smix_load_sample"] = function() {
    return (_xmp_smix_load_sample = Module["_xmp_smix_load_sample"] = Module["asm"]["Ye"]).apply(null, arguments)
}
;
var _xmp_smix_release_sample = Module["_xmp_smix_release_sample"] = function() {
    return (_xmp_smix_release_sample = Module["_xmp_smix_release_sample"] = Module["asm"]["Ze"]).apply(null, arguments)
}
;
var _xmp_end_smix = Module["_xmp_end_smix"] = function() {
    return (_xmp_end_smix = Module["_xmp_end_smix"] = Module["asm"]["_e"]).apply(null, arguments)
}
;
var __get_tzname = Module["__get_tzname"] = function() {
    return (__get_tzname = Module["__get_tzname"] = Module["asm"]["$e"]).apply(null, arguments)
}
;
var __get_daylight = Module["__get_daylight"] = function() {
    return (__get_daylight = Module["__get_daylight"] = Module["asm"]["af"]).apply(null, arguments)
}
;
var __get_timezone = Module["__get_timezone"] = function() {
    return (__get_timezone = Module["__get_timezone"] = Module["asm"]["bf"]).apply(null, arguments)
}
;
var stackSave = Module["stackSave"] = function() {
    return (stackSave = Module["stackSave"] = Module["asm"]["cf"]).apply(null, arguments)
}
;
var stackRestore = Module["stackRestore"] = function() {
    return (stackRestore = Module["stackRestore"] = Module["asm"]["df"]).apply(null, arguments)
}
;
var stackAlloc = Module["stackAlloc"] = function() {
    return (stackAlloc = Module["stackAlloc"] = Module["asm"]["ef"]).apply(null, arguments)
}
;
var _setThrew = Module["_setThrew"] = function() {
    return (_setThrew = Module["_setThrew"] = Module["asm"]["ff"]).apply(null, arguments)
}
;
var _memalign = Module["_memalign"] = function() {
    return (_memalign = Module["_memalign"] = Module["asm"]["gf"]).apply(null, arguments)
}
;
var dynCall_vi = Module["dynCall_vi"] = function() {
    return (dynCall_vi = Module["dynCall_vi"] = Module["asm"]["hf"]).apply(null, arguments)
}
;
var dynCall_ii = Module["dynCall_ii"] = function() {
    return (dynCall_ii = Module["dynCall_ii"] = Module["asm"]["jf"]).apply(null, arguments)
}
;
var dynCall_v = Module["dynCall_v"] = function() {
    return (dynCall_v = Module["dynCall_v"] = Module["asm"]["kf"]).apply(null, arguments)
}
;
var dynCall_iii = Module["dynCall_iii"] = function() {
    return (dynCall_iii = Module["dynCall_iii"] = Module["asm"]["lf"]).apply(null, arguments)
}
;
var dynCall_viii = Module["dynCall_viii"] = function() {
    return (dynCall_viii = Module["dynCall_viii"] = Module["asm"]["mf"]).apply(null, arguments)
}
;
var dynCall_vii = Module["dynCall_vii"] = function() {
    return (dynCall_vii = Module["dynCall_vii"] = Module["asm"]["nf"]).apply(null, arguments)
}
;
var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
    return (dynCall_viiiii = Module["dynCall_viiiii"] = Module["asm"]["of"]).apply(null, arguments)
}
;
var dynCall_viiii = Module["dynCall_viiii"] = function() {
    return (dynCall_viiii = Module["dynCall_viiii"] = Module["asm"]["pf"]).apply(null, arguments)
}
;
var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
    return (dynCall_iiiiii = Module["dynCall_iiiiii"] = Module["asm"]["qf"]).apply(null, arguments)
}
;
var dynCall_iiii = Module["dynCall_iiii"] = function() {
    return (dynCall_iiii = Module["dynCall_iiii"] = Module["asm"]["rf"]).apply(null, arguments)
}
;
var dynCall_fii = Module["dynCall_fii"] = function() {
    return (dynCall_fii = Module["dynCall_fii"] = Module["asm"]["sf"]).apply(null, arguments)
}
;
var dynCall_jii = Module["dynCall_jii"] = function() {
    return (dynCall_jii = Module["dynCall_jii"] = Module["asm"]["tf"]).apply(null, arguments)
}
;
var dynCall_viijii = Module["dynCall_viijii"] = function() {
    return (dynCall_viijii = Module["dynCall_viijii"] = Module["asm"]["uf"]).apply(null, arguments)
}
;
var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
    return (dynCall_iiiii = Module["dynCall_iiiii"] = Module["asm"]["vf"]).apply(null, arguments)
}
;
var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = function() {
    return (dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = Module["asm"]["wf"]).apply(null, arguments)
}
;
var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
    return (dynCall_viiiiii = Module["dynCall_viiiiii"] = Module["asm"]["xf"]).apply(null, arguments)
}
;
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = function() {
    return (dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = Module["asm"]["yf"]).apply(null, arguments)
}
;
var dynCall_iiji = Module["dynCall_iiji"] = function() {
    return (dynCall_iiji = Module["dynCall_iiji"] = Module["asm"]["zf"]).apply(null, arguments)
}
;
var dynCall_ji = Module["dynCall_ji"] = function() {
    return (dynCall_ji = Module["dynCall_ji"] = Module["asm"]["Af"]).apply(null, arguments)
}
;
var dynCall_vij = Module["dynCall_vij"] = function() {
    return (dynCall_vij = Module["dynCall_vij"] = Module["asm"]["Bf"]).apply(null, arguments)
}
;
var dynCall_viij = Module["dynCall_viij"] = function() {
    return (dynCall_viij = Module["dynCall_viij"] = Module["asm"]["Cf"]).apply(null, arguments)
}
;
var dynCall_jjii = Module["dynCall_jjii"] = function() {
    return (dynCall_jjii = Module["dynCall_jjii"] = Module["asm"]["Df"]).apply(null, arguments)
}
;
var dynCall_jiji = Module["dynCall_jiji"] = function() {
    return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["Ef"]).apply(null, arguments)
}
;
var dynCall_iiiifii = Module["dynCall_iiiifii"] = function() {
    return (dynCall_iiiifii = Module["dynCall_iiiifii"] = Module["asm"]["Ff"]).apply(null, arguments)
}
;
var dynCall_vif = Module["dynCall_vif"] = function() {
    return (dynCall_vif = Module["dynCall_vif"] = Module["asm"]["Gf"]).apply(null, arguments)
}
;
var dynCall_viif = Module["dynCall_viif"] = function() {
    return (dynCall_viif = Module["dynCall_viif"] = Module["asm"]["Hf"]).apply(null, arguments)
}
;
var dynCall_viff = Module["dynCall_viff"] = function() {
    return (dynCall_viff = Module["dynCall_viff"] = Module["asm"]["If"]).apply(null, arguments)
}
;
var dynCall_iiiiif = Module["dynCall_iiiiif"] = function() {
    return (dynCall_iiiiif = Module["dynCall_iiiiif"] = Module["asm"]["Jf"]).apply(null, arguments)
}
;
var dynCall_iiiiiidii = Module["dynCall_iiiiiidii"] = function() {
    return (dynCall_iiiiiidii = Module["dynCall_iiiiiidii"] = Module["asm"]["Kf"]).apply(null, arguments)
}
;
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function() {
    return (dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = Module["asm"]["Lf"]).apply(null, arguments)
}
;
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function() {
    return (dynCall_viiiiiii = Module["dynCall_viiiiiii"] = Module["asm"]["Mf"]).apply(null, arguments)
}
;
var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = function() {
    return (dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = Module["asm"]["Nf"]).apply(null, arguments)
}
;
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {
    return (dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = Module["asm"]["Of"]).apply(null, arguments)
}
;
var dynCall_i = Module["dynCall_i"] = function() {
    return (dynCall_i = Module["dynCall_i"] = Module["asm"]["Pf"]).apply(null, arguments)
}
;
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {
    return (dynCall_iiiiiii = Module["dynCall_iiiiiii"] = Module["asm"]["Qf"]).apply(null, arguments)
}
;
var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = function() {
    return (dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = Module["asm"]["Rf"]).apply(null, arguments)
}
;
var dynCall_viji = Module["dynCall_viji"] = function() {
    return (dynCall_viji = Module["dynCall_viji"] = Module["asm"]["Sf"]).apply(null, arguments)
}
;
var dynCall_jij = Module["dynCall_jij"] = function() {
    return (dynCall_jij = Module["dynCall_jij"] = Module["asm"]["Tf"]).apply(null, arguments)
}
;
var dynCall_iij = Module["dynCall_iij"] = function() {
    return (dynCall_iij = Module["dynCall_iij"] = Module["asm"]["Uf"]).apply(null, arguments)
}
;
var dynCall_jiij = Module["dynCall_jiij"] = function() {
    return (dynCall_jiij = Module["dynCall_jiij"] = Module["asm"]["Vf"]).apply(null, arguments)
}
;
var dynCall_viiid = Module["dynCall_viiid"] = function() {
    return (dynCall_viiid = Module["dynCall_viiid"] = Module["asm"]["Wf"]).apply(null, arguments)
}
;
var dynCall_viiif = Module["dynCall_viiif"] = function() {
    return (dynCall_viiif = Module["dynCall_viiif"] = Module["asm"]["Xf"]).apply(null, arguments)
}
;
var dynCall_viid = Module["dynCall_viid"] = function() {
    return (dynCall_viid = Module["dynCall_viid"] = Module["asm"]["Yf"]).apply(null, arguments)
}
;
var dynCall_vffff = Module["dynCall_vffff"] = function() {
    return (dynCall_vffff = Module["dynCall_vffff"] = Module["asm"]["Zf"]).apply(null, arguments)
}
;
var dynCall_vf = Module["dynCall_vf"] = function() {
    return (dynCall_vf = Module["dynCall_vf"] = Module["asm"]["_f"]).apply(null, arguments)
}
;
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function() {
    return (dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = Module["asm"]["$f"]).apply(null, arguments)
}
;
var dynCall_vff = Module["dynCall_vff"] = function() {
    return (dynCall_vff = Module["dynCall_vff"] = Module["asm"]["ag"]).apply(null, arguments)
}
;
var dynCall_vfi = Module["dynCall_vfi"] = function() {
    return (dynCall_vfi = Module["dynCall_vfi"] = Module["asm"]["bg"]).apply(null, arguments)
}
;
var dynCall_vifff = Module["dynCall_vifff"] = function() {
    return (dynCall_vifff = Module["dynCall_vifff"] = Module["asm"]["cg"]).apply(null, arguments)
}
;
var dynCall_viffff = Module["dynCall_viffff"] = function() {
    return (dynCall_viffff = Module["dynCall_viffff"] = Module["asm"]["dg"]).apply(null, arguments)
}
;
var dynCall_iidiiii = Module["dynCall_iidiiii"] = function() {
    return (dynCall_iidiiii = Module["dynCall_iidiiii"] = Module["asm"]["eg"]).apply(null, arguments)
}
;
var dynCall_iiiiij = Module["dynCall_iiiiij"] = function() {
    return (dynCall_iiiiij = Module["dynCall_iiiiij"] = Module["asm"]["fg"]).apply(null, arguments)
}
;
var dynCall_iiiiid = Module["dynCall_iiiiid"] = function() {
    return (dynCall_iiiiid = Module["dynCall_iiiiid"] = Module["asm"]["gg"]).apply(null, arguments)
}
;
var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = function() {
    return (dynCall_iiiiijj = Module["dynCall_iiiiijj"] = Module["asm"]["hg"]).apply(null, arguments)
}
;
var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = function() {
    return (dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = Module["asm"]["ig"]).apply(null, arguments)
}
;
var _asyncify_start_unwind = Module["_asyncify_start_unwind"] = function() {
    return (_asyncify_start_unwind = Module["_asyncify_start_unwind"] = Module["asm"]["jg"]).apply(null, arguments)
}
;
var _asyncify_stop_unwind = Module["_asyncify_stop_unwind"] = function() {
    return (_asyncify_stop_unwind = Module["_asyncify_stop_unwind"] = Module["asm"]["kg"]).apply(null, arguments)
}
;
var _asyncify_start_rewind = Module["_asyncify_start_rewind"] = function() {
    return (_asyncify_start_rewind = Module["_asyncify_start_rewind"] = Module["asm"]["lg"]).apply(null, arguments)
}
;
var _asyncify_stop_rewind = Module["_asyncify_stop_rewind"] = function() {
    return (_asyncify_stop_rewind = Module["_asyncify_stop_rewind"] = Module["asm"]["mg"]).apply(null, arguments)
}
;
var _xmp_version = Module["_xmp_version"] = 2561940;
var _xmp_vercode = Module["_xmp_vercode"] = 2476076;
function invoke_iiiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_iiiii(index, a1, a2, a3, a4)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_viii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        dynCall_viii(index, a1, a2, a3)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_ii(index, a1) {
    var sp = stackSave();
    try {
        return dynCall_ii(index, a1)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_iiii(index, a1, a2, a3)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_vi(index, a1) {
    var sp = stackSave();
    try {
        dynCall_vi(index, a1)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_vii(index, a1, a2) {
    var sp = stackSave();
    try {
        dynCall_vii(index, a1, a2)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiiiii(index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiiii(index, a1, a2, a3, a4, a5)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viiii(index, a1, a2, a3, a4)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
function invoke_iii(index, a1, a2) {
    var sp = stackSave();
    try {
        return dynCall_iii(index, a1, a2)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp")
            throw e;
        _setThrew(1, 0)
    }
}
var calledRun;
function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
}
var calledMain = false;
dependenciesFulfilled = function runCaller() {
    if (!calledRun)
        run();
    if (!calledRun)
        dependenciesFulfilled = runCaller
}
;
function callMain(args) {
    var entryFunction = Module["_main"];
    args = args || [];
    var argc = args.length + 1;
    var argv = stackAlloc((argc + 1) * 4);
    HEAP32[argv >> 2] = allocateUTF8OnStack(thisProgram);
    for (var i = 1; i < argc; i++) {
        HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1])
    }
    HEAP32[(argv >> 2) + argc] = 0;
    try {
        var ret = entryFunction(argc, argv);
        if (!keepRuntimeAlive()) {
            exit(ret, true)
        }
    } catch (e) {
        if (e instanceof ExitStatus) {
            return
        } else if (e == "unwind") {
            return
        } else {
            var toLog = e;
            if (e && typeof e === "object" && e.stack) {
                toLog = [e, e.stack]
            }
            err("exception thrown: " + toLog);
            quit_(1, e)
        }
    } finally {
        calledMain = true
    }
}
function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
        return
    }
    preRun();
    if (runDependencies > 0) {
        return
    }
    function doRun() {
        if (calledRun)
            return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT)
            return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"])
            Module["onRuntimeInitialized"]();
        if (shouldRunNow)
            callMain(args);
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function() {
            setTimeout(function() {
                Module["setStatus"]("")
            }, 1);
            doRun()
        }, 1)
    } else {
        doRun()
    }
}
Module["run"] = run;
function exit(status, implicit) {
    EXITSTATUS = status;
    if (implicit && keepRuntimeAlive() && status === 0) {
        return
    }
    if (keepRuntimeAlive()) {} else {
        exitRuntime();
        if (Module["onExit"])
            Module["onExit"](status);
        ABORT = true
    }
    quit_(status, new ExitStatus(status))
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"])
    shouldRunNow = false;
run();
FS.mkdir("easyrpg");
FS.chdir("easyrpg");
if (Module.EASYRPG_GAME.length > 0) {
    FS.mkdir(Module.EASYRPG_GAME);
    FS.chdir(Module.EASYRPG_GAME)
}
if (typeof Module.EASYRPG_FS === "undefined") {
    Module.EASYRPG_FS = IDBFS
}
