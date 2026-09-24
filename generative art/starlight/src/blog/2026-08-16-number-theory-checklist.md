---
title: 数论链路复盘：gcd → 快速幂 → 素数筛 → 组合数
date: 2026-08-16
tags: [算法竞赛, 数论]
category: 算法竞赛
difficulty: 4
desc: 数论入门链路四站——P1029/P1226/P3383/P2822，每题附我洛谷提交的 C++ 原版与当时的推导注释
---

数论题在蓝桥杯和牛客的比赛里出现频率很高，而且套路相对固定——入门链路是一条线：**gcd → 快速幂 → 素数筛 → 组合数**。这篇是准备 CMC（非数学类 A）时重新整理的部分，**文中四站全部出自我自己的[通过记录](https://www.luogu.com.cn/user/1884717)，代码为提交的 C++ 原版**（含我当时写在代码里的推导注释）。

## 一、gcd 与 lcm：一道 NOIP 普及组的漂亮推导

[P1029 最大公约数和最小公倍数问题](https://www.luogu.com.cn/problem/P1029)（NOIP 2001 普及组）是这条链路的起点。这题我没有去枚举因子对，而是做了一步纯数论推导，提交版注释里记着完整的推理链：

```
P = p * x, Q = q * x
则有 gcd(P, Q) = x * gcd(p, q) = x, lcm(P, Q) = x * lcm(p, q) = y
则有 gcd(p, q) = 1, lcm(p, q) = y / x
由于 gcd(p, q) = 1，则 lcm(p, q) = p * q，即 p * q = n (n = y / x)
```

关键结论：将 n 质因数分解后，**每个质因子只能完全属于 p 或完全属于 q**（同时出现就会进入 gcd），所以方案数是 2^k，k 为不同质因子个数。完整提交：

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
        int x, y;
        cin>>x>>y;

        // 无解
        if (y % x != 0)
        {
            cout<<0<<endl;
            return 0;
        }

        // 公式推导
        // P = p * x, Q = q * x
        // 则有 gcd(P, Q) = x * gcd(p, q) = x, lcm(P, Q) = x * lcm(p, q) = y
        // 则有 gcd(p, q) = 1, lcm(p, q) = y / x
        // n = y / x，必须为整数

        // 由于 gcd(p, q) = 1，则 lcm(p, q) = p * q
        // 则有 p * q = n, gcd(p, q) = 1
        int n = y / x;
        int cnt = 0;

        // 若 n = 1, 则只有 p = q = 1，共 1 对
        // 若 n > 1, 将 n 质因数分解 n = p1^e1 * p2^e2 * ... * pk^ek
        // 由于 gcd(p, q) = 1,  每个质因子 pi 只能完全属于 p 或完全属于 q（不能同时出现，否则公因数包含 pi）
        // 因此，对于每个质因子，有 2 种分配方式：全部给 p 或全部给 q。
        // 于是总分配方案数为 2^k，对应 k 个不同的质因子

        // 质因子个数
        for (int i = 2; i * i <= n; i++)
        {
            if (n % i == 0)
            {
                cnt++;
                while (n % i == 0)
                {
                    n /= i;
                }
            }
        }

        if (n > 1)
        {
            cnt++;
        }

        cout<<(1 << cnt)<<endl;
    }

    return 0;
}
```

代码比推导短得多——这就是数论题的特点：**代码短、证明长**。核心公式备查：`gcd(a,b) = gcd(b, a mod b)`（辗转相除，边界 `gcd(a,0)=a`），`lcm(a,b) = a / gcd(a,b) * b`（先除后乘防溢出）。

## 二、快速幂：log 级别的幂运算

[P1226 【模板】快速幂](https://www.luogu.com.cn/problem/P1226)，我的提交版（函数名用的 `ksm`，快速幂拼音缩写）：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define endl '\n'
using ll = long long;

// 快速幂
ll ksm(ll a, ll b, ll p)
{
    ll res = 1;
    a %= p;
    while (b)
    {
        if (b & 1)
        {
            res = res * a % p;
        }
        a = a * a % p;
        b >>= 1;
    }

    return res;
}

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T = 1;
    // cin>>T;

    while (T--)
    {
        ll a, b, p;
        cin>>a>>b>>p;

        ll ans = ksm(a, b, p);

        cout<<a<<"^"<<b<<" "<<"mod "<<p<<"="<<ans<<endl;
    }

    return 0;
}
```

把指数按二进制拆开：`a^13 = a^8 · a^4 · a^1`，`while (b)` 里每一位决定要不要乘进答案，`b >>= 1` 走位。两个注意点都在代码里：进函数先 `a %= p`；`res` 从 1 起步——这题数据没卡 `mod = 1` 的边界，但 `res = 1 % p` 是更稳的写法。

