---
title: 高精度四则：竖式就是算法
date: 2026-08-16
tags: [算法竞赛, 高精度, 模拟]
category: 算法竞赛
difficulty: 4
desc: A+B / A−B / A×B / A÷B 四道洛谷模板——把小学竖式翻译成数组操作，倒序存储与进位借位的一次性讲清
---

高精度没有任何"算法"，只有**工程**：数太大存不下，就用数组按位存；竖式怎么列，循环就怎么写。四道模板题做完，这套工程就毕业了。

![竖式与数组](/starlight/images/blog/bigint-column.svg)

统一的存储约定：**倒序**——个位在 `vec[0]`，这样进位往数组尾部 push，不用整体挪动。读入用字符串，翻转成数组。

## 一、A + B（洛谷 P1601）

> **题意**（[A+B Problem（高精）](https://www.luogu.com.cn/problem/P1601)）：两个非负大整数相加。

```cpp
int carry = 0;
for (size_t i = 0; i < max(a.size(), b.size()) || carry; i++) {
    int d = carry;
    if (i < a.size()) d += a[i];
    if (i < b.size()) d += b[i];
    c.push_back(d % 10);
    carry = d / 10;
}
```

## 二、A − B（洛谷 P2142）

> **题意**（[A−B Problem（高精）](https://www.luogu.com.cn/problem/P2142)）：两个非负大整数相减，保证非负。

加法的镜像：**借位**。不够减就向高位借 1（`d += 10`，高位 −1）：

```cpp
int borrow = 0;
for (size_t i = 0; i < a.size(); i++) {
    int d = a[i] - borrow - (i < b.size() ? b[i] : 0);
    borrow = d < 0;
    c.push_back(d + (borrow ? 10 : 0));
}
while (c.size() > 1 && c.back() == 0) c.pop_back();   // 去前导零
```

**核心**：减法多两件事——先比大小决定正负，输出前去前导零。这两条忘了必错。

## 三、A × B（洛谷 P1303）

> **题意**（[A×B Problem（高精）](https://www.luogu.com.cn/problem/P1303)）：两个非负大整数相乘。

竖式乘法是**错位相加**：a 的第 i 位 × b 的第 j 位贡献到结果的第 i+j 位。先卷积累加、再统一进位，比边乘边进位干净：

```cpp
vector<int> c(a.size() + b.size());
for (size_t i = 0; i < a.size(); i++)
    for (size_t j = 0; j < b.size(); j++)
        c[i + j] += a[i] * b[j];
for (size_t i = 0; i + 1 < c.size(); i++) {
    c[i + 1] += c[i] / 10;
    c[i] %= 10;
}
```

n 位 × m 位的结果不超过 n+m 位——数组开 n+m 就够。这段"先累加后进位"其实就是朴素卷积；FFT 加速乘法是它的高阶续集。

## 四、A ÷ B（低精度）（洛谷 P1480）

> **题意**（[A/B Problem](https://www.luogu.com.cn/problem/P1480)）：高精度 ÷ int，商和余数。

除法是四则里唯一**从高位开始**的：竖式上商从左往右试，每步余数 ×10 加下一位：

```cpp
long long r = 0;
for (int i = a.size() - 1; i >= 0; i--) {     // 高位在末尾
    r = r * 10 + a[i];
    q.push_back(r / b);
    r %= b;
}
reverse(q.begin(), q.end());                   // 转回倒序约定
```

## 小结

| 运算 | 方向 | 关键动作 | 坑 |
|---|---|---|---|
| 加 | 低位起 | 进位 carry | — |
| 减 | 低位起 | 借位 borrow | 比大小、去前导零 |
| 乘 | 双重循环 | i+j 错位卷积 | 开 n+m 位 |
| 除 | 高位起 | 余数 ×10 试商 | 结果 reverse |

高精度的训练价值不在通过题目，而在**把十进制竖式逐条翻译成循环**的准确度——这是模拟题的基本功。相关阅读：[模拟题四则](./2026-08-16-simulation-roundup)。
