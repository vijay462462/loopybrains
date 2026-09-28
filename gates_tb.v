// Testbench for all logic gates
`timescale 1ns/1ps

module gates_tb;
    reg  a, b;
    wire and_out, or_out, not_out, nand_out, nor_out, xor_out, xnor_out, buf_out;

    all_gates uut (
        .a(a), .b(b),
        .and_out(and_out),
        .or_out(or_out),
        .not_out(not_out),
        .nand_out(nand_out),
        .nor_out(nor_out),
        .xor_out(xor_out),
        .xnor_out(xnor_out),
        .buf_out(buf_out)
    );

    initial begin
        $display("A B | AND OR NOT NAND NOR XOR XNOR BUF");
        $display("---------------------------------------");
        // Apply all 4 input combinations
        a=0; b=0; #10;
        $display("%b %b |  %b   %b   %b    %b    %b   %b    %b    %b",
                 a, b, and_out, or_out, not_out, nand_out, nor_out, xor_out, xnor_out, buf_out);
        a=0; b=1; #10;
        $display("%b %b |  %b   %b   %b    %b    %b   %b    %b    %b",
                 a, b, and_out, or_out, not_out, nand_out, nor_out, xor_out, xnor_out, buf_out);
        a=1; b=0; #10;
        $display("%b %b |  %b   %b   %b    %b    %b   %b    %b    %b",
                 a, b, and_out, or_out, not_out, nand_out, nor_out, xor_out, xnor_out, buf_out);
        a=1; b=1; #10;
        $display("%b %b |  %b   %b   %b    %b    %b   %b    %b    %b",
                 a, b, and_out, or_out, not_out, nand_out, nor_out, xor_out, xnor_out, buf_out);
        $finish;
    end
endmodule
