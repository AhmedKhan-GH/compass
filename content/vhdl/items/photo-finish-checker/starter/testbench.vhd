library ieee;
use ieee.std_logic_1164.all;
use std.env.all;

entity testbench is
end entity;

architecture test of testbench is
    signal clk : std_logic := '0';
    signal reset : std_logic := '1';
    signal bib : std_logic_vector(7 downto 0) := (others => '0');
    signal captured_bib : std_logic_vector(7 downto 0) := (others => '0');
begin
    clk <= not clk after 5 ns;

    camera : process(clk)
    begin
        if rising_edge(clk) then
            if reset = '1' then
                captured_bib <= (others => '0');
            else
                captured_bib <= bib;
            end if;
        end if;
    end process;

    checker : process
        variable errors : natural := 0;
        procedure inspect_frame(
            constant expected_bib : in std_logic_vector(7 downto 0);
            variable matched : out std_logic
        ) is
        begin
            -- BUG: this observes in the same delta cycle as the camera update.
            wait until rising_edge(clk);
            if not is_x(captured_bib) and captured_bib = expected_bib then
                matched := '1';
            else
                matched := '0';
            end if;
        end procedure;
        procedure present_bib(constant next_bib : in std_logic_vector(7 downto 0)) is
        begin
            -- BUG: driving on the sampling edge races the camera.
            wait until rising_edge(clk);
            bib <= next_bib;
        end procedure;
        variable matched : std_logic;
    begin
        wait until falling_edge(clk);
        reset <= '0';
        present_bib(x"12");
        inspect_frame(x"12", matched);
        if matched /= '1' then errors := errors + 1; end if;
        present_bib(x"27");
        inspect_frame(x"28", matched);
        if matched /= '0' then errors := errors + 1; end if;
        present_bib((others => 'X'));
        inspect_frame((others => 'X'), matched);
        if matched /= '0' then errors := errors + 1; end if;
        if errors = 0 then report "CHECK_PASS" severity note;
        else report "CHECK_FAIL frame checks" severity note; end if;
        stop;
        wait;
    end process;

    watchdog : process
    begin
        wait for 200 ns;
        report "CHECK_FAIL timeout" severity failure;
    end process;
end architecture;
