library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity test_wrapper is
    port (
    a8 : in std_logic_vector(7 downto 0);
    b8 : in std_logic_vector(7 downto 0);
    sel8 : in std_logic;
    blank8 : in std_logic;
    a3 : in std_logic_vector(2 downto 0);
    b3 : in std_logic_vector(2 downto 0);
    sel3 : in std_logic;
    blank3 : in std_logic;
    out8 : out std_logic_vector(7 downto 0);
    out3 : out std_logic_vector(2 downto 0)
    );
end entity;
architecture rtl of test_wrapper is
    begin
    wide: entity work.configurable_selector
    generic map (WIDTH => 8)
    port map (a => a8, b => b8, selection => sel8, blank => blank8, data => out8);
    narrow: entity work.configurable_selector
    generic map (WIDTH => 3)
    port map (a => a3, b => b3, selection => sel3, blank => blank3, data => out3);
end architecture;
