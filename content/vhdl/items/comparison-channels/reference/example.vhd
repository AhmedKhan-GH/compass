library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        level_a : in std_logic_vector(7 downto 0);
        level_b : in std_logic_vector(7 downto 0);
        limit : in std_logic_vector(7 downto 0);
        high_a : out std_logic;
        high_b : out std_logic;
        any_high : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    cmp_a: entity work.level_compare port map(value=>level_a, threshold=>limit, at_or_above=>high_a); cmp_b: entity work.level_compare port map(value=>level_b, threshold=>limit, at_or_above=>high_b); any_high <= high_a or high_b;
end architecture;
