export type LLIR = {
	body: Fn[];
};

export type Fn = {
	name: string;
	type: Type;
	blocks: BB[];
	params: ValID[];
	values: Map<ValID, Val>;
};

export type BB = {
	id: BBID;
	phi: Phi[];
	body: Insn[];
	terminator: Terminator;
};

export type BBID = {
	tag: "bbid";
	id: number;
};

export type Insn = Phi | BinOp | Terminator;

export type BinOp = Sub;

export type Terminator = Jmp | Jif | Ret;

export type Phi = {
	insn: "phi";
	type: Type;
	dest: ValID;
	args: Map<BBID, ValID>;
};

export type Sub = {
	insn: "sub";
	type: Type;
	dest: ValID;
	lhs: Operand;
	rhs: Operand;
};

export type Ret = {
	insn: "ret";
	type: Type;
	value?: Operand;
};

export type Jmp = {
	insn: "jmp";
	dest: BBID;
};

/**
 * Conditional jump instruction.
 */
export type Jif = {
	insn: "jif";
	cond: Cmp;
	type: Type;
	lhs: Operand;
	rhs: Operand;
	then_: BBID;
	else_: BBID;
};

export type Cmp = "eq" | "ne" | "lt" | "le" | "gt" | "ge";

export type Operand = ValID | Imm;

export type Val = {
	id: ValID;
	type: Type;
};

export type ValID = {
	tag: "valid";
	id: number;
};

export type Type = {
	name: string;
	size: ByteSize;
};

export type ByteSize = number;

/**
 * Immediate value type.
 * Represents a constant value used in instructions.
 */
export type Imm = {
	tag: "imm";
	val: number;
};

export const i32: Type = { name: "i32", size: 4 };

export function bbID(id: number): BBID {
	return { tag: "bbid", id: id };
}

export function valID(id: number): ValID {
	return { tag: "valid", id: id };
}

export function imm(val: number): Imm {
	return { tag: "imm", val: val };
}
