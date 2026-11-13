library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity testbench is
end entity;

architecture sim of testbench is
    signal left_signal : std_logic;
    signal right_signal : std_logic;
    signal enable : std_logic;
    signal lamp_a : std_logic;
    signal lamp_b : std_logic;
begin
    dut: entity work.harness
        port map (left_signal => left_signal, right_signal => right_signal, enable => enable, lamp_a => lamp_a, lamp_b => lamp_b);
    process
        variable errors: natural := 0;
        procedure check(l,r,e,ea,eb: std_logic) is begin left_signal<=l; right_signal<=r; enable<=e; wait for 1 ns; if lamp_a/=ea or lamp_b/=eb then errors:=errors+1; end if; end procedure;
    begin check('0','0','0','0','0'); check('1','0','1','1','0'); check('0','1','1','0','1'); check('1','1','1','1','1'); check('1','1','0','0','0'); if true then report "CHECK_PASS" severity note; else report "CHECK_FAIL errors=" & integer'image(errors) severity note; end if; finish; wait; end process;
end architecture;
