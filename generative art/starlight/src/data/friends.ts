// 友邻星轨数据（v2.12 全员入轨）：前 3 位进内圈轨道，其余全部进外圈轨道（与下方卡片一一对应）。
// name / url / desc / 星标符号 mark
export interface Friend {
  name: string
  url: string
  desc: string
  mark: string
}

export const friends: Friend[] = [
  { name: 'Starlight 仓库', url: 'https://github.com/xrk-hhh/starlight', desc: '这座星港本身的建造日志', mark: '✦' },
  { name: '洛谷', url: 'https://www.luogu.com.cn', desc: '刷题主场，算法星域的中转站', mark: '◈' },
  { name: '牛客竞赛', url: 'https://ac.nowcoder.com', desc: 'AC 模式刷题 · 竞赛训练场', mark: '◇' },
  { name: '余诺', url: 'https://continueyn.site', desc: '全栈开发者 · 个人作品集', mark: '✧' },
  { name: 'QQ Hamburger', url: 'https://qqhamburger.top', desc: 'CS Portfolio · 计算机科学作品集', mark: '▲' },
  { name: '李伟豪', url: 'https://mypresentboxes.com', desc: '自我 · 求索 · 亲友 · 世界，四格记录站', mark: '△' },
  { name: 'Jizen', url: 'https://jizen.top/', desc: 'Jizen 的个人站点', mark: '◈' },
  { name: 'dmw', url: 'https://chijysmile.github.io/duanmw01/', desc: 'dmw 的个人小站', mark: '✜' },
  { name: '杨禹然', url: 'https://d2e27556a0604eea89cda8bffaefb020.sh2.agentos-app.net/', desc: '杨禹然的 AgentOS 站点', mark: '❖' },
]

// 交换友链：把你的站点按上面的格式加进来，然后发邮件给站长
export const friendExchangeNote = '想交换友链？把你的站点名称、地址和一句话简介发到站长邮箱，验收通过后就会出现在轨道上。'
