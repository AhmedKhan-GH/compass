library ieee;
use ieee.std_logic_1164.all;
entity top_module is
    port (
    status : in std_logic_vector(7 downto 0);
    lamps : out std_logic_vector(7 downto 0)
    );
end entity;
architecture rtl of top_module is
    begin
    -- TODO: implement the required behavior.
    lamps <= (others => '0');
end architecture;
