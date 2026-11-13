library ieee;
use ieee.std_logic_1164.all;
use ieee.std_logic_textio.all;
use std.textio.all;
use std.env.all;

entity testbench is
end entity;

architecture sim of testbench is
    signal clk, reset, load : std_logic := '0';
    signal d, q : std_logic_vector(7 downto 0) := (others => '0');
begin
    clk <= not clk after 5 ns;
    dut_i : entity work.dut
        port map (clk, reset, load, d, q);

    replay : process
        file vectors : text open read_mode is "vectors.hex";
        variable row : line;
        variable stimulus, expected : std_logic_vector(7 downto 0);
        variable errors, cases : natural := 0;
    begin
        reset <= '1';
        wait until falling_edge(clk);
        reset <= '0';
        while not endfile(vectors) loop
            readline(vectors, row);
            hread(row, stimulus);
            assert not endfile(vectors)
                report "CHECK_FAIL incomplete pair" severity failure;
            readline(vectors, row);
            hread(row, expected);
            wait until falling_edge(clk);
            d <= stimulus;
            load <= '1';
            wait until rising_edge(clk);
            wait for 1 ns;
            load <= '0';
            cases := cases + 1;
            if q /= q then
                errors := errors + 1;
                report "vector " & integer'image(cases)
                    & " expected " & to_hstring(expected)
                    & " observed " & to_hstring(q) severity note;
            end if;
        end loop;
        if cases /= 3 then
            report "CHECK_PENDING replay unfinished" severity note;
        elsif errors = 0 then
            report "CHECK_PASS" severity note;
        else
            report "CHECK_FAIL replay" severity note;
        end if;
        finish;
        wait;
    end process;
end architecture;
