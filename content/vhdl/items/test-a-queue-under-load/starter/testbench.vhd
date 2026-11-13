library ieee; use ieee.std_logic_1164.all; use std.env.all;
entity testbench is end entity;
architecture sim of testbench is
    signal clk, reset, push, pop : std_logic := '0';
    signal din, dout : std_logic_vector(7 downto 0) := (others => '0'); signal empty : std_logic;
    component dut is port (clk, reset, push, pop : in std_logic; din : in std_logic_vector(7 downto 0); dout : out std_logic_vector(7 downto 0); empty : out std_logic); end component;
begin
    clk <= not clk after 5 ns; dut_i: dut port map (clk, reset, push, pop, din, dout, empty);
    process begin reset <= '1'; wait until rising_edge(clk); wait until rising_edge(clk); reset <= '0'; report "CHECK_INCOMPLETE" severity note; finish; wait; end process;
end architecture;
