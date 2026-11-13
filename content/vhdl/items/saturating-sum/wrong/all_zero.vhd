library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        a : in std_logic_vector(7 downto 0);
        b : in std_logic_vector(7 downto 0);
        result : out std_logic_vector(7 downto 0);
        saturated : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- TODO: implement the required behavior.
    result <= (others => '0');
    saturated <= '0';
end architecture;
