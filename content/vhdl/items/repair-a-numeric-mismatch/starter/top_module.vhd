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
    -- Faulty adapter: cold readings are treated as unsigned magnitudes.
    displayed <= std_logic_vector(resize(unsigned(temperature), displayed'length));
    below_zero <= '0';
end architecture;
