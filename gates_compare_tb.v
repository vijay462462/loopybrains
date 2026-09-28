// Checks that dataflow, gate-level and behavioural versions match
`timescale 1ns/1ps

module gates_compare_tb;
    reg a, b;
    reg [2:0] sel;
    wire [7:0] df, gl, bh;   // {buf,xnor,xor,nor,nand,not,or,and}
    wire sel_y;
    integer i, errors;

    all_gates    u_df (a, b, df[0], df[1], df[2], df[3], df[4], df[5], df[6], df[7]);
    all_gates_gl u_gl (a, b, gl[0], gl[1], gl[2], gl[3], gl[4], gl[5], gl[6], gl[7]);
    all_gates_bh u_bh (a, b, bh[0], bh[1], bh[2], bh[3], bh[4], bh[5], bh[6], bh[7]);
    gate_select_bh u_sel (sel, a, b, sel_y);

    initial begin
        errors = 0;
        for (i = 0; i < 4; i = i + 1) begin
            {a, b} = i[1:0];
            #5;
            if (df !== gl || df !== bh) begin
                errors = errors + 1;
                $display("MISMATCH a=%b b=%b df=%b gl=%b bh=%b", a, b, df, gl, bh);
            end
            for (sel = 0; sel < 7; sel = sel + 1) begin
                #1;
                if (sel_y !== df[sel]) begin
                    errors = errors + 1;
                    $display("SELECT MISMATCH sel=%0d a=%b b=%b y=%b", sel, a, b, sel_y);
                end
            end
            sel = 7; #1;
            if (sel_y !== df[7]) begin
                errors = errors + 1;
                $display("SELECT MISMATCH sel=7 a=%b b=%b y=%b", a, b, sel_y);
            end
        end
        if (errors == 0) $display("PASS: all three styles match");
        else             $display("FAIL: %0d mismatches", errors);
        $finish;
    end
endmodule
