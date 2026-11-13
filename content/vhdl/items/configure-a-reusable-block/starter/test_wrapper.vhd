library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity test_wrapper is
    port (
    data8 : in std_logic_vector(7 downto 0);
    clear8 : in std_logic;
    data3 : in std_logic_vector(2 downto 0);
    clear3 : in std_logic;
    shown8 : out std_logic_vector(7 downto 0);
    nz8 : out std_logic;
    shown3 : out std_logic_vector(2 downto 0);
    nz3 : out std_logic
    );
end entity;
architecture rtl of test_wrapper is
    begin
    wide: entity work.configurable_block
    generic map (WIDTH => 8, RESET_VALUE => 16#A5#)
    port map (data => data8, clear => clear8, shown => shown8, nonzero => nz8);
    narrow: entity work.configurable_block
    generic map (WIDTH => 3, RESET_VALUE => 5)
    port map (data => data3, clear => clear3, shown => shown3, nonzero => nz3);
end architecture;
