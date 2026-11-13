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
    -- TODO: implement the required behavior.
    mirrored <= '0';
end architecture;
