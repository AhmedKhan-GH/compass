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
    -- TODO: implement the required behavior.
    high_a <= '0';
    high_b <= '0';
    any_high <= '0';
end architecture;
