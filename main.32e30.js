window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;
    var onProgress = null;
    
    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
    function setLoadingDisplay () {
        // Loading splash scene
        var splash = document.getElementById('splash');
        var progressBar = splash.querySelector('.progress-bar span');
        var progressNumber = document.getElementById('progressNumber');
        
        var trueProgress = 0;//真实进度
        var fakeProgress = 0;//虚假进度
        
        var startTime = Date.now();
      var endTime = startTime + 500; // 0.5秒后的时间

      var intervalId = setInterval(function() {
        var currentTime = Date.now();
        var timeElapsed = currentTime - startTime;
        fakeProgress = Math.min(100, (100 * (1 - Math.exp(-timeElapsed / 250)))); // 指数衰减函数

        if (timeElapsed >= 500) {//0.5秒后结束
          clearInterval(intervalId);
        }
        if(trueProgress>0.9)
        {
            fakeProgress = 100;
        }
        var allProgress = fakeProgress*0.55 + trueProgress*0.45;//计算显示的值
        progressBar.style.width = allProgress.toFixed(2) + '%';
        progressNumber.textContent = "Loding..."+allProgress.toFixed(2) + '%';
      }, 10); // 每10毫秒更新一次进度

        onProgress = function (finish, total) {
            trueProgress = 100 * finish / total;
            if(trueProgress>0.9)
            {
                fakeProgress = 100;
            }
            var allProgress = fakeProgress*0.55 + trueProgress*0.45;//计算显示的值
            
            if (progressBar) {
                progressBar.style.width = allProgress.toFixed(2) + '%';
            }
            if (progressNumber) {
                progressNumber.textContent = "Loding..."+allProgress.toFixed(2) + '%'; // 更新数字进度
            }
        };
        splash.style.display = 'block';
        progressBar.style.width = '5%';
        progressNumber.textContent = '5%'; // 初始化数字进度

        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            splash.style.display = 'none';
        });
    }

    

cc.assetManager.downloader.register('.woff2', (url, options, onComplete) => {
    const fixedUrl = url.replace(/\.woff2$/, `/${options.__nativeName__}`);
    console.log('[Font] Downloading font:', options.__nativeName__, 'from:', fixedUrl);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', fixedUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.setRequestHeader('Accept', 'font/woff2');
    xhr.onload = function() {
        xhr.status === 200 || xhr.status === 0 ? 
            onComplete(null, xhr.response) : 
            onComplete(new Error(`${xhr.status}(${xhr.statusText})`));
    };
    xhr.onerror = function() {
        onComplete(new Error(xhr.statusText));
    };
    xhr.ontimeout = function() {
        onComplete(new Error('timeout'));
    };
    xhr.send(null);
});

cc.assetManager.parser.register('.woff2', (file, options, onComplete) => {
    const fontFamily = options.__nativeName__.replace(/\.woff2$/, '');
    console.log('[Font] Parsing font:', fontFamily);
    const fontFace = new FontFace(fontFamily, file);
    document.fonts.add(fontFace);
    fontFace.load().then(() => {
        onComplete(null, fontFamily);
    }).catch(() => {
        cc.warnID(4933, fontFamily);
        onComplete(null, fontFamily);
    });
});
var onStart = function () {

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            }
            else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
            cc.view.enableAutoFullScreen([
                cc.sys.BROWSER_TYPE_BAIDU,
                cc.sys.BROWSER_TYPE_BAIDU_APP,
                cc.sys.BROWSER_TYPE_WECHAT,
                cc.sys.BROWSER_TYPE_MOBILE_QQ,
                cc.sys.BROWSER_TYPE_MIUI,
                cc.sys.BROWSER_TYPE_HUAWEI,
                cc.sys.BROWSER_TYPE_UC,
            ].indexOf(cc.sys.browserType) < 0);
        }

        // Limit downloading max concurrent task to 2,
        // more tasks simultaneously may cause performance draw back on some android system / browsers.
        // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
        if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
            cc.assetManager.downloader.maxConcurrency = 2;
            cc.assetManager.downloader.maxRequestsPerFrame = 2;
        }

        var launchScene = settings.launchScene;
        var bundle = cc.assetManager.bundles.find(function (b) {
            return b.getSceneInfo(launchScene);
        });
        
        bundle.loadScene(launchScene, null, onProgress,
            function (err, scene) {
                if (!err) {
                    cc.director.runSceneImmediate(scene);
                    if (cc.sys.isBrowser) {
                        // show canvas
                        var canvas = document.getElementById('GameCanvas');
                        canvas.style.visibility = '';
                        var div = document.getElementById('GameDiv');
                        if (div) {
                            div.style.backgroundImage = '';
                        }
                        console.log('Success to load scene: ' + launchScene);
                    }
                }
            }
        );

    };

    var option = {
        id: 'GameCanvas',
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({ 
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server
    });
    
    var bundleRoot = [INTERNAL];
    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    var count = 0;
    function cb (err) {
        if (err) return console.error(err.message, err.stack);
        count++;
        if (count === bundleRoot.length + 1) {
            cc.assetManager.loadBundle(MAIN, function (err) {
                if (!err) cc.game.run(option, onStart);
            });
        }
    }

    cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x;}), cb);

    for (var i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }
};

if (window.jsb) {
    var isRuntime = (typeof loadRuntime === 'function');
    if (isRuntime) {
        require('src/settings.8d273.js');
        require('src/cocos2d-runtime.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/engine/index.js');
    }
    else {
        require('src/settings.8d273.js');
        require('src/cocos2d-jsb.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/jsb-engine.js');
    }

    cc.macro.CLEANUP_IMAGE_CACHE = true;
    window.boot();
}