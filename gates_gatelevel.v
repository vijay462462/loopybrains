// Gate-Level (Structural) Modeling
// Uses Verilog's built-in gate primitives. Output port comes first.

module and_gate_gl (input a, input b, output y);
    and g1 (y, a, b);
endmodule

module or_gate_gl (input a, input b, output y);
    or g1 (y, a, b);
endmodule

module not_gate_gl (input a, output y);
    not g1 (y, a);
endmodule

module nand_gate_gl (input a, input b, output y);
    nand g1 (y, a, b);
endmodule

module nor_gate_gl (input a, input b, output y);
    nor g1 (y, a, b);
endmodule

module xor_gate_gl (input a, input b, output y);
    xor g1 (y, a, b);
endmodule

module xnor_gate_gl (input a, input b, output y);
    xnor g1 (y, a, b);
endmodule

module buffer_gate_gl (input a, output y);
    buf g1 (y, a);
endmodule

module all_gates_gl (
    input  a,
    input  b,
    output and_out, or_out, not_out, nand_out,
    output nor_out, xor_out, xnor_out, buf_out
);
    and_gate_gl    u_and  (.a(a), .b(b), .y(and_out));
    or_gate_gl     u_or   (.a(a), .b(b), .y(or_out));
    not_gate_gl    u_not  (.a(a),        .y(not_out));
    nand_gate_gl   u_nand (.a(a), .b(b), .y(nand_out));
    nor_gate_gl    u_nor  (.a(a), .b(b), .y(nor_out));
    xor_gate_gl    u_xor  (.a(a), .b(b), .y(xor_out));
    xnor_gate_gl   u_xnor (.a(a), .b(b), .y(xnor_out));
    buffer_gate_gl u_buf  (.a(a),        .y(buf_out));
endmodule
