var szitrus = szitrus || {}
(function(window,document){
    /**
     * 一个文档盖章组件
     *
     * 创建时间 2019-5-16
     *
     * 相关说明：
     * -- 在标签body上 加上 id="drag-body"
     * -- 引用demo
     * -- var options = {
     *  --     sealClass: '.seal-img', // 拖拽的目标class名（印章）
     *  --     topBarId:'back',  // 头部左边区域内容，此处传入标签的id
     *  --     leftSideId: 'sealsUl', //左侧边的内容，此处传入标签的id
     *  --     rightSideId: '',      //右侧边的内容，此处传入标签的id
     *  --     docWidth: 589,  // 文档宽度
     *  --     docHeight: 847, // 文档高度
     *  --     docSource: ['./images/12.png','./images/12.png','./images/12.png'],
     *  --     themeColor:'#26f',   // 主题颜色
     *  --     submitButtonText: '立即签署'   // 头部右上角按钮的文本内容, 此处传入中文
     *  -- };
     * -- var Sealkit = szitrus.sealkit(options);
     * -- Sealkit.submit(function (data) { //点击提交签署，data是返回的盖章信息
     * --    console.log(data)
     * -- }
     * --  Sealkit.refresh(arrs) // 重新刷新替换图片, arrs是PDF图片数组['./images/333.png','./images/333.png']
     *
     * 关于文件目录：
     * -- js
     * -- -- szitrus-sealkit.js
     * -- css
     * -- -- szitrus-sealkit.css
     * -- images
     * -- -- ico-drag-close.png
     * -- -- ico-drag-top.png
     * -- -- ico-drag-btm.png
     *
     * 关于 sealClass
     * -- 拖拽的目标 设置的属性格式是 data-
     * -- 如果是驼峰命名值：sealName要设置成data-seal-name 如下：i
     * -- data-width="60" data-height="60" data-img="./images/1.png" data-seal-name="电子合同章" data-seal-id="1" data-user-id="2" data-stamp-style="none"
     * -- 特别提醒 data-img 和 data-width="60" data-height="60" 是必须设置的
     *
     **/
    var PDFMARGIN = 20;  // 文档页之间距离
    var PDFHEIGHT = 842; // 文档高度
    var PDFPAGEH  = PDFMARGIN + PDFMARGIN;

    function Sealkit(options){
        var isCls = /^.[a-zA-Z][-a-zA-Z]*$/.test(options.sealClass);

        if(!isCls) {
            alert('请检查传入cls(拖拽目标的类名)格式是否正确！格式如.box');
            return false;
        }
        this._options = {
            sealClass: document.querySelectorAll(options.sealClass),  // 拖拽的目标类名（印章）
            topBarId: options.topBarId,        // 头部左边区域内容
            leftSideId: options.leftSideId, //左侧边的内容
            rightSideId: options.rightSideId, //右侧边的内容
            docWidth: options.docWidth,  // 文档宽度
            docHeight: options.docHeight,  // 文档高度
            docSource: options.docSource,  //PDF 图片—>数组类型，一组图片路径数据
            themeColor: options.themeColor, // 主题颜色
            submitButtonText: options.submitButtonText  // 头部右上角按钮的文本内容
        };
        this.init();
    };
    //初始化组件
    Sealkit.prototype.init = function(){
        var self = this;
        var cls = this._options.sealClass;
        self.fnDragHtml(this._options.topBarId,this._options.leftSideId,
            this._options.rightSideId,this._options.docSource,this._options.submitButtonText);
        self.fnSetDragAttr();
        self.fnGetDrag(cls);
    };
    //渲染组件页面
    Sealkit.prototype.fnDragHtml = function(topBar,leftSideId,rightSideId,pdfImgs,btnTxt){
        var self = this;
        var btnTxt = /^[\u3220-\uFA29]+$/.test(btnTxt) ? btnTxt : '保存';
        var wrap = document.createElement("div");
        var dHtml = [' <div class="fn-clear"><div class="drag-top-left" id="dragTopLeft"></div>'+
                '   <div class="drag-btn-sub" id="btnDragSub">'+
                '       <span>'+btnTxt+'</span>'+
                '   </div>'+
                '   <div class="drag-page" id="pagebox">'+
                '       <ul id="dragPagebox"></ul>'+
                '   </div></div>'+
                '   <div class="drag-contentbox" id="dragContent">'+
                '       <div class="drag-left-side" id="dragLeftSide"></div>'+
                '       <div class="scrollbar" id="dragScrollLeft">'+
                '           <div id="dragThumbLeft" class="scrollthumb"></div>'+
                '       </div>'+
                '       <div class="drag-center-box" id="dragCenterUl">'+
                '           <ul id="dragPdfUl" class="drag-pdful"></ul>'+
                '           <div class="drag-goto">'+
                '               <div class="goto-top" id="gotoTop"></div>'+
                '               <div class="goto-bottom" id="gotoBtm"></div>'+
                '           </div>'+
                '       </div>'+
                '       <div class="scrollbar" id="dragScrollCenter">'+
                '           <div id="dragThumbCenter" class="scrollthumb"></div>'+
                '       </div>'+
                '       <div class="drag-right-side" id="dragRightSide"></div>'+
                '       <div class="scrollbar" id="dragScrollRight">'+
                '           <div id="dragThumbRight" class="scrollthumb"></div>'+
                '       </div>'+
                '   </div>'].join('\n');
        wrap.innerHTML = dHtml;
        document.body.appendChild(wrap);
        document.getElementById('drag-body').style.display = 'block';
        this.appendDocSource(pdfImgs);

        var dragThumbLeft = document.getElementById('dragThumbLeft');
        var dragScrollLeft = document.getElementById('dragScrollLeft');
        var dragThumbCenter = document.getElementById('dragThumbCenter');
        var dragScrollCenter = document.getElementById('dragScrollCenter');
        var dragThumbRight = document.getElementById('dragThumbRight');
        var dragScrollRight = document.getElementById('dragScrollRight');
        var dragPdfUl = document.getElementById('dragPdfUl');
        var dragCenterUl = document.getElementById('dragCenterUl');

        self.fnAppentHtml(topBar,'dragTopLeft');
        self.fnAppentHtml(leftSideId,'dragLeftSide',dragThumbLeft,dragScrollLeft);
        self.fnAppentHtml(rightSideId,'dragRightSide',dragThumbRight,dragScrollRight);
        setTimeout(function () {
            self.fnInitScroll(dragThumbCenter,dragScrollCenter,dragPdfUl,dragCenterUl);
            if(self._options.docHeight) PDFHEIGHT = self._options.docHeight;
            PDFPAGEH = PDFHEIGHT + PDFMARGIN;
        },800);
        self.fnShowPage(pdfImgs);
        self.fnSetTheme(this._options.themeColor);
        document.getElementById('gotoTop').onclick = function (e) {
            dragThumbCenter.style.top = 0;
            self.$centerUId.scrollTop = 0;
            self.$pdfObjId.style.marginTop = 0;
            self.fnCreatePage(1, self.fn.total);
        };
        document.getElementById('gotoBtm').onclick = function (e) {
            var t = self.$pdfObjId.offsetHeight;
            var h = t - PDFPAGEH;
            dragThumbCenter.style.top = h + 'px';
            self.$pdfObjId.style.marginTop = -h + 'px';
            self.$centerUId.scrollTop = h + 'px';
            self.fnCreatePage(self.fn.total, self.fn.total);
        };
    };
    // 加载显示PDF图片
    Sealkit.prototype.appendDocSource = function(pdfImgs){
        if(pdfImgs){
            var imgHtml = '';
            if(pdfImgs instanceof Array){
                for (var i = 0; i < pdfImgs.length; i++){
                    var item = pdfImgs[i];
                    imgHtml += ['<li><img width="'+this._options.docWidth +'" height="'+this._options.docHeight +'" src="' + item +'"/></li>'].join('\n');
                }
                document.getElementById('dragPdfUl').innerHTML = imgHtml;
            }else {
                alert('请检查下pdfImgs(PDF图片)是否是数组');
            }
        }
    };
    Sealkit.prototype.fnAppentHtml = function(itemId,getID,oDiv,oParent){
        if(itemId) {
            if(typeof itemId == 'string'){
                var aHtml = document.getElementById(itemId);
                document.getElementById(getID).appendChild(aHtml);
                if(oDiv && oParent)
                    this.fnInitScroll(oDiv,oParent,aHtml,document.getElementById(getID));
            }
        }
    };
    // 重新刷新替换PDF图片
    Sealkit.prototype.refresh = function (arrs) {
        this.appendDocSource(arrs);
    };
    //自定义滚动条事件
    Sealkit.prototype.fnInitScroll = function(oDiv,oParent,oContainer,oBox){
        var self = this;
        var pH = oParent.offsetHeight;
        var cH = oContainer.scrollHeight;
        if(pH > cH) {
            oDiv.style.height = pH + "px";
            return false;
        };
        var bH = oBox.offsetHeight;
        var rate = parseFloat((bH/cH).toFixed(2));
        var dH = rate * pH;
        oDiv.style.height = dH + "px";

        oDiv.onmousedown = function(ev){
            var oEvent = ev||event;
            var disY = oEvent.clientY - oDiv.offsetTop;
            document.onmousemove = function(ev){
                var oEvent = ev||event;
                var t = oEvent.clientY - disY;
                var scale = oDiv.offsetTop/(oParent.offsetHeight-oDiv.offsetHeight-4);

                if(t<0) t = 0;
                else if(t>(oParent.offsetHeight-oDiv.offsetHeight))
                    t = oParent.offsetHeight-oDiv.offsetHeight;
                oDiv.style.top = t + 'px';
                oContainer.style.marginTop = -scale * (oContainer.offsetHeight - oBox.offsetHeight) + 'px';//按比例滚动条滚到哪个位置文本滚到对应的
                setTimeout(function () {
                    var mart =  oContainer.style.marginTop.replace('px','');
                    var marTop = Math.abs(parseInt(mart));
                    var scrollUl = parseInt(marTop/(842 + 20))+1;
                    var total = self.fn.total;
                    self.fnCreatePage(scrollUl, total);
                },100);
            };

            document.onmouseup = function(){
                document.onmousemove = document.onmouseup = null;
            };
            return false;
        };
        oBox.onmousewheel = function(ev){
            oEvent = ev||event;
            var t = oDiv.offsetTop;
            var scale = 0;
            fnScroll(false,oEvent.wheelDelta,scale,t,oDiv,oParent,oContainer,oBox);
            return false;
        };
        oBox.addEventListener('DOMMouseScroll',function(ev){
            var oEvent = ev||event;
            var t = oDiv.offsetTop;
            var scale = 0;
            fnScroll(true,oEvent.detail,scale,t,oDiv,oParent,oContainer,oBox);
            oEvent.preventDefault();//阻止浏览器默认事件
        },false);
    };
    //页码实时渲染
    Sealkit.prototype.fnCreatePage = function(scrollUl, total){
        var rootele = this.fn.createPage(scrollUl, total);
        this.fn.currentPage = scrollUl;
        document.getElementById('dragPagebox').innerHTML = rootele;
    };
    //设置组件公用属性
    Sealkit.prototype.fnSetDragAttr = function(){
        this.contentboxT = document.getElementById('dragContent').offsetTop;
        this.drag = this._options.sealClass[0];
        this.$centerUId = document.getElementById('dragCenterUl');
        this.$pdfObjId = document.getElementById('dragPdfUl'); // 滚动的PDF
    };
    //设置页码
    Sealkit.prototype.fnShowPage = function(pdfImgs){
        var self = this;
        var conf = {
            total: pdfImgs.length,
            containerId: 'dragPagebox',
            centerUId: 'dragPdfUl',
            click: function(e){
                var total = self.$pdfObjId.children[e-1].offsetTop;
                self.$pdfObjId.style.marginTop = -total + 'px';
            }
        };
        this.fn = new pageFunc(conf);
        this.fn;
    };
    //设置主题颜色
    Sealkit.prototype.fnSetTheme = function(themeColor){
        if(themeColor){
            var isColor = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(themeColor);
            if(isColor) {
                var cssTxt = 'background: '+ themeColor +'; border-color: '+themeColor+';';
                document.querySelector('.lmw-current').style.cssText = cssTxt;
                document.getElementById('btnDragSub').style.cssText = cssTxt;
            }
        }
    };
    //初始化拖拽印章到PDF上
    Sealkit.prototype.fnGetDrag = function(cls){
        var self = this;
        for(var i = 0; i < cls.length; i++) {
            (function(i) {
                self.fnDrag(cls[i]);
            })(i)
        }
    };
    //设置拖拽印章到PDF上
    Sealkit.prototype.fnDrag = function(dragB){
        var self = this;
        dragB.onmousedown = function(e){
            var e = e || window.event;
            e.preventDefault();
            self.obj = dragB;
            self.drag = dragB;
            self.fnDown(e);
            document.onmousemove = function(e){
                e = e || event;
                self.fnMove(e);
            };
            document.onmouseup = function(e){
                self.fnUp(e);
            };
            return false;
        }.bind(self);
    };
    //按下印章事件
    Sealkit.prototype.fnDown = function(e){
        var mtop = parseInt(getAttr(this.$pdfObjId).marginTop.replace('px',''));
        this.pdfT = mtop;
        this.pdfL = this.$pdfObjId.offsetLeft;
        this.pdfB = this.contentboxT + this.$centerUId.offsetHeight;
        this.pdfR = this.pdfL + this.$pdfObjId.offsetWidth;
        this.maxTop = this.$pdfObjId.offsetHeight - (this.drag.offsetHeight)*(4/3);
        this.disX = e.clientX - this.drag.offsetLeft;
        this.disY = e.clientY - this.drag.offsetTop;
        this.fnCreateDragBox(e);
    };
    //创建拖拽目标
    Sealkit.prototype.fnCreateDragBox = function(e){
        var $dragBox = document.createElement('div');
        $dragBox.setAttribute("class",'dragBox');
        $dragBox.appendChild(this.fnCreateImg(this.drag));
        this.drag = $dragBox;
        document.body.appendChild($dragBox);
        var haW = this.drag.offsetWidth/2;
        var haH = this.drag.offsetHeight/2;
        this.disX = haW;
        this.disY = haH;
        this.drag.style.left = e.clientX - this.disX + 'px';
        this.drag.style.top = e.clientY - this.disY + 'px';
    };
    //创建印章图片并设置宽高
    Sealkit.prototype.fnCreateImg = function($el){
        var dataImg = $el.getAttribute('data-img');
        var w = $el.getAttribute('data-width');
        var h = $el.getAttribute('data-height');
        if(dataImg){
            var $img = document.createElement('img');
            $img.setAttribute("src",dataImg);
            $img.setAttribute("width",w + 'px');
            $img.setAttribute("height",h + 'px');
            return $img;
        }else {
            return null;
        }
    };
    //移动印章事件
    Sealkit.prototype.fnMove = function(e){
        this.drag.style.left = e.clientX - this.disX + 'px';
        this.drag.style.top = e.clientY - this.disY + 'px';
    };
    //松开印章事件
    Sealkit.prototype.fnUp = function(e){
        var objW = this.drag.offsetWidth;
        var objH = this.drag.offsetHeight;
        var X = this.pdfR - objW;
        var Y = this.pdfB - objH;
        var dL = e.clientX - this.disX;
        var dT = e.clientY - this.disY - this.drag.offsetHeight/2;
        var h = objH > 100 ? 0 : objH/2;

        if(dL < this.pdfL) dL = this.pdfL;
        if(dL > X) dL = X;
        if(dT < this.pdfT) dT = this.pdfT;
        if(dT > Y) dT = Y;

        document.onmousemove = document.onmouseup = null;
        var st = Math.abs(parseInt(getAttr(this.$pdfObjId).marginTop.replace('px','')));
        var dY = dT + st - h;
        var dX = dL - this.pdfL;
        dY = this.fnDragTop(dY,objH);

        this.fnCreatePdfDragBox(dX,dY);
        return false;
    };
    //设置印章拖到PDF时对应的高度
    Sealkit.prototype.fnDragTop = function(dY,objH){
        var st = Math.abs(parseInt(getAttr(this.$pdfObjId).marginTop.replace('px','')));
        var number = 1;
        if(st > PDFPAGEH) number = parseInt(st / PDFPAGEH) + 1;
        var num = PDFPAGEH * number;

        var h = num - PDFMARGIN - objH;
        var ofH = num - PDFMARGIN;

        if(dY > h && dY < ofH) dY = h;
        if(dY > ofH && dY < num) dY = num;
        if(dY < 0) dY = 0;
        if(dY > this.maxTop) dY = this.maxTop;
        return dY;
    };
    //创建PDF上的印章
    Sealkit.prototype.fnCreatePdfDragBox = function (dX,dY) {
        var self = this;
        var $drag = document.createElement('div');
        var $btnClose = document.createElement('div');
        var dom = this.obj;

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
        });

        $drag.appendChild(self.fnCreateImg($drag));
        $btnClose.addEventListener('click', closeFn, false);
        removeElement(this.drag);

        var optionsJ = this._options;
        optionsJ.sealClass = '.dragStatus';
        new ChildDrag(optionsJ);
        this.drag = $drag;
    };
    //设置印章属性
    Sealkit.prototype.fnSetAttr = function(dom,callback){
        var len = dom.attributes.length;
        for(var i=0;i<len;i++){
            var it = dom.attributes[i];
            var localName = it.localName;
            if(localName !== 'class' && localName !== 'style'){
                var value = it.value;
                callback(localName,value);
            }
        };
    };
    // 立即提交签署
    Sealkit.prototype.fnGetResults = function(dragStatus){
        var self = this;
        var sealArr = [];
        for(var i = 0 ;i< dragStatus.length;i++){
            var $el = dragStatus[i];
            var w = dragStatus[i].offsetWidth;
            var h = dragStatus[i].offsetHeight;
            var xLeft = dragStatus[i].offsetLeft;
            var yTop = dragStatus[i].offsetTop;
            var positionX = getPage($el,w,h,xLeft,yTop)[0];
            var positionY = getPage($el,w,h,xLeft,yTop)[1];
            var page = getPage($el,w,h,xLeft,yTop)[2];
            var dom = $el;
            var optionsJson = {};
            self.fnSetAttr(dom, function (localName,value) {
                if(localName !== 'style'){
                    (function (localName,value) {
                        var attr = localName.toString().replace('data-','');
                        var a = attr.split('-');
                        var key = a[0];
                        for (var i = 0; i < a.length; i++){
                            (function (i) {
                                var item = a[i];
                                if(i !== 0){
                                    var u = item.slice(0,1).toUpperCase();
                                    var s = item.slice(1);
                                    var k = u + s;
                                    key += k;
                                }
                            })(i)
                        }
                        optionsJson[key] =value;
                    })(localName,value)
                };
            });

            var obj = {
                page: page,
                positionX: positionX,
                positionY: positionY
            };

            var resultJson = extend(optionsJson,obj);
            sealArr.push(resultJson);
        }
        return sealArr;
    };
    // 点击立即签署
    Sealkit.prototype.submit = function (callback) {
        var self = this;
        document.getElementById('btnDragSub').onclick = function (e) {
            var dragStatus = document.getElementsByClassName('dragStatus');
            var sealArrs = self.fnGetResults(dragStatus);
            callback(sealArrs);
        };
    };
    // childDrag继承Sealkit
    function ChildDrag(obj){
        Sealkit.call(this,obj);
    };
    if(!Object.create){
        Object.create = function(proto){
            function F(){};
            F.prototype = proto;
            return new F;
        }
    };
    ChildDrag.prototype = Object.create(Sealkit.prototype);
    ChildDrag.prototype.constructor = ChildDrag;
    ChildDrag.prototype.fnDragHtml = function() {};
    ChildDrag.prototype.fnCreateDragBox = function () {};
    ChildDrag.prototype.fnCreatePdfDragBox = function(){};
    //PDF上印章移动事件
    ChildDrag.prototype.fnMove = function(e){
        var dLeft = e.clientX - this.disX;
        var dTop = e.clientY - this.disY;
        var maxLeft = this.$pdfObjId.offsetWidth - this.drag.offsetWidth;
        var maxTop = this.maxTop;

        if (dLeft <= 0) dLeft = 0;
        if (dTop <= 0) dTop = 0;
        if (dLeft >= maxLeft) dLeft = maxLeft;
        if (dTop >= maxTop) dTop = maxTop;

        this.drag.style.left = dLeft + 'px';
        this.drag.style.top = dTop + 'px';
    };
    //PDF上印章松开事件
    ChildDrag.prototype.fnUp = function(e){
        var dT = e.clientY - this.disY;
        var objH = this.drag.offsetHeight;
        var dY = this.fnDragTop(dT,objH);

        this.drag.style.top = dY +'px';
        document.onmousemove = document.onmouseup = null;
        return false;
    };
    // 分页页码
    function pageFunc(conf){
        this.containerId = conf.containerId;
        this.myFunc = conf.click; //用户点击要执行的方法
        this.total = conf.total; //总页数
        this.currentPage = 1;    //当前页码
        this.centerUId = conf.centerUId;//滚动的pdf
        this.init();              //初始化
    };
    pageFunc.prototype.init = function(){
        var total = this.total,
            containerId=this.containerId,
            currentPage = this.currentPage,
            centerUId = this.centerUId,
            _this = this;

        listeners = {
            'setWhat' : function(opts) {
                _this.aClick(opts.src);
                return false;
            }
        };

        listenersPre = {
            'lmw-pre' : function(opts) {
                _this.prevClick();
                return false;
            }
        };

        listenersAdd = {
            'lmw-add' : function(opts) {
                _this.addClick();
                return false;
            }
        };

        listenersScroll = function (opts) {
            _this.aScroll();
            return false;
        };

        var rootele = this.createPage(currentPage,total);
        document.getElementById(containerId).innerHTML = rootele;
        $on(document.getElementById(containerId), ['click'], listeners);//点击a标签
        $on(document.getElementById(containerId), ['click'], listenersPre);//点击上一页
        $on(document.getElementById(containerId), ['click'], listenersAdd);//点击下一页

        document.getElementById(centerUId).onmousewheel = function () {
            listenersScroll();
            return false;
        };
        document.getElementById(centerUId).addEventListener('DOMMouseScroll',function(ev){
            listenersScroll();
        },false);
    };
    // //创建HTML分页结构字符串
    pageFunc.prototype.createPage = function(page,total){
        var str = '<a class="lmw-current" href="#">'+ page +'</a>';
        for(var i=1;i<=3;i++){
            if(page-i>1){
                str = '<a attr-action="setWhat" href="#">'+ (page-i) + '</a>'+str;
            };
            if(page+i<total){
                str = str+'<a attr-action="setWhat" href="#"> '+ (page+i) + '</a>';
            };
        };
        if(page-4>1){
            str = '<span>...</span>'+str;
        };
        if(page+4<total){
            str = str+'<span>...</span>';
        };
        if(page>1){
            str = '<a class="lmw-pre" href="#">上一页</a><a attr-action="setWhat" href="#">1</a>'+str;
        };
        if(page<total){
            str = str+'<a attr-action="setWhat"  href="#">'+total+'</a><a class="lmw-add"  href="#">下一页</a>';
        };
        return str;
    };
    //上一页方法
    pageFunc.prototype.prevClick = function(){
        var total = this.total;
        var containerId = this.containerId;
        var va = --this.currentPage;
        var newret = this.createPage(va, total);
        document.getElementById(containerId).innerHTML = newret;
        this.myFunc(va);
    };
    //下一页方法
    pageFunc.prototype.addClick = function(){
        var total = this.total;
        var va = ++this.currentPage;
        var containerId = this.containerId;
        var newret = this.createPage(va, total);
        document.getElementById(containerId).innerHTML = newret;
        this.myFunc(va);
    };
    //点击方法
    pageFunc.prototype.aClick = function(_this){
        var total = this.total;
        var va = parseInt(_this.innerText);
        var containerId = this.containerId;
        this.currentPage = va;
        var rootele = this.createPage(va, total);
        var bTop = (va -1) * (842+20);
        var cH = document.getElementById(this.centerUId).offsetHeight;
        var rate = parseFloat(bTop/cH).toFixed(2);
        var dragScrollCenterH = document.getElementById('dragScrollCenter').offsetHeight;
        var dragThumbCenter = document.getElementById('dragThumbCenter');
        dragThumbCenter.style.top = rate * dragScrollCenterH + 'px';
        document.getElementById(containerId).innerHTML = rootele;
        this.myFunc(va);
    };
    //滚动定位方法
    pageFunc.prototype.aScroll = function(_this){
        var self = this;
        setTimeout(function () {
            var martop = Math.abs(document.getElementById(self.centerUId).style.marginTop.replace('px',''));
            var scrollUl = parseInt(martop /(842 + 20))+1;
            var total = self.total;
            var containerId = self.containerId;
            this.currentPage = scrollUl;
            var rootele = self.createPage(scrollUl, total);
            document.getElementById(containerId).innerHTML = rootele;
        },100)
    };
    //二：封装事件代理方法
    function $on(dom, event, listeners) {
        $addEvent(dom, event, function(e) {
            var e = e || window.event,
                src = e.target || e.srcElement,
                action,
                returnVal;
            while (src && src !== dom) {
                action = src.getAttribute('attr-action') || src.getAttribute('class') ;
                if (listeners[action]) {
                    returnVal = listeners[action]({
                        src : src,
                        e : e,
                        action : action
                    });

                    if (returnVal === false) {
                        break;
                    }
                };
                src = src.parentNode;
            };
        });
    };
    //1、封装跨浏览器事件绑定方法
    function $addEvent(obj, type, handle) {
        if(!obj || !type || !handle) {
            return;
        };

        if( obj instanceof Array) {
            for(var i = 0, l = obj.length; i < l; i++) {
                $addEvent(obj[i], type, handle);
            }
            return;
        };
        if( type instanceof Array) {
            for(var i = 0, l = type.length; i < l; i++) {
                $addEvent(obj, type[i], handle);
            }
            return;
        };
        //2、解决IE中this指向window的问题
        function createDelegate(handle, context) {
            return function() {
                return handle.apply(context, arguments);
            };
        };
        if(window.addEventListener) {
            var wrapper = createDelegate(handle, obj);
            obj.addEventListener(type, wrapper, false);
        } else if(window.attachEvent) {
            var wrapper = createDelegate(handle, obj);
            obj.attachEvent("on" + type, wrapper);
        } else {
            obj["on" + type] = handle;
        };
    };
    //自定义滚动条
    function fnScroll(isFirefox,oEventName,scale,t,oDiv,oParent,oContainer,oBox) {
        var up = oEventName>0;
        var down = oEventName<0;
        if(isFirefox){
            up = oEventName<0;
            down = oEventName>0;
        };
        if(oEventName){//火狐
            if(up){//向上滚
                oDiv.style.top = t - 20 + 'px';
                t = oDiv.offsetTop;
                if(t<0) oDiv.style.top = 0 + 'px';
                scale = oDiv.offsetTop/(oParent.offsetHeight-oDiv.offsetHeight-4);
                oContainer.style.marginTop = -scale * (oContainer.offsetHeight - oBox.offsetHeight) + 'px';
            } else if(down){//向下滚
                oDiv.style.top = t + 20 + 'px';
                t = oDiv.offsetTop;
                if(t>oParent.offsetHeight-oDiv.offsetHeight) {
                    oDiv.style.top = oParent.offsetHeight-oDiv.offsetHeight + 'px';
                };
                scale = oDiv.offsetTop/(oParent.offsetHeight-oDiv.offsetHeight-4);
                oContainer.style.marginTop = -scale * (oContainer.offsetHeight - oBox.offsetHeight) + 'px';
            };
        };
    };
    //获取属性值
    function getAttr(div) {
        if (window.getComputedStyle) {
            var computedStyle = getComputedStyle(div, null);
        } else {
            computedStyle = div.currentStyle;//兼容IE的写法
        };
        return computedStyle;
    };
    // 合并两个JSON
    function extend(target, source) {
        for (var obj in source) {
            target[obj] = source[obj];
        };
        return target;
    };
    // 通过印章的坐标返回页码
    function getPage($el,w,h,xLeft,yTop){
        var $img = $el.children[1];
        var imgH = $img.offsetHeight;
        var imgW = $img.offsetWidth;
        var imgT = $img.offsetTop;
        var mb = w - imgH - imgT;
        var pY = PDFHEIGHT - yTop % PDFPAGEH - w + mb;
        var valm = yTop % PDFPAGEH;
        var pX = xLeft + (w - imgW)/2;
        var pMax = PDFHEIGHT - h;

        if (pY < 0 && valm > pMax) {pY = 0}
        else if (pY < 0 && valm < pMax) {pY = pMax};
        pX = parseInt(pX);
        pY = parseInt(pY);
        var page = parseInt(yTop / PDFPAGEH) + 1;
        return [pX,pY,page];
    };
    // 标签删除事件
    function removeElement(_element){
        var _parentElement = _element.parentNode;
        if(_parentElement){
            _parentElement.removeChild(_element);
        };
    };
    //删除拖拽的印章
    function closeFn(e){
        removeElement(e.target.parentNode);
    };

    var sealkitFn = function(options){
        return new Sealkit(options);
    };

    window.szitrus.sealkit = sealkitFn;

})(window,document)
