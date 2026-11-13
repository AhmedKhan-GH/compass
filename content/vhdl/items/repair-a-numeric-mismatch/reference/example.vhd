library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        temperature : in std_logic_vector(7 downto 0);
        displayed : out std_logic_vector(11 downto 0);
        below_zero : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    displayed <= std_logic_vector(resize(signed(temperature),12)); below_zero <= temperature(7);
end architecture;
