library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        temperature : in std_logic_vector(7 downto 0);
        limit : in std_logic_vector(7 downto 0);
        below_limit : out std_logic;
        extended : out std_logic_vector(11 downto 0);
        negative : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    below_limit <= '1' when signed(temperature)<signed(limit) else '0'; extended <= std_logic_vector(resize(signed(temperature),12)); negative <= temperature(7);
end architecture;
