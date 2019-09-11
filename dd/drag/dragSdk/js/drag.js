(function(window,document){
    /**
     * 一个文档盖章组件
     *
     * 创建时间 2019-5-16
     *
     * 相关说明：
     * -- 引用demo
     * -- var options = {
     *  --     cls: '.box', // 拖拽的目标class名（印章）
     *  --     topBar:'back',  // 头部左边区域内容，此处传入标签的id
     *  --     leftSideId: 'sealsUl', //左侧边的内容，此处传入标签的id
     *  --     rightSideId: '',      //右侧边的内容，此处传入标签的id
     *  --     pdfImgs: ['./images/12.png','./images/12.png','./images/12.png'],
     *  --     themeColor:'#26f',   // 主题颜色
     *  --     btnTxt: '立即签署',   // 头部右上角按钮的文本内容, 此处传入中文
     *  --     click: function (data) {
     *  --         console.log(data)  //点击提交签署，data是返回的盖章信息
     *  --     }
     *  -- };
     * -- new Drag(options);
     *
     * 关于文件目录：
     * -- js
     * -- -- page.js
     * -- -- drag.js
     * -- css
     * -- -- drag.css
     * -- images
     * -- -- ico-drag-close.png
     * -- -- ico-drag-top.png
     * -- -- ico-drag-btm.png
     *
     * 关于 cls
     * -- 拖拽的目标 设置的属性格式是 data-
     * -- 如下：
     * -- data-img="./images/1.png" data-sealName="电子合同章" data-sealId="1" data-userId="2" data-stampStyle="none"
     * -- 特别提醒 data-img 和 data-sealName 是必须设置的
     *
     **/

    var PDFPAGEW = 595;   // 文档宽度
    var PDFPAFEH = 842;  // 文档高度
    var PDFMARGIN = 20;  //文档页之间距离
    var PDFPAGEHM = PDFPAFEH + PDFMARGIN;

    function Drag(options){
        var isCls = /^.[a-zA-Z]*$/.test(options.cls);
        if(!isCls) {
            alert('请检查传入cls(拖拽目标的类名)格式是否正确！格式如.box');
            return false;
        }
        this._options = {
            cls: document.querySelectorAll(options.cls),  // 拖拽的目标类名（印章）
            topBar: options.topBar,        // 头部左边区域内容
            leftSideId: options.leftSideId, //左侧边的内容
            rightSideId: options.rightSideId, //右侧边的内容
            pdfImgs: options.pdfImgs,  //PDF 图片—>数组类型，一组图片路径数据
            themeColor: options.themeColor, // 主题颜色
            btnTxt: options.btnTxt,  // 头部右上角按钮的文本内容
            subFunc: options.click //点击提交签署
        };
        this.init();
    }
    //初始化组件
    Drag.prototype.init = function(){
        var self = this;
        var cls = this._options.cls;
        self.fnDragHtml(this._options.topBar,this._options.leftSideId,
            this._options.rightSideId,this._options.pdfImgs,this._options.btnTxt)
        self.fnSetDragAttr();
        self.fnGetDrag(cls);
    };
    //渲染组件页面
    Drag.prototype.fnDragHtml = function(topBar,leftSideId,rightSideId,pdfImgs,btnTxt){
        var self = this
        var o = document.body;
        var btnTxt = /^[\u3220-\uFA29]+$/.test(btnTxt) ? btnTxt : '保存';
        var wrap = document.createElement("div");
        wrap.setAttribute('class','drag-container');

        var dHtml = ['<div class="drag-top-left" id="dragTopLeft"></div><div class="drag-btn-sub" id="btnDragSub">'+
            '            <span>'+ btnTxt +'</span>' +
            '            </div>' +
            '            <div class="drag-page" id="pagebox">' +
            '            <ul id="dragPagebox"></ul>' +
            '            </div>' +
            '            <div class="drag-contentbox" id="dragContent">' +
            '            <div class="drag-left-side" id="dragLeftSide">' +
            '            </div>' +
            '            <div class="drag-center-box" id="dragCenterUl">' +
            '            <ul id="dragPdfUl" class="drag-pdful"></ul>' +
            '            <div class="drag-goto">' +
            '            <div class="goto-top" id="gotoTop"></div>' +
            '            <div class="goto-bottom" id="gotoBtm"></div>' +
            '            </div>' +
            '            </div>' +
            '            <div class="drag-right-side" id="dragRightSide"></div>'].join('\n');
        wrap.innerHTML = dHtml;
        o.appendChild(wrap);

        self.fnAppentHtml(topBar,'dragTopLeft')
        self.fnAppentHtml(leftSideId,'dragLeftSide')
        self.fnAppentHtml(rightSideId,'dragRightSide')
        if(pdfImgs){
            var imgHtml = '';
            if(pdfImgs instanceof Array){
                for (var i = 0; i < pdfImgs.length; i++){
                    var item = pdfImgs[i];
                    imgHtml += '<li><img src="' + item +'"/></li>'
                }
                document.getElementById('dragPdfUl').innerHTML = imgHtml
            }else {
                alert('请检查下pdfImgs(PDF图片)是否是数组');
            }
        }
        self.fnShowPage(pdfImgs)
        self.fnSetTheme(this._options.themeColor);

        document.getElementById('gotoTop').onclick = function (e) {
            self.$centerUId.scrollTop = 0;
        }

        document.getElementById('gotoBtm').onclick = function (e) {
            self.$centerUId.scrollTop = document.getElementById('dragPdfUl').offsetHeight
        }

        document.getElementById('btnDragSub').onclick = function (e) {
            var dragStatus = document.getElementsByClassName('dragStatus');
            self.fnGetResults(dragStatus)
        };
    }
    Drag.prototype.fnAppentHtml = function(itemId,getID){
        if(itemId) {
            if(typeof itemId == 'string'){
                var aHtml = document.getElementById(itemId)
                document.getElementById(getID).appendChild(aHtml);
            }
        }
    }
    //设置组件公用属性
    Drag.prototype.fnSetDragAttr = function(){
        this.contentboxT = document.getElementById('dragContent').offsetTop;
        this.drag = this._options.cls[0];
        this.$centerUId = document.getElementById('dragCenterUl');
        this.$pdfObjId = document.getElementById('dragPdfUl'); // 滚动的PDF
    }
    //设置页码
    Drag.prototype.fnShowPage = function(pdfImgs){
        var self = this
        var conf = {
            total: pdfImgs.length,
            containerId: 'dragPagebox',
            centerUId: 'dragCenterUl',
            click: function(e){
                var total = self.$pdfObjId.children[e-1].offsetTop;
                self.$centerUId.scrollTop = total;
            }
        };
        new pageFunc(conf);
    }
    //设置主题颜色
    Drag.prototype.fnSetTheme = function(themeColor){
        if(themeColor){
            var isColor = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(themeColor);
            if(isColor) {
                var cssTxt = 'background: '+ themeColor +'; border-color: '+themeColor+';'
                document.querySelector('.lmw-current').style.cssText = cssTxt
                document.getElementById('btnDragSub').style.cssText = cssTxt
            }
        }
    }
    //初始化拖拽印章到PDF上
    Drag.prototype.fnGetDrag = function(cls){
        var self = this
        for(var i = 0; i < cls.length; i++) {
            (function(i) {
                self.fnDrag(cls[i]);
            })(i)
        }
    }
    //设置拖拽印章到PDF上
    Drag.prototype.fnDrag = function(dragB){
        var self = this;
        dragB.onmousedown = function(e){
            e = e || event;
            self.obj = dragB;
            self.drag = dragB;
            self.fnDown(e);
            document.onmousemove = function(e){
                e = e || event;
                self.fnMove(e);
            }
            document.onmouseup = function(e){
                self.fnUp(e);
            }
            return false;
        }.bind(self);
    }
    //按下印章事件
    Drag.prototype.fnDown = function(e){
        this.pdfT = this.$pdfObjId.offsetTop + this.contentboxT;
        this.pdfL = this.$pdfObjId.offsetLeft;
        this.pdfB = this.pdfT + this.$centerUId.offsetHeight
        this.pdfR = this.pdfL + this.$pdfObjId.offsetWidth;
        this.maxTop = this.$pdfObjId.offsetHeight - this.drag.offsetHeight - this.$pdfObjId.offsetTop - 40;
        this.disX = e.clientX - this.drag.offsetLeft;
        this.disY = e.clientY - this.drag.offsetTop;
        this.fnCreateDragBox(e);
    }
    //创建拖拽目标
    Drag.prototype.fnCreateDragBox = function(e){
        var $dragBox = document.createElement('div');
        $dragBox.setAttribute("class",'dragBox');
        $dragBox.appendChild(this.fnCreateImg(this.drag));
        this.drag = $dragBox;
        document.body.appendChild($dragBox);

        var haW = this.drag.offsetWidth/2;
        var haH = this.drag.offsetHeight/2;
        this.disX = haW;
        this.disY = haH;
    }
    //创建印章图片并设置宽高
    Drag.prototype.fnCreateImg = function($el){
        var dataImg = $el.getAttribute('data-img');
        var name = $el.getAttribute('data-sealName');
        if(dataImg){
            var $img = document.createElement('img');
            $img.setAttribute("src",dataImg);
            switch(name)
            {
                case '电子合同章':
                    $img.setAttribute("width",'120');
                    $img.setAttribute("height",'120');
                    break;
                case '法人章':
                    $img.setAttribute("width",'76');
                    $img.setAttribute("height",'32');
                    break;
                default:
                    $img.setAttribute("maxWidth",'120');
                    $img.setAttribute("maxHeight",'120');
                    break;
            }
            return $img;
        }else {
            return null;
        }
    }
    //移动印章事件
    Drag.prototype.fnMove = function(e){
        this.drag.style.left = e.clientX - this.disX + 'px';
        this.drag.style.top = e.clientY - this.disY + 'px';
    }
    //松开印章事件
    Drag.prototype.fnUp = function(e){
        var objW = this.drag.offsetWidth
        var objH = this.drag.offsetHeight
        var X = this.pdfR - objW
        var Y = this.pdfB - objH
        var dL = e.clientX - this.disX
        var dT = e.clientY - this.disY

        if(dL < this.pdfL) dL = this.pdfL
        if(dL > X) dL = X
        if(dT < this.pdfT) dT = this.pdfT
        if(dT > Y) dT = Y

        document.onmousemove = document.onmouseup = null;
        var st = this.$centerUId.scrollTop
        var dY = dT + st - this.pdfT
        var dX = dL - this.pdfL
        dY = this.fnDragTop(dY,objH);

        this.fnCreatePdfDragBox(dX,dY)
    }
    //设置印章拖到PDF时对应的高度
    Drag.prototype.fnDragTop = function(dY,objH){
        var st = this.$centerUId.scrollTop
        var number = 1;
        if(st > PDFPAGEHM) number = parseInt(st / PDFPAGEHM) + 1
        var num = PDFPAGEHM * number
        var h = num - PDFMARGIN - objH
        var ofH = num - PDFMARGIN

        if(dY > h && dY < ofH) dY = h
        if(dY > ofH && dY < num) dY = num
        if(dY < 0) dY = 0
        if(dY > this.maxTop) dY = this.maxTop
        return dY
    }
    //创建PDF上的印章
    Drag.prototype.fnCreatePdfDragBox = function (dX,dY) {
        var self = this;
        var $drag = document.createElement('div');
        var $btnClose = document.createElement('div');
        var dom = this.obj

        $drag.setAttribute("class",'dragStatus');
        $btnClose.setAttribute("class",'drag-close');
        $drag.style.left = dX +'px';
        $drag.style.top =  dY +'px';
        self.$pdfObjId.appendChild($drag);
        $drag.appendChild($btnClose);

        self.fnSetAttr(dom, function (localName,value) {
            (function (localName,value) {
                $drag.setAttribute(localName,value);
            })(localName,value)
        })

        $drag.appendChild(self.fnCreateImg($drag));
        $btnClose.addEventListener('click', closeFn, false)
        removeElement(this.drag)

        var optionsJ = this._options
        optionsJ.cls = '.dragStatus'
        optionsJ.click = this._options.subFunc
        new ChildDrag(optionsJ)
        this.drag = $drag;
    }
    //设置印章属性
    Drag.prototype.fnSetAttr = function(dom,callback){
        var len = dom.attributes.length;
        for(var i=0;i<len;i++){
            var it = dom.attributes[i];
            var localName = it.localName;
            if(localName !== 'class' && localName !== 'style'){
                var value = it.value;
                callback(localName,value)
            }
        }
    }
    // 立即提交签署
    Drag.prototype.fnGetResults = function(dragStatus){
        var self = this
        var sealArr = [];
        for(var i = 0 ;i< dragStatus.length;i++){
            var $el = dragStatus[i]
            var w = dragStatus[i].offsetWidth
            var h = dragStatus[i].offsetHeight
            var xLeft = dragStatus[i].offsetLeft
            var yTop = dragStatus[i].offsetTop
            var positionX = getPage($el,w,h,xLeft,yTop)[0]
            var positionY = getPage($el,w,h,xLeft,yTop)[1]
            var page = getPage($el,w,h,xLeft,yTop)[2]
            var dom = $el
            var optionsJson = {}
            self.fnSetAttr(dom, function (localName,value) {
                if(localName !== 'style'){
                    (function (localName,value) {
                        var key =localName.toString().replace('data-','');
                        optionsJson[key] =value
                    })(localName,value)
                }
            });

            var obj = {
                page: page,
                positionX: positionX,
                positionY: positionY
            };

            var resultJson = extend(optionsJson,obj)
            sealArr.push(resultJson)
        }
        self._options.subFunc(sealArr)
    }
    // childDrag继承drag
    function ChildDrag(obj){
        Drag.call(this,obj);
    }
    if(!Object.create){
        Object.create = function(proto){
            function F(){};
            F.prototype = proto;
            return new F;
        }
    }
    ChildDrag.prototype = Object.create(Drag.prototype);
    ChildDrag.prototype.constructor = ChildDrag;
    ChildDrag.prototype.fnDragHtml = function() {}
    ChildDrag.prototype.fnCreateDragBox = function () {};
    ChildDrag.prototype.fnCreatePdfDragBox = function(){}
    //PDF上印章移动事件
    ChildDrag.prototype.fnMove = function(e){
        var dLeft = e.clientX - this.disX
        var dTop = e.clientY - this.disY
        var maxLeft = this.$pdfObjId.offsetWidth - this.drag.offsetWidth;
        var maxTop = this.maxTop

        if (dLeft <= 0) dLeft = 0
        if (dTop <= 0) dTop = 0
        if (dLeft >= maxLeft) dLeft = maxLeft
        if (dTop >= maxTop) dTop = maxTop

        this.drag.style.left = dLeft + 'px';
        this.drag.style.top = dTop + 'px';
    }
    //PDF上印章松开事件
    ChildDrag.prototype.fnUp = function(e){
        var dT = e.clientY - this.disY
        var objH = e.target.offsetHeight
        var dY = this.fnDragTop(dT,objH)

        this.drag.style.top = dY +'px';
        document.onmousemove = document.onmouseup = null;
    }
    // 合并两个JSON
    function extend(target, source) {
        for (var obj in source) {
            target[obj] = source[obj];
        }
        return target;
    }
    // 通过印章的坐标返回页码
    function getPage($el,w,h,xLeft,yTop){
        var $img = $el.children[1]
        var imgH = $img.offsetHeight
        var imgW = $img.offsetWidth
        var imgT = $img.offsetTop
        var mb = w - imgH - imgT
        var pY = PDFPAFEH - yTop % PDFPAGEHM - w + mb
        var valm = yTop % PDFPAGEHM
        var pX = xLeft + (w - imgW)/2
        var pMax = PDFPAFEH - h

        if (pY < 0 && valm > pMax) {pY = 0}
        else if (pY < 0 && valm < pMax) {pY = pMax}
        pX = parseInt(pX)
        pY = parseInt(pY)
        var page = parseInt(yTop / PDFPAGEHM) + 1
        return [pX,pY,page]
    }
    // 标签删除事件
    function removeElement(_element){
        var _parentElement = _element.parentNode;
        if(_parentElement){
            _parentElement.removeChild(_element);
        }
    }
    //删除拖拽的印章
    function closeFn(e){
        removeElement(e.target.parentNode)
    }

    window.Drag = Drag;
})(window,document)
