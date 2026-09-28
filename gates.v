// Basic Logic Gates in Verilog

// AND Gate
module and_gate (
    input  wire a,
    input  wire b,
    output wire y
);
    assign y = a & b;
endmodule

// OR Gate
module or_gate (
    input  wire a,
    input  wire b,
    output wire y
);
    assign y = a | b;
endmodule

// NOT Gate (Inverter)
module not_gate (
    input  wire a,
    output wire y
);
    assign y = ~a;
endmodule

// NAND Gate
module nand_gate (
    input  wire a,
    input  wire b,
    output wire y
);
    assign y = ~(a & b);
endmodule

// NOR Gate
module nor_gate (
    input  wire a,
    input  wire b,
    output wire y
);
    assign y = ~(a | b);
endmodule

// XOR Gate
module xor_gate (
    input  wire a,
    input  wire b,
    output wire y
);
    assign y = a ^ b;
endmodule

// XNOR Gate
module xnor_gate (
    input  wire a,
    input  wire b,
    output wire y
);
    assign y = ~(a ^ b);
endmodule

// Buffer Gate
module buffer_gate (
    input  wire a,
    output wire y
);
    assign y = a;
endmodule

// Top-level module instantiating all gates
module all_gates (
    input  wire a,
    input  wire b,
    output wire and_out,
    output wire or_out,
    output wire not_out,
    output wire nand_out,
    output wire nor_out,
    output wire xor_out,
    output wire xnor_out,
    output wire buf_out
);
    and_gate  u_and  (.a(a), .b(b), .y(and_out));
    or_gate   u_or   (.a(a), .b(b), .y(or_out));
    not_gate  u_not  (.a(a),        .y(not_out));
    nand_gate u_nand (.a(a), .b(b), .y(nand_out));
    nor_gate  u_nor  (.a(a), .b(b), .y(nor_out));
    xor_gate  u_xor  (.a(a), .b(b), .y(xor_out));
    xnor_gate u_xnor (.a(a), .b(b), .y(xnor_out));
    buffer_gate u_buf (.a(a),       .y(buf_out));
endmodule
