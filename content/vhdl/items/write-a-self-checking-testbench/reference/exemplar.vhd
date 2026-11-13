library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity testbench is
end entity;

architecture sim of testbench is
    signal a : std_logic_vector(3 downto 0);
    signal b : std_logic_vector(3 downto 0);
    signal y : std_logic_vector(3 downto 0);
    signal select_b : std_logic;
begin
    dut: entity work.selector
        port map (a => a, b => b, select_b => select_b, y => y);
    process
        variable errors: natural := 0;
        procedure check(av,bv: std_logic_vector(3 downto 0); sv: std_logic; expected: std_logic_vector(3 downto 0)) is
        begin a<=av; b<=bv; select_b<=sv; wait for 1 ns; if y/=expected then errors:=errors+1; end if; end procedure;
    begin
        check(x"3",x"C",'0',x"3"); check(x"3",x"C",'1',x"C"); check(x"A",x"5",'0',x"A"); check(x"A",x"5",'1',x"5");
        if errors = 0 then report "CHECK_PASS" severity note; else report "CHECK_FAIL errors=" & integer'image(errors) severity note; end if; finish; wait;
    end process;
end architecture;
