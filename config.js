/*
 * @Author: TonyJiangWJ
 * @Date: 2019-12-09 20:42:08
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-12-26 11:56:26
 * @Description: 
 */
let currentEngine = engines.myEngine().getSource() + ''
let isRunningMode = currentEngine.endsWith('/config.js') && typeof module === 'undefined'
let is_pro = Object.prototype.toString.call(com.stardust.autojs.core.timing.TimedTask.Companion).match(/Java(Class|Object)/)
let default_config = {
  password: '',
  timeout_unlock: 1000,
  timeout_findOne: 1000,
  timeout_existing: 8000,
  // 异步等待截图，当截图超时后重新获取截图 默认开启
  async_waiting_capture: true,
  capture_waiting_time: 500,
  show_debug_log: true,
  show_engine_id: false,
  develop_mode: false,
  develop_saving_mode: false,
  enable_visual_helper: false,
  check_device_posture: false,
  check_distance: false,
  posture_threshold_z: 6,
  auto_lock: false,
  lock_x: 150,
  lock_y: 970,
  // 是否根据当前锁屏状态来设置屏幕亮度，当锁屏状态下启动时 设置为最低亮度，结束后设置成自动亮度
  auto_set_brightness: false,
  // 锁屏启动关闭提示框
  dismiss_dialog_if_locked: true,
  request_capture_permission: true,
  capture_permission_button: 'START NOW|立即开始|允许',
  // 是否保存日志文件，如果设置为保存，则日志文件会按时间分片备份在logback/文件夹下
  save_log_file: true,
  async_save_log_file: true,
  back_size: '100',
  // 通话状态监听
  enable_call_state_control: false,
  // 单脚本模式 是否只运行一个脚本 不会同时使用其他的 开启单脚本模式 会取消任务队列的功能。
  // 比如同时使用蚂蚁庄园 则保持默认 false 否则设置为true 无视其他运行中的脚本
  single_script: false,
  auto_restart_when_crashed: false,
  // 是否使用模拟的滑动，如果滑动有问题开启这个 当前默认关闭 经常有人手机上有虚拟按键 然后又不看文档注释的
  useCustomScrollDown: true,
  // 排行榜列表下滑速度 200毫秒 不要太低否则滑动不生效 仅仅针对useCustomScrollDown=true的情况
  scrollDownSpeed: 200,
  bottomHeight: 200,
  // 当以下包正在前台运行时，延迟执行
  skip_running_packages: [],
  warn_skipped_ignore_package: false,
  warn_skipped_too_much: false,
  // 延迟启动时延 5秒 悬浮窗中进行的倒计时时间
  delayStartTime: 5,
  device_width: device.width,
  device_height: device.height,
  // 是否是AutoJS Pro  需要屏蔽部分功能，暂时无法实现：生命周期监听等 包括通话监听
  is_pro: is_pro,
  auto_set_bang_offset: true,
  bang_offset: 0,
  thread_name_prefix: 'autoscript_',


    //===淘金币收集===

    //===任务开关===
    //简单的逛逛浏览任务
    ck_simple_task: true,
    //蚂蚁庄园喂小鸡任务
    ck_feedchick_task: true,
    //淘宝人生掷骰子任务
    ck_dice_task: true,
    //200淘金币夺宝任务
    ck_doubao_task: true,
    //淘宝成就的签到任务
    ck_achievement_task: true,
    //淘宝成就月账单任务
    ck_achievement_month_task: true,
    //天猫程序领红包任务
    ck_tianmao_task: true,
    //支付宝蚂蚁森林任务
    ck_antforest: true,
    //开心砖块消消乐任务
    ck_xiaoxiaole_task: true,
    //逛农场免费水果任务
    ck_baba_farm_task: true,
    //逛好店领10金币
    ck_browse_goog_shop: true,
    //逛好店浏览10秒任务-10秒+10
    ck_earn_10coin: true,
    //逛好店浏览10秒任务-收藏+10
    ck_pat_shop: true,
    //淘宝人生套装任务
    ck_baba_suit_task: true,
    //开心消消乐任务
    ck_baba_xxl_task: true,
    //支付宝农场任务
    ck_baba_zhifubao_task: true,
    //好友森林任务
    ck_baba_friend_forest_task: true,

    //===任务设置===
    //执行期间静音
    ck_mute_during_execution: true,

    //===关键字===
    //任务执行按钮关键字
    txt_btn_reg_str: "去完成|去施肥|去领取|去浏览|去逛逛|去消除|去看看",
    //任务列表界面关键字
    txt_task_list_ui_reg: "做任务赚金币",
    //简单浏览任务关键字
    txt_simple_task_reg_str: "浏览1|逛1|浏览抽|浏览得能|逛聚划算|逛菜鸟|步数|浏览心",
    //简单任务跳过关键字
    txt_simple_skip_reg_str: "商品同款|逛好店|去天猫APP",
    //庄园小鸡任务关键字
    txt_feedchick_task_reg_str: "喂小鸡",
    //逛好店10金币关键字
    txt_browse_goog_shop_reg_str: "逛好店",
    //农场水果任务关键字
    txt_baba_farm_task_reg_str: "逛农场",
    //点掷骰子任务关键字
    txt_dice_task_reg_str: "骰子",
    //200淘金币夺宝关键字
    txt_doubao_task_reg_str: "金币夺宝",
    //淘宝成就签到关键字
    txt_achievement_task_reg_str: "淘宝成就签到",
    //淘宝成就月账单关键字
    txt_achievement_month_reg_str: "淘宝成就月账单",
    //蚂蚁森林任务关键字
    txt_antforest_reg_str: "蚂蚁森林",
    //天猫领红包任务关键字
    txt_tianmao_task_reg_str: "去天猫APP领红包",
    //开心消消乐任务关键字
    txt_xiaoxiaole_task_reg_str: "消除"

}
// 不同项目需要设置不同的storageName，不然会导致配置信息混乱
let CONFIG_STORAGE_NAME = 'ant_credits_config_fork_version'
let PROJECT_NAME = '淘金币自动执行'
let config = {}
let storageConfig = storages.create(CONFIG_STORAGE_NAME)
Object.keys(default_config).forEach(key => {
  let storedVal = storageConfig.get(key)
  if (typeof storedVal !== 'undefined') {
    config[key] = storedVal
  } else {
    config[key] = default_config[key]
  }
})


if (!isRunningMode) {
  module.exports = function (__runtime__, scope) {
    if (typeof scope.config_instance === 'undefined') {
      scope.config_instance = {
        config: config,
        default_config: default_config,
        storage_name: CONFIG_STORAGE_NAME,
        project_name: PROJECT_NAME
      }
    }
    return scope.config_instance
  }
} else {
  setTimeout(function () {
    engines.execScriptFile(files.cwd() + "/可视化配置.js", { path: files.cwd() })
  }, 30)
}
