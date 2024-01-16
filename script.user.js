// ==UserScript==
// @name         测试
// @namespace    http://tampermonkey.net/
// @version      2024-01-14
// @description  try to take over the world!
// @author       WingLee
// @match        http://eqshare.just.edu.cn/model/yqkf/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==


// 要预约的设备信息
var requiredDeviceInfoObj = {};

(function() {
    console.log('------页面更新------')
    console.log(GM_getValue('requiredDeviceInfoObj'))
    requiredDeviceInfoObj = GM_getValue('requiredDeviceInfoObj')
    requiredDeviceInfoObj.bookTime = new Date(requiredDeviceInfoObj.bookTime)
    // console.log(requiredDeviceInfoObj.bookTime)

    // 插入一个侧边框用于预约设置
    SidebarSetting()


    // requiredDeviceInfoObj.bookProgress 预约进度 -1不抢|0等待定时预约|1搜索设备送样检测|2日历选择|3填表提交|4完成
    if (requiredDeviceInfoObj.bookProgress === 0) {
        WaitStart()
    } else if (requiredDeviceInfoObj.bookProgress === 1) {
        Step1Search()
    } else if (requiredDeviceInfoObj.bookProgress === 2) {
        Step2Calendar()
    } else if (requiredDeviceInfoObj.bookProgress === 3) {
        Step3Form()
    } else if (requiredDeviceInfoObj.bookProgress === 4) {
        StopBook()
    }
})();


// 第〇步 等待开始抢设备
function WaitStart() {
    if (!requiredDeviceInfoObj.bookProgress === 0) {
        return ;
    }
    console.log('------第〇步等待开始------')
    var bookTime = new Date(requiredDeviceInfoObj.bookTime)

    // 若到抢设备时间
    if ((bookTime - new Date()) <= 0) {
        document.querySelector('#status-bar-id').textContent = ('开始抢设备');
        requiredDeviceInfoObj.bookProgress = 1
        GM_setValue('requiredDeviceInfoObj', requiredDeviceInfoObj)
        Step1Search()
    } else {
        // 获取小时、分钟和秒
        var hours = bookTime.getHours();
        var minutes = bookTime.getMinutes();
        var seconds = bookTime.getSeconds();

        // 格式化时间，确保单个数字前面有零（例如，09:05:02）
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        // 构建显示时间的字符串
        var currentBookTime = hours + ":" + minutes + ":" + seconds;
        // 如果条件不满足，等待一段时间后再次检查
        if ((bookTime - new Date()) > 60000) {
            document.querySelector('#status-bar-id').textContent = ('开始时间为' + currentBookTime + ', 距离开始预约还剩' + Math.floor(((bookTime-new Date()) / 1000)) + '秒');
            setTimeout(WaitStart, 10000); // 慢速10秒
        } else {
            document.querySelector('#status-bar-id').textContent = ('开始时间为' + currentBookTime + ', 距离开始预约还剩' + ((bookTime-new Date()) / 1000) + '秒');
            setTimeout(WaitStart, 100); // 快0.1秒刷新
        }
    }
}

