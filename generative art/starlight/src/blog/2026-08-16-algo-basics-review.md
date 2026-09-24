---
title: 贪心与背包：交换一下，倒着走走
date: 2026-08-16
tags: [算法竞赛, 贪心, 动态规划]
category: 算法竞赛
difficulty: 2
desc: 洛谷 P1090/P1048/P1616——合并果子的交换论证，与 01/完全背包仅一字之差的循环顺序
---

贪心和背包是"简单题最多、翻车也最多"的两个知识点。这篇的三道题都出自我自己的通过记录，代码为当时提交的 C++ 原版。

## 一、贪心：先写"最平均"的方案，再证明它不败

[P1090 合并果子](https://www.luogu.com.cn/problem/P1090)（NOIP 2004 提高组）是我的贪心启蒙题：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define endl '\n'
#define ll long long

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

        priority_queue<int, vector<int>, greater<int>> pq;
        for (int i = 0; i < n; i++)
        {
            int x;
            cin>>x;

            pq.push(x);
        }

        int ans = 0;
        while (pq.size() > 1)
        {
            int t1 = pq.top();
            pq.pop();

            int t2 = pq.top();
            pq.pop();

            int t = t1 + t2;
            ans += t;

            pq.push(t);
        }

        cout<<ans<<endl;
    }

    return 0;
}
```

核心是 `priority_queue<int, vector<int>, greater<int>>` 小根堆：每次弹出最小的两堆合并、把结果塞回去。为什么对？**交换论证**：假设某次合并的不是最小的两堆，把它们换成更小的两堆，总代价严格变小——所以最优解每一步都必须拿最小的两堆。贪心题的证明大多长这样：假设最优解不和贪心一样，交换之后不变差。

## 二、背包：正序与倒序的一字之差

两道题对照着刷，01 背包和完全背包的区别一辈子忘不掉。

![01 背包倒序与完全背包正序](/starlight/images/blog/knapsack-order.svg)

[P1048 采药](https://www.luogu.com.cn/problem/P1048)（NOIP 2005 普及组），01 背包，**倒序**枚举容量：

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
        int t, m;
        cin>>t>>m;

        vector<int> tt(m), v(m);
        for (int i = 0; i < m; i++)
        {
            cin>>tt[i]>>v[i];
        }

        // 01背包（采药）
        vector<int> dp(t + 1, 0);
        int cur = 0;
        for (int i = 0; i < m; i++)
        {
            // 倒序更新，保证 dp[j - tt[i]]还没有被当前物品更新，以保证每个物品只取一次
            for (int j = t; j >= tt[i]; j--)
            {
                dp[j] = max(dp[j], dp[j - tt[i]] + v[i]);
            }
        }

        cout<<dp[t]<<endl;
    }

    return 0;
}
```

提交版里我自己写的注释就是当时的理解：*"倒序更新，保证 dp[j - tt[i]] 还没有被当前物品更新，以保证每个物品只取一次"*。

[P1616 疯狂的采药](https://www.luogu.com.cn/problem/P1616)，完全背包，**正序**：

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
        int t, m;
        cin>>t>>m;

        vector<int> a(m), b(m);
        for (int i = 0; i < m; i++)
        {
            cin>>a[i]>>b[i];
        }

        // 完全背包（疯狂的采药）
        vector<ll> dp(t + 1, 0);
        for (int i = 0; i < m; i++)
        {
            // 正序，因为每个物品可以取无限次
            for (int j = a[i]; j <= t; j++)
            {
                dp[j] = max(dp[j], dp[j - a[i]] + b[i]);
            }
        }

        cout<<dp[t]<<endl;
    }

    return 0;
}
```

注释同样写着：*"正序，因为每个物品可以取无限次"*。注意这份提交里 dp 开的是 `vector<ll>`：这题容量给到 10⁷，int 会炸。

## 三、怎么区分"这题是贪心还是 DP"

我的判断口诀：**如果能构造出"局部最优拼起来不是全局最优"的反例，就老老实实 DP**。比如采药——先采性价比最高的药会把背包塞满，反例随手能造，所以是背包；而合并果子按"最小两堆"合并无法构造反例（交换论证堵死了），所以是贪心。构造反例的能力，就是贪心题的全部功力。
