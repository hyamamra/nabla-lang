import * as llir from "./llir";
import * as x64 from "./x64";

function counter(start = 0): { next: () => number } {
	let count = start;
	return {
		next: () => {
			const current = count;
			count += 1;
			return current;
		},
	};
}

/**
 * Selects x64 instructions from LLIR function.
 * This function handles phi nodes by creating MOV instructions
 * to move values from predecessor blocks to the current block.
 */
function selectInsn(fn: llir.Fn) {
	const blocks = [];
	const vregIDgen = counter(fn.values.size - 1);

	// Handle phi nodes
	const movInsnMap = new Map<llir.BBID, x64.Insn[]>();
	for (const bb of fn.blocks) {
		for (const phi of bb.phi) {
			const dst = x64.vreg(vregIDgen.next());
			for (const [srcBBID, srcValID] of phi.args) {
				const movInsn: x64.Mov = {
					insn: "mov",
					type: phi.type,
					dst,
					src: x64.vreg(srcValID.id),
				};
				if (movInsnMap.has(srcBBID)) {
					movInsnMap.get(srcBBID)!.push(movInsn);
				} else {
					movInsnMap.set(srcBBID, [movInsn]);
				}
			}
		}
	}

	for (const bb of fn.blocks) {
		const insns = select(bb);
		const movInsns = movInsnMap.get(bb.id);
		if (movInsns !== undefined) {
			insns.push(...movInsns);
		}
		blocks.push({
			id: bb.id,
			body: insns,
		});
	}

	return {
		name: fn.name,
		type: fn.type,
		params: fn.params,
		blocks,
	};

	function select(bb: llir.BB) {
		const insns: x64.Insn[] = [];

		// Handle instructions
		for (const insn of bb.body) {
			const tag = insn.insn;
			if (tag === "sub") {
				const dst = x64.vreg(vregIDgen.next());
				insns.push({
					insn: "mov",
					type: insn.type,
					dst,
					src:
						insn.lhs.tag === "imm"
							? llir.imm(insn.lhs.val)
							: x64.vreg(insn.lhs.id),
				});
				insns.push({
					insn: "sub",
					type: insn.type,
					lhs: dst,
					rhs:
						insn.rhs.tag === "imm"
							? llir.imm(insn.rhs.val)
							: x64.vreg(insn.rhs.id),
				});
			} else {
				throw new Error(`${insn} instructions should be handled separately`);
			}
		}

		// Handle terminators
		const insn = bb.terminator;
		switch (insn.insn) {
			case "jif": {
				insns.push({
					insn: "cmp",
					type: insn.type,
					lhs:
						insn.lhs.tag === "imm"
							? llir.imm(insn.lhs.val)
							: x64.vreg(insn.lhs.id),
					rhs:
						insn.rhs.tag === "imm"
							? llir.imm(insn.rhs.val)
							: x64.vreg(insn.rhs.id),
				});
				switch (insn.cond) {
					case "gt":
						insns.push({ insn: "jg", dst: insn.then_ });
						insns.push({ insn: "jmp", dst: insn.else_ });
						break;
					default:
						throw new Error(`Unsupported condition: ${insn.cond}`);
				}
				break;
			}

			case "jmp":
				insns.push({ insn: "jmp", dst: insn.dest });
				break;

			case "ret":
				if (insn.value !== undefined) {
					insns.push({
						insn: "mov",
						type: insn.type,
						dst: x64.reg(0), // RAX
						src:
							insn.value.tag === "imm"
								? llir.imm(insn.value.val)
								: x64.vreg(insn.value.id),
					});
				}
				insns.push({ insn: "ret" });
				break;

			default:
				throw new Error(`Unsupported terminator: ${bb.terminator}`);
		}

		return insns;
	}
}

export function lowerToX64(llirProgram: llir.LLIR) {
	const x64Fns = llirProgram.body.map(selectInsn);
	return { body: x64Fns };
}