// 第一步 搜索设备送样检测
function Step1Search() {
    if (!requiredDeviceInfoObj.bookProgress === 1) {
        return ;
    }
    //if (window.location.pathname != '/model/yqkf/equipmentlist.html') {
        //window.location.href = 'http://eqshare.just.edu.cn/model/yqkf/equipmentlist.html';
    //}
    // 第一步实现找到设备并点击预约按钮
    console.log('------第一步找设备------')
    // 根据上面信息搜索
    // 要中文全名, 不要后面的括号和英文型号
    var inputElement = document.querySelector('#devname');
    inputElement.value = requiredDeviceInfoObj.name;
    // 点击搜索
    var searchButtonElement = document.querySelector('#devname+span');
    searchButtonElement.click();
    document.querySelector('#status-bar-id').textContent = ('正在查找设备');

    // 等待直到搜索结果刷新出来
    function _WaitUntilSearch() {
        // 若搜索结果刷新出来, 则会定位到多个li元素显示设备信息列表
        if (document.querySelectorAll('#devlist > li').length > 0) {
            // 设备信息和预约信息li列表
            var devlistElements = document.querySelectorAll('#devlist > li');

            // 建立当前页面的设备信息列表, 并给重要标签所在元素加id属性
            var deviceInfoList = BuildDeviceInfoList(devlistElements);
            // console.log(deviceInfoList)
            requiredDeviceInfoObj.bookProgress = 2
            GM_setValue('requiredDeviceInfoObj', requiredDeviceInfoObj)
            // 点击
            document.querySelector('#device-book-id-0').click(); // 默认点击第一个即id=device-book-id-0
            document.querySelector('#status-bar-id').textContent = ('进入【送样检测】/【自主上机】');

        } else if ((new Date() - new Date(requiredDeviceInfoObj.bookTime)) > 10000) {
            document.querySelector('#status-bar-id').textContent = ('无法通过设备名【' + requiredDeviceInfoObj.name + '】查找到设备, 脚本暂停');
            // 设置终止预约标志
            requiredDeviceInfoObj.bookProgress = -1 // 预约进度.  -1不抢|0等待定时预约|1搜索设备送样检测|2日历选择|3填表提交|4完成
            alert('无法通过设备名【' + requiredDeviceInfoObj.name + '】查找到设备, 脚本暂停')
            return ;
        }else {
            // 如果条件不满足，等待一段时间后再次检查
            setTimeout(_WaitUntilSearch, 500); // 500毫秒
        }
    }

    // 调用函数, 通过递归等待直到搜索结果刷新出来
    _WaitUntilSearch();

}


