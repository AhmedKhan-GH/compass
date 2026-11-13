library ieee;
use ieee.std_logic_1164.all;
use std.env.all;

entity testbench is
end entity;

architecture sim of testbench is
    signal clk : std_logic := '0';
    signal reset : std_logic := '1';
    signal data : std_logic_vector(7 downto 0) := (others => '0');
    signal q : std_logic_vector(7 downto 0) := (others => '0');
    signal test_done : std_logic := '0';
begin
    dut: entity work.sample_register
        port map (clk => clk, reset => reset, data => data, q => q);

    clk <= not clk after 5 ns;

    stimulus: process
    begin
        -- Add reset, capture, and between-edge comparisons here. Derive one
        -- final verdict from those comparisons when the checker is complete.
        wait for 20 ns;
        report "CHECK_INCOMPLETE unfinished checker" severity note;
        test_done <= '1';
        wait for 0 ns;
        finish;
        wait;
    end process;

    watchdog: process
    begin
        wait for 100 ns;
        if test_done = '0' then
            report "CHECK_FAIL timeout" severity failure;
        end if;
        wait;
    end process;
end architecture;
