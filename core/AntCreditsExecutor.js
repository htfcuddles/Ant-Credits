let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')

function AntCreditsExecutor() {
    //===================用户可编辑参数===================
    //所有任务重复次数,解决新增任务问题
    var MAX_ALL_TASK_EPOCH = 2
    //浏览任务最大执行次数
    var MAX_EPOCH = 101
    //任务执行默认等待的时长 考虑到网络卡顿问题 默认15秒
    var wait_sec = 15
    //序列化数据到本地
    var storage = storages.create("javis486");
    //线程执行其任务
    var thread = null
    //程序包名
    const _package_name = 'com.taobao.taobao'

    //===================通用函数=========================
    //点击控件
    function btn_click(x) { if (x) return x.click() }

    //点击控件所在坐标
    function btn_position_click(x) { if (x) click(x.bounds().centerX(), x.bounds().centerY()) }

    //不断查找元素x的父元素，指定满足要求(解决模拟器和手机不查找元素不一致问题)
    function btn_assure_click(x) {
        if (x && x.clickable()) return x.click()
        for (let ii = 0; ii < 6; ii++) {
            if (!x) break
            x = x.parent()
            if (x && x.clickable()) return x.click()
            let list_x = x.children()
            for (let i = 0; i < list_x.length; i++) {
                if (list_x[i] && list_x[i].clickable()) {
                    return list_x[i].click()
                }
            }
        }
        return false
    }

    //消息提示
    function toast_console(msg, tshow) {
        console.log(msg);
        if (tshow) toast(msg);
    }

    // 截屏查找图片颜色并单击对应的点
    function cs_click(num, rgb, xr, yr, wr, hr, flipup) {
        while (num--) {
            let img = captureScreen()
            if (flipup != undefined) img = images.rotate(img, 180)
            let point = findColor(img, rgb, { region: [img.getWidth() * xr, img.getHeight() * yr, img.getWidth() * wr, img.getHeight() * hr], threshold: 8 })
            if (point) {
                if (flipup != undefined) {
                    point.x = img.getWidth() - point.x; point.y = img.getHeight() - point.y
                }
                return click(point.x, point.y);
            }
            if (num) sleep(1000)
        }
        return false
    }

    //===================业务逻辑函数=========================
    //获取[浏览以下商品]的所在组控件数
    function get_group_count() {
        let x = textContains('浏览以下商品').findOne(5)
        if (x) return x.parent().childCount()
        return 0
    }

    //等待sec秒，有完成提示后立即返回
    function wait(sec, title) {
        let t_sec = sec
        let pre_num = 0  //[浏览以下商品]的所在组控件数有时会变化
        slide_down = title && title.indexOf('精选') > -1
        while (sec--) {
            let a1 = textMatches('点我领取奖励|任务已完成快去领奖吧|任务完成|任务已完成|任务已经|任务已经全部完成啦').findOne(10)
            let cur_num = get_group_count()
            let a10 = pre_num > 0 && cur_num != pre_num; pre_num = cur_num
            let a = descMatches('任务完成|快去领奖吧').findOne(1000)
            if (a1 || a10 || a) {
                toast_console('到时立即返回')
                return true
            }
            if (sec <= t_sec - 2 && slide_down) {
                swipe(device.width * 0.5, device.height * 0.75, device.width * 0.5, device.height * 0.5, 800)
            }
        }
        toast_console('等待' + t_sec + 's返回');
        return true
    }

    //根据正则表达式获取任务
    function get_task(key_reg_str, skip_reg) {
        sleep(500); textMatches('每日来访领能量.+|累计任务奖励|x500').findOne(2000);
        let list_x = textMatches(input_value(config.txt_btn_reg_str)).find()
        let reg = new RegExp(key_reg_str)
        for (let i = 0; i < list_x.length; i++) {
            let btn_topic = list_x[i].parent().child(0).child(0) //主题
            let btn_desc = list_x[i].parent().child(0).child(1).child(0) //描述
            if (!btn_desc) continue
            let txt_desc = btn_desc.text()
            let txt_topic = btn_topic.text()
            if (skip_reg != undefined && skip_reg.test(txt_topic)) continue
            if (reg.test(txt_desc) || reg.test(txt_topic)) {
                toast_console(txt_topic)
                let obj = new Object(); obj.x = list_x[i]; obj.txt = txt_topic;
                return obj
            }
        }
        return null
    }

    //淘金币获取奖励
    function get_rewards(reward) {
        if (reward) {
            sleep(500); btn_click(text('领取奖励').findOne(1000)); sleep(3000) //等待调整布局 
        }
    }

    //确保任务按钮被单击，解决单击时布局发生改变的问题
    function assure_click_task(name) {
        let obj = null
        for (let i = 0; i < 3; i++) {
            obj = get_task(name)
            if (!obj) return false
            if (obj.x) break
        }
        if (!obj.x) {
            toast_console('无法找到[' + name + '任务],请确保其在未完成任务列表中'); return false
        }
        obj.x.click();
        return true
    }

    //保证返回到任务界面
    function assure_back(tag) {
        let num = 8
        while (num-- && !text(tag).findOne(1000)) {
            back()
            btn_click(textMatches("残忍离开|立即领取").findOne(200))
        }
    }

    //淘宝人生套装任务
    function suit_task() {
        toast_console('查看-淘宝人生套装任务')
        if (!assure_click_task('套装')) return
        sleep(5000); cs_click(6, '#fed362', 0.2, 0.05, 0.7, 0.4, true) //领取套装
        sleep(5000); assure_back('x500')
    }

    function do_baba_farm(all_task) {
        //金色获取肥料按钮
        btn_click(text('继续努力').findOne(1000))
        if (btn_click(text('立即领取').findOne(1000))) {
            btn_assure_click(text('肥料礼包').findOne(1000))
            btn_click(text('开心收下').findOne(1000))
            btn_click(text('去施肥').findOne(1000))
        }
        cs_click(6, '#fed362', 0.5, 0.45, 0.45, 0.25) //领取肥料
        sleep(500); btn_position_click(text('去施肥，赚更多肥料').findOne(1000)); sleep(500)
        //签到列表领肥料
        if (cs_click(3, '#9dbe77', 0.66, 0.66, 0.25, 0.25)) {
            console.log('打开签到列表领肥料'); sleep(1000)
            btn_click(text('去签到').findOne(1000)); btn_click(text('去领取').findOne(1000)); sleep(2000)
            if (all_task) {
                do_simple_task(16, 16, '浏览', 'x500', false)
                if (config.ck_baba_suit_task) {
                    suit_task()
                }
                if (config.ck_baba_xxl_task) {
                    xiaoxiaole_task()
                }
                if (config.ck_baba_zhifubao_task) {
                    zhifubao_baba_farm_task()
                }
            }
            btn_click(text('去领取').findOne(1000))
            btn_click(text('关闭').findOne(1000)); sleep(1000)
            if (all_task && config.ck_baba_friend_forest_task) {
                friend_forest_task()
            }
        }
    }

    //芭芭农场任务
    function baba_farm_task() {
        toast_console('查看-芭芭农场任务')
        if (!assure_click_task(input_value(config.txt_baba_farm_task_reg_str))) return
        sleep(6000)
        do_baba_farm()
        cs_click(3, '#fff39f', 0.45, 0.6, 0.25, 0.35)   //金色施肥按钮
        sleep(500); assure_back(input_value(config.txt_task_list_ui_reg)); get_rewards(true)
    }

    //淘宝成就签到
    function achievement_signin_task() {
        toast_console('查看-淘宝成就签到任务')
        if (!assure_click_task(input_value(config.txt_achievement_task_reg_str))) return
        btn_click(text("成就礼包").findOne(3000))
        btn_click(text("我收下了").findOne(1000))
        let btn_x = text('成就签到').findOne(2000)
        if (btn_x) {
            btn_x.parent().child(3).click()
        }
        btn_click(text("我收下了").findOne(1000))
        sleep(1000); assure_back(input_value(config.txt_task_list_ui_reg)); get_rewards(true)
    }

    //淘宝成就月账单任务
    function achievement_month_task() {
        toast_console('查看-淘宝成就月账单任务')
        if (!assure_click_task(input_value(config.txt_achievement_month_reg_str))) return
        btn_assure_click(text('月度账单').findOne(3000)); sleep(2000)
        assure_back(input_value(config.txt_task_list_ui_reg)); get_rewards(true)

    }

    //喂小鸡任务，可以直接返回
    function feed_chick_task() {
        toast_console('查看-蚂蚁庄园喂小鸡任务')
        if (!assure_click_task(input_value(config.txt_feedchick_task_reg_str))) return
        sleep(1000); btn_click(text('取消').findOne(2000));
        assure_back(input_value(config.txt_task_list_ui_reg)); get_rewards(true)
    }

    //蚂蚁森林偷取能量
    function steal_energy(num_find) {
        let num = 5
        while (num-- && !textMatches('.+动态').findOne(1000)) sleep(500);
        if (textMatches('.+动态').findOne(500)) {
            let point = null; num = 5
            while (num--) {
                let img = captureScreen();
                point = findColor(img, '#ff6e01', { region: [img.getWidth() * 0.7, img.getHeight() * 0.6, img.getWidth() * 0.25, img.getHeight() * 0.25], threshold: 8 })
                if (point) break
                sleep(1000)
            }
            if (!point) {
                toast('找能量按钮去哪了?'); exit()
            }
            for (let i = 1; i <= num_find; i++) {
                for (let j = 0; j < 12; j++) {
                    if (!cs_click(1, '#b6ff00', 0.1, 0.2, 0.8, 0.4)) break
                    sleep(400)
                }
                if (num_find == 1) return
                click(point.x, point.y); sleep(1500)
                if (!textMatches('.+动态').findOne(1000)) break
                toast('找能量/' + i)
            }
        }
        toast('找能量执行完毕')
    }

    //蚂蚁森林任务
    function ant_forest_task(num, back_reg) {
        toast_console('查看-蚂蚁森林任务')
        if (!assure_click_task(input_value(config.txt_antforest_reg_str))) return
        btn_click(text('打开').findOne(1000))
        sleep(2000); console.hide(); steal_energy(num); console.show()
        assure_back(back_reg); get_rewards(true)
    }

    //逛好店领10金币
    function browse_goodshop_task(not_key_reg_str) {
        toast_console('查看-逛好店并领10金币任务')
        if (!assure_click_task(input_value(config.txt_browse_goog_shop_reg_str))) return
        for (let i = 0; i < 11 && config.ck_earn_10coin; i++) {
            let btn_x = desc('逛10秒+10').findOne(2000)
            toast_console('逛10秒+10金币/' + (i + 1))
            if (!btn_x) break
            btn_x.parent().click(); sleep(13000);
            if (config.ck_pat_shop) {
                tn_x = textContains('+10').findOne(800)
                if (btn_x) {
                    btn_click(btn_x.parent()); sleep(800)
                }
            }
            back(); sleep(800);
        }
        wait(wait_sec); assure_back(input_value(config.txt_task_list_ui_reg)); get_rewards(true)
    }

    //去天猫红包任务
    function tianmao_task() {
        toast_console('查看-去天猫APP领红包任务')
        if (!assure_click_task(input_value(config.txt_tianmao_task_reg_str))) return
        sleep(4000)

        if (text('打开手机天猫APP').findOne(1500)) {
            back(); sleep(1500); back(); wait(wait_sec)
        }
        else if (text('攻略').findOne(4000)) {
            btn_click(textContains('继续逛逛').findOne(1000))
            wait(wait_sec)
        }

        assure_back(input_value(config.txt_task_list_ui_reg)); get_rewards(true)
    }

    //掷骰子任务
    function dice_task() {
        toast_console('查看-淘宝人生掷骰子任务')
        if (!assure_click_task(input_value(config.txt_dice_task_reg_str))) return
        console.hide(); sleep(13000);
        //去他大爷的神秘礼物
        toast_console('掷骰子任务-查看是否有神秘礼物(QTM的神秘礼盒)', true)
        cs_click(5, '#e9e9e9', 0.2, 0.1, 0.6, 0.6, true);
        //单击礼包
        toast_console('掷骰子任务-查看是否有礼包(QTM的礼包)', true)
        cs_click(3, '#fee998', 0.2, 0.2, 0.7, 0.8);
        //橙色收下奖励按钮按钮
        toast_console('掷骰子任务-点击5次开心收下按钮(一点都不开心- -)', true)
        for (let i = 0; i < 5; i++) {
            cs_click(1, '#ff7d44', 0.1, 0.15, 0.2, 0.5, true); sleep(500)
        }
        sleep(1000)
        //金色前进按钮
        toast_console('掷骰子任务-尝试点击色子前进', true)
        cs_click(4, '#fff89d', 0.2, 0.5, 0.45, 0.3); sleep(3000)
        //橙色收下奖励按钮按钮
        cs_click(2, '#ff7d44', 0.1, 0.15, 0.2, 0.5, true);
        back(); sleep(1000)
        //橙色返回淘宝按钮
        cs_click(3, '#ff7d44', 0.1, 0.15, 0.2, 0.5, true)
        btn_click(text('立刻离开').findOne(1000)); get_rewards(true); console.show()
    }


    //消消乐任务
    function xiaoxiaole_task() {
        toast_console('查看-消消乐任务')
        if (!assure_click_task(input_value(config.txt_xiaoxiaole_task_reg_str))) return
        console.hide(); sleep(10000)
        cs_click(3, '#11c6bf', 0.2, 0.6, 0.3, 0.3);  //开心收下奖励
        cs_click(3, '#ffffff', 0.8, 0.05, 0.2, 0.2) //跳过
        sleep(2000)
        //回到主页
        for (let i = 0; i < 6; i++) {
            cs_click(1, '#8d5546', 0, 0, 0.1, 0.1); sleep(1000) //back(); 
            if (cs_click(1, '#ffbd29', 0.2, 0.5, 0.45, 0.45)) break //橙色返回
            if (cs_click(1, '#965417', 0.2, 0.2, 0.6, 0.6, true)) break //咖啡色暂时返回
        }
        toast("回到主页了么,您?");
        sleep(3000) //过渡动画
        //邮件领取 pass
        cs_click(3, '#ffffff', 0.65, 0.15, 0.3, 0.5); sleep(500)
        //滑到屏幕下方
        for (let i = 0; i < 8; i++)swipe(device.width / 2, device.height / 2, device.width / 2, device.height / 5, 500)
        //点击第一关 绿色圆圈
        sleep(1000); cs_click(3, '#63cbc4', 0.5, 0.3, 0.4, 0.4, true); sleep(2000)
        //开始 绿色方块
        cs_click(2, '#11c6bf', 0.3, 0.5, 0.3, 0.3); sleep(2000)
        cs_click(3, '#ffffff', 0.8, 0.05, 0.2, 0.2) //跳过
        sleep(2000)
        //消除方块,兼容不同机型
        let rgb = '#fff0e0'
        img = captureScreen()
        let point1 = findColor(img, rgb, { region: [img.getWidth() * 0.2, img.getHeight() * 0.3, img.getWidth() * 0.4, img.getHeight() * 0.4], threshold: 4 })
        img = images.rotate(img, 180)
        let point2 = findColor(img, rgb, { region: [img.getWidth() * 0.2, img.getHeight() * 0.3, img.getWidth() * 0.4, img.getHeight() * 0.4], threshold: 4 })
        if (point1 && point2) {
            let box_x = (img.getWidth() - point2.x - point1.x) / 5
            let box_y = (img.getHeight() - point2.y - point1.y) / 6
            list_xy = [[0, 1, 0, 2], [0, 5, 0, 4], [2, 2, 3, 2]]
            list_xy.forEach(xy => {
                x1 = (xy[0] + 0.5) * box_x + point1.x; x2 = (xy[2] + 0.5) * box_x + point1.x
                y1 = (xy[1] + 0.5) * box_y + point1.y; y2 = (xy[3] + 0.5) * box_y + point1.y
                swipe(x1, y1, x2, y2, 600); sleep(800)
            });
        }
        cs_click(2, '#8d5546', 0, 0, 0.1, 0.1); //back()
        sleep(1000);
        //回到主页1 灰色的暂时离开
        cs_click(2, '#9d6031', 0.2, 0.2, 0.4, 0.5, true)
        //回到主页2 金色的回到主页
        cs_click(2, '#ffbd29', 0.2, 0.5, 0.45, 0.45); sleep(2000);
        //再挑战?
        cs_click(5, '#ffffff', 0.6, 0.15, 0.35, 0.5); sleep(800)
        //返回淘宝按钮
        back(); sleep(1000);
        cs_click(3, '#ff6e09', 0.2, 0.2, 0.4, 0.4, true);
        console.show(); get_rewards(true)
    }

    //淘金币夺宝任务,需花费100淘金币
    function duobao_task(back_reg) {
        toast_console('查看-100淘金币夺宝任务')
        if (!assure_click_task(input_value(config.txt_doubao_task_reg_str))) return
        if (btn_assure_click(text('去“我的奖品”查看').findOne(3000))) {
            swipe(device.width / 2, device.height * 0.8, device.width / 2, device.height * 0.2, 500)
        }
        btn_assure_click(textMatches('立即参与|立即夺宝').findOne(3000))
        btn_click(text('参与兑换抽奖号').findOne(3000))
        let num = 5
        while (num--) btn_click(text('-').findOne(1000))
        btn_click(text('确定兑换').findOne(1000)); sleep(200)
        btn_click(text('确认兑换').findOne(1000)); sleep(200)
        btn_click(text('我知道了').findOne(1000)); sleep(1000)
        back(); sleep(800); back(); sleep(800); back(); sleep(800); cs_click(4, '#ff7d44', 0.1, 0.2, 0.5, 0.5, true)
        get_rewards(true)
    }

    //执行简单的浏览任务
    function do_simple_task(epoch, sec, reg_str, back_reg, reward) {
        toast_console('查看-可执行的简单浏览任务')
        skip_reg = new RegExp(input_value(config.txt_simple_skip_reg_str))
        for (let i = 0; i < epoch; i++) {
            let obj = get_task(reg_str, skip_reg)
            if (!obj) {
                console.log('简单浏览任务执行完毕'); break
            }
            if (!obj.x) {
                console.log('继续执行简单浏览任务'); continue
            }
            obj.x.click();
            wait(sec, obj.txt)
            let num = 8
            while (num-- && !text(back_reg).findOne(1000)) {
                if (obj.txt.indexOf('充值金') > -1) {
                    btn_click(text('O1CN01NN8T8d1tBlBM5R7qG_!!6000000005864-1-tps-100-100').findOne(1000))
                    sleep(500); btn_click(text('立即领取').findOne(1000)); sleep(500);
                }
                back(); btn_position_click(desc('继续退出').findOne(400))
                btn_click(textMatches('残忍离开|回到淘宝').findOne(400))
                //if (obj.txt.indexOf('淘宝吃货') > -1) cs_click(1, '#ff4c55', 0.2, 0.2, 0.4, 0.4, true)
            }
            get_rewards(reward)
        }
    }


    //进入到淘金币列表界面
    function get_into_taojinbi_task_list() {
        let task_list_ui_reg = input_value(config.txt_task_list_ui_reg)
        if (!text(task_list_ui_reg).findOne(2000)) {
            let num = 8
            while (num-- && !desc('领淘金币').findOne(1000)) back();
            let btn_x = desc('领淘金币').findOne(500)
            if (!btn_x) {
                toast_console('请手动回到我的淘宝主界面后重新运行'); exit()
            }
            btn_x.click(); toast_console('进入到淘金币主界面..'); sleep(2000)
            for (let i = 0; i < 6; i++) {
                btn_click(text('签到领金币').findOne(1000)); btn_click(text('领取奖励').findOne(1000))
                btn_x = text('赚金币').findOne(1000)
                if (btn_x) break
            }
            if (!btn_x) {
                toast_console('无法找到[赚金币]按钮,请重新运行程序'); exit()
            }
            btn_x.click()
        }
        toast_console('进入到淘金币列表界面..'); textMatches('每日来访领能量.+').findOne(6000);
    }

    //红包签到
    function do_envelope_signin() {
        let btn = desc('红包签到').findOne(1000)
        if (btn) {
            btn.click(); sleep(3000); back()
        }
    }

    //启动淘宝并进入到我的界面
    function enter_mine() {
        toast_console('启动淘宝app')
        app.launch('com.taobao.taobao'); sleep(1500)
        btn_click(desc('我的淘宝').findOne(2000)); sleep(1000)
    }

    function taojinbi_task() {
        let simple_task_reg_str = input_value(config.txt_simple_task_reg_str)
        let task_list_ui_reg = input_value(config.txt_task_list_ui_reg)
        for (let i = 0; i < MAX_ALL_TASK_EPOCH; i++) {
            toast_console("#第" + (i + 1) + "次执行全任务")
            enter_mine()
            if (config.ck_envelope_task) {
                do_envelope_signin()
            }
            get_into_taojinbi_task_list()
            if (config.ck_simple_task) {
                do_simple_task(MAX_EPOCH, wait_sec, simple_task_reg_str, task_list_ui_reg, true)
            }
            if (config.ck_feedchick_task) {
                feed_chick_task()
            }
            if (config.ck_dice_task) {
                dice_task()
            }
            if (config.ck_baba_farm_task) {
                baba_farm_task()
            }
            if (config.ck_antforest) {
                ant_forest_task(8, input_value(config.txt_task_list_ui_reg))
            }
            if (config.ck_browse_goog_shop) {
                browse_goodshop_task();
            }
            if (config.ck_achievement_month_task) {
                achievement_month_task()
            }
            if (config.ck_achievement_task) {
                achievement_signin_task()
            }
            if (config.ck_doubao_task) {
                duobao_task(task_list_ui_reg)
            }
            if (config.ck_tianmao_task) {
                tianmao_task()
            }
            if (config.ck_xiaoxiaole_task) {
                xiaoxiaole_task()
            }
            get_rewards(true)
        }
        toast_console('*****淘金任务执行完毕*****')
    }

    function main() {
        console.show();
        console.log("淘金币" + storage.get('taojinbi_version', '') + " 本APP完全免费，作者:Javis486，github下载地址：https://github.com/JavisPeng/taojinbi")
        taojinbi_task();
        toast_console('###***全部任务执行完毕***###')
    }


    function input_value(x) {
        return x
    }

    //直接启动支付宝蚂蚁森林偷取好友能量,需添加蚂蚁森林到首页
    function zfb_antforest() {
        if (thread && thread.isAlive()) {
            toast_console('当前程序正在执行其他任务,请结束后再运行', true); return
        }
        thread = threads.start(function () {
            requestScreenCapture(false);
            app.launch('com.eg.android.AlipayGphone'); sleep(2000)
            let btn_ant = textContains('蚂蚁森林').findOne(5000)
            if (!btn_ant) {
                toast_console('无法找到蚂蚁森林,请先添加到支付宝首页', true); return
            }
            btn_position_click(btn_ant)
            steal_energy(64);
        });
    }

    //单独执行芭芭农场全任务
    function solo_baba_farm() {
        if (thread && thread.isAlive()) {
            toast_console('当前程序正在执行其他任务,请结束后再运行', true); return
        }
        thread = threads.start(function () {
            requestScreenCapture(false);
            app.launch('com.taobao.taobao');
            if (!text('亲密度').findOne(1000)) {
                btn_assure_click(desc('我的淘宝').findOne(3000))
                let btn_x = desc('芭芭农场').findOne(3000)
                if (!btn_x) {
                    toast_console('无法进入芭芭农场主界面,请手动回到淘宝主界面后重新运行'); exit()
                }
                btn_x.click(); toast_console('进入芭芭农场主界面..');
                sleep(6000)
                btn_click(text('立即去收').findOne(2000))
                if (text('兑换').findOne(3000)) {
                    cs_click(2, '#984f2e', 0.05, 0.2, 0.1, 0.3); sleep(6000)
                }
            }
            console.show()
            do_baba_farm(true)
            toast_console('**芭芭农场任务完成**');
        });
    }

    //支付宝芭芭农场
    function zhifubao_baba_farm_task() {
        toast_console('查看-支付宝芭芭农场任务')
        //if (!assure_click_task('支付宝芭芭农场')) return
        btn_position_click(textContains('支付宝芭芭农场').findOne(1000))
        toast_console('等待农场主界面出现');
        btn_click(text('继续赚肥料').findOne(7000)); sleep(2000)
        toast_console('领取肥料');
        cs_click(4, '#fed362', 0.55, 0.65, 0.45, 0.15); sleep(1500); //领取肥料
        btn_click(text('去施肥').findOne(1000)); sleep(500)
        if (cs_click(2, '#fed362', 0.1, 0.2, 0.1, 0.2, true)) {  //打开列表
            toast_console('开始领取'); sleep(1500)
            for (let i = 0; i < 4; i++) {
                btn_click(text('领取').findOne(500)); sleep(500)
            }
            let btn_water = textContains('浇水').findOne(1000)//蚂蚁森林任务
            if (btn_water) {
                click(btn_water.bounds().right + 10, btn_water.bounds().top)
                console.hide(); steal_energy(1, true); assure_back('队伍设置'); console.show()
                sleep(1000); btn_click(text('领取').findOne(1000));
            }
            if (btn_click(text('去逛逛').findOne(1000))) {
                sleep(4000); btn_click(textContains('继续赚').findOne(5000)); return
            }
        }
        assure_back('x500')
    }

    //芭芭农场中的好友林
    function friend_forest_task() {
        toast_console('前往芭芭农场中的好友林'); sleep(3000)
        btn_click(textContains('我知道啦').findOne(3500))
        console.hide()
        cs_click(3, '#fed362', 0.01, 0.5, 0.2, 0.3); sleep(2000)// 打开好友林
        if (cs_click(3, '#b63223', 0.4, 0.1, 0.2, 0.3)) { //中心领取
            btn_click(textMatches('继续加油|开心收下').findOne(1000))
        }
        //收取肥料
        let fu = images.fromBase64('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABEDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAMCBQb/xAAcEAACAwEBAQEAAAAAAAAAAAABAgADERITIQT/xAAXAQADAQAAAAAAAAAAAAAAAAAAAwQF/8QAGBEBAQADAAAAAAAAAAAAAAAAAAECERL/2gAMAwEAAhEDEQA/ALHn1f8AQQzau59khWE8LFZtY/RsQz2e1qVkAEndjK1ue2hWZeUOiZ8TY3dabmEX0YQP5f/Z')
        for (let i = 0; i < 8; i++) {
            let img = captureScreen()
            var point = findImage(img, fu, { region: [0.1 * device.width, 0.3 * device.height], threshold: 0.9 });
            if (point) {
                click(point.x, point.y); sleep(1000)
            }
        }
        if (btn_click(text('点我领肥料').findOne(1000))) {
            btn_click(text('立即去浇灌').findOne(1000)); console.show(); sleep(4000); return
        }
        if (btn_click(text('立即领取').findOne(1000))) {
            btn_click(text('开心收下').findOne(1000))
        }
        console.show(); back()
    }

    //取消关注的店铺
    function cancel_pat_shop() {
        if (thread && thread.isAlive()) {
            toast_console('当前程序正在执行其他任务,请结束后再运行', true); return
        }
        thread = threads.start(function () {
            app.launch('com.taobao.taobao');
            toast('单击我的淘宝'); btn_assure_click(desc('我的淘宝').findOne(6000))
            toast('点击关注店铺'); btn_assure_click(desc('订阅店铺').findOne(2000)); sleep(1000)
            btn_assure_click(desc('全部').findOne(2000));
            for (let i = 0; i < MAX_EPOCH; i++) {
                let list_x = className("ImageView").find()
                for (let i = 0; i < list_x.length; i++) {
                    let btn_x = list_x[i]
                    let h = btn_x.bounds().bottom - btn_x.bounds().top
                    if (h < 10) { //hight较小的控件
                        if (btn_x && btn_x.parent()) {
                            btn_x.parent().click(); sleep(500)
                            let bnt_cancel = desc('取消订阅').findOne(1000)
                            if (bnt_cancel) {
                                btn_click(bnt_cancel.parent()); sleep(500)
                            }
                        }
                    }
                }
            }
        })
    }
    return {
        exec: function () {
            volume = device.getMusicVolume()
            try {
                if (config.ck_mute_during_execution) {
                    toast_console('执行静音')
                    device.setMusicVolume(0)
                }
                main()
            } finally {  
                if (config.ck_mute_during_execution) {
                    toast_console('恢复音量:' + volume)
                    device.setMusicVolume(volume)
                }
                console.hide()

            }
            commonFunctions.minimize(_package_name)
        }
    }
}
module.exports = new AntCreditsExecutor()