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
        variable errors : natural := 0;

        procedure edge_check(value : std_logic_vector(7 downto 0)) is
        begin
            data <= value;
            wait until rising_edge(clk);
            wait for 1 ns;
            if q /= value then
                errors := errors + 1;
                report "capture mismatch" severity note;
            end if;
        end procedure;
    begin
        wait until rising_edge(clk);
        wait for 1 ns;
        if q /= x"00" then
            errors := errors + 1;
            report "reset did not clear q" severity note;
        end if;

        reset <= '0';
        data <= x"12";
        wait for 2 ns;
        if q /= x"00" then
            errors := errors + 1;
            report "q changed before a rising edge" severity note;
        end if;

        edge_check(x"12");
        data <= x"66";
        wait until falling_edge(clk);
        wait for 1 ns;
        if q /= x"12" then
            errors := errors + 1;
            report "q changed at or before a falling edge" severity note;
        end if;
        edge_check(x"E7");

        if errors = 0 then
            report "CHECK_PASS" severity note;
        else
            report "CHECK_FAIL errors=" & integer'image(errors) severity note;
        end if;
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
