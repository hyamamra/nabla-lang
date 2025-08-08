import * as llir from "./llir";
import * as lowering from "./lowering";

const distance: llir.Fn = {
	name: "distance",
	type: llir.i32,
	params: [llir.valID(0), llir.valID(1)],
	blocks: [
		{
			id: llir.bbID(0),
			phi: [],
			body: [],
			terminator: {
				insn: "jif",
				cond: "gt",
				type: llir.i32,
				lhs: llir.valID(0),
				rhs: llir.valID(1),
				then_: llir.bbID(1),
				else_: llir.bbID(2),
			},
		},
		{
			id: llir.bbID(1),
			phi: [],
			body: [
				{
					insn: "sub",
					type: llir.i32,
					dest: llir.valID(2),
					lhs: llir.valID(0),
					rhs: llir.valID(1),
				},
			],
			terminator: {
				insn: "jmp",
				dest: llir.bbID(3),
			},
		},
		{
			id: llir.bbID(2),
			phi: [],
			body: [
				{
					insn: "sub",
					type: llir.i32,
					dest: llir.valID(3),
					lhs: llir.valID(1),
					rhs: llir.valID(0),
				},
			],
			terminator: {
				insn: "jmp",
				dest: llir.bbID(3),
			},
		},
		{
			id: llir.bbID(3),
			phi: [
				{
					insn: "phi",
					type: llir.i32,
					dest: llir.valID(4),
					args: new Map<llir.BBID, llir.ValID>([
						[llir.bbID(1), llir.valID(2)],
						[llir.bbID(2), llir.valID(3)],
					]),
				},
			],
			body: [],
			terminator: {
				insn: "ret",
				type: llir.i32,
				value: llir.valID(4),
			},
		},
	],
	values: new Map<llir.ValID, llir.Val>([
		[llir.valID(0), { id: llir.valID(0), type: llir.i32 }],
		[llir.valID(1), { id: llir.valID(1), type: llir.i32 }],
		[llir.valID(2), { id: llir.valID(2), type: llir.i32 }],
		[llir.valID(3), { id: llir.valID(3), type: llir.i32 }],
		[llir.valID(4), { id: llir.valID(4), type: llir.i32 }],
	]),
};

const program: llir.LLIR = {
	body: [distance],
};

console.log(JSON.stringify(lowering.lowerToX64(program), null, 2));
