library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        panel : in std_logic_vector(7 downto 0);
        mirrored : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    mirrored <= '1' when panel(7 downto 4) = (panel(0) & panel(1) & panel(2) & panel(3)) else '0';
end architecture;
