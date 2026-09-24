---
title: 图上的 BFS：染色与"走到底"
date: 2026-08-16
tags: [算法竞赛, 图论, BFS]
category: 算法竞赛
difficulty: 3
desc: 两道 AtCoder 题——树边权取模后的奇偶染色，和牌堆链的"沿链走到底"统计
---

BFS 的本质是**从起点一圈一圈往外扩散**，天然的三个用途：算无权最短路、给连通块做标记、二分图染色。两道 AtCoder 题正好各占一个。

## 染色：树上的奇偶

> **题意**（[AtCoder ABC126 D - Even Relation](https://atcoder.jp/contests/abc126/tasks/abc126_d)）：n 个点的树，每条边有边权。给每个点染色：点 1 为白，其余点满足"到点 1 的距离为偶数染白、奇数染黑"。

距离模 2 有个绝好性质：**子节点距离 = 父节点距离 + 边权**，模 2 意义下边权只剩 0/1。所以从点 1 开始 BFS，`col[v] = col[u] ^ (w % 2)` 一路染下去：

![BFS 分层染色](/starlight/images/blog/bfs-layers.svg)

```cpp
#include <bits/stdc++.h>
using namespace std;

#define endl '\n'
using ll = long long;

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T = 1;
    // cin>>T;

    while (T--)
    {
        int n;
        cin>>n;

        vector<vector<pair<int, int>>> g(n + 1);
        for (int i = 0; i < n - 1; i++)
        {
            int u, v, w;
            cin>>u>>v>>w;

            g[u].push_back({v, w % 2});
            g[v].push_back({u, w % 2});
        }

        vector<int> col(n + 1, -1);
        queue<int> q;
        col[1] = 0;
        q.push(1);
        while (!q.empty())
        {
            int u = q.front();
            q.pop();

            for (auto [v, w] : g[u])
            {
                if (col[v] == -1)
                {
                    col[v] = col[u] ^ w;
                    q.push(v);
                }
            }
        }

        for (int i = 1; i <= n; i++)
        {
            cout<<col[i]<<endl;
        }
    }

    return 0;
}
```

注意代码里的预处理 `w % 2`——边权最大 10¹⁸，但染色只关心奇偶，读入时就取模。这就是"边权不小，但信息量小"的典型：**先看题目真正需要哪一位信息**。

## 走到底：牌堆链

> **题意**（AtCoder ABC455 D - Card Pile Query，形式化）：n 张牌，q 次操作，每次把牌 c 整摞放到牌 p 上（记 `down[c] = p`）；最终问每摞最底下那张牌上面压了几张。

最后的形态是若干条链。对每个没访问过的牌沿 `down` 走到底、数链长，答案记在链尾：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define endl '\n'
using ll = long long;

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T = 1;
    // cin>>T;

    while (T--)
    {
        int n, q;
        cin>>n>>q;

        // 下方牌
        vector<int> down(n + 1, 0);
        while (q--)
        {
            int c, p;
            cin>>c>>p;

            down[c] = p;
        }

        vector<bool> vis(n + 1, false);
        vector<int> ans(n + 1, 0);
        // 遍历所有牌
        for (int i = 1; i <= n; i++)
        {
            if (vis[i])
            {
                continue;
            }

            int cur = i;
            int cnt = 1;
            vis[cur] = true;
            // 从 i 开始往下走直到底部，统计链长
            while (down[cur])
            {
                cur = down[cur];
                cnt++;
                vis[cur] = true;
            }

            // cur 是底部牌
            ans[cur] = cnt;
        }

        for (int i = 1; i <= n; i++)
        {
            cout<<ans[i]<<' ';
        }
        cout<<endl;
    }

    return 0;
}
```

这份提交的妙处在于**不建图也不排序**：一个 `down[c] = p` 数组就是全部图结构，"每摞的张数"就是"从链头走到链尾的步数"。访问数组保证每条链只走一遍，总复杂度 O(n + q)。

## 两个共同点

- 都没跑最短路——BFS 只用了"逐层扩散"的遍历顺序（染色）或干脆只用"沿边走"（链遍历）；
- 都有一个**提前降维**的动作：边权取模 2、牌堆关系压缩成单个数组。图论题先想清楚"信息里哪些位是有用的"，代码会短一半。

## 连通块：数水坑

> **题意**（洛谷 [P1596 [USACO10OCT] Lake Counting S](https://www.luogu.com.cn/problem/P1596)）：N×M 的格子地里 `W` 是水、`.` 是旱，八连通的水格算一个水坑，问有几个水坑。

连通块计数的标准姿势：**扫每个格子，遇到没访问过的 `W` 就答案 +1，然后把整个连通块全部标记掉**：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define endl '\n'
using ll = long long;

// 八连通块
const int dx[] = {-1, -1, -1, 0, 0, 1, 1, 1};
const int dy[] = {-1, 0, 1, -1, 1, -1, 0, 1};

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T = 1;
    // cin>>T;

    while (T--)
    {
        int n, m;
        cin>>n>>m;

        vector<string> g(n);
        for (int i = 0; i < n; i++)
        {
            cin>>g[i];
        }

        vector<vector<bool>> vis(n, vector<bool>(m, false));
        int ans = 0;
        // 对每个位置遍历
        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < m; j++)
            {
                if (g[i][j] == 'W' && !vis[i][j])
                {
                    ans++;
                    queue<pair<int, int>> q;
                    q.push({i, j});
                    vis[i][j] = true;
                    while (!q.empty())
                    {
                        auto [x, y] = q.front();
                        q.pop();

                        // 八连通块遍历
                        for (int k = 0; k < 8; k++)
                        {
                            int nx = x + dx[k], ny = y + dy[k];
                            if (nx >= 0 && nx < n && ny >= 0 && ny < m && g[nx][ny] == 'W' && !vis[nx][ny])
                            {
                                vis[nx][ny] = true;
                                q.push({nx, ny});
                            }
                        }
                    }
                }
                
            }
        }
        
        cout<<ans<<endl;
    }

    return 0;
}
```

`dx/dy` 数组开成 8 个方向就是"八连通"，改成 4 个就是四连通——这类题的全部变化就这一行。BFS 在这里的角色不是"分层"，而是"洪水填充"（flood fill）：从任意一格出发把整片水域淹一遍。染色、走到底、数水坑——BFS 的三种打开方式，本质都是**从起点把能到的都摸一遍**。
