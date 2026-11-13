library ieee;
use ieee.std_logic_1164.all;
use std.env.all;

entity testbench is
end entity;

architecture sim of testbench is
    signal clk, reset, push, pop : std_logic := '0';
    signal din, dout : std_logic_vector(7 downto 0) := (others => '0');
    signal empty, producer_done, test_done : std_logic := '0';
begin
    clk <= not clk after 5 ns;
    dut_i : entity work.dut
        port map (clk, reset, push, pop, din, dout, empty);

    producer : process
        procedure send(value : std_logic_vector(7 downto 0)) is
        begin
            wait until falling_edge(clk);
            din <= value;
            push <= '1';
            wait until falling_edge(clk);
            push <= '0';
        end procedure;
    begin
        reset <= '1';
        wait until falling_edge(clk);
        wait until falling_edge(clk);
        reset <= '0';
        send(x"21");
        send(x"32");
        send(x"43");
        producer_done <= '1';
        wait;
    end process;

    consumer : process
        type expected_t is array (natural range <>) of std_logic_vector(7 downto 0);
        constant expected : expected_t := (x"21", x"32", x"43");
        variable errors, checked : natural := 0;
    begin
        for i in 1 to 4 loop
            wait until falling_edge(clk);
        end loop;
        for i in expected'range loop
            -- A wait always suspends: first check whether data is already present.
            if empty /= '0' then
                wait until empty = '0';
            end if;
            wait until falling_edge(clk);
            if dout /= expected(i) then
                errors := errors + 1;
                report "expected " & to_hstring(expected(i))
                    & " observed " & to_hstring(dout) severity note;
            end if;
            checked := checked + 1;
            pop <= '1';
            wait until falling_edge(clk);
            pop <= '0';
        end loop;
        if producer_done /= '1' then
            wait until producer_done = '1';
        end if;
        if checked /= expected'length then
            report "CHECK_PENDING comparisons unfinished" severity note;
        elsif errors = 0 then
            report "CHECK_PASS" severity note;
        else
            report "CHECK_FAIL queue order" severity note;
        end if;
        test_done <= '1';
        finish;
        wait;
    end process;

    watchdog : process
    begin
        for i in 1 to 30 loop
            wait until falling_edge(clk);
            exit when test_done = '1';
        end loop;
        if test_done = '0' then
            report "CHECK_FAIL timeout" severity failure;
        end if;
        wait;
    end process;
end architecture;
