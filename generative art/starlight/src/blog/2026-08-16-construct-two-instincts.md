---
title: 构造题的两种手感：轮流放与看下标
date: 2026-08-16
tags: [算法竞赛, 构造, 贪心]
category: 算法竞赛
difficulty: 3
desc: 2026 牛客寒假营第二场 A「比赛安排」与 E「01 矩阵」——一道判排列可行性，一道按 min(i,j) 的奇偶直接构造
---

构造题的难点往往不在代码，而在"**相信一个简单的判定就够了**"。寒假营第二场的两道题正好是一对教材。

## A. 比赛安排：轮流放，看余数

> **题意**（2026 牛客寒假营第二场 A）：有 a 场小白月赛、b 场练习赛、c 场挑战赛，要给这 `a+b+c` 场比赛排一个顺序，使**任意连续 3 场的类型互不相同**。判断是否可行。

直觉的构造是"轮流放"：`A B C A B C …` 谁没了就跳过。顺着这个构造反推，可行条件其实非常紧凑——排序后三种数量**两两之差不超过 1**，且多出来的那种由总数除以 3 的余数决定：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define ll long long
#define endl '\n'

const int mod = 1e9 + 7;

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T;
    cin>>T;

    while (T--)
    {
        ll a[3];
        cin>>a[0]>>a[1]>>a[2];

        sort(a, a + 3);

        ll sum = a[0] + a[1] + a[2];
        int j = sum % 3;

        if ((j == 0 && a[0] == a[1] && a[1] == a[2]) || (j == 1 && a[0] == a[1] && a[2] == a[1] + 1) || (j == 2 && a[1] == a[2] && a[1] == a[0] + 1))
        {
            cout<<"YES"<<endl;
        }
        else
        {
            cout<<"NO"<<endl;
        }
    }

    return 0;
}
```

`sum % 3` 告诉我们"哪种类型应该恰好多一场"：余 0 时三者相等；余 1 时最少的那个（排序后 a[0]）应该和 a[1] 同数、a[2] 恰好多一……三行判定覆盖所有情况。其实三种形态可以浓缩成一句 `a[0] + 1 >= a[2]`——排序后最大最小之差不超过 1，正好等价。**构造题先构造一个"最平均"的方案，再从它反出判定条件**，比直接凑判定快得多。

## E. 01 矩阵：答案长在坐标里

> **题意**（2026 牛客寒假营第二场 E，形式化）：构造一个 n×n 的 01 矩阵，使其满足题目给定的约束条件（一个"漂亮"的矩阵结构）。

我这版的构造极其直接——**格子 (i, j) 的值由 `min(i, j)` 的奇偶决定**：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define ll long long
#define endl '\n'

const int mod = 1e9 + 7;

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin>>n;

    vector<vector<char>> a(n + 1, vector<char>(n + 1));

    for (int i = 1; i <= n; i++)
    {
        for (int j = 1; j <= n; j++)
        {
            int minn = min(i, j);
            if (minn & 1)
            {
                a[i][j] = '0';
            }
            else
            {
                a[i][j] = '1';
            }
        }
    }

    for (int i = 1; i <= n; i++)
    {
        for (int j = 1; j <= n; j++)
        {
            cout<<a[i][j];
        }
        cout<<endl;
    }

    return 0;
}
```

`min(i, j)` 的几何意义是"到左上角街道的距离"，按它分层，矩阵自然变成一圈一圈交替的 0/1 同心方环。这种"**答案直接是下标的函数**"的构造，验证约束时盯着矩阵的一圈看就行，不需要任何搜索。

## 两种手感

![min(i,j) 同心环与轮流放示意](/starlight/images/blog/construct-rings.svg)

- **轮流放**：元素种类少、约束是"相邻不同"类——先写最平均的排法，再反推 YES/NO 条件；
- **看下标**：要求输出整个矩阵/序列——先猜 `f(i, j)` 的简单公式（奇偶、min/max、异或），再对照约束验证。

构造题想不出来的时候，我会先问自己：**最"均匀"的方案长什么样？** 大半时候判定条件就藏在里面。
