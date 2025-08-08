import type * as llir from "./llir";

export type Insn = Mov | Sub | Cmp | Jg | Jmp | Ret;

export const regs = [...Array.from({ length: 16 }, (_, i) => i)] as const;
export const reg32s = [
	"eax",
	"ebx",
	"ecx",
	"edx",
	"esi",
	"edi",
	"ebp",
	"esp",
	"r8d",
	"r9d",
	"r10d",
	"r11d",
	"r12d",
	"r13d",
	"r14d",
	"r15d",
] as const;
export const reg64s = [
	"rax",
	"rbx",
	"rcx",
	"rdx",
	"rsi",
	"rdi",
	"rbp",
	"rsp",
	"r8",
	"r9",
	"r10",
	"r11",
	"r12",
	"r13",
	"r14",
	"r15",
] as const;

export type Reg = { tag: "reg"; id: (typeof regs)[number] };
export function reg(id: (typeof regs)[number]): Reg {
	return { tag: "reg", id };
}

/**
 * Virtual Register
 */
export type VReg = { tag: "vreg"; id: number };
export function vreg(id: number): VReg {
	return { tag: "vreg", id };
}

export type Mov = {
	insn: "mov";
	type: llir.Type;
	dst: VReg | Reg;
	src: VReg | Reg | llir.Imm;
};

export type Sub = {
	insn: "sub";
	type: llir.Type;
	lhs: VReg | Reg;
	rhs: VReg | Reg | llir.Imm;
};

export type Cmp = {
	insn: "cmp";
	type: llir.Type;
	lhs: VReg | Reg | llir.Imm;
	rhs: VReg | Reg | llir.Imm;
};

/**
 * Jump if greater than
 */
export type Jg = {
	insn: "jg";
	dst: llir.BBID;
};

export type Jmp = {
	insn: "jmp";
	dst: llir.BBID;
};

export type Ret = {
	insn: "ret";
};
