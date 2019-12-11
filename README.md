```javascript
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
```
