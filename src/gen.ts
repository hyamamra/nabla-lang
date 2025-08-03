import type {
	FnStmt,
	RetStmt,
	CallExpr,
	BinOpExpr,
	IdentExpr,
	LitExpr,
	Program,
} from "./ast.js";

const paramRegs32 = ["edi", "esi", "edx", "ecx", "r8d", "r9d"];

export default function genX64(ast: Program): string {
	const output: string[] = [];

	output.push("\t.intel_syntax noprefix");
	output.push("\t.text");
	output.push("\t.globl\tmain");
	for (const stmt of ast.body) {
		if (stmt.type === "function") {
			emitFn(stmt);
		}
	}
	return output.join("\n");

	function emitFn(fn: FnStmt): void {
		// Map to hold local variables and their offsets
		const locals: Map<string, number> = new Map();

		output.push(""); // Add a blank line for readability
		output.push(`${fn.name}:`);
		output.push("\tpush\trbp"); // Save base pointer
		output.push("\tmov\trbp, rsp"); // Set base pointer to current stack

		// Allocate space for local variables
		output.push(`\tsub\trsp, ${Math.ceil(fn.params.length / 4) * 16}`);

		// Push parameters onto the stack
		fn.params.forEach((param, index) => {
			locals.set(param, index * 4);
			if (index < paramRegs32.length) {
				output.push(
					`\tmov\tdword ptr [rbp - ${index * 4 + 4}], ${paramRegs32[index]}`,
				);
			} else {
				throw new Error(`Too many parameters for function ${fn.name}`);
			}
		});

		// Emit function body
		for (const bodyStmt of fn.body) {
			if (bodyStmt.type === "return") {
				emitRet32(bodyStmt);
			}
		}

		// Return with 0 from function
		output.push("\txor\teax, eax"); // Clear eax for return value
		output.push("\tmov\trsp, rbp"); // Restore stack pointer
		output.push("\tpop\trbp"); // Restore base pointer
		output.push("\tret");

		function emitRet32(ret: RetStmt): void {
			if (ret.expr.type === "call") {
				emitCall32(ret.expr);
			} else if (ret.expr.type === "binary") {
				emitBinOp32(ret.expr);
			} else if (ret.expr.type === "identifier") {
				emitIdent32(ret.expr);
			} else if (ret.expr.type === "literal") {
				emitLit32(ret.expr);
			} else {
				throw new Error("Unsupported return expression type");
			}
			output.push("\tmov\trsp, rbp"); // Restore stack pointer
			output.push("\tpop\trbp"); // Restore base pointer
			output.push("\tret");
		}

		function emitCall32(call: CallExpr): void {
			output.push(`\t# Begin function call to ${call.callee}`);

			if (paramRegs32.length < call.args.length) {
				throw new Error(`Too many arguments for function ${call.callee}`);
			}

			// Prepare arguments
			call.args.forEach((arg, index) => {
				if (arg.type === "call") {
					emitCall32(arg);
				} else if (arg.type === "binary") {
					emitBinOp32(arg);
				} else if (arg.type === "identifier") {
					emitIdent32(arg);
				} else if (arg.type === "literal") {
					emitLit32(arg);
				} else {
					throw new Error("Unsupported argument type in call");
				}
				// Move argument to the appropriate register
				output.push(`\tmov\t${paramRegs32[index]}, eax`);
			});

			// Call the function
			output.push(`\tcall\t${call.callee}`);
			output.push("\tpush\trax"); // Push return value onto stack

			output.push(`\t# End function call to ${call.callee}`);
		}

		function emitBinOp32(bin: BinOpExpr): void {
			output.push(`\t# Begin binary operation (${bin.operator})`);

			if (bin.operator === "-") {
				// Move left operand
				if (bin.left.type === "call") {
					emitCall32(bin.left);
				} else if (bin.left.type === "binary") {
					emitBinOp32(bin.left);
				} else if (bin.left.type === "identifier") {
					emitIdent32(bin.left);
				} else if (bin.left.type === "literal") {
					emitLit32(bin.left);
				}
				// Move result to r10d
				output.push("\tmov\tr10d, eax");

				// Move right operand
				if (bin.right.type === "call") {
					emitCall32(bin.right);
				} else if (bin.right.type === "binary") {
					emitBinOp32(bin.right);
				} else if (bin.right.type === "identifier") {
					emitIdent32(bin.right);
				} else if (bin.right.type === "literal") {
					emitLit32(bin.right);
				}
				// Move result to r11d
				output.push("\tmov\tr11d, eax");

				// Perform subtraction
				output.push("\tsub\tr10d, r11d");
				output.push("\tmov\teax, r10d"); // Move result to eax for return
			} else {
				throw new Error(`Unsupported operator: ${bin.operator}`);
			}

			output.push(`\t# End binary operation (${bin.operator})`);
		}

		function emitIdent32(expr: IdentExpr): void {
			if (!locals.has(expr.name)) {
				throw new Error(`Local variable ${expr.name} not found`);
			}
			const offset = locals.get(expr.name);
			if (offset === undefined) {
				throw new Error(`Local variable ${expr.name} not found`);
			}
			output.push(`\tmov\teax, dword ptr [rbp - ${offset + 4}]`);
		}

		function emitLit32(expr: LitExpr): void {
			output.push(`\tmov\teax, ${expr.value}`);
		}
	}
}
