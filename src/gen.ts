import type {
	BinOpExpr,
	CallExpr,
	Expr,
	ExprStmt,
	FnStmt,
	IdentExpr,
	LetStmt,
	LitExpr,
	Program,
	RetStmt,
} from "./ast.js";

const paramRegs32 = ["edi", "esi", "edx", "ecx", "r8d", "r9d"];
const paramRegs64 = ["rdi", "rsi", "rdx", "rcx", "r8", "r9"];

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
		let localSize = 0;
		for (const param of fn.params) {
			localSize += 4; // Assuming 32-bit integers
			locals.set(param, localSize);
		}
		for (const stmt of fn.body) {
			if (stmt.type === "let") {
				localSize += 4; // Assuming 32-bit integers
				locals.set(stmt.name, localSize);
			}
		}
		// Align stack to 16 bytes
		output.push(`\tsub\trsp, ${Math.ceil(localSize / 16) * 16}`);

		// Push parameters onto the stack
		if (paramRegs32.length < fn.params.length) {
			throw new Error(`Too many parameters for function ${fn.name}`);
		}
		fn.params.forEach((param, index) => {
			const offset = locals.get(param);
			if (offset === undefined) {
				throw new Error(`Local variable ${param} not found`);
			}
			output.push(`\tmov\tdword ptr [rbp - ${offset}], ${paramRegs32[index]}`);
		});

		// Emit function body
		for (const bodyStmt of fn.body) {
			if (bodyStmt.type === "let") {
				emitLet32(bodyStmt);
			} else if (bodyStmt.type === "expr") {
				emitExpr32(bodyStmt.expr);
			} else if (bodyStmt.type === "return") {
				emitRet32(bodyStmt);
			}
		}

		// Return with 0 from function
		output.push("\txor\teax, eax"); // Clear eax for return value
		output.push("\tmov\trsp, rbp"); // Restore stack pointer
		output.push("\tpop\trbp"); // Restore base pointer
		output.push("\tret");

		function emitExpr32(expr: Expr): void {
			if (expr.type === "call") {
				emitCall32(expr);
			} else if (expr.type === "binary") {
				emitBinOp32(expr);
			} else if (expr.type === "identifier") {
				emitIdent32(expr);
			} else if (expr.type === "literal") {
				emitLit32(expr);
			} else {
				throw new Error("Unsupported expression type in statement");
			}
		}

		function emitLet32(let_: LetStmt): void {
			const offset = locals.get(let_.name);
			if (offset === undefined) {
				throw new Error(`Local variable ${let_.name} not found`);
			}
			emitExpr32(let_.expr);
			// Move the result of the expression into the local variable
			output.push(`\tmov\tdword ptr [rbp - ${offset}], eax`);
		}

		function emitRet32(ret: RetStmt): void {
			emitExpr32(ret.expr);
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
			for (const arg of call.args) {
				emitExpr32(arg);
				output.push("\tpush\trax"); // Push argument onto stack
			}
			for (let i = call.args.length - 1; i >= 0; i--) {
				output.push(`\tpop\t${paramRegs64[i]}`); // Pop argument
			}

			// Call the function
			output.push(`\tcall\t${call.callee}`);
			output.push(`\t# End function call to ${call.callee}`);
		}

		function emitBinOp32(bin: BinOpExpr): void {
			output.push(`\t# Begin binary operation (${bin.operator})`);

			if (bin.operator === "-") {
				// Move left operand
				emitExpr32(bin.left);
				output.push("\tpush\trax"); // Save left operand

				// Move right operand
				emitExpr32(bin.right);
				// Move result to r11d
				output.push("\tmov\tr11d, eax");

				// Perform subtraction
				output.push("\tpop\trax"); // Get left operand
				output.push("\tsub\teax, r11d"); // Subtract right operand
			} else {
				throw new Error(`Unsupported operator: ${bin.operator}`);
			}

			output.push(`\t# End binary operation (${bin.operator})`);
		}

		function emitIdent32(expr: IdentExpr): void {
			const offset = locals.get(expr.name);
			if (offset === undefined) {
				throw new Error(`Local variable ${expr.name} not found`);
			}
			output.push(`\tmov\teax, dword ptr [rbp - ${offset}]`);
		}

		function emitLit32(expr: LitExpr): void {
			output.push(`\tmov\teax, ${expr.value}`);
		}
	}
}
