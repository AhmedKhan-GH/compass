library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        level : in std_logic_vector(7 downto 0);
        limit : in std_logic_vector(7 downto 0);
        enable : in std_logic;
        raw_high : out std_logic;
        alarm : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    cmp: entity work.level_compare port map(value=>level, threshold=>limit, at_or_above=>raw_high); alarm <= enable and raw_high;
end architecture;
