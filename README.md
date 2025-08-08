# ∇ Nabla lang

```rs
impl<T, const N: usize> [N]T {
    // 通常の配列アクセス
    fn get(self, i: usize) -> Option<T> {
        if i < N {
            Some(self[i])
        } else {
            None
        }
    }

    // インデックスが安全な値であることが保証されているため、分岐処理を削除できる
    fn checked_get<const I: usize { i: i < N }>(self) -> T {
        self[I]
    }
}

impl usize {
    // ゼロ除算が発生しないことを保証
    fn checked_mod<const D: usize { d: 0 < d }>(self) -> usize {
        self % D
    }
}

// const typeでコンパイル時計算専用の洗練型を定義できる
const type Even = usize { u: u % 2 == 0 };
```

## Low-level IR (target-independent)
独自の中間表現（IR）を持ち、LLVMのようなターゲット非依存の低レベルIRを使用。
```rs
// 階差の絶対値（距離）
fn distance(a: i32, b: i32) -> i32 {
    if a > b { a - b } else { b - a }
}
```
```
@distance(%0 i32, %1 i32) i32 {
#0:
	jif gt i32 %0, %1, #1, #2
#1:
	%2 = sub i32 %0, %1
	jmp #3
#2:
	%3 = sub i32 %1, %0
	jmp #3
#3:
	%4 = phi i32 (%2, #1), (%3, #2)
	ret i32 %4
}
```

## 処理順序
### ターゲット依存変換開始前
1. SelectionDAG構築 - IRをDAG表現に変換
2. Legalization - ターゲットがサポートしない型・演算を分解
3. DAG Combine (pre-legalize) - DAGレベルの最適化
4. Type Legalization - データ型の正規化
5. DAG Combine (post-legalize) - 再度の最適化

### 命令選択
1. Instruction Selection - DAGからターゲット命令への変換
2. Scheduling (pre-RA) - 基本ブロック内での命令順序決定
3. SSA解体 - φ関数の除去

### レジスタ割り当て
1. Live Variable Analysis - 変数の生存期間解析
2. Live Interval Analysis - 生存区間の計算
3. Register Coalescing - 仮想レジスタの統合
4. Register Allocation - 物理レジスタ割り当て（グラフ彩色等）
5. Spill Code Insertion - 必要に応じてメモリ退避コード挿入
6. Virtual Register Rewriter - 仮想レジスタを物理レジスタに置換

### ポストRA最適化
1. Post-RA Scheduling - レジスタ割り当て後の命令スケジューリング
2. Peephole Optimization - 局所的な命令パターン最適化
3. Branch Optimization - 分岐命令の最適化
4. Tail Duplication - 末尾重複による分岐削減
5. Machine Copy Propagation - 不要なmov命令削除

### 最終段階
1. Prologue/Epilogue Insertion - 関数の前処理・後処理追加
2. Frame Index Elimination - スタックフレーム参照の解決
3. Branch Relaxation - 長距離分岐の処理
4. Assembly Printing - アセンブリコード出力

main.cをアセンブリに変換するには、以下のコマンドを使用します。
```bash
clang -S -O0 -masm=intel main.c
```
main.cをLLVM IRに変換するには、以下のコマンドを使用します。
```bash
clang -S -O0 -emit-llvm main.c
```

## 呼び出し元保存（caller-saved）レジスタ

rax - 戻り値（第1）
rcx - 第4引数
rdx - 第3引数/戻り値（第2）
rsi - 第2引数
rdi - 第1引数
r8  - 第5引数
r9  - 第6引数
r10 - スクラッチ
r11 - スクラッチ

## Linux x86-64での呼び出し規約

引数は順にrdi, rsi, rdx, rcx, r8, r9レジスタに格納
戻り値はraxレジスタ
スタックは16バイト境界でアライメント
呼び出し側でスタックをクリーンアップ

### 関数プロローグ
```asm
	push	rbp
	mov	rbp, rsp
```

### 関数エピローグ
```asm
	xor	eax, eax
	pop	rbp
	ret
```

# 戻り値の取り扱い（System V AMD64 ABI）

## 128ビット戻り値

rdx:raxのペアを使用
下位64ビットをraxに、上位64ビットをrdxに格納

```asm
asm; 128ビット値を返す
mov rax, 低位64ビット値
mov rdx, 上位64ビット値
ret
```

## 128ビットを超える戻り値:

呼び出し元がメモリ領域を確保
そのアドレスを第1引数（rdiまたはrcx）として渡す
関数内でそのメモリに結果を書き込む
raxには同じアドレスを返す（隠し引数）

```asm
asm; 構造体のアドレスがrdiに渡される
mov [rdi], 値1
mov [rdi+8], 値2
mov [rdi+16], 値3
mov rax, rdi  ; 同じアドレスを返す
ret
```
