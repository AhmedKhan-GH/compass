library ieee;
use ieee.std_logic_1164.all;

entity dut is
    port (clk, reset, load : in std_logic; d : in std_logic_vector(7 downto 0); q : out std_logic_vector(7 downto 0));
end entity;

architecture rtl of dut is
    signal stored : std_logic_vector(7 downto 0) := (others => '0');
begin
    q <= stored;
    process(clk)
    begin
        if rising_edge(clk) and load = '1' then
            stored <= d;
        end if;
    end process;
end architecture;