// 第二步 日历选择 点击弹出框, 选择时间预约
function Step2Calendar() {

    if (!requiredDeviceInfoObj.bookProgress === 2) {
        return ;
    }
    console.log('------第三步选日历------')
    // 第二步点击弹出框, 选择时间预约
    if (!window.location.pathname === '/model/yqkf/res.html') {

        return ;
    }

    console.log('------第二步找设备------')
    // 获取顶层窗口的文档对象
    // 此页面中document定位的是页面内<iframe>内容, 因此要获取顶层代码文档
    const topDocument = window.top.document;

    // Step 1 等待倒计时结束, 点击确认
    // 是否已经点击标志, Step2会用到. false未点击|true已点击
    var isClickedConfirm = false
    // 等待倒计时结束, 点击确认
    function _WaitCountdown() {

        // 确认按钮 / 倒计时
        var confirmButtonElement = topDocument.querySelector('#layui-layer1 .layui-layer-btn0');
        // console.log(confirmButtonElement)

        // 倒计时结束, 该元素文本变成【确认】
        if (confirmButtonElement && confirmButtonElement.textContent === '确认') {
            // console.log('点击确认')
            confirmButtonElement.click();
            isClickedConfirm = true
        } else {
            topDocument.querySelector('#status-bar-id').textContent = ('等待倒计时结束');
            // 如果条件不满足，等待一段时间后再次检查
            setTimeout(_WaitCountdown, 500); // 500毫秒
        }
    }

    // 调用函数, 通过递归等待倒计时结束, 点击确认
    _WaitCountdown()

    // Step 2 根据日期点击预约
    // 等待直到日历刷新出来
    function _WaitUntilCalender() {
        // 获取日历的全部td标签
        var tableElemenet = document.querySelectorAll('#tbodytr > tr > td');
        // 若日历刷新出来, 则会定位到多个li元素显示日期等信息
        if (tableElemenet.length > 0) {
            // 可约日期列表
            var availableDateList = []

            for (var i = 0; i < tableElemenet.length; i++) {
                // 日期元素的函数值
                // 从该函数的参数可以看出该日期是否可以预约该设备
                var strOnclickValue = tableElemenet[i].getAttribute('onclick')

                // 上述函数的参数表示该日期不可用的关键词列表
                var unavailableKeywordList = ['请重新选择日期', '小时后的日期']

                // 若某日期不可用则跳到下一循环
                if (unavailableKeywordList.some(keyword => strOnclickValue.includes(keyword))){
                    continue;
                }

                // console.log(strOnclickValue);

                // 使用正则表达式匹配参数, 参数按顺序放到列表中
                // 形式如gourlsy('2024-01-15',0),
                const matchList = /gourlsy\('([^']*)',(\d+)\)/.exec(strOnclickValue);
                // 要第一个日期参数
                availableDateList.push(matchList[1])

                // 给相应标签增加id属性（再使用不用定位）
                // book+日期, 形如book-2024-01-15
                tableElemenet[i].id = 'book-' + matchList[1];
            }

            // console.log(availableDateList);

            // 若用户设置日期可约, 则点击进入预约设置
            if (availableDateList.includes(requiredDeviceInfoObj.date)) {
                // console.log(requiredDeviceInfoObj.date)
                // console.log(isClickedConfirm)

                // 方法1. 等倒计时结束再点击
                // 异步调用计时器, 等待上面计时结束, 点击确认后才能选择日期
                async function _WaitForConfirmation() {
                    while (!isClickedConfirm) {
                        await new Promise(resolve => setTimeout(resolve, 500))
                        console.log("等待倒计时结束")
                    }
                    console.log("结束")
                    requiredDeviceInfoObj.bookProgress = 3
                    GM_setValue('requiredDeviceInfoObj', requiredDeviceInfoObj)
                    // 倒计时确认框结束, 可以点击选择日期点击
                    document.querySelector('#book-' + requiredDeviceInfoObj.date).click();
                }
                // 调用异步调用计时器
                _WaitForConfirmation();

                // 方法2. 不等倒计时结束, 直接点击
                // 其实可以不等倒计时结束, 倒计时确认框结束
                //document.querySelector('#book-' + requiredDeviceInfoObj.date).click();

            } else {
                alert('预设日期无法预约')
            }


        } else {
            // 如果条件不满足，等待一段时间后再次检查
            setTimeout(_WaitUntilCalender, 500); // 500毫秒
        }
    }

    // 调用函数, 通过递归等待直到日历刷新出来
    _WaitUntilCalender();

}

// 第三步填表提交
function Step3Form() {
    if (!requiredDeviceInfoObj.bookProgress === 3) {
        return ;
    }
    // 第三步填表, 点击提交
    if (window.location.pathname === '/model/yqkf/ResSubmitA.html') {
        console.log('------第三步填表------')

        setTimeout(() => {
            console.log('--------- 5s running -------------')

            // 填写日期表单
            // 年月日直接填
            // console.log(document.querySelector('#YYKSD'))
            document.querySelector('#YYKSD').value = '2024-01-15'

            // 时间段, 先检查是否可约
            // 调用选择时间的函数, 产生弹框
            selecttime()

            var availableStartTimeList = [] // 可预约的开始时间的列表
            var timeDiff = -1 // 时间段长度, 单位毫秒
            var timeLiElements = document.querySelectorAll('#timelist > li') // 时间段元素列表
            for (var i=0; i<timeLiElements.length; i++) {
                // 当前遍历到的时间段
                var tempTime = timeLiElements[i]

                // 若该时间不可用, 则该元素的class='gq'
                // 以此作为检验该时间是否可用
                if ('gq'.includes(tempTime.classList)) {
                    continue
                }

                console.log(tempTime.querySelector('span').textContent)
                // 输入的时间字符串
                const timeString = tempTime.querySelector('span').textContent

                // 正则表达式, 用于分离【19:30 -- 20:00】两个时间
                const regexPattern = /(\d{1,2}:\d{2})\s*--\s*(\d{1,2}:\d{2})/
                // 使用正则表达式匹配时间字符串
                const match = timeString.match(regexPattern)
                if (match) {
                    // 提取匹配的时间值
                    const startTime = match[1]; // 开始时间
                    const [startHour, startMinute] = startTime.split(":");
                    const startDate = new Date(0, 0, 0, startHour, startMinute);
                    availableStartTimeList.push(startDate)

                    // 给可用时间段加id, 方便调用
                    // 形式如time-index-0
                    timeLiElements[i].id = 'time-index-' + (availableStartTimeList.length-1)

                    // 计算时段间隔长度
                    if (timeDiff < 0) {
                        const endTime = match[2];
                        const [endHour, endMinute] = endTime.split(":");
                        const endDate = new Date(0, 0, 0, endHour, endMinute);
                        const timeDiff = endDate - startDate;
                    }
                } else {
                    console.log("未匹配到时间字符串");
                }
            }

            document.querySelector('#time-index-0').click();


            console.log(availableStartTimeList)
            console.log('done');
        }, 2000);

    }

}

