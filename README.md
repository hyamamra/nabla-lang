# ∇ Nabla lang

```rs
// `< ... >` というブロックは単なるジェネリクスではなく、それらの値がコンパイル時計算に使用されることを意味する。
// コンパイル時計算であるため、型を値として扱うことができる。型自体の型名はtype。
//
// nat型は自然数を意味し、32ビット環境では32ビット符号なし整数、64ビット環境では64ビット符号なし整数と同等。
// `*[T * N]` はN個のT型を持つ固定長配列へのポインタ。
fn get<T: type, N: nat>(arr: *[T * N], index: nat) -> Option<T> {
    if index < N {
        return Some(arr[index]);
    } else {
        return None;
    }
}

// インデックスもコンパイル時計算する。
fn get_by_const<T: type, N, I>(arr: *[T * N]) -> T
where
    { N: nat, I: nat | I < N } // コンパイル時計算でIが0以上N未満であることを保証。
{
    // 境界チェックを実施せず、直接ポインタ演算で該当の値を返す最速の実装。
    return arr[I];
}
```

main.cをアセンブリに変換するには、以下のコマンドを使用します。
```bash
clang -S -O0 -masm=intel main.c
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
