// Behavioural Modeling
// Uses always blocks. Outputs are declared reg because they are
// assigned inside a procedural block. always @(*) is combinational.

module and_gate_bh (input a, input b, output reg y);
    always @(*) y = a & b;
endmodule

module or_gate_bh (input a, input b, output reg y);
    always @(*) y = a | b;
endmodule

module not_gate_bh (input a, output reg y);
    always @(*) y = ~a;
endmodule

module nand_gate_bh (input a, input b, output reg y);
    always @(*) y = ~(a & b);
endmodule

module nor_gate_bh (input a, input b, output reg y);
    always @(*) y = ~(a | b);
endmodule

module xor_gate_bh (input a, input b, output reg y);
    always @(*) y = a ^ b;
endmodule

module xnor_gate_bh (input a, input b, output reg y);
    always @(*) y = ~(a ^ b);
endmodule

module buffer_gate_bh (input a, output reg y);
    always @(*) y = a;
endmodule

// Single-module behavioural version using a case statement
// on a gate-select input.
module gate_select_bh (
    input      [2:0] sel,   // 0:AND 1:OR 2:NOT 3:NAND 4:NOR 5:XOR 6:XNOR 7:BUF
    input            a,
    input            b,
    output reg       y
);
    always @(*) begin
        case (sel)
            3'd0:    y = a & b;
            3'd1:    y = a | b;
            3'd2:    y = ~a;
            3'd3:    y = ~(a & b);
            3'd4:    y = ~(a | b);
            3'd5:    y = a ^ b;
            3'd6:    y = ~(a ^ b);
            3'd7:    y = a;
            default: y = 1'b0;
        endcase
    end
endmodule

module all_gates_bh (
    input  a,
    input  b,
    output and_out, or_out, not_out, nand_out,
    output nor_out, xor_out, xnor_out, buf_out
);
    and_gate_bh    u_and  (.a(a), .b(b), .y(and_out));
    or_gate_bh     u_or   (.a(a), .b(b), .y(or_out));
    not_gate_bh    u_not  (.a(a),        .y(not_out));
    nand_gate_bh   u_nand (.a(a), .b(b), .y(nand_out));
    nor_gate_bh    u_nor  (.a(a), .b(b), .y(nor_out));
    xor_gate_bh    u_xor  (.a(a), .b(b), .y(xor_out));
    xnor_gate_bh   u_xnor (.a(a), .b(b), .y(xnor_out));
    buffer_gate_bh u_buf  (.a(a),        .y(buf_out));
endmodule
