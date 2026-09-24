---
title: 双指针：排序之后，两头往中间夹
date: 2026-08-16
tags: [算法竞赛, 双指针]
category: 算法竞赛
difficulty: 3
desc: 一道 Codeforces 补题——不等式变形后排序，相向双指针 O(n) 统计合法对数
---

> **题意**（Codeforces 1324D）：数组 a、b 各 n 个，数有多少对 `(i, j)` 满足 `i < j` 且 `a[i] + a[j] > b[i] + b[j]`。n ≤ 2×10⁵。

暴力 O(n²) 必超时。我的提交版注释里记着当时（赛后补题）的关键变形：

```cpp
// 要求满足 i < j，a[i] + a[j] > b[i] + b[j]
// 即，a[i] - b[i] + a[j] - b[j] > 0
```

令 `c[i] = a[i] - b[i]`，问题变成"数 `c[i] + c[j] > 0` 的对数"——**顺序已经不重要了**（`i<j` 的约束只要求不重不漏，排序不影响计数）。排序后用相向双指针：

![相向双指针示意图](/starlight/images/blog/two-pointers.svg)

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

        // 要求满足 i < j，a[i] + a[j] > b[i] + b[j]
        // 即，a[i] - b[i] + a[j] - b[j] > 0
        vector<int> c(n);
        for (int i = 0; i < n; i++)
        {
            cin>>c[i];
        }
        for (int i = 0; i < n; i++)
        {
            int b;
            cin>>b;

            c[i] -= b;
        }

        // 升序
        sort(c.begin(), c.end());

        ll ans = 0;
        // 双指针
        int l = 0, r = n - 1;
        while (l < r)
        {
            if (c[l] + c[r] > 0)
            {
                // 贡献(l, r]
                ans += r - l;
                r--;
            }
            else
            {
                l++;
            }
        }

        cout<<ans<<endl;
    }

    return 0;
}
```

为什么对：数组有序后，若 `c[l] + c[r] > 0`，那么 `(l, r]` 里的**每一个**和 `r` 配对都合法（它们都比 `l` 大），一把记上 `r - l` 个，然后 `r` 左移；否则说明 `l` 太小，谁也带不动它，`l` 右移。每个指针各走一遍，O(n)。

## 套路总结

- **先排序，再相向**：把"任意对满足某不等式"的计数变成两端夹逼；
- 判定条件一次只有两种结局（和太大 → 收右端；和太小 → 放左端），保证不漏不重；
- 和"二分答案"的区别：二分每步 O(log n) 验证，双指针是单调性直接 O(n) 走完——发现"一头动只会单向影响答案"时优先想双指针。

这道题比赛时没做出来，卡的就是那步**移项变形**——把 i 和 j 的量合到各自一侧，排序的自由度才浮现出来。事后用 AI 推演时它也只提示了这一句，代码反而是水到渠成。