// 设置信息窗口
function SidebarSetting(){
    // 创建侧边栏容器
    const sidebarContainer = document.createElement('div');
    sidebarContainer.className = 'sidebar';
    sidebarContainer.style = 'position: fixed; top: 0;left: 0;width: 260px;height: 100%;background-color: #f8f9fa;padding: 20px;box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);z-index: 9999;overflow-y: auto;'

    // 标题栏
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.innerHTML = '<h3>设备是俺滴</h3><hr>';
    sidebarContainer.appendChild(header);

    // 状态栏
    const statusBar = document.createElement('div');
    statusBar.className = 'status-bar';
    statusBar.textContent = '正在设置预约参数...';
    statusBar.style = 'margin-top: 20px; padding: 10px;background-color: #e9ecef;'
    statusBar.id = 'status-bar-id'
    sidebarContainer.appendChild(statusBar);

    // 插入分割线
    sidebarContainer.appendChild(document.createElement('hr'));

    // 勾选框1
    const checkbox1 = createCheckbox('checkbox1', '请确认是否已经登陆');
    sidebarContainer.appendChild(checkbox1);

    // 勾选框2
    const checkbox2 = createCheckbox('checkbox2', '请确认下面信息已经填写');
    sidebarContainer.appendChild(checkbox2);

    // 插入分割线
    sidebarContainer.appendChild(document.createElement('hr'));

    // 信息填写框1
    const input1 = createInput('input1', '设备名', '如, 差热分析仪');
    sidebarContainer.appendChild(input1);
    sidebarContainer.querySelector('#input1').value = requiredDeviceInfoObj.name


    // 信息填写框2
    const input2 = createInput('input2', '预约时间');
    sidebarContainer.appendChild(input2);
    sidebarContainer.querySelector('#input2').type = 'date'
    sidebarContainer.querySelector('#input2').value = requiredDeviceInfoObj.date

    // 信息填写框3
    const input3 = createInput('input3', '开始时间');
    sidebarContainer.appendChild(input3);
    sidebarContainer.querySelector('#input3').type = 'time'
    sidebarContainer.querySelector('#input3').value = requiredDeviceInfoObj.formInfo.startTime

    // 信息填写框4
    const input4 = createInput('input4', '结束时间');
    sidebarContainer.appendChild(input4);
    sidebarContainer.querySelector('#input4').type = 'time'
    sidebarContainer.querySelector('#input4').value = requiredDeviceInfoObj.formInfo.endTime

    // 信息填写框5
    const input5 = createInput('input5', '电话', '110');
    sidebarContainer.appendChild(input5);
    sidebarContainer.querySelector('#input5').type = 'tel'
    sidebarContainer.querySelector('#input5').value = requiredDeviceInfoObj.formInfo.phone

    // 信息填写框6
    const input6 = createInput('input6', '邮箱', '123@163.com');
    sidebarContainer.appendChild(input6);
    sidebarContainer.querySelector('#input6').type = 'email'
    sidebarContainer.querySelector('#input6').value = requiredDeviceInfoObj.formInfo.mail

    // 信息填写框7
    const input7 = createInput('input7', '样品名', '样品1');
    sidebarContainer.appendChild(input7);
    sidebarContainer.querySelector('#input7').value = requiredDeviceInfoObj.formInfo.sample.length>0 ? requiredDeviceInfoObj.formInfo.sample[0][0] : ''

    // 信息填写框8
    const input8 = createInput('input8', '样品数量', 123);
    sidebarContainer.appendChild(input8);
    sidebarContainer.querySelector('#input8').type = 'number'
    sidebarContainer.querySelector('#input8').value = requiredDeviceInfoObj.formInfo.sample.length>0 ? requiredDeviceInfoObj.formInfo.sample[0][0] : ''

    // 插入分割线
    sidebarContainer.appendChild(document.createElement('hr'));

    // 提交按钮
    // 现在开抢
    const Button1 = createButton('现在开抢', BookNow);
    sidebarContainer.appendChild(Button1);

    // 插入分割线
    sidebarContainer.appendChild(document.createElement('hr'));

    // 日期时间选择表单
    const dateTimeForm = createInput('input9', '开抢时间', 123);
    sidebarContainer.appendChild(dateTimeForm);
    sidebarContainer.querySelector('#input9').type = 'datetime-local'
    // sidebarContainer.querySelector('#input9').value = requiredDeviceInfoObj.bookTime

    // 定时开抢
    const Button2 = createButton('定时开抢', BookByTime);
    sidebarContainer.appendChild(Button2);


    // 终止预约
    const Button3 = createButton('终止预约', StopBook);
    sidebarContainer.appendChild(Button3);

    // 将侧边栏插入到原始页面中
    // window.top.document.body.appendChild(sidebarContainer);
    document.body.appendChild(sidebarContainer);

    // 辅助函数，创建勾选框
    function createCheckbox(id, label) {
        const checkbox = document.createElement('div');
        checkbox.className = 'form-check';
        checkbox.innerHTML = `<input class="form-check-input" type="checkbox" value="" id="${id}">
                          <label class="form-check-label" for="${id}">${label}</label>`;
        return checkbox;
    }

    // 辅助函数，创建信息填写框
    function createInput(id, strLabel, strPlaceholder) {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-group mb-3';
        inputContainer.innerHTML = `<label for="${id}" style="width: 85px;">${strLabel}</label>
                <input type="text" id="${id}" class="form-control" placeholder="${strPlaceholder}" required>`;

        return inputContainer;
    }

    // 辅助函数，创建按钮
    function createButton(text, clickFunc) {
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'd-grid gap-2 col-8 mx-auto';
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `btn btn-primary`;
        button.addEventListener('click', clickFunc);
        buttonDiv.appendChild(button)
        return buttonDiv;
    }

    // 现在开抢
    function BookNow() {
        console.log('现在开抢')

        // 要预约的设备信息
        requiredDeviceInfoObj = {
            name: document.querySelector('#input1').value, // 要中文全名, 不要后面的括号和英文型号
            date: document.querySelector('#input2').value, // 预约日期, 单个数字要写01. 若该日期无法预约, 会弹框提示
            formInfo: {
                startTime: document.querySelector('#input3').value, // 当天开始时间
                endTime: document.querySelector('#input4').value, // 当天结束时间
                phone: document.querySelector('#input5').value,
                mail: document.querySelector('#input6').value,
                sample: [
                    [document.querySelector('#input7').value, document.querySelector('#input8').value],
                    [ '样品2', 1]
                ], // 样品信息[ '样品2', 1], 多个则push多个
            }, // 填表信息, 仅填必填内容
            bookTime: new Date().toString(),
            bookProgress: 1 // 预约进度.  -1不抢|0等待定时预约|1搜索设备送样检测|2日历选择|3填表提交|4完成
            // bookOrNot: true
        }

        GM_setValue('requiredDeviceInfoObj', requiredDeviceInfoObj)

        if (window.location.pathname != '/model/yqkf/equipmentlist.html') {
            window.location.href = 'http://eqshare.just.edu.cn/model/yqkf/equipmentlist.html';
        }

        // 进入第一步抢设备
        Step1Search()
    }

    // 定时开抢
    function BookByTime() {
        console.log('定时开抢')
        if (new Date(document.querySelector('#input9').value) < new Date()) {
            alert('抢设备时间已过, 请重新设置');
            return ;
        }

        // 要预约的设备信息
        requiredDeviceInfoObj = {
            name: document.querySelector('#input1').value, // 要中文全名, 不要后面的括号和英文型号
            date: document.querySelector('#input2').value, // 预约日期, 单个数字要写01. 若该日期无法预约, 会弹框提示
            formInfo: {
                startTime: document.querySelector('#input3').value, // 当天开始时间
                endTime: document.querySelector('#input4').value, // 当天结束时间
                phone: document.querySelector('#input5').value,
                mail: document.querySelector('#input6').value,
                sample: [
                    [document.querySelector('#input7').value, document.querySelector('#input8').value],
                    [ '样品2', 1]
                ], // 样品信息, 多个则push多个
            }, // 填表信息, 仅填必填内容
            bookTime: document.querySelector('#input9').value,
            bookProgress: 0 // 预约进度.  -1不抢|0等待定时预约|1搜索设备送样检测|2日历选择|3填表提交|4完成
            // bookOrNot: true
        }

        GM_setValue('requiredDeviceInfoObj', requiredDeviceInfoObj)

        //if (window.location.pathname != '/model/yqkf/equipmentlist.html') {
            //window.location.href = 'http://eqshare.just.edu.cn/model/yqkf/equipmentlist.html';
        //}

        // 调用函数, 通过递归等待直到搜索结果刷新出来
        WaitStart();

    }

    // 终止预约
    function StopBook() {
        console.log('终止预约')

        // 设置终止预约标志
        requiredDeviceInfoObj.bookProgress = -1 // 预约进度.  -1不抢|0等待定时预约|1搜索设备送样检测|2日历选择|3填表提交|4完成
        GM_setValue('requiredDeviceInfoObj', requiredDeviceInfoObj)
        document.querySelector('#status-bar-id').textContent = ('终止预约');

    }

}



