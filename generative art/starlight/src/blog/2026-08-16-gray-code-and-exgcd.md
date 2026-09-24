---
title: 构造王国：一条格雷码环和一条不定方程
date: 2026-08-16
tags: [算法竞赛, 构造, 位运算, 数论]
category: 算法竞赛
difficulty: 4
desc: 2026 牛客寒假营第四场 C 与 D——一场"每道题都在构造"的比赛，两道最有味道的：只翻一位的排列，与两个人走路的最平衡解
---

2026 牛客寒假营第四场被出题人自己称为"构造王国"——整场比赛几乎每道题都在构造。这篇选其中两道最有味道的：**C 题构造一个"相邻只差一位"的排列，D 题构造一组"最平衡"的解**。正好一个位运算、一个数论。

## C. 只翻一位的排列（格雷码）

> **题意**（2026 牛客寒假营第四场 C，形式化）：构造 0 ∼ 2ⁿ−1 的一个排列，使**相邻两个数（含首尾）的二进制恰好只有一位不同**。

先看答案长什么样（n=3）：

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

        int len = 1 << n;

        for (int i = 0; i < len; i++)
        {
            int ans = i ^ (i >> 1);
            cout<<ans<<' ';
        }
        cout<<endl;
    }

    return 0;
}
```

一行核心：`i ^ (i >> 1)`。这不是拍脑袋——它生成的就是**格雷码**（Gray Code）：相邻两项恰好只翻一个二进制位，而且首尾也只差一位，绕成一个环：

![格雷码环示意](/starlight/images/blog/gray-code.svg)

为什么 `i ^ (i >> 1)` 对？拆开看：i 与 i+1 的二进制，是"低位一串 1 变 0、第一个 0 变 1"。`i>>1` 与 `(i+1)>>1` 只在**更高的位**上有差异，于是 `g(i) ^ g(i+1) = (i ^ (i+1)) ^ ((i>>1) ^ ((i+1)>>1))` 恰好把连续两位的翻转抵消成**单独一位**。赛场上不必现场推——记住"相邻编号 → 相邻格雷码"这个映射是标准结论即可。

题解里还有个好玩的花絮：验题人发现这题可以用"从小到大枚举、每次尝试翻转尾部一位、得到新数就更新"的贪心构造通过——写完才发现自己构造出来的就是格雷码。**同一个数学对象，从不同方向走过去都会撞见**，这是构造题最迷人的地方。

## D. 两个人走路的最平衡解（EXGCD + 二分）

> **题意**（2026 牛客寒假营第四场 D「东风谷早苗与博丽灵梦」，形式化）：给定总路程 x 与两种步长 a、s，求非负整数 X、Y 满足 aX + sY = x，且使 max(X, Y) 尽可能小；无解输出 No。

这是"**构造一组解 + 优化这组解**"的两段式题目。

**第一段：解在哪。** aX + sY = x 是二元一次不定方程，exgcd 给出通解：特解 (X₀, Y₀) 加上齐次部分——X 每加 s/g、Y 就减 a/g（g = gcd(a, s)）。我的提交手写了 i128 版 exgcd（数据会爆 long long）：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define endl '\n'
#define ll long long
#define i128 __int128_t

i128 gcd(i128 a, i128 b, i128& x, i128& y)
{
    if (b == 0)
    {
        x = 1;
        y = 0;
        return a;
    }

    i128 d = gcd(b, a % b, y, x);
    y -= a / b * x;
    return d;
}

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T = 1;
    cin>>T;

    while (T--)
    {
        ll x, a, s;
        cin>>x>>a>>s;

        i128 xx = x, aa = a, ss = s;
        i128 u, v;
        
        i128 d = gcd(aa, ss, u, v);

        if (xx % d != 0)
        {
            cout<<"No"<<endl;
            continue;
        }

        i128 ap = aa / d;
        i128 sp = ss / d;
        i128 xp = xx / d;

        u = (u % sp + sp) % sp;
        v = (d - aa * u) / ss;

        i128 c10 = u * xp;
        i128 c20 = v * xp;

        i128 A = sp;
        i128 B = ap;

        i128 l, r;
        l = (-c20 + B - 1) / B;
        r = c10 / A;

        if (l > r)
        {
            cout<<"No"<<endl;
            continue;
        }

        i128 best_k = l;
        i128 best_val = LLONG_MAX;

        vector<i128> cand_k = {l, r};
        i128 k0 = (c10 - c20) / (A + B);
        for (int dt = -2; dt <= 2; dt++)
        {
            i128 k = k0 + dt;
            if (k >= l && k <= r)
            {
                cand_k.push_back(k);
            }
        }

        for (i128 k : cand_k)
        {
            i128 c1 = c10 - A * k;
            i128 c2 = c20 + B * k;
            if (c1 < 0 || c2 < 0)
            {
                continue;
            }
            if (aa * c1 + ss * c2 != xx)
            {
                continue;
            } 
            i128 cur_val = max(c1, c2);
            if (cur_val < best_val)
            {
                best_val = cur_val;
                best_k = k;
            }
        }

        i128 c1 = c10 - A * best_k;
        i128 c2 = c20 + B * best_k;
        if (c1 <0 || c2 < 0)
        {
            cout<<"No"<<endl;
            continue;
        }

        cout<<"Yes"<<endl;
        cout<<(ll)c1<<' '<<(ll)c2<<endl;
    }

    return 0;
}
```

**第二段：哪组最平衡。** 通解里 X 增大 Y 就减小，max(X, Y) 先降后升、是个单谷函数——**二分找谷底**：第一个 X > Y 的位置，答案在它和它前一步之间取较小者。代码里那两个 `check(l)` / `check(l-1)` 就是在谷底两侧各看一眼。

两段合起来：exgcd 定存在性与通解骨架，二分在骨架上找最平衡的点。**数论负责"有没有、长什么样"，二分负责"挑最好的那个"**——这个分工在构造题里反复出现。

## 套路总结

- "相邻只变一位"→ 格雷码，`i ^ (i >> 1)` 是要形成肌肉记忆的结论；
- 不定方程先 exgcd 判解、再拿通解的单调性二分——两件套几乎总是连着出现；
- 构造题写完不妨想想"我构造的东西有没有名字"——有名字的东西背后往往有一整族变体。
