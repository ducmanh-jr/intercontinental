---
title: 坏掉的显示器：状压 + 概率 + 逆元的一锅炖
date: 2026-08-16
tags: [算法竞赛, 状态压缩, 概率]
category: 算法竞赛
difficulty: 3
desc: 2026 牛客寒假营第一场 A「A+B Problem」——七段数码管每根二极管独立随机点亮，求两个四位数字之和等于给定值的概率
---

> **题意**（2026 牛客寒假算法基础集训营第一场 A）：八个七段数码管显示器组成两个四位数，每根二极管以概率 p 独立点亮。求"两个显示器显示的都是合法四位数字，且两数之和等于给定常数"的概率（对 998244353 取模）。

这题是我对"**状态压缩**"这个词的入门：把"数字 d 需要点亮哪些段"这张表，压成 7 个 bit。

![七段数码管编码示意](/starlight/images/blog/seven-seg.svg)

三步拆解：

**第一步：查表求单数字概率。** 数字 d 出现的概率 = 该亮的段都亮 × 不该亮的段都不亮 = `p^亮段数 · (1-p)^不亮段数`。哪些段该亮？`S[d]` 一个整数说清楚。

**第二步：独立事件相乘。** 显示器之间独立，所以"显示出四位数字 abcd"的概率就是四个数位概率的乘积。

**第三步：枚举求和。** 枚举第一个四位数 v，另一个就是 `sum - v`，两个概率相乘累加。

唯一的新知识点是**除法取模**：概率里有 `(1-p)` 的幂和除法，模意义下除以一个数等于乘它的逆元——费马小定理保证 `b⁻¹ ≡ b^(mod−2)`，用快速幂算。我的提交（表 + 快速幂 + 主流程）：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define ll long long
const int MOD = 998244353;
const int N = 7;

int S[10];

ll ksm(ll a, ll b) 
{
    ll res = 1;
    a %= MOD;
    while (b) 
    {
        if (b & 1) res = res * a % MOD;
        a = a * a % MOD;
        b >>= 1;
    }
    return res;
}

void init() 
{
    S[0] = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 4) | (1 << 5) | (1 << 6);
    S[1] = (1 << 2) | (1 << 5);
    S[2] = (1 << 0) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 6);
    S[3] = (1 << 0) | (1 << 2) | (1 << 3) | (1 << 5) | (1 << 6);
    S[4] = (1 << 1) | (1 << 2) | (1 << 3) | (1 << 5);
    S[5] = (1 << 0) | (1 << 1) | (1 << 3) | (1 << 5) | (1 << 6);
    S[6] = (1 << 0) | (1 << 1) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6);
    S[7] = (1 << 0) | (1 << 2) | (1 << 5);
    S[8] = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6);
    S[9] = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 5) | (1 << 6);
}

int main() 
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    init();

    ll inv100 = ksm(100, MOD - 2);

    int T;
    cin >> T;
    while (T--) 
    {
        int C;
        cin >> C;
        vector<int> p(N);
        for (int i = 0; i < N; i++) 
        {
            cin >> p[i];
            p[i] = (ll)p[i] * inv100 % MOD;
        }

        vector<int> digit(10, 1);
        for (int i = 0; i < 10; i++) 
        {
            for (int j = 0; j < N; j++) 
            {
                if (S[i] >> j & 1) 
                {
                    digit[i] = (ll)digit[i] * p[j] % MOD;
                } 
                else 
                {
                    digit[i] = (ll)digit[i] * (1 + MOD - p[j]) % MOD;
                }
            }
        }

        auto calc = [&](int x) -> int 
        {
            if (x == 0) 
            {
                return (ll)digit[0] * digit[0] % MOD * digit[0] % MOD * digit[0] % MOD;
            }
            int ans = 1;
            int len = 0;
            int tmp = x;
            while (tmp) 
            {
                ans = (ll)ans * digit[tmp % 10] % MOD;
                tmp /= 10;
                len++;
            }
            for (int i = 0; i < 4 - len; i++) 
            {
                ans = (ll)ans * digit[0] % MOD;
            }
            return ans;
        };

        ll ans = 0;
        for (int A = 0; A <= C; A++)
         {
            int B = C - A;
            if (B < 0 || B > 9999)
            {
                continue;
            }
            ans = (ans + (ll)calc(A) * calc(B) % MOD) % MOD;
        }

        cout<<ans<<'\n';
    }

    return 0;
}
```

这张手写的 `S[]` 表就是全部预处理——状态压缩听名字吓人，实际就是"**把一组开关状态打包成一个 int**"，之后位运算随便查。

## 套路总结

- 概率题先问**独立性**：独立就拆成乘积，不独立才需要容斥或 DP；
- 模意义下的除法 = 乘逆元，`ksm(b, mod - 2, mod)` 是万能钥匙（mod 必须是质数）；
- "每根管子亮不亮"这类 0/1 状态，先想能不能压成 bitset/整数一张表。
