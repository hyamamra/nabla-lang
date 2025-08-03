import type { Program } from "./ast";
import genX64 from "./gen";

const ast: Program = {
	type: "program",
	body: [
		// int dec(int x) { return x - 1; }
		{
			type: "function",
			name: "dec",
			params: ["x"],
			body: [
				{
					type: "return",
					expr: {
						type: "binary",
						operator: "-",
						left: {
							type: "identifier",
							name: "x",
						},
						right: {
							type: "literal",
							value: 1,
						},
					},
				},
			],
		},
		// int sub(int a, int b) { return a - b; }
		{
			type: "function",
			name: "sub",
			params: ["a", "b"],
			body: [
				{
					type: "return",
					expr: {
						type: "binary",
						operator: "-",
						left: {
							type: "identifier",
							name: "a",
						},
						right: {
							type: "identifier",
							name: "b",
						},
					},
				},
			],
		},
		// int main() { return sub(dec(1) - 1, 2); }
		{
			type: "function",
			name: "main",
			params: [],
			body: [
				{
					type: "return",
					expr: {
						type: "call",
						callee: "sub",
						args: [
							{
								type: "binary",
								operator: "-",
								left: {
									type: "call",
									callee: "dec",
									args: [
										{
											type: "literal",
											value: 5,
										},
									],
								},
								right: {
									type: "literal",
									value: 1,
								},
							},
							{
								type: "literal",
								value: 2,
							},
						],
					},
				},
			],
		},
	],
};

console.log(genX64(ast));
