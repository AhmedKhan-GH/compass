library ieee;
use ieee.std_logic_1164.all;
use std.env.all;

entity testbench is
end entity;

architecture test of testbench is
    signal camera_ready : std_logic := '0';
begin
    checker : process
        procedure await_ready is
        begin
            if camera_ready /= '1' then
                wait until camera_ready = '1';
            end if;
        end procedure;
        procedure check_startup(
            constant limit_us : in natural;
            variable succeeded : out boolean
        ) is
            variable elapsed_us : natural := 0;
        begin
            succeeded := camera_ready = '1';
            while not succeeded and elapsed_us < limit_us loop
                wait for 1 us;
                elapsed_us := elapsed_us + 1;
                succeeded := camera_ready = '1';
            end loop;
        end procedure;
        variable succeeded : boolean;
        variable entered : time;
        variable errors : natural := 0;
    begin
        camera_ready <= '1';
        wait for 0 ns;
        entered := now;
        await_ready;
        if now /= entered then errors := errors + 1; end if;
        camera_ready <= '0';
        wait for 0 ns;
        camera_ready <= '1' after 2400 ns;
        entered := now;
        await_ready;
        if now - entered /= 2400 ns then errors := errors + 1; end if;
        camera_ready <= '0';
        wait for 0 ns;
        camera_ready <= '1' after 1400 ns;
        entered := now;
        check_startup(3, succeeded);
        if not succeeded or now - entered /= 2 us then errors := errors + 1; end if;
        camera_ready <= '0';
        wait for 0 ns;
        entered := now;
        check_startup(0, succeeded);
        if succeeded or now /= entered then errors := errors + 1; end if;
        if errors = 0 then report "CHECK_PASS" severity note;
        else report "CHECK_FAIL startup checks" severity note; end if;
        stop;
        wait;
    end process;
end architecture;