// 检测用户要求的时间段是否可用
// 可用返回
function IsTimeSlotAvailable() {



}



// 建立当前页面的设备信息列表, 并给重要标签所在元素加id属性
// listElements 页面设备li列表
function BuildDeviceInfoList(listElements) {
    // 检查是否成功获取到id为devlist的元素
    if (!listElements) {
        console.error("Cannot find element with id 'devlist'");

        return;
    }
    // 返回列表
    // [设备名， 设备名标签id， 设备预约按钮id]
    var resultList = [];

    for (var i = 0; i < listElements.length; i++) {
        // 定位到【送样检测】/【自主上机】按钮
        var deviceBookButtonElement = listElements[i].querySelector('.btn_compoment span .layui-btn-warm, .btn_compoment span .layui-btn-normal');
        // 点击按钮
        // deviceBookButtonElement.click();
        // 输出找到的元素
        // console.log(deviceBookButtonElement);

        // 定位到【设备名信息】标签
        var deviceNameElement= listElements[i].querySelector('.t a');
        // console.log(deviceNameElement);

        // 检查是否成功获取到【送样检测】/【自主上机】按钮 和 【设备名信息】标签
        if (deviceBookButtonElement && deviceNameElement) {
            var textContent = deviceNameElement.textContent || deviceNameElement.innerText;
            var href = deviceNameElement.href;

            var item = {
                textContent: textContent,
                device_name_id: 'device-name-id-' + i,
                device_book_id: 'device-book-id-' + i
            };
            resultList.push(item);

            // 给相应标签增加id属性（再使用不用定位）
            deviceBookButtonElement.id = item.device_book_id;
            deviceNameElement.id = item.device_name_id;
        }
    }

    return resultList;
}


