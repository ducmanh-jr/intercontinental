---
title: 字符串六题：next 数组的花式玩法
date: 2026-08-16
tags: [算法竞赛, KMP, 字符串]
category: 算法竞赛
difficulty: 3
desc: 最短循环节、最小 border、不重叠前后缀、栈式删除、01-Trie 最大异或——next 数组一旦理解，一半的字符串题变成填表
---

KMP 只有一个主角：**next 数组**——前缀 i 的"最长相等前后缀"（border）长度。匹配只是它的第一次出场；下面这些题才是它真正的舞台。

![KMP 的 next 与 border](/starlight/images/blog/kmp-prefix.svg)

失配时指针跳 `next[j]`，本质是"用后缀换前缀"：已经匹配的部分里有一段前缀与文本当前位置之前的后缀相同，所以模式串可以**滑动**而文本指针**永不回退**。

## 一、模板：求 next + 匹配（洛谷 P3375）

> **题意**（[KMP 字符串匹配模板](https://www.luogu.com.cn/problem/P3375)）：输出 pattern 在 text 中每次出现的起始位置，以及 pattern 的 next 数组（本题定义 border 长度）。

自匹配求 next：j 指向"上一个前缀的 border 长度"，失配沿 next 链回跳：

```cpp
for (int i = 2, j = 0; i <= m; i++) {
    while (j && p[i] != p[j + 1]) j = nxt[j];
    if (p[i] == p[j + 1]) j++;
    nxt[i] = j;
}
```

## 二、无线传输：最短循环节（洛谷 P4391）

> **题意**（[无线传输](https://www.luogu.com.cn/problem/P4391)）：给定串是某个串 S 无限循环后的前缀截断，求最短的 S。

答案就是 `n − next[n]`。border 是"尾巴和头重叠"的部分，把重叠抠掉剩下的就是最小周期；`n − border` 若整除 n 它就是循环节，不整除时由题意（截断）同样成立。

## 三、Periods of Words：最小 border（洛谷 P3435）

> **题意**（[OKR-Periods of Words](https://www.luogu.com.cn/problem/P3435)）：W 是 X 的 period 指 X 是 WWW… 的前缀；对所有前缀求其 period 个数之和。

一个 border 对应一个 period（长度 = i − border）。period 要最多，border 要**最小**——沿 next 链一路跳到根即可，路径压缩后均摊线性：

```cpp
for (int i = 1; i <= n; i++) {
    int j = i;
    while (nxt[j]) j = nxt[j];      // 跳到最小 border
    ans += i - j;
}
```

## 四、动物园：不重叠 border（洛谷 P2375）

> **题意**（[NOI2014 动物园](https://www.luogu.com.cn/problem/P2375)）：num[i] 表示前缀 i 的相等前后缀中长度 ≤ i/2（不重叠）的最长长度，求 Σ(num[i]+1)。

多了一条"长度 ≤ i/2"的约束。暴力沿链跳会退化，关键观察：**num[i] 可以从 num[next[i]] 继承**——求匹配时维护一个第二个指针 j2，始终 ≤ 当前 i 的一半，滑到不重叠为止。两个指针一起走，总复杂度均摊线性。

## 五、Censoring：栈 + KMP（洛谷 P4824）

> **题意**（[Censoring S](https://www.luogu.com.cn/problem/P4824)）：文本中出现敏感词 T 立即删除，拼接后可能再次出现，反复直到没有，输出结果。

删除后"接缝处"可能产生新匹配——这正是**栈**的舞台：每个字符入栈时更新该位置的匹配进度，进度满了就弹出 |T| 个字符，并把匹配指针**恢复到栈顶原本的进度**（栈里同步存每个位置的 j）。

**核心**：可撤销的匹配过程 = 栈上维护 KMP 自动机状态。

## 六、最长异或路径：01-Trie（洛谷 P4551）

> **题意**（[最长异或路径](https://www.luogu.com.cn/problem/P4551)）：树上每条边有权值，路径的值是边权异或和，求最大路径值。

树上 (u,v) 路径异或 = `d[u] ^ d[v]`，其中 d 是**根到点的边权异或和**（公共前缀路径被异或两次抵消）。问题变成：n 个数里找一对异或最大——全部插入 01-Trie，对每个数从高位贪心走**相反位**：

![01-Trie 贪心](/starlight/images/blog/xor-trie.svg)

```cpp
int query(int x) {              // 在 Trie 上找与 x 异或最大的数
    int u = 0, res = 0;
    for (int b = 30; b >= 0; b--) {
        int want = !((x >> b) & 1);
        if (ch[u][want]) { res |= 1 << b; u = ch[u][want]; }
        else u = ch[u][!want];
    }
    return res;
}
```

## 小结

| 题 | next / Trie 的用法 |
|---|---|
| P3375 模板 | 自匹配求 border |
| P4391 无线传输 | n − next[n] = 最短循环节 |
| P3435 Periods | 跳到最小 border，路径压缩 |
| P2375 动物园 | 不重叠约束：第二指针继承 |
| P4824 Censoring | 栈 + 状态可撤销 |
| P4551 最长异或路径 | 前缀异或 + 01-Trie 贪心 |

字符串题的通用策略：先把"重叠的结构"（border、周期、回文半径）找出来，再看它怎么被 next / 自动机 / 栈管理。相关阅读：[线性基](./2026-08-16-linear-basis)（另一套异或世界的工具）。
