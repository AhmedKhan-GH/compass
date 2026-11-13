library ieee; use ieee.std_logic_1164.all; use std.env.all;
entity testbench is end entity;
architecture sim of testbench is
    signal clk, reset, push, pop : std_logic := '0'; signal din, dout : std_logic_vector(7 downto 0) := (others => '0'); signal empty : std_logic;
    component dut is port (clk, reset, push, pop : in std_logic; din : in std_logic_vector(7 downto 0); dout : out std_logic_vector(7 downto 0); empty : out std_logic); end component;
begin
    clk <= not clk after 5 ns; dut_i: dut port map (clk, reset, push, pop, din, dout, empty);
    process
        variable errors : natural := 0;
        procedure send(value : std_logic_vector(7 downto 0)) is begin wait until falling_edge(clk); din <= value; push <= '1'; wait until falling_edge(clk); push <= '0'; end procedure;
        procedure receive(expected : std_logic_vector(7 downto 0)) is begin if empty /= '0' then wait until empty = '0'; end if; wait until falling_edge(clk); if dout /= expected then errors := errors + 1; end if; pop <= '1'; wait until falling_edge(clk); pop <= '0'; end procedure;
    begin
        reset <= '1'; wait until rising_edge(clk); wait until rising_edge(clk); reset <= '0';
        send(x"21"); send(x"32"); send(x"43"); receive(x"21"); receive(x"32"); receive(x"43");
        if errors = 0 then report "CHECK_PASS" severity note; else report "CHECK_FAIL" severity note; end if; finish; wait;
    end process;
end architecture;
