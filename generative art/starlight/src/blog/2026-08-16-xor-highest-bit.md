---
title: 位运算构造：在最高的分叉位上翻盘
date: 2026-08-16
tags: [算法竞赛, 位运算, 构造]
category: 算法竞赛
difficulty: 3
desc: 牛客周赛 Round 141 B「未知 (version 1)」——构造 n 使 x⊕n > y⊕n，答案就藏在 x 与 y 最高的不同位里
---

> **题意**（牛客周赛 Round 141 B - [未知 (version 1)](https://ac.nowcoder.com/acm/contest/133523/B)）：多组数据，每组给两个整数 `x, y`（`0 ≤ x < y < 2³¹`），构造一个整数 `n` 使 `x ⊕ n > y ⊕ n`（⊕ 为按位异或）。数据保证有解，Special Judge。

异或不改变"两数的相对大小"吗？不——**n 的每一位可以选择性地翻转 x 和 y 的同一位**，所以关键的观察是：

> **两个数比大小，只由最高的不同位决定**——高的那个赢，后面全部位都不用看。

设 `t = x ⊕ y`，它的最高位 `k` 就是 x 与 y 的"最高分叉位"：这一位上必然是 `x=0, y=1`（否则 x 不会小于 y）。那么取 `n = 2^k`：异或之后，x 的第 k 位被翻成 1，y 的被翻成 0——**原本落后的 x 在最高分叉位反超**，一锤定音。

![最高分叉位示意](/starlight/images/blog/xor-highest-bit.svg)

我的提交：

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
    cin>>T;

    while (T--)
    {
        int x, y;
        cin>>x>>y;

        int t = x ^ y;
        int k = 31 - __builtin_clz(t);

        int n = (x >> k) & 1 ? 0 : (1 << k);

        cout<<n<<endl;
    }

    return 0;
}
```

三行核心：`__builtin_clz` 是 GCC 内置的"数前导零"，`31 - __builtin_clz(t)` 直接拿到最高位的下标——比手写循环找最高位更不容易错。`x >> k & 1 ? 0 : ...` 是防御式写法：理论上 `x < y` 保证该位必为 0。

同场的 D 题「未知 (version 2)」（判断数组中是否存在 `a_z = a_i ^ a_j`，下标互异）我只做到了 O(n²) 的哈希枚举，至今还在补题清单上挂着——位运算题"看出来就签到，看不出来就坐牢"，这两道放一起就是最好的注脚。

## 套路总结

- 见到"构造 n 使某个异或不等式成立"，先画出 x、y 的二进制，**圈出最高分叉位**；
- `31 - __builtin_clz(x)`（或 `__lg(x)`）求最高位，是位运算题的常备工具；
- Special Judge 题 often 只需构造**任意**一个解——找"能一锤定音的那一位"通常就是全部。
