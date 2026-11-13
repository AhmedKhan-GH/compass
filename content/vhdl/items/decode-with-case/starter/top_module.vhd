library ieee;
use ieee.std_logic_1164.all;
entity top_module is
    port (
    mode : in std_logic_vector(2 downto 0);
    lamps : out std_logic_vector(3 downto 0);
    enabled : out std_logic
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Decode the mode lamps: implement this requirement.
    -- Task 2. Disable unsupported modes: implement this requirement.
    lamps <= (others => '0');
    enabled <= '0';
end architecture;