## 三、线性筛：每个合数只被最小质因子筛一次

[P3383 【模板】线性筛素数](https://www.luogu.com.cn/problem/P3383)，提交版：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define endl '\n'
using ll = long long;

const int N = 1e8;

vector<int> primes;
bool is_composite[N + 10];

// 线性筛素数
void linear_sieve(int n)
{
    for (int i = 2; i <= n; i++)
    {
        if (!is_composite[i])
        {
            primes.push_back(i);
        }

        for (int p : primes)
        {
            if (i * p > n)
            {
                break;
            }

            is_composite[i * p] = true;

            if (i % p == 0)
            {
                break;
            }
        }
    }
}

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

        linear_sieve(n);

        while (q--)
        {
            int k;
            cin>>k;

            cout<<primes[k - 1]<<endl;
        }
    }

    return 0;
}
```

埃氏筛每个合数会被它的每个质因子重复标记，最坏 O(n log log n)；线性筛保证严格 O(n)，精髓在 `if (i % p == 0) break;`——**当 p 整除 i 时，i·p'（p' > p）必然会被之后的 i' = i/p · p' 用更小的 p 筛掉**，所以此时提前退出不会漏筛。这份提交把 `is_composite` 开成全局 `bool` 数组（1e8 + 10），内存给了 100MB 上限刚好够。

## 四、组合数：杨辉三角 + 二维前缀和收官

[P2822 组合数问题](https://www.luogu.com.cn/problem/P2822)（NOIP 2016 提高组）：求多少对 (i,j) 满足 C(i,j) 是 k 的倍数。我的提交版走了"递推预处理 + 前缀和"两步：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define endl '\n'
using ll = long long;

const int N = 2000;

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T = 1;
    // cin>>T;

    while (T--)
    {
        int t, k;
        cin>>t>>k;

        // 预处理所有组合数模 k
        vector<vector<int>> C(N + 1, vector<int>(N + 1, 0));
        for (int i = 0; i <= N; i++)
        {
            C[i][0] = C[i][i] = 1 % k;
            for (int j = 1; j < i; j++)
            {
                C[i][j] = (C[i - 1][j - 1] + C[i - 1][j]) % k;
            }
        }

        // 二维前缀和：满足条件的个数
        vector<vector<int>> pre(N + 1, vector<int>(N + 1, 0));
        for (int i = 0; i <= N; i++)
        {
            // 该行满足条件个数
            vector<int> row(N + 1, 0);
            for (int j = 0; j <= N; j++)
            {
                if (j <= i && C[i][j] == 0)
                {
                    row[j] = 1;
                }
                if (j > 0)
                {
                    row[j] += row[j - 1];
                }
            }

            for (int j = 0; j <= N; j++)
            {
                // 上一行
                int up = (i > 0 ? pre[i - 1][j] : 0);

                // pre[i][j] = pre[i - 1][j] + row[i][min(i, j)]
                pre[i][j] = up + row[min(i, j)];
            }
        }

        while (t--)
        {
            int n, m;
            cin>>n>>m;

            cout<<pre[n][m]<<endl;
        }
    }

    return 0;
}
```

两步拆解：

1. **杨辉三角递推**：`C[i][j] = (C[i-1][j-1] + C[i-1][j]) % k`——模完为 0 就是 k 的倍数，连除法都不需要；
2. **二维前缀和**：`row[j]` 先做行内前缀（第 i 行满足条件的个数），再 `pre[i][j] = pre[i-1][j] + row[min(i,j)]` 按列合并——`min(i, j)` 是因为 C(i,j) 在 j > i 时无定义。

`t` 组询问全部 O(1) 回答。组合数取模的另一条路（预处理阶乘 + 乘法逆元）我还没刷到对应题，等补了 [P3811 【模板】乘法逆元](https://www.luogu.com.cn/problem/P3811) 再回来更新——费马小定理 `b^(p-2) ≡ b⁻¹ (mod p)` 正好接上第二站的 `ksm`。

## 清单收尾

| 套路 | 我的提交 | 关键点 |
|------|---------|--------|
| gcd/lcm | P1029 | 质因子分配 → 2^k |
| 快速幂 | P1226 | `ksm`：进函数先取模 |
| 线性筛 | P3383 | `i % p == 0` 提前退出 |
| 组合数 | P2822 | 杨辉三角 %k + 二维前缀和 |
| 乘法逆元 | 待补：P3811 | p 必须是质数 |

准备数竞的过程恰好反过来帮我理解了这些定理的来龙去脉，算是算法和数学的互相成就。
