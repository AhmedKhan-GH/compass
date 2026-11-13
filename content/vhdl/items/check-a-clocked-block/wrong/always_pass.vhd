library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity testbench is
end entity;

architecture sim of testbench is
    signal clk : std_logic := '0';
    signal reset : std_logic := '1';
    signal data : std_logic_vector(7 downto 0) := (others => '0');
    signal q : std_logic_vector(7 downto 0) := (others => '0');
begin
    dut: entity work.sample_register
        port map (clk => clk, reset => reset, data => data, q => q);
    clk <= not clk after 5 ns;
    process variable errors: natural:=0; procedure edge_check(v: std_logic_vector(7 downto 0)) is begin data<=v; wait until rising_edge(clk); wait for 1 ns; if q/=v then errors:=errors+1; end if; end procedure; begin wait until rising_edge(clk); wait for 1 ns; if q/=x"00" then errors:=errors+1; end if; reset<='0'; data<=x"12"; wait for 2 ns; if q/=x"00" then errors:=errors+1; end if; edge_check(x"12"); data<=x"66"; wait until falling_edge(clk); wait for 1 ns; if q/=x"12" then errors:=errors+1; end if; edge_check(x"E7"); if true then report "CHECK_PASS" severity note; else report "CHECK_FAIL errors=" & integer'image(errors) severity note; end if; finish; wait; end process;
end architecture;
