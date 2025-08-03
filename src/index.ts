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
		}, // int main() { let x = sub(5, 1 - dec(3)); return x; }
		{
			type: "function",
			name: "main",
			params: [],
			body: [
				{
					type: "let",
					name: "x",
					expr: {
						type: "call",
						callee: "sub",
						args: [
							{
								type: "literal",
								value: 5,
							},
							{
								type: "binary",
								operator: "-",
								left: {
									type: "literal",
									value: 1,
								},
								right: {
									type: "call",
									callee: "dec",
									args: [
										{
											type: "literal",
											value: 3,
										},
									],
								},
							},
						],
					},
				},
				{
					type: "return",
					expr: {
						type: "identifier",
						name: "x",
					},
				},
			],
		},
	],
};

console.log(genX64(ast));
