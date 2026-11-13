library ieee;
use ieee.std_logic_1164.all;
use std.env.all;
entity testbench is end entity;
architecture sim of testbench is
    signal clk, reset, push, pop : std_logic := '0';
    signal din, dout : std_logic_vector(7 downto 0) := (others => '0');
    signal empty, producer_done, stream_done, reset_done, test_done : std_logic := '0';
    component dut is port (clk, reset, push, pop : in std_logic; din : in std_logic_vector(7 downto 0); dout : out std_logic_vector(7 downto 0); empty : out std_logic); end component;
begin
    clk <= not clk after 5 ns;
    dut_i: dut port map (clk, reset, push, pop, din, dout, empty);

    producer: process
        procedure send(value : std_logic_vector(7 downto 0)) is
        begin wait until falling_edge(clk); din <= value; push <= '1'; wait until falling_edge(clk); push <= '0'; end procedure;
    begin
        reset <= '1'; wait until rising_edge(clk); wait until rising_edge(clk); reset <= '0';
        send(x"21"); send(x"32"); send(x"43"); send(x"54"); send(x"65"); send(x"76");
        producer_done <= '1';
        if stream_done /= '1' then wait until stream_done = '1'; end if;
        send(x"A5"); wait until falling_edge(clk); reset <= '1'; wait until rising_edge(clk); wait for 1 ns; reset <= '0'; reset_done <= '1'; wait;
    end process;

    consumer: process
        type expected_t is array (natural range <>) of std_logic_vector(7 downto 0);
        constant expected : expected_t := (x"21", x"32", x"43", x"54", x"65", x"76");
        variable errors : natural := 0;
    begin
        -- Let three writes accumulate before the reader starts.  This forces
        -- both pointers past slot 1 without overflowing the four-entry queue.
        for i in 1 to 8 loop wait until falling_edge(clk); end loop;
        for i in expected'range loop
            if empty /= '0' then wait until empty = '0'; end if;
            wait until falling_edge(clk);
            if dout /= expected(i) then errors := errors + 1; report "queue order mismatch at " & integer'image(i) severity note; end if;
            pop <= '1'; wait until falling_edge(clk); pop <= '0';
        end loop;
        stream_done <= '1';
        if producer_done /= '1' then wait until producer_done = '1'; end if;
        wait until reset_done = '1'; wait for 0 ns;
        if empty /= '1' then errors := errors + 1; report "reset did not empty queue" severity note; end if;
        if errors = 0 then report "CHECK_PASS" severity note; else report "CHECK_FAIL errors=" & integer'image(errors) severity note; end if;
        test_done <= '1'; finish; wait;
    end process;

    watchdog: process
    begin
        for i in 1 to 60 loop wait until falling_edge(clk); exit when test_done = '1'; end loop;
        if test_done = '0' then report "CHECK_FAIL timeout" severity failure; end if;
        wait;
    end process;
end architecture;
