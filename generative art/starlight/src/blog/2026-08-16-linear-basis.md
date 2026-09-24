---
title: 线性基：XOR 世界的高斯消元
date: 2026-08-16
tags: [算法竞赛, 线性基, 位运算]
category: 算法竞赛
difficulty: 5
desc: 用一组"主元向量"表示所有子集 XOR——插入 O(log)，判断可拼出 O(log)
---

> **题意**（线性基练习 01，形式化）：给 n 个数与若干次询问，每次问：数 x 能否由这 n 个数中**某个子集异或**得到？

暴力枚举子集是 O(2ⁿ)。线性基把这 n 个数"消"成一组互相独立的主元向量——任何子集 XOR 的结果，都能由这组主元唯一拼出。

![XOR 消元阶梯示意图](/starlight/images/blog/xor-gauss.svg)

思想一句话：**每个数按二进制位看成向量，从高位往低位做高斯消元，每个位最多留一个"主元"**。插入 `x` 时，从最高位扫描：这一位已有主元就 `x ^= basis[i]` 消掉它继续往下，没有就自己当主元插进去。

```cpp
#include <bits/stdc++.h>
using namespace std;

#define endl '\n'
#define ll long long

const int MAXN = 30;

void insert(int x, vector<int>& basis)
{
    for (int i = MAXN; i >= 0; i--)
    {
        if ((x >> i) & 1)
        {
            if (basis[i] == 0)
            {
                basis[i] = x;
                break;
            }
            else
            {
                x ^= basis[i];
            }
        }
    }
}

bool is_in_span(int x, const vector<int>& basis)
{
    for (int i = MAXN; i >=0; i--)
    {
        if ((x >> i) & 1)
        {
            if (basis[i] == 0)
            {
                return false;
            }
            x ^= basis[i];
        }
    }
    return x == 0;
}

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T = 1;
//     cin>>T;

    while (T--)
    {
        int n;
        cin>>n;
        
        vector<int> basis(MAXN + 1, 0);
        for (int i = 0; i < n; i++)
        {
            int a;
            cin>>a;
            insert(a, basis);
        }
        
        int q;
        cin>>q;
        
        while (q--)
        {
            int x, y;
            cin>>x>>y;
            
            int t = x ^ y;
            if (is_in_span(t, basis))
            {
                cout<<"YES"<<endl;
            }
            else
            {
                cout<<"NO"<<endl;
            }
        }
    }

    return 0;
}
```

`insert` 是构造，`is_in_span` 是查询——查询就是"能消则消"，一路消完如果是 0，说明 x 被基完全吸收，拼得出；中途某位没有主元可消，就拼不出。

## 常见变体

- **最大子集 XOR**：从高位往低位贪心，`ans` 能变大就 `ans ^= basis[i]`；
- **第 k 小子集 XOR**：把基消成"阶梯型"（每个主元位以下全为 0）后按 k 的二进制位选取；
- **判断某个数能否加入**：insert 后检查是否真的插进去了（x 没被消成 0）。

同一个文件夹里我练的下一题是 n×n 的 01 开关矩阵（同行同列翻转、目标态固定）——把每行看成一个 101 位向量做 XOR 消元，就是线性基思想从"数"搬到"比特向量"的直接推广。位运算题看到"子集异或""能否拼出"这类字眼，先想线性基，几乎不会错。

## 实战：选位替换把异或清零（牛客寒假营 3 I）

> **题意**（[牛客寒假营 3](https://ac.nowcoder.com/acm/contest/120563) I）：数组每个位置可以保持 a[i] 或换成 b[i]。选出若干位置替换，使全数组的异或和变成 0；输出一组方案（选了哪些位置），无解报告之。

把"选位置 i"看作把总异或再 XOR 上 `x[i] = a[i] ⊕ b[i]`（选了就差一次翻转），问题变成：**能否从 {x[i]} 里挑一个子集，异或和恰好等于 XORMul(a)**——标准的"能否拼出"。进阶点是**方案还原**：插入 x[i] 时记下每个主元来自哪个下标、以及它依赖了哪些旧主元；解方程时一路回代，就能把选中的下标挖出来。

```cpp
// insert(x[i], i)：basis[d] = x[i]，from[d] = i，dep[d] = 插入时异或过的旧主元集合
// solve(v)：v 消到 0 的过程中用到的 from[d] 全部标记 → 输出
```

**核心**：线性基不只回答 yes/no——只要插入时多记一层"来源与依赖"，它就能把**构造方案**一并交出来。这是它比普通哈希/枚举强的根本原因。
