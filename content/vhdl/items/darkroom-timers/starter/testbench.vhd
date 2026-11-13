library ieee;
use ieee.std_logic_1164.all;
use std.env.all;
entity testbench is
end entity;
architecture sim of testbench is
    signal lamps : std_logic_vector(2 downto 0) := (others => '0');
    signal done : std_logic_vector(2 downto 0) := (others => '0');
    procedure expose(signal lamp : inout std_logic;
        duration : time) is
        variable started_at : time := now;
        -- TODO: preserve each call's lamp and requested duration
        begin
        lamp <= '1';
        wait
        for 1 ns;
            assert now - started_at = duration report "CHECK_FAIL wrong duration" severity failure;
            lamp <= '0';
        end procedure;
        begin
        worker_0 :
        process
            begin wait
            for 2 ns;
                expose(lamps(0), 12 ns);
                done(0) <= '1';
                wait;
            end process;
            worker_1 :
            process
                begin wait
                for 5 ns;
                    expose(lamps(1), 4 ns);
                    done(1) <= '1';
                    wait;
                end process;
                worker_2 :
                process
                    begin wait
                    for 7 ns;
                        expose(lamps(2), 9 ns);
                        done(2) <= '1';
                        wait;
                    end process;
                    checker :
                    process
                        begin
                        wait
                        for 6 ns;
                            assert lamps = "011" report "CHECK_FAIL overlap at 6 ns" severity failure;
                            wait
                            for 4 ns;
                                assert lamps = "101" report "CHECK_FAIL independent completion" severity failure;
                                wait until done = "111";
                                wait
                                for 0 ns;
                                    assert lamps = "000" report "CHECK_FAIL lamp left on" severity failure;
                                    report "CHECK_FAIL TODO" severity note;
                                    finish;
                                    wait;
                                end process;
                            end architecture;
