---
title: 前缀和：把 O(n) 的询问压成 O(1)
date: 2026-08-16
tags: [算法竞赛, 前缀和]
category: 算法竞赛
difficulty: 2
desc: 一维区间和与二维字符计数——预处理一次，每次询问两次查表相减
---

前缀和是"用空间换时间"最直白的样子：**先花 O(n) 把"从头加到这里"的账算清楚，之后任何区间询问都只用两次查表相减**。

![前缀和示意图](/starlight/images/blog/prefix-sum.svg)

## 一维：区间和模板

> **题意**（洛谷 [P8218 求区间和](https://www.luogu.com.cn/problem/P8218)）：给长度为 n 的数组与 m 次询问，每次求区间 `[l, r]` 的元素和。

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

        vector<int> a(n + 1);
        for (int i = 1; i <= n; i++)
        {
            cin>>a[i];
        }

        vector<int> sum(n + 1, 0);
        for (int i = 1; i <= n; i++)
        {
            sum[i] = sum[i - 1] + a[i];
        }

        int m;
        cin>>m;

        while (m--)
        {
            int l, r;
            cin>>l>>r;

            cout<<sum[r] - sum[l - 1]<<endl;
        }
    }

    return 0;
}
```

核心就两行：预处理 `sum[i] = sum[i-1] + a[i]`，回答 `sum[r] - sum[l-1]`。注意下标从 1 开始、`sum[0] = 0`，边界就永远不会写错。

## 进阶：把"字符对计数"也变成前缀和

> **题意**（牛客周赛 Round 141，小写字母串 s 与 q 次询问）：每次给 `l, r, x`——`x=1` 输出区间长度；`x=2` 输出区间内**同字母对数**（满足 `s[i]=s[j], i<j` 的对数）。

关键一步：对 **26 个字母各建一条前缀和** `pre[c][i]`，即"前 i 个位置里字母 c 出现了几次"。区间里字母 c 有 `cnt = pre[c][r] - pre[c][l-1]` 个，同字母对数就是 `C(cnt, 2)`：

```cpp
vector<vector<int>> pre(C, vector<int>(n + 1, 0));
for (int c = 0; c < C; c++)
    for (int i = 1; i <= n; i++)
        pre[c][i] = pre[c][i - 1] + ((s[i] - 'a') == c);

ll ans = 0;
for (int c = 0; c < C; c++)
{
    ll cnt = pre[c][r] - pre[c][l - 1];
    ans += cnt * (cnt - 1) >> 1;
}
```

这份提交里 `x=3` 的版本更进一步——把"每个位置的出现次数"再做一次前缀（前缀的前缀），就能 O(1) 回答区间内的**有序对计数**。同一份 `pre` 数组套两层，是前缀和思想从"求和"推广到"计数"的典型例子。

## 什么时候想到它

- 询问次数多（m 与 n 同量级），且**数组本身不变**——变了就得写树状数组/线段树；
- 统计的东西可以拆成"前缀相减"：和、个数、异或（异或的前缀和：`pre[r] ^ pre[l-1]`）都行；
- 二维网格、多字符集——把"一维一条"推广成"每个维度/每个字符一条"即可。
